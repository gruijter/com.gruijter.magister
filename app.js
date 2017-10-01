'use strict';

Homey.log('app.js started');

const util = require('util');
const request = require('request');
const fs = require('fs');
const Magister = require('magister.js');
// const devices = {};
const allStudents = {};		// object containing all students
let studentList = [];		// array containing all students for flow autocomplete
const intervalId1 = {}; // polling for course info
const intervalId2 = {}; // polling for grades
const intervalId3 = {}; // polling for day roster

module.exports.init = init;
module.exports.validateAccount = validateConnection;
module.exports.deleteAccount = deleteAccount;

// Executed on app start
function init() {
	Homey.log('init started');
	initAllStudents();
	// debug show what files are in userdata
	// fs.readdir('./userdata/', function (err, res) { Homey.log(err); Homey.log(res) });
	setTimeout(() => {
		let x = 0;
		Homey.log(allStudents);
		for (const key in allStudents) {
			if (allStudents.hasOwnProperty(key)) {
				setTimeout(() => {
					startPolling(allStudents[key]);
				}, 10000 + (1000 * 60 * 5 * x));				// spread polling of students every 5 minutes
				x += 1;
			}
		}
	}, 5000);
}

// Fired when a setting has been changed from the frontend
Homey.manager('settings').on('set', (changedKey) => {
	Homey.log(`this key has changed: ${changedKey}`);
	init();
});

function deleteAccount(key, callback) {
	try {
		Homey.log(`deleting: ${key}`);
		fs.unlink(`./userdata/${key}.jpg`, (err) => {
			if (err) {
				callback(err, 'photo delete error');
				return;
			}
			callback(null, 'file deleted successfully');
		});
		if (allStudents[key] !== undefined) {
			clearInterval(intervalId1[allStudents[key].studentId]); // end polling of device for course info
			clearInterval(intervalId2[allStudents[key].studentId]); // end polling of device for grades
			clearInterval(intervalId3[allStudents[key].studentId]); // end polling of device for day roster
			deleteLogs(allStudents[key]);	//  delete all student insight logs
		}
		setTimeout(() => {
			delete allStudents[key];			// remove student object from memory
		}, 5000);
		callback(null, 'deletion is done');
	}	catch (err) { Homey.log(err); }
}

function validateConnection(credentials, callback) { // Validate Magister connection data
	Homey.log('Validating', credentials);
	getStudent(credentials, (error, student) => {
		if (error) {
			Homey.log('Error connecting: ', error);
			callback(error, null);
			return;
		}
		Homey.log(student);
		Homey.log('Connecting successful!');
		callback(null, student);
	});
}

// get all students stored in Homey app settings
function initAllStudents() {
	try {
		for (const key in allStudents) {			// clear the studentlist
			if (key.hasOwnProperty(key)) {
				clearInterval(intervalId1[allStudents[key].studentId]); // end polling of device for course info
				clearInterval(intervalId2[allStudents[key].studentId]); // end polling of device for grades
				clearInterval(intervalId3[allStudents[key].studentId]); // end polling of device for day roster
				delete allStudents[key];
			}
		}
		studentList = [];						// clear the studentlist for flow autocomplete
		const keys = Homey.manager('settings').getKeys();
		// Homey.log(keys);
		keys.forEach((key) => {
			const settings = Homey.manager('settings').get(key);
			// Homey.log(settings);
			allStudents[key] = {
				studentId: settings.studentId,
				credentials: {
					school: settings.credentials.school,
					username: settings.credentials.username,
					password: settings.credentials.password,
				},
				fullName: settings.fullName,
				totalAverageGrade: settings.totalAverageGrade, // average of all grades in this schoolyear
				name: null, // needs to be changed to first name
				initials: null,
				currentCourse: {}, // schoolyear course information
				grades: [], // grades in this schoolyear
				lastGradeDateFilledIn: settings.lastGradeDateFilledIn, // start logging new grades since last grade
				dayRosterToday: {}, // lessons roster of this day
				dayRosterTomorrow: {}, // lessons roster of tomorrow
			};
			// Homey.log(`settings avg grade: ${settings.totalAverageGrade}`);
			if (settings.totalAverageGrade === null || settings.lastGradeDateFilledIn === undefined) {
				Homey.log('Student is newly added or re-fetch requested; will retrieve all historic grades');
				deleteLogs(allStudents[key]);	//  delete all student insight logs
				allStudents[key].lastGradeDateFilledIn = 0;
			}
			getStudent(settings.credentials, (error, student) => {
				if (!error) {
					allStudents[key].name = student.firstName;
					allStudents[key].currentCourse = student.currentCourse;
					allStudents[key].initials = student.firstName[0] + student.lastName[0];
				}
			});

			const item =
				{
					image: `/app/com.gruijter.magister/userdata/${key}.jpg`,
					name: allStudents[key].fullName,
					// description: allStudents[key].fullName,
					studentId: allStudents[key].studentId,
				};
			Homey.log(item);
			studentList.push(item);	// fill the studentList for flow autocomplete
		});
		// Homey.log(allStudents);
	} catch (err) {	Homey.log(err); }
}


