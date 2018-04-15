'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _magisterThing = require('./magisterThing');

var _magisterThing2 = _interopRequireDefault(_magisterThing);

var _assignmentVersion = require('./assignmentVersion');

var _assignmentVersion2 = _interopRequireDefault(_assignmentVersion);

var _file = require('./file');

var _file2 = _interopRequireDefault(_file);

var _person = require('./person');

var _person2 = _interopRequireDefault(_person);

var _util = require('./util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @extends MagisterThing
 * @private
 */
class Assignment extends _magisterThing2.default {
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
   * @type String
   * @readonly
   */
		this.name = raw.Titel;
		/**
   * @type String
   * @readonly
   */
		this.description = raw.Omschrijving;
		/**
   * @type Object
   * @readonly
   */
		this.class = raw.Vak; // TODO
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
   * @type File[]
   * @readonly
   */
		this.files = raw.Bijlagen.map(function (f) {
			return new _file2.default(magister, undefined, f);
		});
		/**
   * @type Person[]
   * @readonly
   */
		this.teachers = raw.Docenten != null ? raw.Docenten.map(function (p) {
			return new _person2.default(magister, p);
		}) : [];
		/**
   * @type String[]
   * @readonly
   */
		this.versionIds = raw.VersieNavigatieItems.map(function (v) {
			return (0, _util.toString)(v.Id);
		});
		/**
   * @type String
   * @readonly
   */
		this.grade = raw.Beoordeling;
		/**
   * @type Date
   * @readonly
   */
		this.markedOn = (0, _util.parseDate)(raw.BeoordeeldOp);
		/**
   * @type Boolean
   * @readonly
   */
		this.handInAgain = raw.OpnieuwInleveren;
		/**
   * @type Boolean
   * @readonly
   */
		this.finished = raw.Afgesloten;
		/**
   * @type Boolean
   * @readonly
   */
		this.canHandIn = raw.MagInleveren;
	}

	/**
  * @return {Promise<AssignmentVersion[]>}
  */
	versions() {
		var _this = this;

		var promises = this.versionIds.map(function (id) {
			var url = `${_this._magister._personUrl}/opdrachten/versie/${id}`;
			return _this._magister.http.get(url).then(function (res) {
				return res.json();
			}).then(function (raw) {
				return new _assignmentVersion2.default(_this._magister, raw);
			});
		});
		return Promise.all(promises);
	}
}

exports.default = Assignment;