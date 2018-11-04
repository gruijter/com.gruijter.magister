'use strict';

// retrieving data via Magister API

const { default: magister, getSchools } = require('magister.js');

const schoolName = 'test lyceum';
const username = 'test';
const password = 'testing12';


async function test() {
	try {
		const schools = await getSchools(schoolName);
		console.log(schools);
		const sessionCredentials = {
			school: schools[0], // get first matching school
			username,
			password,
		};
		const magisterSession = await magister(sessionCredentials);
		console.log(magisterSession);
	} catch (error) { console.log(error); }
}

test();