function startPolling(student) {
	if (student === undefined) { return; }

	Homey.log(`starting to poll ${student.studentId}`);
	clearInterval(intervalId1[student.studentId]); // end polling of device for course info
	clearInterval(intervalId2[student.studentId]); // end polling of device for grades
	clearInterval(intervalId3[student.studentId]); // end polling of device for day roster

	setTimeout(() => { // delay http call to spread Homey load
		// handleCourseData(student);     // get schoolyear courseInfo first time
		intervalId1[student.studentId] = setInterval(() => { // start polling schoolyear courseInfo every 24 hrs
			if (student !== undefined) {
				handleCourseData(student);
			}
		}, 1000 * 60 * 60 * 24);
	}, 5000);

	setTimeout(() => { // delay http call to spread Homey load
		if (student !== undefined) {
			handleGradesData(student); // get grades info first time
		}
		intervalId2[student.studentId] = setInterval(() => { // start polling grades info every 120 min
			if (student !== undefined) {
				handleGradesData(student);
			}
		}, 1000 * 60 * 120);
	}, 15000);

	// testen met data
	let longAgo = new Date();
	longAgo.setDate(longAgo.getDate() - 0);
	let today = new Date(longAgo);
	let tomorrow = new Date(longAgo);
	tomorrow.setDate(today.getDate() + 1);

	setTimeout(() => { // delay http call to spread Homey load
		if (student !== undefined) {
			handleDayRosterToday(student, today); // get dayRosterToday info first time
		}
		setTimeout(() => { // delay http call to spread Homey load
			if (student !== undefined) {
				handleDayRosterTomorrow(student, tomorrow); // get dayRosterTomorrow info first time
			}
		}, 10000);

		intervalId3[student.studentId] = setInterval(() => { // start polling dayRoster info every 20 min
			longAgo = new Date();
			longAgo.setDate(longAgo.getDate() - 0);
			today = new Date(longAgo);
			tomorrow = new Date(today);
			tomorrow.setDate(today.getDate() + 1);
			if (student !== undefined) {
				handleDayRosterToday(student, today);
			}
			setTimeout(() => { // delay http call to spread Homey load
				if (student !== undefined) {
					handleDayRosterTomorrow(student, tomorrow);
				}
			}, 20000);

		}, 1000 * 60 * 20);
	}, 25000);

} // end startPolling

function logGrade(student, grade) {
	try {
		// Homey.log(grade);
		let logDate = Date.parse(grade.dateFilledIn); // use dateFilledIn as logdate
		if (grade.testDate !== undefined) { logDate = Date.parse(grade.testDate); } // use testDate as logdate
		logDate = new Date(logDate); // e.g. Tue Sep 23 2015 00:00:00 GMT+0200 (CEST)

		Homey.manager('insights').createLog(grade.class.id.toString(), {
			label: {
				en: `${allStudents[student.studentId].initials}-
				${allStudents[student.studentId].currentCourse.classesById[grade.class.id].description}`,
			},
			type: 'number',
			chart: 'scatter', // default chart type. can be: line, area, stepLine, column, spline, splineArea, scatter
		}, (error, success) => {
			// if (error) Homey.log(error);
			Homey.manager('insights').createEntry(grade.class.id.toString(), parseFloat(grade.grade), logDate, (er, su) => {
				if (er) {
					// Homey.log('insights create error: ')
					// Homey.log(er); // return Homey.error(err);
				}
			});
		});
	}	catch (err) {	Homey.log(err); }
}

function deleteLogs(student) {
	try {
	/*
		Homey.manager( 'insights' ).getLogs( function (err , logs){
			Homey.log(err);
			Homey.log(logs);
		});
	*/
		Homey.log(`deleting all insights for ${student.studentId}`);
		for (const classId in student.currentCourse.classesById) {
			if (student.currentCourse.classesById.hasOwnProperty(classId)) {
				Homey.manager('insights').deleteLog(classId, (err, success) => {
					// Homey.log(err);
				});
			}
		}
	} catch (err) {	Homey.log(err); }
}

function calcAverageGrade(student) {
	try {
		let totalAverage = 0;
		let totalWeight = 0;
		let totalWeightedGrade = 0;
		allStudents[student.studentId].grades.forEach((currentGrade, index, arr) => {
			if (!isNaN(currentGrade.grade * currentGrade.weight) && currentGrade.grade >= 0) {
				totalWeightedGrade = totalWeightedGrade + currentGrade.grade * currentGrade.weight;
				totalWeight = totalWeight + currentGrade.weight;
			}
		});
		if (totalWeight !== 0) {
			totalAverage = totalWeightedGrade / totalWeight;
		}
		Homey.log(`Total Average Grade is: ${totalAverage}`);
		return totalAverage;
	} catch (err) {	Homey.log(err); }
}

