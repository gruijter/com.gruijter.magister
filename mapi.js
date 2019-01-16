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

const { default: magister, getSchools } = require('magister.js');
const https = require('https');
// const fs = require('fs');

const authCodeUrl = 'https://raw.githubusercontent.com/simplyGits/magisterjs-authcode/master/code.json';
const magisterTokenCache = [];

function _getRequest(url) {
	return new Promise((resolve, reject) => {
		const req = https.get(url, (res) => {
			let resBody = '';
			res.on('data', (chunk) => {
				resBody += chunk;
			});
			res.once('end', () => {
				res.body = resBody;
				return resolve(res); // resolve the request
			});
		});
		req.setTimeout(5000, () => {
			req.abort();
		});
		req.once('error', (e) => {
			reject(e);
		});
	});
}

module.exports.getAppointments = async function getAppointments(student, from, to) {
	// console.log(`getting DayRoster for ${student.profileInfo.id} from ${from} to ${to}`);
	try {
		const appointments = await student.appointments(from, to);
		// note: remove html content with .replace(/<[^>]+>/g, '');
		return Promise.resolve(appointments);
	} catch (error) {
		return Promise.reject(error);
	}

};

module.exports.getGrades = async function getGrades(student) {
	// console.log(`getting grades for ${student.profileInfo.id}`);
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
		return Promise.resolve(grades);
	} catch (error) {
		return Promise.reject(error);
	}
};

module.exports.getCurrentCourse = async function getCurrentCourse(student) {
	// console.log(`getting latest course for ${student.profileInfo.id}`);
	try {
		const courses = await student.courses();
		const currentCourse = courses[courses.length - 1];
		return Promise.resolve(currentCourse);
	} catch (error) {
		return Promise.reject(error);
	}
};

module.exports.getStudent = async function getStudent(credentials) {
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
		return Promise.resolve(student);
	} catch (error) {
		return Promise.reject(error);
	}
};

module.exports.findSchools = async function findSchools(schoolQueery) {
	// console.log(`getting latest course for ${student.profileInfo.id}`);
	try {
		const schools = await getSchools(schoolQueery); // get schools matching '<schoolname>'
		if (schools.length < 1) throw Error('No matching school found');
		return Promise.resolve(schools);
	} catch (error) {
		return Promise.reject(error);
	}
};

module.exports.getMagisterSession = async function getMagisterSession(credentials) {
	try {
		let { school } = credentials;
		if (!school.url) {
			const schools = await this.findSchools(school);
			[school] = schools;
		}
		// get the authToken
		const authCodeResponse = await _getRequest(authCodeUrl);
		const authCode = JSON.parse(authCodeResponse.body);
		// retrieve existing token from cache
		const id = `${school.url}_${credentials.username}_${credentials.password}`;
		if (magisterTokenCache[id] !== undefined) {
			const sessionCredentials = {
				school,
				token: magisterTokenCache[id],	// use the token
				authCode,
			};
			const magisterSession = await magister(sessionCredentials)
				.catch(() => false);
			if (magisterSession) {
				return Promise.resolve(magisterSession);
			}
		}
		// no token stored or error logging in with token, so login with username and password
		const sessionCredentials = {
			school,
			username: credentials.username,
			password: credentials.password,
			authCode,
		};
		let magisterSession = await magister(sessionCredentials)
			.catch(() => false);
		if (!magisterSession) {
			// login failed. Attempt one more time...
			magisterSession = await magister(sessionCredentials)
				.catch(() => false);
			if (!magisterSession) {
				// login failed again. Attempt one last time...
				magisterSession = await magister(sessionCredentials);
			}
		}
		magisterTokenCache[id] = magisterSession.http._token;
		return Promise.resolve(magisterSession);
	} catch (error) {
		return Promise.reject(error);
	}
};
