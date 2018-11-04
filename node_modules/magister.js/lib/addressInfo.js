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
class AddressInfo extends _magisterThing2.default {
	/**
  * @param {Magister} magister
  * @param {Object} raw
  */
	constructor(magister, raw) {
		super(magister);

		/**
   * @type String
   * @readonly
   */
		this.postalCode = raw.Postcode;
		/**
   * @type String
   * @readonly
   */
		this.street = raw.Straatnaam;
		/**
   * @type Number
   * @readonly
   */
		this.houseNumber = raw.Huisnummer;
		/**
   * String behind the `houseNumber` (eg 'A')
   * @type String
   * @readonly
   */
		this.suffix = raw.Toevoeging;
		/**
   * @type String
   * @readonly
   */
		this.city = raw.Woonplaats;
	}
}

exports.default = AddressInfo;