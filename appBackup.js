/*
Copyright 2016 - 2018, Robin de Gruijter (gruijter@hotmail.com)

This file is part of com.gruijter.magister.

com.gruijter.magister is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

com.gruijter.magister is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with com.gruijter.magister.  If not, see <http://www.gnu.org/licenses/>.
*/

'use strict';

const Homey = require('homey');
const Logger = require('./captureLogs.js');
const mapi = require('./mapi.js');
const fs = require('fs');
// const util = require('util');

class MagisterApp extends Homey.App {

	onInit() {
		this.log('Magister app is running!');
		this.logger = new Logger('log', 200);
		// register some listeners
		process.on('unhandledRejection', (error) => {
			this.error('unhandledRejection! ', error);
		});
		process.on('uncaughtException', (error) => {
			this.error('uncaughtException! ', error);
		});
		Homey
			.on('unload', () => {
				this.log('app unload called');
				// save logs to persistant storage
				this.logger.saveLogs();
			})
			.on('memwarn', () => {
				this.log('memwarn!');
			});
		// register trigger flowcards
		this.newGradeTrigger = new Homey.FlowCardTrigger('new_grade')
			.register()
			.getArgument('student')
			.registerAutocompleteListener((query, args) => {
				let results = this.autoCompleteList;
				results = results.filter(result => (result.name.toLowerCase().indexOf(query.toLowerCase()) > -1));
				return Promise.resolve(results);
			});

		// // register action flow cards
		// const blockDevice = new Homey.FlowCardAction('block_device');
		// blockDevice.register()
		// 	.on('run', async (args, state, callback) => {
		// 		await this._driver.blockOrAllow.call(this, args.mac.name, 'Block');
		// 		// this.log(args.mac.name);
		// 		callback(null, true);
		// 	})
		// 	.getArgument('mac')
		// 	.registerAutocompleteListener((query, args) => {
		// 		let results = this._driver.makeAutocompleteList.call(this);
		// 		results = results.filter((result) => {		// filter for query on MAC and Name
		// 			const macFound = result.name.toLowerCase().indexOf(query.toLowerCase()) > -1;
		// 			const nameFound = result.description.toLowerCase().indexOf(query.toLowerCase()) > -1;
		// 			return macFound || nameFound;
		// 		});
		// 		return Promise.resolve(results);
		// 	});


		// init some variables
		this.startPolling();
	}

	startPolling() {
		try {
			this.log('Polling started');
			clearInterval(this.intervalId);	// stop polling first
			this.makeAutocompleteList();	// needed for flowcards
			this.handleStudents();	// get the first round of info right away
			this.intervalId = setInterval(() => {
				this.handleStudents();
			}, 1000 * 60 * 10);// poll every 10 min
		} catch (error) {
			this.error(error);
		}
	}

	async handleStudents() {
		const studentIds = Homey.ManagerSettings.getKeys();
		// this.log(studentIds);
		for (let idx = 0; idx < studentIds.length; idx += 1) {	// poll each student sequentially
			const studentId = studentIds[idx];
			const { credentials } = Homey.ManagerSettings.get(studentId);
			const student = await mapi.getStudent(credentials);
			await this.handleGradesData(student);
			// const appointments = await mapi.getAppointments(student, Date('2018-04-15'));
			// this.log(appointments);
		}
	}

	//  stuff for frontend API
	deleteLogs() {
		return this.logger.deleteLogs();
	}
	getLogs() {
		return this.logger.logArray;
	}
	saveAccount(credentials) {
		this.log('Validating and saving', credentials);
		return new Promise(async (resolve, reject) => {
			try {
				const student = await mapi.getStudent(credentials);
				const currentCourse = await mapi.getCurrentCourse(student);
				let { lastName } = student.profileInfo;
				const initials = `${student.profileInfo.firstName[0]}${lastName[0]}`;
				if (student.profileInfo.namePrefix !== null) {
					lastName = `${student.profileInfo.namePrefix} ${student.profileInfo.lastName}`;
				}
				const oldStudentSettings = Homey.ManagerSettings.get(student.profileInfo.id) || {};
				const newStudentSettings = {
					studentId: student.profileInfo.id, // This is used as unique student ID, e.g. 18341
					credentials: {
						school: student.school.name,
						username: credentials.username,
						password: credentials.password,
						childNumber: credentials.childNumber,
					},
					fullName: `${student.profileInfo.firstName} ${lastName}`,
					initials,
					type_group: `${currentCourse.type.description} - ${currentCourse.group.description}`,
					period: `${currentCourse.schoolPeriod}`,
					totalAverageGrade: oldStudentSettings.totalAverageGrade || null,
					lastGradeLogDate: oldStudentSettings.lastGradeLogDate || 0,	// log all historic grades from currentCourse
				};
				Homey.ManagerSettings.set(newStudentSettings.studentId, newStudentSettings);
				// store student photo in /userdata
				const writeStream = fs.createWriteStream(`./userdata/${student.profileInfo.id}.jpg`);
				student.profileInfo.getProfilePicture(128, 128, false)
					.then((readStream) => {
						readStream.pipe(writeStream);
					});
				this.startPolling();
				return resolve(newStudentSettings);
			} catch (error) {
				this.error(error);
				return reject(error);
			}
		});
	}
	deleteAccount(studentId) {
		this.log(`Deleting student: ${studentId}`);
		return new Promise((resolve, reject) => {
			try {
				this.deleteGradeLogs(Homey.ManagerSettings.get(studentId).initials);
				Homey.ManagerSettings.unset(studentId);
				fs.unlink(`./userdata/${studentId}.jpg`, (err) => {
					if (err) {
						this.error(err);	// photo delete error
					} // else { this.log('Photo deleted'); }
				});
				this.startPolling();
				return resolve('deletion is done');
			} catch (error) {
				this.error(error);
				return reject(error);
			}
		});
	}