// =======================HANDLE THE RETRIEVED POLLING DATA======================

function handleCourseData(student) {
	try {
		getCourse(allStudents[student.studentId].credentials, (error, result) => {
			if (result !== null) {
				if (typeof allStudents[student.studentId].currentCourse.period === 'undefined') { // startup condition of app
					Homey.log('student is initializing, first course data is being stored');
					Homey.log(util.inspect(result));
					allStudents[student.studentId].currentCourse = result;
					return;
				}
				const period = Homey.manager('settings').get(student.studentId).period;
				if ((util.inspect(result) !== util.inspect(allStudents[student.studentId].currentCourse)) || (period !== result.period)) {
					Homey.log('course has changed');
					allStudents[student.studentId].currentCourse = result;
					const setting = Homey.manager('settings').get(student.studentId);
					setting.type_group = (`${result.type.description} - ${result.group.description}`);
					setting.period = result.period;
					setting.totalAverageGrade = null;
					Homey.manager('settings').set(student.studentId, setting);
					initAllStudents();
				}
			}
		});
	} catch (err) {	Homey.log(err); }
}

function handleGradesData(student) {
	try {
		getGrades(allStudents[student.studentId].credentials, (error, result) => {
			if (result !== null && result !== []) {
				allStudents[student.studentId].grades = result; // store all retrieved grades
				for (const index in result) {
					if (result[index].dateFilledIn > allStudents[student.studentId].lastGradeDateFilledIn) {
						// Homey.log(` ${allStudents[student.studentId].name} has a new grade for: `
						// + `${allStudents[student.studentId].currentCourse.classesById[result[index].class.id].description}`);
						// Homey.log(result[index]);
						logGrade(student, result[index]);
						// Trigger flow for new grade
						const tokens = {
							name: allStudents[student.studentId].name,
							class: allStudents[student.studentId].currentCourse.classesById[result[index].class.id].description,
							description: result[index].description,
							weight: result[index].weight,
							grade: result[index].grade,
						};
						const state = { student: allStudents[student.studentId].fullName };
						// trigger new grade flow, only if student is not newly added or re-fetch requested
						if (allStudents[student.studentId].totalAverageGrade !== undefined || null) {
							Homey.manager('flow').trigger('new_grade', tokens, state, (err, res) => {
								// Homey.log(res);
								if (err) Homey.log(err);
							});
						}
					}
				}
				const datesFilledIn = (result.map(function (g) { // get an array of all dateFilledIn
					return Date.parse(g.dateFilledIn);
					})
				);
				allStudents[student.studentId].lastGradeDateFilledIn = new Date(datesFilledIn.sort().pop()); // store last dateFilledIn
				allStudents[student.studentId].totalAverageGrade = calcAverageGrade(student); // calculate and store total average grade
				const setting = Homey.manager('settings').get(student.studentId);
				if (setting !== undefined) {
					setting.totalAverageGrade = allStudents[student.studentId].totalAverageGrade.toFixed(2);
					setting.lastGradeDateFilledIn = allStudents[student.studentId].lastGradeDateFilledIn;
					Homey.manager('settings').set(student.studentId, setting);
				}
			}
		});
	} catch (err) {	Homey.log(err); }
}

function handleDayRosterToday(student, date) {
	try {
		getDayRoster(allStudents[student.studentId].credentials, date, (error, result) => {
			if (!error && result !== {}) {
				// Homey.log(util.inspect(result));
				if (allStudents[student.studentId].dayRosterToday.date === undefined) { // startup condition of app
					Homey.log('app is initializing, first data is being stored');
				} else if (util.inspect(result) !== util.inspect(allStudents[student.studentId].dayRosterToday)
				&& result.date === allStudents[student.studentId].dayRosterToday.date) {
					Homey.log('dayroster today has changed');
					// Trigger flow for roster_changed_today
					const tokens = {
						name: allStudents[student.studentId].name,
						beginHour: result.beginHour,
						beginTime: result.beginTime.toTimeString().substr(0, 5),
						endHour: result.endHour,
						endTime: result.endTime.toTimeString().substr(0, 5),
						scrappedLessons: result.scrappedLessons,
					};
					const state = { student: allStudents[student.studentId].fullName };
					// Homey.log(tokens);
					// Homey.log(state);
					Homey.manager('flow').trigger('roster_changed_today', tokens, state, (err, res) => {
						// Homey.log(result);
						if (err) return Homey.log(err);
					});
					allStudents[student.studentId].dayRosterToday = result;
				}
				allStudents[student.studentId].dayRosterToday = result;
			}
		});
	} catch (err) {	Homey.log(err); }
}

