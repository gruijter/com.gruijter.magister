'use strict';

const { default: magister, getSchools } = require('magister.js');
// const https = require('https');
// const fs = require('fs');

// const schoolName = 'test lyceum';
// const username = 'test';
// const password = 'testing12';
// const token = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjkxRjFFNTQ2ODQ1MkVFQTM4QUM4NDVFODI4NkMzODNFNkRFQzMzQ0IiLCJ0eXAiOiJKV1QiLCJ4NXQiOiJrZkhsUm9SUzdxT0t5RVhvS0d3NFBtM3NNOHMifQ.eyJuYmYiOjE1NDIyMjcwNzMsImV4cCI6MTU0MjIzMDY3MywiaXNzIjoiaHR0cHM6Ly9hY2NvdW50cy5tYWdpc3Rlci5uZXQiLCJhdWQiOlsiaHR0cHM6Ly9hY2NvdW50cy5tYWdpc3Rlci5uZXQvcmVzb3VyY2VzIiwibWFnaXN0ZXIuZWNzLmxlZ2FjeSIsIm1hZ2lzdGVyLm1kdi5icm9rZXIucmVhZCJdLCJjbGllbnRfaWQiOiJNNi1hbWFkZXVzLm1hZ2lzdGVyLm5ldCIsInN1YiI6Ijk4NGRiOGIwZWY5NzRjMDU4NDJkOGNmNzJmY2NiY2MxIiwiYXV0aF90aW1lIjoxNTQyMjI3MDczLCJpZHAiOiJsb2NhbCIsInVybjptYWdpc3RlcjpjbGFpbXM6aWFtOnRlbmFudElkIjoiZTllYzk1OTk0YmM1NDQ3N2IwZWUwMWI2NjQ3NDJjMjMiLCJ1cm46bWFnaXN0ZXI6dGlkIjoiZTllYzk1OTk0YmM1NDQ3N2IwZWUwMWI2NjQ3NDJjMjMiLCJ1cm46bWFnaXN0ZXI6Y2xhaW1zOmlhbTp0ZW5hbnQiOiJhbWFkZXVzLm1hZ2lzdGVyLm5ldCIsInVybjptYWdpc3RlcjpjbGFpbXM6aWFtOnVzZXJuYW1lIjoiMTA3MDAzIiwianRpIjoiYWI1NzNhNGQ0ZWUyMmY2NGZjNzQ4MDQzYWJlOTZjNGEiLCJzY29wZSI6WyJvcGVuaWQiLCJwcm9maWxlIiwibWFnaXN0ZXIuZG5uLnJvbGVzLnJlYWQiLCJtYWdpc3Rlci5lY3MubGVnYWN5IiwibWFnaXN0ZXIubWR2LmJyb2tlci5yZWFkIl0sImFtciI6WyJwd2QiXX0.bIUh32i4pOHs-K1m51F8R0P8Y6UW551i3SpocI0RX5OuwfpobcUWgHk2TbTMzb5fMm2aJ7BghFFUfiTKH5jocsPFTTJ7bkuytSUtbEioAmRqrDw9N9xC3okkXqjw235NiP7Q8DE34a8hHTSg_AWGAJGLmG2EnL5uyFh8CVSs_kFgvQPgl-ukLajcP9JdTVfxm_mLgX5dPD7ED1gE8EhD4kj8wQGO9Lbvj02Mya_swtXmBQ-nbA8LETwg9KWLcLh4ct4TDlfTnxaFzCFLCOZcUoOgnPZJbEImabaXJcQT8lGvIFE644wVZcZqc1JGmMPVU7TRRrbVz72BrNTQvkKdqw';

async function test() {
	try {
		const schools = await getSchools(schoolName);
		console.log(schools);
		const sessionCredentials = {
			school: schools[0], // get first matching school
			username,
			password,
			// token,
		};
		const magisterSession = await magister(sessionCredentials);
		console.log(magisterSession);
		// token = magisterSession.http._token;
		// console.log(token);
		// logout();

		// const childSession = await magisterSession.children();
		// console.log(childSession[0]);
		// // store student photo in /userdata
		// const writeStream = fs.createWriteStream(`${childSession[0].profileInfo.id}.jpg`);
		// childSession[0].profileInfo.getProfilePicture(128, 128, false)
		// 	.then((readStream) => {
		// 		readStream.pipe(writeStream);
		// 	})
		// 	.catch(() => { console.log('profile picture could not be loaded'); });

	} catch (error) {
		console.log('I have an error in test:');
		console.log(error);
	}
}

test();
