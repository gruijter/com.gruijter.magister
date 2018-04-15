'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _magisterThing = require('./magisterThing');

var _magisterThing2 = _interopRequireDefault(_magisterThing);

var _appointment = require('./appointment');

var _appointment2 = _interopRequireDefault(_appointment);

var _util = require('./util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @extends MagisterThing
 * @private
 */
class AbsenceInfo extends _magisterThing2.default {
	/**
  * @param {Magister} magister
  * @param {Object} raw
  */
	constructor(magister, raw) {
		super(magister);

		/**
   * @type Number
   * @private
   * @readonly
   */
		this._type = raw.Verantwoordingtype;

		/**
   * @type String
   * @readonly
   */
		this.id = (0, _util.toString)(raw.Id);
		/**
   * @type Date
   * @readonly
   */
		this.begin = (0, _util.parseDate)(raw.Start);
		/**
   * @type Date
   * @readonly
   */
		this.end = (0, _util.parseDate)(raw.Eind);
		/**
   * @type Number
   * @readonly
   */
		this.schoolHour = raw.Lesuur;
		/**
   * @type Boolean
   * @readonly
   */
		this.isPermitted = raw.Geoorloofd;
		/**
   * @type String
   * @readonly
   */
		this.description = _lodash2.default.toString(raw.Omschrijving).trim();
		/**
   * @type String
   * @readonly
   */
		this.code = _lodash2.default.toString(raw.Code);
		/**
   * @type Appointment
   * @readonly
   */
		this.appointment = new _appointment2.default(magister, raw.Afspraak); // REVIEW: do we want (and need) this?
	}

	/**
  * @type String
  * @readonly
  */
	get type() {
		switch (this._type) {
			case 1:
				return 'absent';
			case 2:
				return 'late';
			case 3:
				return 'sick';
			case 4:
				return 'discharged';
			case 6:
				return 'exemption';
			case 7:
				return 'books';
			case 8:
				return 'homework';

			default:
				return 'unknown';
		}
	}
}

exports.default = AbsenceInfo;