function handleDayRosterTomorrow(student, date) {
	try {
		getDayRoster(allStudents[student.studentId].credentials, date, (error, result) => {
			if (!error && result !== {} || null) {
				// Homey.log(util.inspect(result));
				if (allStudents[student.studentId].dayRosterTomorrow.date === undefined) { // startup condition of app
					Homey.log('app is initializing, first data is being stored');
				} else if (util.inspect(result) !== util.inspect(allStudents[student.studentId].dayRosterTomorrow)
				&& result.date === allStudents[student.studentId].dayRosterTomorrow.date) {
					Homey.log('dayroster tomorrow has changed');
					// Trigger flow for roster_changed_tomorrow
					const tokens = {
						name: allStudents[student.studentId].name,
						beginHour: result.beginHour,
						beginTime: result.beginTime.toTimeString().substr(0, 5),
						endHour: result.endHour,
						endTime: result.endTime.toTimeString().substr(0, 5),
						scrappedLessons: result.scrappedLessons,
					};
					const state = { student: allStudents[student.studentId].fullName };
					// Homey.log(tokens);
					// Homey.log(state);
					Homey.manager('flow').trigger('roster_changed_tomorrow', tokens, state, (err, res) => {
						// Homey.log(res);
						if (err) return Homey.log(err);
					});
					allStudents[student.studentId].dayRosterTomorrow = result;
				}
				allStudents[student.studentId].dayRosterTomorrow = result;
			}
		});
	} catch (err) {	Homey.log(err); }
}


// ========================GET DATA FROM MAGISTER================================

const getMagister = (() => {
	const magisterCache = {};
	const magisterArray = (credentials, callback) => {
		const id = `${credentials.school}_${credentials.username}`;
		const magisters = magisterCache[id];
		if (magisters !== undefined) {
			setImmediate(() => {
				callback(null, magisters);
			});
			return;
		}
		new Magister.Magister(credentials).ready(function (err) {
			if (err != null) {
				callback(err, []);
				return;
			}
			const provide = (err, res) => {
				res = res || [];
				if (err == null) {
					magisterCache[id] = res;
				}
				callback(err, res);
			};
			if (this.profileInfo().birthDate() !== undefined) {
				provide(null, [this]);
			} else {
				this.children(provide);
			}
		});
	};
	return magisterArray;
})();

// get school and student info, used during settings update
function getStudent(credentials, callback) {
	try {
		// Homey.log('entering get pupil');
		if (credentials.school === '' || credentials.username === '' || credentials.password === '') {
			Homey.log('Error: school, username and password are required');
			callback('Error: school, username and password are required', null);
			return;
		}

		getMagister(credentials, (error, magisters) => {
			if (error != null) {
				Homey.log('Error connecting: ', error);
				// Homey.log(JSON.stringify(error));
				callback(JSON.stringify(error), null);
				return;
			}
			// Homey.log(util.inspect(magisters[0], { colors: true, depth: 10 }));
			const item = magisters[0];
			// store student photo in /userdata
			request.get({
				url: item.profileInfo().profilePicture(128, 128, false),
				encoding: null,
				headers: {
					cookie: item.http._cookie,
					'X-API-Client-ID': '12D8',
				},
			}).pipe(fs.createWriteStream(`./userdata/${item.profileInfo().id()}.jpg`));

			const student = {
				id: item.profileInfo().id(),
				firstName: item.profileInfo().firstName(),
				namePrefix: item.profileInfo().namePrefix(),
				lastName: item.profileInfo().lastName(),
				fullName: item.profileInfo().fullName(),
				magisterSchool: item.magisterSchool,
				currentCourse: null,
			};

			getCourse(credentials, (err, res) => {
				if (!err) {
					student.currentCourse = res;
					callback(null, student);
				} else { callback(err, err); }
			});

		});

	} catch (err) {	Homey.log(err); }
}

// schoolyear course
function getCourse(credentials, callback) {
	try {
		Homey.log('getting course info');
		getMagister(credentials, (error, magisters) => {
			if (error != null) {
				Homey.log('Error connecting: ', error);
				Homey.log(error);
				callback(error, null);
				return;
			}
			// Homey.log(util.inspect(magisters[0], { colors: true, depth: 10 }));
			const item = magisters[0];

			item.currentCourse((error, result) => {
				if (error || result === null || result === undefined) {
					Homey.log(`got error: ${error}`);
					if (!error) {
						callback('no current course data', null);
					}	else { callback(error.message, null); }
				} else {
					const courseInfo = {
						period: result.schoolPeriod(), // e.g. 1516
						begin: result.begin(), // e.g. Sat Aug 01 2015 00:00:00 GMT+0200 (West-Europa (zomertijd))
						end: result.end(), // e.g. Sun Jul 31 2016 00:00:00 GMT+0200 (West-Europa (zomertijd))
						type: result.type(), // e.g. { id: 1346, description: '1 gymnasium' },
						group: result.group(), // e.g. { id: 6150, description: '1gb', locationId: 0 },
						classesById: {},
					};

					result.classes((error, courseClasses) => {
						if (error) {
							Homey.log(error.message);
							callback(error.message, null);
							return;
						}
						for (const courseClass of courseClasses) {
							courseInfo.classesById[courseClass.id()] = {
								id: courseClass.id(), // e.g. 532518
								abbreviation: courseClass.abbreviation(), // e.g. 'ne'
								description: courseClass.description(), // e.g. 'Nederlandse taal'
								// number: courseClass.number() // e.g. 1
							};
						}
						// Homey.log(courseInfo);
						callback(null, courseInfo);
					});
				}
			});
		});
	} catch (err) {	Homey.log(err); }
}