	// other helper stuff
	makeAutocompleteList() {
		const studentIds = Homey.ManagerSettings.getKeys();
		this.autoCompleteList = [];
		studentIds.forEach((id) => {
			const student = Homey.ManagerSettings.get(id);
			const item =
				{
					image: `/app/${this.manifest.id}/userdata/${id}.jpg`,
					name: student.fullName,
					// description: student.fullName,
					studentId: id,
				};
			this.autoCompleteList.push(item);	// fill the studentList for flow autocomplete
		});
	}

	// logic to retrieve and handle student related information

	handleGradesData(student) {
		// this.log(`handling gradesData for ${student.profileInfo.id}`);
		return new Promise(async (resolve, reject) => {
			try {
				const studentSettings = Homey.ManagerSettings.get(student.profileInfo.id);
				const grades = await mapi.getGrades(student);
				const totalGrade = grades.reduce((acc, current) => {
					const value = acc.value + (current.grade * current.weight);
					const weight = acc.weight + current.weight;
					return { value, weight };
				}, { value: 0, weight: 0 });
				const totalAverageGrade = Math.round(100 * (totalGrade.value / totalGrade.weight)) / 100;
				const lastGradeDateFilledIn = grades.reduce((acc, current) => {
					let lastDate = acc;
					if (new Date(current.dateFilledIn) > new Date(lastDate)) {
						lastDate = current.dateFilledIn;
					}
					return lastDate;
				}, 0);
				// update student settings with new avg grade and new fetch date/time
				if (studentSettings.totalAverageGrade !== totalAverageGrade) {
					studentSettings.totalAverageGrade = totalAverageGrade;
				}
				studentSettings.lastGradeLogDate = new Date(lastGradeDateFilledIn); // new Date('2018-4-15');	// for testing historic dates
				// migrate initials from v2 app
				if (!studentSettings.initials) {
					studentSettings.initials = `${student.profileInfo.firstName[0]}${student.profileInfo.lastName[0]}`;
				}
				Homey.ManagerSettings.set(student.profileInfo.id, studentSettings);
				// select and handle new grades
				const newGrades = grades.filter(grade => new Date(grade.dateFilledIn) > new Date(studentSettings.lastGradeLogDate));
				newGrades.forEach((newGrade) => {
					this.logGrade(studentSettings.initials, newGrade);
					const tokens = {
						name: student.profileInfo.firstName,
						class: newGrade.classDescription,
						description: newGrade.description,
						weight: newGrade.weight,
						grade: newGrade.grade,
					};
					this.newGradeTrigger
						.trigger(tokens)
						.catch(this.error);
				});
				return resolve();
			} catch (error) {
				return reject(Error(error));
			}
		});
	}

	async logGrade(studentInitials, grade) {
		try {
			const logDate = new Date(grade.testDate || grade.dateFilledIn); // use 1.testDate or 2.dateFilledIn as logdate
			const log = await Homey.ManagerInsights.getLog(grade.classId)
				.catch(async (error) => {
					const newLog = await Homey.ManagerInsights.createLog(grade.classId, {
						label: `${studentInitials}-${grade.classDescription}`,
						type: 'number',
						chart: 'scatter', // default chart type. can be: line, area, stepLine, column, spline, splineArea, scatter
					});
					return newLog;
				});
			log.createEntry(grade.grade, logDate);
		}	catch (error) {	this.log(error); }
	}

	deleteGradeLogs(studentInitials) {
		this.log(`deleting all insights for ${studentInitials}`);
		Homey.ManagerInsights.getLogs()
			.then((allLogs) => {
				const studentLogs = allLogs.filter((log) => {
					const label = log.label.en || log.label;
					return (label.toString().substring(0, 2) === studentInitials);
				});
				studentLogs.forEach(log => Homey.ManagerInsights.deleteLog(log).catch(this.error));
			})
			.catch(this.error);
	}

	handleCourseData(student) {
		// this.log(`handling courseData for ${student.profileInfo.id}`);
		return new Promise(async (resolve, reject) => {
			try {
				const currentCourse = await mapi.getCurrentCourse(student);
				const courseData = {
					type_group: `${currentCourse.type.description} - ${currentCourse.group.description}`,
					period: `${currentCourse.schoolPeriod}`,
				};
				const studentSettings = Homey.ManagerSettings.get(student.profileInfo.id);
				// this.log(studentSettings);
				if (studentSettings) {
					if ((studentSettings.type_group !== courseData.type_group) || (studentSettings.period !== courseData.period)) {
						this.log('course has changed');	// store new student settings
						studentSettings.type_group = courseData.type_group;
						studentSettings.period = courseData.period;
						Homey.ManagerSettings.set(student.profileInfo.id, studentSettings);
						this.startPolling();
					}
				}
				return resolve(currentCourse);
			} catch (error) {
				return reject(Error(error));
			}
		});
	}

}

module.exports = MagisterApp;
