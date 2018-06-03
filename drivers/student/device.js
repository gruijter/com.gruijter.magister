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
const fs = require('fs');
// const util = require('util');

class StudentDevice extends Homey.Device {	// studentDevice represents a student status and its methods

	// this method is called when the Device is inited
	async onInit() {
		this.log(`device init: ${this.getName()} id: ${this.getData().id}`);
		const settings = this.getSettings();
		// init states
		this.studentId = this.getData().id;
		this.credentials = {
			school: settings.school,
			username: settings.username,
			password: settings.password,
			childNumber: settings.childNumber,
		};
		this.magisterStudent = {};	// available after login
		this.initials = '';	// available after login
		this.firstName = ''; // settings.firstName;	// available after login
		this.fullName = ''; // settings.fullName;	// available after login
		this.typeAndGroup = settings.typeAndGroup;
		this.period = settings.period;
		this.totalAverageGrade = Number(settings.totalAverageGrade);
		this.lastGradeLogDate = new Date(settings.lastGradeLogDate || 0);
		this.grades = [];	// available after getGrades
		this.rosterToday = { summary: null, lessons: null }; // available after getDayRostersTodayAndTomorrow()
		this.rosterTomorrow = { summary: null, lessons: null };	// available after getDayRostersTodayAndTomorrow()
		// add device methods from driver
		this._driver = this.getDriver();
		this.login = this._driver.login.bind(this);
		this.getCurrentCourse = this._driver.getCurrentCourse.bind(this);
		this.getAllGrades = this._driver.getAllGrades.bind(this);
		this.getNewGrades = this._driver.getNewGrades.bind(this);
		this.handleGradesData = this._driver.handleGradesData.bind(this);
		this.logGrade = this._driver.logGrade.bind(this);
		this.deleteGradeLogs = this._driver.deleteGradeLogs.bind(this);
		this.sayGrades = this._driver.sayGrades.bind(this);
		this.handleLessons = this._driver.handleLessons.bind(this);
		this.getRostersTodayAndTomorrow = this._driver.getRostersTodayAndTomorrow.bind(this);
		this.getDayRoster = this._driver.getDayRoster.bind(this);
		this.getAllRosterItems = this._driver.getAllRosterItems.bind(this);
		this.sayRoster = this._driver.sayRoster.bind(this);
		this.sayHomework = this._driver.sayHomework.bind(this);
		this.sayTests = this._driver.sayTests.bind(this);
		// init flow cards
		this.flowCards = {};
		this.registerFlowCards();
	}

	// this method is called when the Device is added
	onAdded() {
		this.log('student added as device');
		setTimeout(() => this._driver.startPolling(), 1000 * 10);
	}

	// this method is called when the Device is deleted
	onDeleted() {
		// stop polling
		clearInterval(this.intervalIdDevicePoll);
		this.deleteGradeLogs(this.initials);
		fs.unlink(`./userdata/${this.studentId}.jpg`, (err) => {
			if (err) {
				this.error(err);	// photo delete error
			} // else { this.log('Photo deleted'); }
		});
		this.log('student deleted as device');
	}

	// this method is called when the user has changed the device's settings in Homey.
	onSettings(oldSettingsObj, newSettingsObj, changedKeysArr, callback) {
		// first stop polling the device, then start init after short delay
		clearInterval(this.intervalIdDevicePoll);
		this.log('student settings changed');
		if (newSettingsObj.fetchAllGrades) {
			this.lastGradeLogDate = 0;
			this._driver.startPolling();
			return callback(Homey.__('fetchAllGrades'), null);
		}
		this.setAvailable()
			.catch(this.error);
		setTimeout(() => {
			this.onInit();
		}, 10000);
		// do callback to confirm settings change
		return callback(null, true);
	}

	provideSettings() {	// settings that will be stored in Homey persistent storage
		const studentSettings = {
			studentId: this.studentId,
			school: this.credentials.school,
			username: this.credentials.username,
			password: this.credentials.password,
			childNumber: this.credentials.childNumber,
			typeAndGroup: this.typeAndGroup,
			period: this.period,
			totalAverageGrade: this.totalAverageGrade.toString(),
			lastGradeLogDate: this.lastGradeLogDate.toISOString(),
		};
		return studentSettings;
	}