// grades
function getGrades(credentials, callback) {
	try {
		Homey.log('getting grades info');
		// let grade = {};
		const grades = [];

		getMagister(credentials, (error, magisters) => {
			if (error != null) {
				Homey.log('Error connecting: ', error);
				Homey.log(error);
				callback(error, null);
				return;
			}
			// Homey.log(util.inspect(magisters[0], { colors: true, depth: 10 }));
			const item = magisters[0];

			item.currentCourse((error, result) => {
				if (error || result === null || result === undefined) {
					Homey.log(`got error: ${error}`);
					if (!error) {
						callback('no current course data', null);
						return;
					}
					callback(error.message, null);
					return;
				}
				// Homey.log(util.inspect(result));
				result.grades((error, res) => {
					// Homey.log(util.inspect(res));
					if (!Array.isArray(res)) {
						Homey.log('there are no grades available');
						callback('there are no grades available', null);
						return;
					}
					if (res[0] !== undefined) {
						for (const index in res) {
							if (res.hasOwnProperty(index)) {
							// Homey.log(res[index]);
								const grade = {
									id: res[index].type().id(), // e.g. 284587
									type: res[index].type().type(), // e.g. 1 or 2, where 1 is an actual grade and 2 a calulated grade
									class: res[index].class(), // e.g. { id: 532518, abbreviation: 'ne', description: '' }
									//  period: res[index].period(),  // e.g. { id: 3117, name: 'T2' }
									testDate: res[index].testDate(), // e.g. Tue Nov 17 2015 00:00:00 GMT+0100 (CET)
									dateFilledIn: new Date(Date.parse(res[index].dateFilledIn())), // e.g. Tue Mar 29 2016 11:26:10 GMT+0200 (West-Europa (zomertijd))
									description: res[index].description(), // e.g. SO Spelling H1-4
									grade: res[index].grade(), // e.g. 7.2
									weight: res[index].weight(), // e.g. 2
								};
								if (typeof grade.grade === 'string') {
									grade.grade = grade.grade.replace(',', '.');
								}
								if (grade.type === 1) {
									grades.push(grade);
								}
							}
						}
					} else {
						Homey.log('there are no grades available');
						callback('there are no grades available', null);
						return;
					}
					// Homey.log(grades);
					callback(null, grades);
				});
			});
		});
	} catch (err) {	Homey.log(err); }
}

