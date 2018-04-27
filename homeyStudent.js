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
const mapi = require('./mapi.js');
const fs = require('fs');
// const util = require('util');

class HomeyStudent {
	constructor(credentials, id) {
		this.studentId = id || null; // gets updated after login. unique student ID, e.g. 18341
		this.credentials = credentials; // { school, username, password, childNumber }
		this.fullName = '';	// available after login or loadSettings
		this.type_group = '';	// available after login or loadSettings
		this.period = '';	// available after login or loadSettings
		this.totalAverageGrade = null;	// available after loadSettings
		this.lastGradeLogDate = 0;	// available after loadSettings
		this.magisterStudent = {};	// available after login or loadSettings
		this.firstName = ''; // available after login
		this.initials = '';	// available after login
	}

	async loadSettings(id) {
		return new Promise(async (resolve, reject) => {
			try {
				this.studentId = id || this.studentId;
				if (!this.studentId) {	// need to login first to get studentId
					throw Error('No studentId provided. Provide Id or login first');
				}
				const studentSettings = Homey.ManagerSettings.get(this.studentId);
				this.credentials = studentSettings.credentials;
				this.fullName = studentSettings.fullName;
				this.type_group = studentSettings.type_group;
				this.period = studentSettings.period;
				this.totalAverageGrade = studentSettings.totalAverageGrade;
				this.lastGradeLogDate = studentSettings.lastGradeLogDate;
				return resolve(studentSettings);
			} catch (error) {
				console.log(error);
				return reject(error);
			}
		});
	}

	provideSettings() {	// settings that will be stored in Homey
		const studentSettings = {
			studentId: this.studentId,
			credentials: this.credentials,
			fullName: this.fullName,
			initials: this.initials,
			type_group: this.type_group,
			period: this.period,
			totalAverageGrade: this.totalAverageGrade,
			lastGradeLogDate: this.lastGradeLogDate,
		};
		return studentSettings;
	}

	saveSettings() {
		return new Promise((resolve, reject) => {
			try {
				const studentSettings = this.provideSettings();
				Homey.ManagerSettings.set(studentSettings.studentId, studentSettings);
				// store student photo in /userdata
				const writeStream = fs.createWriteStream(`./userdata/${this.studentId}.jpg`);
				this.magisterStudent.profileInfo.getProfilePicture(128, 128, false)
					.then((readStream) => {
						readStream.pipe(writeStream);
					});
				return resolve(studentSettings);
			} catch (error) {
				console.log(error);
				return reject(error);
			}
		});
	}

	deleteSettings() {
		Homey.ManagerSettings.unset(this.studentId);
		fs.unlink(`./userdata/${this.studentId}.jpg`, (err) => {
			if (err) {
				console.error(err);	// photo delete error
			} // else { this.log('Photo deleted'); }
		});
	}

	login(credentials) {
		this.credentials = credentials || this.credentials;
		return new Promise(async (resolve, reject) => {
			try {
				this.magisterStudent = await mapi.getStudent(this.credentials);
				let { lastName } = this.magisterStudent.profileInfo;
				if (this.magisterStudent.profileInfo.namePrefix !== null) {
					lastName = `${this.magisterStudent.profileInfo.namePrefix} ${this.magisterStudent.profileInfo.lastName}`;
				}
				this.studentId = this.magisterStudent.profileInfo.id;
				this.firstName = this.magisterStudent.profileInfo.firstName;
				this.fullName = `${this.magisterStudent.profileInfo.firstName} ${lastName}`;
				this.initials = `${this.magisterStudent.profileInfo.firstName[0]}${this.magisterStudent.profileInfo.lastName[0]}`;
				const currentCourse = await mapi.getCurrentCourse(this.magisterStudent);
				this.type_group = `${currentCourse.type.description} - ${currentCourse.group.description}`;
				this.period = `${currentCourse.schoolPeriod}`;
				return resolve(this.magisterStudent);
			} catch (error) {
				console.log(error);
				return reject(error);
			}
		});
	}

	getAllGrades() {
		return new Promise(async (resolve, reject) => {
			try {
				const grades = await mapi.getGrades(this.magisterStudent);
				const totalGrade = grades.reduce((acc, current) => {
					const value = acc.value + (current.grade * current.weight);
					const weight = acc.weight + current.weight;
					return { value, weight };
				}, { value: 0, weight: 0 });
				this.totalAverageGrade = Math.round(100 * (totalGrade.value / totalGrade.weight)) / 100;
				return resolve(grades);
			} catch (error) {
				return reject(Error(error));
			}
		});
	}

	getNewGrades() {
		return new Promise(async (resolve, reject) => {
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
				this.lastGradeLogDate = new Date(lastGradeDateFilledIn); // new Date('2018-4-15');	// for testing historic dates
				return resolve(newGrades);
			} catch (error) {
				return reject(Error(error));
			}
		});
	}

	setLastLogDate(dateString) {
		this.lastGradeLogDate = new Date(dateString);
	}


}

module.exports = HomeyStudent;
