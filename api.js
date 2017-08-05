var Magister = require('./node_modules/magister.js');

module.exports = [

  {
    // validate account for use with settings page
    description: 'Validate magister account settings',
    method: 'GET',
    path:	'/account/validate',
    requires_authorization: true,
    role: 'owner',
    fn: function (callback, args) {
      var credentials = args.query;
      Homey.log("api validation entered");
      Homey.app.validateAccount (credentials, function (error, result){
        callback(null, {error, result});
        return;
      });
    }
  },
  {
    // Delete account
    description: 'Delete magister account settings',
    method: 'GET',
    path:	'/account/delete',
    requires_authorization: true,
    role: 'owner',
    fn: function (callback, args) {
      var toDelete = args.query;
      Homey.log("api deletion entered");
      Homey.log(args);
      Homey.log(toDelete);

      Homey.app.deleteAccount (toDelete.id, function (error, result){
        Homey.log(error);
        Homey.log(result);
        return callback(error, result);
      });
    }
  }

]