function getDayRoster(credentials, date, callback) {
	try {
		// Homey.log('getting roster info for: '+ date);
		let dayRoster = {};
		let lesson = [];

		getMagister(credentials, (error, magisters) => {
			if (error != null) {
				Homey.log('Error connecting: ', error);
				Homey.log(error);
				callback(error, null);
				return;
			}
			// Homey.log(util.inspect(magisters[0], { colors: true, depth: 10 }));
			const item = magisters[0];

			item.appointments(date, (error, result) => {
				if (error || result === null || result === undefined) {
					Homey.log(`got error: ${error}`);
					if (!error) {
						callback('no appointment data', null);
						return;
					}
					callback(error.message, null);
					return;
				}
				// Homey.log(result[0]);
				dayRoster = {
					date: date.toDateString(),
					beginHour: null,
					beginTime: new Date(0),
					endHour: null,
					endTime: new Date(0),
					description: '',
					content: '',
					tests: false,
					fullDay: null,
					scrappedLessons: false,
					lessons: [],
				};
				if (!Array.isArray(result)) {
					// Homey.log('No lessons for this day: '+date);
					callback(null, dayRoster);
					return;
				}
				if (result[0] === undefined) {
					// Homey.log('No lessons for this day: '+date);
					callback(null, dayRoster);
					return;
				}

				for (const index in result) {
					if (result[index].scrapped() === false && dayRoster.beginHour === null) { // get first non-scrapped schoolhour
						dayRoster.beginHour = result[index].beginBySchoolHour();
						dayRoster.beginTime = result[index].begin();
						dayRoster.description = result[index].description();
						dayRoster.content = result[index].content().replace(/(\r\n|\n|\r)/gm, ' ');
						dayRoster.fullDay = result[index].fullDay();
					}
					if (result[index].scrapped() === false) { // get last non-scrapped schoolhour
						dayRoster.endHour = result[index].beginBySchoolHour();
						dayRoster.endTime = result[index].end();
					}
				}

				if (result[0].beginBySchoolHour() === null) {
					// Homey.log('No lessons for this day: '+date);
					callback(null, dayRoster);
					return;
				}
				for (const index in result) {
					if (result.hasOwnProperty(index)) {
						// Homey.log(result[index]);
						lesson = {
							hour: result[index].beginBySchoolHour(), // e.g. 1
							begin: result[index].begin(), // e.g. Thu Jun 23 2016 08:00:00 GMT+0200 (West-Europa (zomertijd))
							end: result[index].end(), // e.g. Thu Jun 23 2016 14:00:00 GMT+0200 (West-Europa (zomertijd))
							description: result[index].description(), // e.g. 'te - pri - 1gb' or 'Toetsweek'
							content: result[index].content().replace(/(\r\n|\n|\r)/gm, ' '), // e.g. null or 'Maken\tblz 164: opgave 27 t/m 31' or 'Toetsweek, rooster op www.minkema.nl'
							infoType: result[index].infoType(), // e.g. 0=regular, 1=huiswerk, 2=huiswerk+proefwerk, 4=huiswerk+SO, 6=mondeling of inhalen?
							class: result[index].classes()[0], // e.g. 'tekenen',
							fullDay: result[index].fullDay(), //  e.g. false
							location: result[index].location(), // e.g. 'M218',
							teacher: '', // result[index].teachers()[0].fullName(), // e.g. 'G. D. Lasseur'
							scrapped: result[index].scrapped(), // e.g. true
							changed: result[index].changed(), // e.g. false
							absenceInfo: result[index].absenceInfo(), // e.g. undefined
						};
						if (result[index].teachers()[0] !== undefined) {
							lesson.teacher = result[index].teachers()[0].fullName(); // e.g. 'G. D. Lasseur'
						}
						// Homey.log(lesson);
						//  check stuff if lesson hour already exists
						if (dayRoster.lessons.slice(-1)[0] !== undefined) {
							if (dayRoster.lessons.slice(-1)[0].hour === lesson.hour) {
								// if last lesson was scrapped, replace it with this lesson
								if (dayRoster.lessons.slice(-1)[0].scrapped === true) {
									dayRoster.lessons.pop();
									dayRoster.lessons.push(lesson);
								} else if (lesson.scrapped === false) { // if last lesson was not scrapped, add this lesson if it not scrapped
									dayRoster.lessons.push(lesson);
								}
							} else {	// add lesson in case this is a new hour
								dayRoster.lessons.push(lesson);
							}
						} else {	// add lesson in case this is the first hour
							dayRoster.lessons.push(lesson);
						}
					}
				}

				// check if day has scrapped lessons or tests
				dayRoster.lessons.forEach((lessn) => {
					// Homey.log(lesson);
					if (lessn.scrapped) { dayRoster.scrappedLessons = true; }
					if (lessn.infoType === 2 || lessn.infoType === 4 || lessn.infoType === 6) { dayRoster.tests = true; }
				});

				// Homey.log(dayRoster);
				callback(null, dayRoster);
				return;
			});
		});
	} catch (err) {	Homey.log(err); }
}


// ===================TRIGGER FLOWS with autocomplete============================
// this is fired when a flow with this trigger has been found, and has extra arguments

Homey.manager('flow').on('trigger.new_grade', (callback, args, state) => {
	// console.log(args); // { 'location': 'New York' }, this is the user input
	// console.log(state); // { 'location': 'Amsterdam' }, this is the state parameter, as passed in trigger()
	if (allStudents[args.student.studentId].fullName === state.student) {
		callback(null, true); // If true, this flow should run. The callback is (err, result)-style.
	} else {
		callback(null, false);
	}
});

Homey.manager('flow').on('trigger.roster_changed_today', (callback, args, state) => {
	if (allStudents[args.student.studentId].fullName === state.student) {
		callback(null, true); // If true, this flow should run. The callback is (err, result)-style.
	} else {
		callback(null, false);
	}
});

Homey.manager('flow').on('trigger.roster_changed_tomorrow', (callback, args, state) => {
	if (allStudents[args.student.studentId].fullName === state.student) {
		callback(null, true); // If true, this flow should run. The callback is (err, result)-style.
	} else {
		callback(null, false);
	}
});

// ============================ACTION and CONDITION FLOWS=====================================

Homey.manager('flow').on('action.sayGrades', (callback, args) => {
	sayGrades(args);
	callback(null, true); //  we've fired successfully
});

Homey.manager('flow').on('action.sayRoster', (callback, args) => {
	sayRoster(args);
	callback(null, true); // we've fired successfully
});

Homey.manager('flow').on('action.sayHomework', (callback, args) => {
	sayHomework(args);
	callback(null, true); // we've fired successfully
});

Homey.manager('flow').on('action.sayTests', (callback, args) => {
	sayTests(args);
	callback(null, true); // we've fired successfully
});

