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
const fs = require('fs');
const Magister = require('magister2.js');
const util = require('util');

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

		// init some variables
		this.magisterCache = {};
	}

	//  stuff for frontend API
	deleteLogs() {
		return this.logger.deleteLogs();
	}
	getLogs() {
		return this.logger.logArray;
	}
	async validateAccount(credentials) {
		this.log('Validating', credentials);
		try {
			const student = await this.getStudent(credentials);
			return student; // Homey.__('testOk', { result: JSON.stringify(student.profileInfo) });
		} catch (error) {
			return error;
		}
	}

	getStudent(credentials, studentId) {
		return new Promise(async (resolve, reject) => {
			try {
				const session = await this.getMagisterSession(credentials);
				let student = session;
				// this.log(util.inspect(session));
				// do stuff here for parent login
				const children = await session.children()
					.catch(() => {
						// student account; leave student as is
					});
				if (Array.isArray(children)) {
					// parent account; select right child as student
					// need to do stuff here to match against studentId
					student = children[0];
				}
				// this.log(util.inspect(student));

				// store student photo in /userdata
				const writeStream = fs.createWriteStream(`./userdata/${student.profileInfo.id}.jpg`);
				student.profileInfo.getProfilePicture(128, 128, false)
					.then((readStream) => {
						readStream.pipe(writeStream);
					});
				return resolve(student);
			} catch (error) {
				this.error(error);
				return reject(Error(error));
			}
		});
	}

	getMagisterSession(credentials, forceNewSession) {
		return new Promise(async (resolve, reject) => {
			try {
				// cache existing sessions
				const id = `${credentials.school}_${credentials.username}`;
				if (!forceNewSession && this.magisterCache[id] !== undefined) {
					return resolve(this.magisterCache[id]);
				}
				const schools = await Magister.getSchools(credentials.school); // get schools matching '<schoolname>'
				if (schools.length < 1) throw Error('No matching school found');
				credentials.school = schools[0]; // get the first matching school
				const magisterSession = await Magister.default(credentials); // login
				// this.log(util.inspect(magisterSession));
				this.magisterCache[id] = magisterSession;
				return resolve(magisterSession);
			} catch (error) {
				this.error(error);
				return reject(error);
			}
		});
	}

	// testing routines here


}

module.exports = MagisterApp;
