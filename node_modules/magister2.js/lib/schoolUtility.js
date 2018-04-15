'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _magisterThing = require('./magisterThing');

var _magisterThing2 = _interopRequireDefault(_magisterThing);

var _class = require('./class');

var _class2 = _interopRequireDefault(_class);

var _util = require('./util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @extends MagisterThing
 * @private
 */
class SchoolUtility extends _magisterThing2.default {
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
		this.id = toString(raw.Id);
		/**
   * @type Number
   * @readonly
   */
		this.type = raw.MateriaalType; // REVIEW: do we want a string getter for this?
		/**
   * @type String
   * @readonly
   */
		this.name = raw.Titel;
		/**
   * @type String
   * @readonly
   */
		this.publisher = raw.Uitgeverij;
		/**
   * @type Number
   * @readonly
   */
		this.state = raw.Status;
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
   * @type String
   * @readonly
   */
		this.EAN = raw.EAN;
		/**
   * @type String
   * @readonly
   */
		this.url = function () {
			var link = raw.Links.find(function (l) {
				return l.Rel === 'content';
			});
			return link == null ? undefined : link.Href;
		}();
		/**
   * @type Class
   * @readonly
   */
		this.class = new _class2.default(magister, raw.Vak);
	}
}

exports.default = SchoolUtility;