'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _magisterThing = require('./magisterThing');

var _magisterThing2 = _interopRequireDefault(_magisterThing);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @extends MagisterThing
 * @private
 */
class ProfileSettings extends _magisterThing2.default {
	/**
  * @param {Magister} magister
  * @param {Object} raw
  */
	constructor(magister, raw) {
		super(magister);

		/**
   * @type Boolean
   * @readonly
   */
		this.redirectMagisterMessages = raw.EloBerichtenDoorsturen;
		/**
   * @type String
   * @readonly
   */
		this.emailAddress = raw.EmailAdres;
		/**
   * @type String
   * @readonly
   */
		this.mobileNumber = raw.Mobiel;
	}

	/**
  * Update the server to reflect the changes made on the properties of this
  * ProfileSettings instance.
  * @return {Promise<Error|undefined>}
  */
	saveChanges() {
		var _this = this;

		var url = `${this._magister._personUrl}/profiel`;

		return this._magister._privileges.needs('profiel', 'update').then(function () {
			return _this._magister.http.put(url, _this._toMagister());
		}).then(function () {
			return undefined;
		});
	}

	/**
  * @private
  * @return {Object}
  */
	_toMagister() {
		return {
			EloBerichtenDoorsturen: this.redirectMagisterMessages,
			EmailAdres: this.emailAddress,
			Mobiel: this.mobileNumber
		};
	}
}

exports.default = ProfileSettings;