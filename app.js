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

class MagisterApp extends Homey.App {

	onInit() {
		this.log('Magister app is running!');
		this.logger = new Logger('log', 1000);
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
	}

	//  stuff for frontend API
	deleteLogs() {
		return this.logger.deleteLogs();
	}
	getLogs() {
		return this.logger.logArray;
	}
	getStudents() {
		this.log('settings frontend is requesting studentlist');
		const driver = Homey.ManagerDrivers.getDriver('student');
		const devices = driver.getDevices();
		const studentList = devices.reduce((acc, current) => {	// make an associative array
			acc[current.studentId] = {
				studentId: current.studentId,
				fullName: current.fullName,
				typeAndGroup: current.typeAndGroup,
				period: current.period,
				totalAverageGrade: current.totalAverageGrade.toString(),
			};
			return acc;
		}, {});
		return studentList;
	}

}


module.exports = MagisterApp;
