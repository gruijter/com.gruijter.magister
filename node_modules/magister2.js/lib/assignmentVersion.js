'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _magisterThing = require('./magisterThing');

var _magisterThing2 = _interopRequireDefault(_magisterThing);

var _file = require('./file');

var _file2 = _interopRequireDefault(_file);

var _util = require('./util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @extends MagisterThing
 * @private
 */
class AssignmentVersion extends _magisterThing2.default {
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
   * @type Number
   * @readonly
   */
		this.state = raw.Status;
		/**
   * @type String
   * @readonly
   */
		this.pupilMessage = raw.LeerlingOpmerking;
		/**
   * @type String
   * @readonly
   */
		this.teacherNotice = raw.DocentOpmerking;
		/**
   * @type File[]
   * @readonly
   */
		this.handedInFiles = raw.LeerlingBijlagen.map(function (f) {
			return new _file2.default(magister, undefined, f);
		});
		/**
   * @type File[]
   * @readonly
   */
		this.feedbackFiles = raw.FeedbackBijlagen.map(function (f) {
			return new _file2.default(magister, undefined, f);
		});
		/**
   * @type Date
   * @readonly
   */
		this.deadline = (0, _util.parseDate)(raw.InleverenVoor);
		/**
   * @type Date
   * @readonly
   */
		this.handedInOn = (0, _util.parseDate)(raw.IngeleverdOp);
		/**
   * @type String|null
   * @readonly
   */
		this.grade = raw.Beoordeling;
		/**
   * @type Date
   * @readonly
   */
		this.markedOn = (0, _util.parseDate)(raw.BeoordeeldOp);
		/**
   * @type Number
   * @readonly
   */
		this.version = raw.VersieNummer;
		/**
   * @type Boolean
   * @readonly
   */
		this.tooLate = raw.IsTeLaat;
	}
}

exports.default = AssignmentVersion;