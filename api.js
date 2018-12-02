const Homey = require('homey');

module.exports = [
	{
		description: 'Show loglines',
		method: 'GET',
		path: '/getlogs/',
		requires_authorization: true,
		role: 'owner',
		fn: function fn(args, callback) {
			const result = Homey.app.getLogs();
			callback(null, result);
		},
	},
	{
		description: 'Delete logs',
		method: 'GET',
		path: '/deletelogs/',
		requires_authorization: true,
		role: 'owner',
		fn: function fn(args, callback) {
			const result = Homey.app.deleteLogs();
			callback(null, result);
		},
	},
	{
		description: 'Find schools',
		method: 'GET',
		path: '/findSchools/',
		requires_authorization: false,
		role: 'owner',
		fn: async function fn(args, callback) {
			console.log(args);
			const result = await Homey.app.findSchools(args.query.query);
			callback(null, result);
		},
	},
	{
		description: 'Get a list of students',
		method: 'GET',
		path: '/getStudents/',
		requires_authorization: true,
		role: 'owner',
		fn: function fn(args, callback) {
			const result = Homey.app.getStudents();
			callback(null, result);
		},
	},
];