Homey.manager('flow').on('condition.scrapped', (callback, args) => {
	if (allStudents[args.student.studentId] === undefined) {
		return callback('unknown student', null);
	}
	const dayRoster = allStudents[args.student.studentId][`dayRoster${args.when}`];
	if (dayRoster.hasOwnProperty('scrappedLessons')) {
		const result = dayRoster.scrappedLessons;
		return callback(null, result);
	}
	callback('no roster data available', null);
});

Homey.manager('flow').on('condition.testPlanned', (callback, args) => {
	if (allStudents[args.student.studentId] === undefined) {
		return callback('unknown student', null);
	}
	const dayRoster = allStudents[args.student.studentId][`dayRoster${args.when}`];
	if (dayRoster.hasOwnProperty('tests')) {
		const result = dayRoster.tests;
		return callback(null, result);
	}
	callback('no roster data available', null);
});

// ============================Autocomplete lists FLOWS==========================
Homey.manager('flow').on('trigger.new_grade.student.autocomplete', (callback, args) => {
	let myItems = studentList;
	// filter items to match the search query
	myItems = myItems.filter(function (item) {
		return (item.name.toLowerCase().indexOf(args.query.toLowerCase()) > -1);
	});
	callback(null, myItems); // err, results
});

Homey.manager('flow').on('trigger.roster_changed_today.student.autocomplete', (callback, args) => {
	let myItems = studentList;
	// filter items to match the search query
	myItems = myItems.filter(function (item) {
		return (item.name.toLowerCase().indexOf(args.query.toLowerCase()) > -1);
	});
	callback(null, myItems); // err, results
});

Homey.manager('flow').on('trigger.roster_changed_tomorrow.student.autocomplete', (callback, args) => {
	let myItems = studentList;
	// filter items to match the search query
	myItems = myItems.filter(function (item) {
		return (item.name.toLowerCase().indexOf(args.query.toLowerCase()) > -1);
	});
	callback(null, myItems); // err, results
});

Homey.manager('flow').on('condition.scrapped.student.autocomplete', (callback, args) => {
	let myItems = studentList;
	// filter items to match the search query
	myItems = myItems.filter(function (item) {
		return (item.name.toLowerCase().indexOf(args.query.toLowerCase()) > -1);
	});
	callback(null, myItems); // err, results
});

Homey.manager('flow').on('condition.testPlanned.student.autocomplete', (callback, args) => {
	let myItems = studentList;
	// filter items to match the search query
	myItems = myItems.filter(function (item) {
		return (item.name.toLowerCase().indexOf(args.query.toLowerCase()) > -1);
	});
	callback(null, myItems); // err, results
});

Homey.manager('flow').on('action.sayGrades.student.autocomplete', (callback, args) => {
	let myItems = studentList;
	// filter items to match the search query
	myItems = myItems.filter(function (item) {
		return (item.name.toLowerCase().indexOf(args.query.toLowerCase()) > -1);
	});
	callback(null, myItems); // err, results
});

Homey.manager('flow').on('action.sayRoster.student.autocomplete', (callback, args) => {
	let myItems = studentList;
	// filter items to match the search query
	myItems = myItems.filter(function (item) {
		return (item.name.toLowerCase().indexOf(args.query.toLowerCase()) > -1);
	});
	callback(null, myItems); // err, results
});

Homey.manager('flow').on('action.sayHomework.student.autocomplete', (callback, args) => {
	let myItems = studentList;
	// filter items to match the search query
	myItems = myItems.filter(function (item) {
		return (item.name.toLowerCase().indexOf(args.query.toLowerCase()) > -1);
	});
	callback(null, myItems); // err, results
});

Homey.manager('flow').on('action.sayTests.student.autocomplete', (callback, args) => {
	let myItems = studentList;
	// filter items to match the search query
	myItems = myItems.filter(function (item) {
		return (item.name.toLowerCase().indexOf(args.query.toLowerCase()) > -1);
	});
	callback(null, myItems); // err, results
});

// ========================SPEECH OUTPUT=========================================

function sayGrades(args) {
	try {
		if (args.when === 'last') {
			const lastGrade = args.student.studentId.grades.pop();
			Homey.manager('speech-output').say(
				allStudents[args.student.studentId].name + __('has a new grade for') +
				allStudents[args.student.studentId].currentCourse.classesById[lastGrade.class.id].description +
				__('its a') + lastGrade.grade + __('this one counts') + lastGrade.weight + __('times')
			);
			return;
		}
		let requestedPeriod;
		let requestedDay;
		if (args.when === 'today') {
			requestedPeriod = new Date();
			requestedPeriod.setDate(requestedPeriod.getDate() - 1);
			requestedDay = __('today');
		}
		if (args.when === 'week') {
			requestedPeriod = new Date();
			requestedPeriod.setDate(requestedPeriod.getDate() - 7);
			requestedDay = __('the past 7 days');
		}
		// Homey.log('saying grades since ' + requestedPeriod);
		if (allStudents[args.student.studentId].grades === undefined) {
			return;
		}
		Homey.manager('speech-output').say(
			__('new grades of') + allStudents[args.student.studentId].name + __('of') + requestedDay
		);
		let newGrades = false;
		allStudents[args.student.studentId].grades.forEach((currentGrade, index, arr) => {
			if (currentGrade.dateFilledIn >= requestedPeriod) {
				newGrades = true;
				Homey.manager('speech-output').say(allStudents[args.student.studentId].currentCourse.classesById[currentGrade.class.id].description +
					__('its a') + currentGrade.grade + __('this one counts') + currentGrade.weight + __('times')
				);
			}
		});
		if (newGrades === false) {
			Homey.manager('speech-output').say(__('no new grades') + requestedDay);
		}
	} catch (err) {	Homey.log(err); }
}

