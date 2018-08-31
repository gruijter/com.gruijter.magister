/*
Copyright 2017, 2018, Robin de Gruijter (gruijter@hotmail.com)

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
const mapi = require('../../mapi.js');
// const util = require('util');

class StudentDriver extends Homey.Driver {

	onInit() {
		this.log('StudentDriver onInit');
		// start polling all students sequentially from here
		this.startPolling();
	}

	onPair(socket) {
		socket.on('save', async (credentials, callback) => {
			try {
				this.log('save button pressed in frontend');
				const oldAppSettings = Homey.ManagerSettings.getKeys();
				if (oldAppSettings.length > 0) {
					throw Error(Homey.__('pair.old_settings'));
				}
				const magisterStudent = await mapi.getStudent(credentials); // test account credentials
				const response = {
					settings: {
						studentId: magisterStudent.profileInfo.id,
						school: magisterStudent.school.name,
						username: credentials.username,
						password: credentials.password,
						childNumber: Number(credentials.childNumber),
					},
					info: {
						firstName: magisterStudent.profileInfo.firstName,
					},
				};
				callback(null, JSON.stringify(response)); // report settings to frontend
			}	catch (error) {
				this.error('Pair error', error.message);
				callback(error);
			}
		});
	}

	startPolling() {
		try {
			this.log('Polling started');
			clearInterval(this.intervalId);	// stop polling first
			this.pollStudentsOnce();	// get the first round of info right away
			this.intervalId = setInterval(() => {
				this.pollStudentsOnce();
			}, 1000 * 60 * 60); // poll every 60 min
		} catch (error) {
			this.error(error);
		}
	}

	async pollStudentsOnce() {
		const devices = this.getDevices();
		for (let idx = 0; idx < devices.length; idx += 1) {	// poll each student device sequentially to distribute load
			try {
				const studentDevice = devices[idx];
				await studentDevice.ready(() => true);
				await studentDevice.login();
				await studentDevice.getCurrentCourse();
				await studentDevice.handleGradesData();
				await studentDevice.handleLessons();
				// this.log(util.inspect(await studentDevice.handleLessons(), { colors: true, depth: null }));
				studentDevice.saveSettings();	// save student changes back to persistent storage
				global.gc(); // do garbage collection
			} catch (error) {
				this.error(error);
			}
		}
	}

	// ===================general device methods============================

	async login() {	// call with studentDevice as this
		try {
			this.magisterStudent = await mapi.getStudent(this.credentials);
			this.setAvailable()
				.catch(this.error);
			let { lastName } = this.magisterStudent.profileInfo;
			if (this.magisterStudent.profileInfo.namePrefix !== null) {
				lastName = `${this.magisterStudent.profileInfo.namePrefix} ${this.magisterStudent.profileInfo.lastName}`;
			}
			this.fullName = `${this.magisterStudent.profileInfo.firstName} ${lastName}`;
			this.firstName = this.magisterStudent.profileInfo.firstName;
			this.initials = `${this.magisterStudent.profileInfo.firstName[0]}${this.magisterStudent.profileInfo.lastName[0]}`;
			this.credentials.school = this.magisterStudent.school.name;
			return Promise.resolve(this.magisterStudent);
		} catch (error) {
			this.setUnavailable(error.message)
				.catch(this.error);
			throw error;
		}
	}

	async getCurrentCourse() {	// call with studentDevice as this
		try {
			const currentCourse = await mapi.getCurrentCourse(this.magisterStudent);
			this.typeAndGroup = `${currentCourse.type.description} - ${currentCourse.group.description}`;
			this.period = `${currentCourse.schoolPeriod}`;
			return Promise.resolve(currentCourse);
		} catch (error) {
			return error;
		}
	}

	// ===================lessons related device methods============================

	async handleLessons() {	// call with studentDevice as this
		// this.log(`handling appointments for ${this.firstName}`);
		try {
			let oldRosterToday = this.rosterToday;
			let oldRosterTomorrow = this.rosterTomorrow;
			let rosterChangedToday = false;
			const newRosters = await this.getRostersTodayAndTomorrow();
			// check for first getRoster
			if (!oldRosterToday.summary || !oldRosterTomorrow.summary) {
				oldRosterToday = this.rosterToday;
				oldRosterTomorrow = this.rosterTomorrow;
			}
			// check for date change at midnight
			const oldDay = new Date(oldRosterTomorrow.summary.date).getDate();
			const newDay = new Date(newRosters.rosterTomorrow.summary.date).getDate();
			if (oldDay !== newDay) {
				// this.log('the day changed, so it must be just past midnight!');
				return Promise.resolve(newRosters);
			}
			// check for roster change today
			if (JSON.stringify(oldRosterToday.lessons) !== JSON.stringify(newRosters.rosterToday.lessons)) {
				this.log('something changed today');
				rosterChangedToday = true;
				// this.log(newRosters.rosterToday.summary);
				const tokens = {
					name: this.firstName,
					startHour: newRosters.rosterToday.summary.startHour,
					startTime: newRosters.rosterToday.summary.startTime,
					endHour: newRosters.rosterToday.summary.endHour,
					endTime: newRosters.rosterToday.summary.endTime,
					cancellations: newRosters.rosterToday.summary.cancellations,
					tests: newRosters.rosterToday.summary.tests,
				};
				this.flowCards.rosterChangedTodayTrigger
					.trigger(this, tokens)
					.catch(this.error);
			}
			// check for roster change tomorrow
			if (JSON.stringify(oldRosterTomorrow.lessons) !== JSON.stringify(newRosters.rosterTomorrow.lessons)) {
				this.log('something changed tomorrow');
				// this.log(newRosters.rosterTomorrow.summary);
				const tokens = {
					name: this.firstName,
					startHour: newRosters.rosterTomorrow.summary.startHour,
					startTime: newRosters.rosterTomorrow.summary.startTime,
					endHour: newRosters.rosterTomorrow.summary.endHour,
					endTime: newRosters.rosterTomorrow.summary.endTime,
					cancellations: newRosters.rosterTomorrow.summary.cancellations,
					tests: newRosters.rosterTomorrow.summary.tests,
				};
				this.flowCards.rosterChangedTomorrowTrigger
					.trigger(this, tokens)
					.catch(this.error);
			}
			// check for skipped classes today
			if (rosterChangedToday && (newRosters.rosterToday.summary.skippedClasses > 0)) {
				newRosters.rosterToday.lessons
					.filter((lesson) => {
						let skipped = false;
						if (lesson.absenceInfo !== undefined) {
							skipped = !lesson.absenceInfo.isPermitted;
						}
						return skipped;
					})
					.map((lesson) => {
						const tokens = {
							name: this.firstName,
							schoolHour: lesson.schoolHour,
							class: lesson.class,
						};
						this.flowCards.classSkippedTrigger
							.trigger(this, tokens)
							.catch(this.error);
						return tokens;
					});
			}
			return Promise.resolve(newRosters);
		} catch (error) {
			return error;
		}
	}

	async getRostersTodayAndTomorrow() { // call with studentDevice as this
		try {
			const today = new Date(); // 'Tue Apr 24 2018 23:30:00 GMT+0200 (CEST)'));
			const tomorrow = new Date();
			tomorrow.setDate(today.getDate() + 1); // + 1);
			const rosterToday = await this.getDayRoster(today);
			this.setCapabilityValue('schoolStart', rosterToday.summary.startTime);
			this.setCapabilityValue('schoolEnd', rosterToday.summary.endTime);
			this.rosterToday = rosterToday;
			const rosterTomorrow = await this.getDayRoster(tomorrow);
			this.rosterTomorrow = rosterTomorrow;
			return Promise.resolve({ rosterToday, rosterTomorrow });
		} catch (error) {
			return error;
		}
	}

	async getDayRoster(date) {	// call with studentDevice as this
		try {
			const allRosterItems = await this.getAllRosterItems(date);
			const summary = {
				date, // : date.toISOString(),
				startHour: null, // allLessons[0].schoolHour,
				startTime: '', // allLessons[0].start,
				endHour: null, // allLessons[0].schoolHour,
				endTime: '', // allLessons[0].end,
				description: '',
				cancellations: 0,
				skippedClasses: 0,
				homework: 0,
				tests: 0,
			};
			if (allRosterItems[0] !== undefined) {
				summary.description = allRosterItems[0].description || allRosterItems[0].content || '';
			}
			const allHours = allRosterItems.filter(lesson => lesson.schoolHour); // all hours
			const allLessons = allHours.filter((lesson) => { // lessons, including cancelled ones
				if (!lesson.isCancelled) { return true; } // always include non-canceled hours
				const doubles = allHours.filter(les => les.schoolHour === lesson.schoolHour);
				if (doubles.length > 1) {
					const undoubled = doubles.filter(ls => !ls.isCancelled);
					if (undoubled.length > 0) { return false; }
				}
				return true;
			});
			summary.cancellations = (allLessons.filter(lesson => lesson.isCancelled).length);
			const lessons = allLessons.filter(lesson => !lesson.isCancelled); // lessons, not including cancelled ones
			if (lessons.length > 0) {
				summary.startHour = lessons[0].schoolHour;
				summary.startTime = lessons[0].start.toTimeString().substr(0, 5);
				const lastLesson = lessons[lessons.length - 1];
				summary.endHour = lastLesson.schoolHour;
				summary.endTime = lastLesson.end.toTimeString().substr(0, 5);
				summary.homework = lessons.filter(lesson => (lesson.infoType >= 1)).length;
				summary.tests = lessons.filter(lesson => (lesson.infoType >= 2)).length;
				summary.skippedClasses = lessons.filter((lesson) => {
					let skipped = false;
					if (lesson.absenceInfo !== undefined) {
						skipped = !lesson.absenceInfo.isPermitted;
					}
					return skipped;
				}).length;
			}
			return Promise.resolve({ summary, lessons: allLessons });
		} catch (error) {
			return error;
		}
	}

	async getAllRosterItems(date) {	// call with studentDevice as this
		try {
			const appointments = await mapi.getAppointments(this.magisterStudent, date, date);
			const allRosterItems = appointments.map((appointment) => {
				const lesson = {
					id: appointment.id,	// e.g. '7381473'
					schoolHour: appointment.startBySchoolhour, // e.g. 1 or null for lessons[0] if no lesson today
					start: appointment.start, // e.g. 2018-04-26T07:05:00.000Z
					end: appointment.end, // e.g. 2018-04-26T07:50:00.000Z
					isCancelled: appointment.isCancelled, // e.g. true
					absenceInfo: appointment.absenceInfo, // e.g. undefined
					// absenceInfo: id: '9360388', begin: 2018-04-25T22:00:00.000Z, end: 2018-04-25T22:00:00.000Z, schoolHour: 7, isPermitted: false, description: 'onbekend', code: 'o', appointment: [Object]
					location: appointment.location, // e.g. 'M218',
					class: appointment.classes[0], // e.g. 'tekenen',
					description: appointment.description, // e.g. 'te - pri - 1gb' or 'Toetsweek'
					content: appointment.content || '', // e.g. null or 'Maken blz 164: opgave 27 t/m 31'
					infoType: appointment.infoType,
					// infoType e.g. 0=none, 1=homework, 2=test/proefwerk, 3=exam, 4=quiz/so, 5=oral/mondeling, 6 =information, 7=annotation

					// teacher: appointment.teachers[0], // e.g. 'G. D. Lasseur'
					// type: appointment.type, // e.g. 13??
					// // type e.g. 0='none', 1='personal', 2='general', 3='schoolwide', 4='internship', 5='intake', 6='scheduleFree', 7='kwt', 8='standby', 9='block', 10='miscellaneous',
					// // 11='localBlock', 12='classBlock', 13='lesson', 14='studiehuis', 15='scheduleFreeStudy', 16='planning', 101='actions', 102='presences', 103='examSchedule'
					// isDone: appointment.isDone, // e.g. false
					// classRoom: appointment.classRooms[0], // e.g. 'M218'
					status: appointment.status, // e.g. 4 ??? 2=dayInfo?, 3,9,10=changed, 4,5=canceled, 7=regular?
					// isChanged: appointment.isChanged, // e.g. false
					// isFullDay: appointment.isFullDay, //  e.g. false
				};
				// if (lesson.teacher !== undefined) {
				// 	// Homey.app.log(lesson.teacher);
				// 	lesson.teacher = lesson.teacher.fullName;
				// }
				lesson.content = lesson.content.replace(/<[^>]+>/g, '');
				// lesson.content = lesson.content.replace(/\\[bntr]/g, '');
				// lesson.content = lesson.content.replace(/&nbsp/g, '');
				return lesson;
			});
			return Promise.resolve(allRosterItems);
		} catch (error) {
			return error;
		}
	}

	// ========================grades related device methods=============================

	async handleGradesData() {	// call with studentDevice as this
		// this.log(`handling gradesData for ${student.firstName}`);
		try {
			const newGrades = await this.getNewGrades();
			newGrades.forEach((newGrade) => {
				const label = `${this.initials}-${newGrade.classDescription}`;
				this.logGrade(newGrade, label);
				const tokens = {
					name: this.firstName,
					class: newGrade.classDescription,
					description: newGrade.description,
					weight: newGrade.weight,
					grade: newGrade.grade,
				};
				this.flowCards.newGradeTrigger
					.trigger(this, tokens)
					.catch(this.error);
			});
			return Promise.resolve(newGrades);
		} catch (error) {
			return error;
		}
	}

	logGrade(grade, label) {
		try {
			const logDate = new Date(grade.testDate || grade.dateFilledIn); // use 1.testDate or 2.dateFilledIn as logdate
			this.log(`new/updated grade: ${label} ${grade.grade}, ${grade.weight}x, ${logDate}`);
			const createOptions = {
				label,
				type: 'number',
				chart: 'scatter', // default chart type. can be: line, area, stepLine, column, spline, splineArea, scatter
			};
			Homey.ManagerInsights.createLog(grade.classId, createOptions)
				.catch(() => Promise.resolve(Homey.ManagerInsights.getLog(grade.classId)))
				.then((newLog) => {
					newLog.createEntry(grade.grade, logDate);
				});
		}	catch (error) {	this.log(error.message); }
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

	async getAllGrades() {	// call with studentDevice as this
		try {
			const grades = await mapi.getGrades(this.magisterStudent);
			const totalGrade = grades.reduce((acc, current) => {
				const value = acc.value + (current.grade * current.weight);
				const weight = acc.weight + current.weight;
				return { value, weight };
			}, { value: 0, weight: 0 });
			this.totalAverageGrade = Math.round(100 * (totalGrade.value / totalGrade.weight)) / 100;
			this.setCapabilityValue('totalAverageGrade', this.totalAverageGrade);
			const lastGrade = `${grades[grades.length - 1].classAbreviation} ${grades[grades.length - 1].grade}x${grades[grades.length - 1].weight}`;
			this.setCapabilityValue('lastGrade', lastGrade);
			this.grades = grades;
			return Promise.resolve(grades);
		} catch (error) {
			return error;
		}
	}

	async getNewGrades() {	// since lastGradeLogDate // call with studentDevice as this
		try {
			const grades = await this.getAllGrades();
			const newGrades = grades.filter(grade => new Date(grade.dateFilledIn) > new Date(this.lastGradeLogDate));
			const lastGradeDateFilledIn = grades.reduce((acc, current) => {
				let lastDate = acc;
				if (new Date(current.dateFilledIn) > new Date(lastDate)) {
					lastDate = current.dateFilledIn;
				}
				return lastDate;
			}, 0);
			if (new Date(lastGradeDateFilledIn) > new Date(this.lastGradeLogDate)) {
				this.lastGradeLogDate = lastGradeDateFilledIn; // new Date('2018-4-15');	// for testing historic dates
			}
			return Promise.resolve(newGrades);
		} catch (error) {
			return error;
		}
	}

	// ========================SPEECH OUTPUT=========================================

	sayGrades(args) {
		try {
			let requestedPeriod;
			let requestedDay;
			if (args.when === 'today') {
				requestedPeriod = new Date();
				requestedPeriod.setDate(requestedPeriod.getDate() - 1);
				requestedDay = Homey.__('today');
			} else { // args.when === 'week'
				requestedPeriod = new Date();
				requestedPeriod.setDate(requestedPeriod.getDate() - 7);
				requestedDay = Homey.__('the past 7 days');
			}
			const selectedGrades = args.student.grades.filter(grade => new Date(grade.dateFilledIn) > new Date(requestedPeriod));
			Homey.ManagerSpeechOutput.say(`${Homey.__('new grades of')} ${args.student.firstName} ${Homey.__('of')} ${requestedDay}`);
			if (selectedGrades.length < 1) {
				return Homey.ManagerSpeechOutput.say(`${Homey.__('no new grades')} ${requestedDay}`);
			}
			selectedGrades.forEach((grade) => {
				Homey.ManagerSpeechOutput.say(`${grade.classDescription} ${Homey.__('its a')} ${grade.grade}
				${Homey.__('this one counts')} ${grade.weight} ${Homey.__('times')}`);
			});
		} catch (err) {	this.log(err); }
		return true;
	}

	sayRoster(args) {
		try {
			let requestedRoster;
			let requestedDay;
			if (args.when === 'today') {
				requestedRoster = args.student.rosterToday;
				requestedDay = Homey.__('today');
			} else {
				requestedRoster = args.student.rosterTomorrow;
				requestedDay = Homey.__('tomorrow');
			}
			if (!requestedRoster.lessons || !requestedRoster.summary) {
				return;
			}
			if (!requestedRoster.summary.startHour) {
				Homey.ManagerSpeechOutput.say(`${args.student.firstName} ${Homey.__('has no class')} ${requestedDay}`);
				if (requestedRoster.summary.description !== '') {
					Homey.ManagerSpeechOutput.say(`${Homey.__('but there is a description')}: ${requestedRoster.summary.description}`);
				}
			} else {
				Homey.ManagerSpeechOutput.say(`${Homey.__('the roster of')} ${args.student.firstName} ${Homey.__('of')} ${requestedDay}
					${Homey.__('starts at')} ${requestedRoster.summary.startTime} ${Homey.__('and ends at')} ${requestedRoster.summary.endTime}`);
				requestedRoster.lessons.forEach((currentLesson) => {
					if (currentLesson.isCancelled) {
						Homey.ManagerSpeechOutput.say(`${Homey.__('class')} ${currentLesson.schoolHour} ${Homey.__('has been scrapped')}`);
					} else {
						Homey.ManagerSpeechOutput.say(`${Homey.__('class')} ${currentLesson.schoolHour}: ${currentLesson.class}`);
					}
				});
			}
		} catch (err) {	this.log(err); }
	}

	sayHomework(args) {
		try {
			let requestedRoster;
			let requestedDay;
			if (args.when === 'today') {
				requestedRoster = args.student.rosterToday;
				requestedDay = Homey.__('today');
			} else {
				requestedRoster = args.student.rosterTomorrow;
				requestedDay = Homey.__('tomorrow');
			}
			if (!requestedRoster.lessons || !requestedRoster.summary) {
				return;
			}
			if (!requestedRoster.summary.homework) {
				Homey.ManagerSpeechOutput.say(`${args.student.firstName} ${Homey.__('no homework')} ${requestedDay}`);
			} else {
				Homey.ManagerSpeechOutput.say(`${Homey.__('homework of')} ${args.student.firstName} ${Homey.__('of')} ${requestedDay}:`);
				requestedRoster.lessons.forEach((currentLesson) => {
					if (currentLesson.infoType >= 1) {
						Homey.ManagerSpeechOutput.say(`${currentLesson.class}: ${currentLesson.content.substr(0, 255)}`);
					}
				});
			}
		} catch (err) {	this.log(err); }
	}

	sayTests(args) {
		try {
			let requestedRoster;
			let requestedDay;
			if (args.when === 'today') {
				requestedRoster = args.student.rosterToday;
				requestedDay = Homey.__('today');
			} else {
				requestedRoster = args.student.rosterTomorrow;
				requestedDay = Homey.__('tomorrow');
			}
			if (!requestedRoster.lessons || !requestedRoster.summary) {
				return;
			}
			if (!requestedRoster.summary.tests) {
				Homey.ManagerSpeechOutput.say(`${args.student.firstName} ${Homey.__('no tests')} ${requestedDay}`);
			} else {
				Homey.ManagerSpeechOutput.say(`${Homey.__('tests of')} ${args.student.firstName} ${Homey.__('of')} ${requestedDay}:`);
				requestedRoster.lessons.forEach((currentLesson) => {
					if (currentLesson.infoType >= 2) {
						Homey.ManagerSpeechOutput.say(`${currentLesson.class}: ${currentLesson.content.substr(0, 255)}`);
					}
				});
			}
		} catch (err) {	this.log(err); }
	}

}

module.exports = StudentDriver;
