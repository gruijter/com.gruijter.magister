'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _magisterThing = require('./magisterThing');

var _magisterThing2 = _interopRequireDefault(_magisterThing);

var _person = require('./person');

var _person2 = _interopRequireDefault(_person);

var _util = require('./util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @extends MagisterThing
 * @private
 */
class Class extends _magisterThing2.default {
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
		this.id = (0, _util.toString)(raw.id || raw.Id);
		/**
   * @type Date
   * @readonly
   */
		this.beginDate = (0, _util.parseDate)(raw.begindatum);
		/**
   * @type Date
   * @readonly
   */
		this.endDate = (0, _util.parseDate)(raw.einddatum);
		/**
   * @type String
   * @readonly
   */
		this.abbreviation = raw.afkorting || raw.Afkorting;
		/**
   * @type String
   * @readonly
   */
		this.description = raw.omschrijving || raw.Omschrijving;
		/**
   * @type Number
   * @readonly
   */
		this.number = raw.volgnr || raw.Volgnr;
		/**
   * @type Person
   * @readonly
   */
		this.teacher = new _person2.default(magister, { Docentcode: raw.docent });
		/**
   * @type Boolean
   * @readonly
   */
		this.hasClassExemption = raw.VakDispensatie || raw.VakVrijstelling;
	}
}

exports.default = Class;