function sayHomework(args) {
	try {
		let requestedRoster;
		let requestedDay;
		if (args.when === 'today') {
			requestedRoster = allStudents[args.student.studentId].dayRosterToday;
			requestedDay = __('today');
		} else {
			requestedRoster = allStudents[args.student.studentId].dayRosterTomorrow;
			requestedDay = __('tomorrow');
		}
		// Homey.log(requestedRoster.lessons);
		if (requestedRoster.lessons === undefined) {
			return;
		}
		Homey.manager('speech-output').say(
			__('homework of') + allStudents[args.student.studentId].name + __('of') + requestedDay
		);
		let homework = false;
		requestedRoster.lessons.forEach((currentLesson, index, arr) => {
			if (currentLesson.content !== '' && currentLesson.content != null) {
				homework = true;
				Homey.manager('speech-output').say(`${currentLesson.class}: ${currentLesson.content.substr(0, 255)}`);
			}
		});
		if (homework === false) {
			Homey.manager('speech-output').say(__('no homework') + requestedDay);
		}
	} catch (err) {	Homey.log(err); }
}

function sayRoster(args) {
	try {
		let requestedRoster;
		let requestedDay;
		if (args.when === 'today') {
			requestedRoster = allStudents[args.student.studentId].dayRosterToday;
			requestedDay = __('today');
		} else {
			requestedRoster = allStudents[args.student.studentId].dayRosterTomorrow;
			requestedDay = __('tomorrow');
		}
		// Homey.log(requestedRoster);
		if (requestedRoster.lessons === undefined) {
			return;
		}
		if (requestedRoster.beginHour === null) {
			Homey.manager('speech-output').say(allStudents[args.student.studentId].name + __('has no class') + requestedDay);
			// Homey.log(requestedRoster.description);
			// Homey.log(requestedRoster.content);
			if (requestedRoster.description !== '' || requestedRoster.content !== '') {
				//      Homey.log('starting to say description');
				Homey.manager('speech-output').say(__('but there is a description'));
				if (requestedRoster.description !== null) {
					Homey.manager('speech-output').say(requestedRoster.description);
				}
				if (requestedRoster.content !== null) {
					Homey.manager('speech-output').say(requestedRoster.content.substr(0, 255));
				}
			}
		} else {
			Homey.manager('speech-output').say(
				__('the roster of') + allStudents[args.student.studentId].name +
				__('of') + requestedDay + __('starts at') + requestedRoster.beginTime.toTimeString().substr(0, 5) +
				__('and ends at') + requestedRoster.endTime.toTimeString().substr(0, 5)
			);
			requestedRoster.lessons.forEach((currentLesson, index, arr) => {
				if (currentLesson.scrapped === true) {
					Homey.manager('speech-output').say(__('class') + currentLesson.hour + __('has been scrapped'));
				} else {
					Homey.manager('speech-output').say(__('class') + `${currentLesson.hour}: ${currentLesson.class}`);
				}
			});
		}
	} catch (err) {	Homey.log(err); }
}

function sayTests(args) {
	try {
		let requestedRoster;
		let requestedDay;
		if (args.when === 'today') {
			requestedRoster = allStudents[args.student.studentId].dayRosterToday;
			requestedDay = __('today');
		} else {
			requestedRoster = allStudents[args.student.studentId].dayRosterTomorrow;
			requestedDay = __('tomorrow');
		}
		// Homey.log(requestedRoster.lessons);
		if (requestedRoster.lessons === undefined) {
			return;
		}
		Homey.manager('speech-output').say(
			__('tests of') + allStudents[args.student.studentId].name + __('of') + requestedDay
		);
		if (requestedRoster.tests === false) {
			Homey.manager('speech-output').say(__('no tests') + requestedDay);
			return;
		}
		requestedRoster.lessons.forEach((currentLesson, index, arr) => {
			if (currentLesson.infoType === 2 || currentLesson.infoType === 4 || currentLesson.infoType === 6) {
				Homey.manager('speech-output').say(`${currentLesson.class}: ${currentLesson.content.substr(0, 255)}`);
			}
		});
	} catch (err) {	Homey.log(err); }
}