	saveSettings() {
		const studentSettings = this.provideSettings();
		this.setSettings(studentSettings);
		// store student photo in /userdata
		const writeStream = fs.createWriteStream(`./userdata/${this.studentId}.jpg`);
		this.magisterStudent.profileInfo.getProfilePicture(128, 128, false)
			.then((readStream) => {
				readStream.pipe(writeStream);
			})
			.catch(this.error);
		return studentSettings;
	}

	registerFlowCards() {
		// unregistering previous cards and listeners
		// if (this.flowCards) {
		// 	this.flowCards.forEach((flowCard) => {
		// 		this.log(`unregistering ${flowCard.id}`);
		// 		flowCard.unregister();
		// 	});
		// } else {
		// 	this.flowCards = [];
		// }

		// if (this.newGradeTrigger) {
		// 	this.newGradeTrigger.unregister();
		// }
		// if (this.rosterChangedTodayTrigger) {
		// 	this.rosterChangedTodayTrigger.unregister();
		// }
		// if (this.rosterChangedTomorrowTrigger) {
		// 	this.rosterChangedTomorrowTrigger.unregister();
		// }
		// if (this.sayGradesAction) {
		// 	this.sayGradesAction.unregister();
		// }
		// if (this.cancelledCondition) {
		// 	this.cancelledCondition.unregister();
		// }
		// if (this.testPlannedCondition) {
		// 	this.testPlannedCondition.unregister();
		// }
		// if (this.homeworkCondition) {
		// 	this.homeworkCondition.unregister();
		// }
		// if (this.sayRosterAction) {
		// 	this.sayRosterAction.unregister();
		// }
		// if (this.sayTestsAction) {
		// 	this.sayTestsAction.unregister();
		// }
		// if (this.sayHomeworkAction) {
		// 	this.sayHomeworkAction.unregister();
		// }
		// register trigger flow cards
		this.flowCards.newGradeTrigger = new Homey.FlowCardTriggerDevice('new_grade')
			.register();
		this.flowCards.rosterChangedTodayTrigger = new Homey.FlowCardTriggerDevice('roster_changed_today')
			.register();
		this.flowCards.rosterChangedTomorrowTrigger = new Homey.FlowCardTriggerDevice('roster_changed_tomorrow')
			.register();
		this.flowCards.classSkippedTrigger = new Homey.FlowCardTriggerDevice('class_skipped_today')
			.register();
		// register condition flow registerFlowCards
		this.flowCards.cancelledCondition = new Homey.FlowCardCondition('cancelled')
			.register()
			.registerRunListener((args) => {
				if (!this.rosterToday.summary) {
					return false;
				}
				let cancelled = (this.rosterToday.summary.cancellations > 0);
				if (args.when === 'tomorrow') {
					cancelled = (this.rosterTomorrow.summary.cancellations > 0);
				}
				return Promise.resolve(cancelled);
			});
		this.flowCards.testPlannedCondition = new Homey.FlowCardCondition('test_planned')
			.register()
			.registerRunListener((args) => {
				if (!this.rosterToday.summary) {
					return false;
				}
				let cancelled = (this.rosterToday.summary.tests > 0);
				if (args.when === 'tomorrow') {
					cancelled = (this.rosterTomorrow.summary.tests > 0);
				}
				return Promise.resolve(cancelled);
			});
		this.flowCards.homeworkCondition = new Homey.FlowCardCondition('homework')
			.register()
			.registerRunListener((args) => {
				if (!this.rosterToday.summary) {
					return false;
				}
				let homeworkCondition = (this.rosterToday.summary.homework > 0);
				if (args.when === 'tomorrow') {
					homeworkCondition = (this.rosterTomorrow.summary.homework > 0);
				}
				return Promise.resolve(homeworkCondition);
			});
		// register action flow cards
		this.flowCards.sayGradesAction = new Homey.FlowCardAction('say_grades')
			.register()
			.registerRunListener((args) => {
				this.sayGrades(args);
				return Promise.resolve(true);
			});
		this.flowCards.sayRosterAction = new Homey.FlowCardAction('say_roster')
			.register()
			.registerRunListener((args) => {
				this.sayRoster(args);
				return Promise.resolve(true);
			});
		this.flowCards.sayTestsAction = new Homey.FlowCardAction('say_tests')
			.register()
			.registerRunListener((args) => {
				this.sayTests(args);
				return Promise.resolve(true);
			});
		this.flowCards.sayHomeworkAction = new Homey.FlowCardAction('say_homework')
			.register()
			.registerRunListener((args) => {
				this.sayHomework(args);
				return Promise.resolve(true);
			});
	}

}

module.exports = StudentDevice;
