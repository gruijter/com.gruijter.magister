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

// retrieving data via Magister API

const Magister = require('magister2.js');

const magisterCache = [];

module.exports.getAppointments = function getAppointments(student, from, to) {
	// console.log(`getting DayRoster for ${student.profileInfo.id} from ${from} to ${to}`);
	return new Promise(async (resolve, reject) => {
		try {
			const appointments = await student.appointments(from, to);
			// note: remove html content with .replace(/<[^>]+>/g, '');
			return resolve(appointments);
		} catch (error) {
			return reject(Error(error));
		}
	});
};

module.exports.getGrades = function getGrades(student) {
	// console.log(`getting grades for ${student.profileInfo.id}`);
	return new Promise(async (resolve, reject) => {
		try {
			const courses = await student.courses();
			const currentCourse = courses[courses.length - 1];
			const rawGrades = await currentCourse.grades();
			// only type 1 grades, and grades that are a number
			const grades = rawGrades
				.filter(gradeRaw => (gradeRaw.type._type === 1)) // && !Number.isNaN(gradeRaw.grade.replace(',', '.'))))
				.map(gradeRaw => ({
					id: gradeRaw.id,
					grade: gradeRaw.grade.replace(',', '.'),	// this is a string!
					weight: gradeRaw.weight,
					description: gradeRaw.description,
					testDate: gradeRaw.testDate,
					dateFilledIn: gradeRaw.dateFilledIn,
					classId: gradeRaw.class.id,
					classAbreviation: gradeRaw.class.abbreviation,
					classDescription: gradeRaw.class.description,
					typeDescription: gradeRaw.type.description,
				}));
			return resolve(grades);
		} catch (error) {
			return reject(Error(error));
		}
	});
};

module.exports.getCurrentCourse = function getCurrentCourse(student) {
	// console.log(`getting latest course for ${student.profileInfo.id}`);
	return new Promise(async (resolve, reject) => {
		try {
			const courses = await student.courses();
			const currentCourse = courses[courses.length - 1];
			return resolve(currentCourse);
		} catch (error) {
			return reject(Error(error));
		}
	});
};

module.exports.getStudent = function getStudent(credentials) {
	return new Promise(async (resolve, reject) => {
		try {
			const loginSession = await module.exports.getMagisterSession(credentials);
			let student = loginSession;
			const children = await loginSession.children()
				.catch(() => {	// student account; leave student as is
				});
			if (Array.isArray(children)) {	// parent account; select right child as student
				let childNr = (Number(credentials.childNumber) - 1);
				if (childNr > (children.length - 1)) {
					throw Error('This child number does not exist with this parent login');
				}
				if (Number.isNaN(childNr) || childNr < 0) {
					childNr = 0;
				}
				student = children[childNr];
			}
			return resolve(student);
		} catch (error) {
			return reject(error);
		}
	});
};

module.exports.getMagisterSession = function getMagisterSession(credentials) {
	return new Promise(async (resolve, reject) => {
		try {
			// // cache existing sessions
			const id = `${credentials.school}_${credentials.username}_${credentials.password}`;
			if (magisterCache[id] !== undefined) {
				// console.log('already got a session');
				return resolve(magisterCache[id]);
			}
			console.log('new session');
			const schoolQueery = credentials.school;
			const schools = await Magister.getSchools(schoolQueery); // get schools matching '<schoolname>'
			if (schools.length < 1) throw Error('No matching school found');
			const sessionCredentials = {
				school: schools[0], // get first matching school
				username: credentials.username,
				password: credentials.password,
			};
			const magisterSession = await Magister.default(sessionCredentials);
			magisterCache[id] = magisterSession;
			return resolve(magisterSession);
		} catch (error) {
			return reject(error);
		}
	});
};

// module.exports = [getMagisterSession, getStudent, getCurrentCourse, getGrades, getAppointments];
