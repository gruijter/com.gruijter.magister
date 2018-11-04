'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _magisterThing = require('./magisterThing');

var _magisterThing2 = _interopRequireDefault(_magisterThing);

var _util = require('./util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @extends MagisterThing
 * @private
 */
class GradePeriod extends _magisterThing2.default {
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
		this.end = (0, _util.parseDate)(raw.Einde);
		/**
   * @type String
   * @readonly
   * @default ''
   */
		this.name = _lodash2.default.trim(raw.Naam);
		/**
   * @type String
   * @readonly
   * @default ''
   */
		this.description = _lodash2.default.trim(raw.Omschrijving);
	}
}

exports.default = GradePeriod;