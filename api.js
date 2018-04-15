const Homey = require('homey');

module.exports = [
	{
		description: 'Validate magister account settings',
		method: 'POST',
		path: '/account/validate',
		fn: async function fn(args, callback) {
			const credentials = args.body;
			const result = await Homey.app.validateAccount(credentials);
			if (result instanceof Error) return callback(result);
			return callback(null, result);
		},
	},
	{
		description: 'Delete magister account settings',
		method: 'DELETE',
		path: '/account/delete',
		fn: async function fn(args, callback) {
			const studentId = args.body;
			const result = await Homey.app.deleteAccount(studentId);
			if (result instanceof Error) return callback(result);
			return callback(null, result);
		},
	},
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
];

// module.exports = [
//
//   {
//     // validate account for use with settings page
//     description: 'Validate magister account settings',
//     method: 'GET',
//     path:	'/account/validate',
//     requires_authorization: true,
//     role: 'owner',
//     fn: function (callback, args) {
//       var credentials = args.query;
//       Homey.log("api validation entered");
//       Homey.app.validateAccount (credentials, function (error, result){
//         callback(null, {error, result});
//         return;
//       });
//     }
//   },
//   {
//     // Delete account
//     description: 'Delete magister account settings',
//     method: 'GET',
//     path:	'/account/delete',
//     requires_authorization: true,
//     role: 'owner',
//     fn: function (callback, args) {
//       var toDelete = args.query;
//       Homey.log("api deletion entered");
//       Homey.log(args);
//       Homey.log(toDelete);
//
//       Homey.app.deleteAccount (toDelete.id, function (error, result){
//         Homey.log(error);
//         Homey.log(result);
//         return callback(error, result);
//       });
//     }
//   }
//
// ]
