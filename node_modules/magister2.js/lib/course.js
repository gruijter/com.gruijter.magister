'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _magisterThing = require('./magisterThing');

var _magisterThing2 = _interopRequireDefault(_magisterThing);

var _class = require('./class');

var _class2 = _interopRequireDefault(_class);

var _grade = require('./grade');

var _grade2 = _interopRequireDefault(_grade);

var _util = require('./util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @extends MagisterThing
 * @private
 */
class Course extends _magisterThing2.default {
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
		this.start = (0, _util.parseDate)(raw.Start);
		/**
   * @type Date
   * @readonly
   */
		this.end = (0, _util.parseDate)(raw.Einde);

		/**
   * The school year of this course, e.g: '1617'
   * @type String
   * @readonly
   */
		this.schoolPeriod = raw.Lesperiode;

		/**
   * Basic type information of this course, e.g: { description: "VWO 6", id: 420 }
   * @type Object
   * @readonly
   */
		this.type = {
			id: raw.Studie.Id,
			description: raw.Studie.Omschrijving

			/**
    * The group of this course, e.g: { description: "Klas 6v3", id: 420, locationId: 0 }
    * @type Object
    * @readonly
    */
		};this.group = {
			id: raw.Groep.Id,
			description: function () {
				var group = raw.Groep.Omschrijving;
				if (group != null) {
					return group.split(' ').find(function (w) {
						return (/\d/.test(w)
						);
					}) || group;
				}
			}(),
			locationId: raw.Groep.LocatieId

			/**
    * @type String[]
    * @readonly
    */
		};this.curricula = [raw.Profiel];
		if (raw.Profiel2 != null) {
			this.curricula.push(raw.Profiel2);
		}
	}

	/**
  * @type Boolean
  * @readonly
  */
	get current() {
		var now = new Date();
		return this.start <= now && now <= this.end;
	}

	/**
  * @return {Promise<Class[]>}
  */
	classes() {
		var _this = this;

		var url = `${this._magister._personUrl}/aanmeldingen/${this.id}/cijfers`;
		return this._magister.http.get(url).then(function (res) {
			return res.json();
		}).then(function (res) {
			return res.Items.map(function (c) {
				return new _class2.default(_this._magister, c);
			});
		});
	}

	/**
  * @param {Object} [options={}]
  * 	@param {Boolean} [options.fillGrades=true]
  * @return {Promise<Grade[]>}
  */
	grades() {
		var _this2 = this;

		var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
		    _ref$fillGrades = _ref.fillGrades,
		    fillGrades = _ref$fillGrades === undefined ? true : _ref$fillGrades;

		var urlPrefix = `${this._magister._personUrl}/aanmeldingen/${this.id}/cijfers`;
		var url = `${urlPrefix}/cijferoverzichtvooraanmelding?actievePerioden=false&alleenBerekendeKolommen=false&alleenPTAKolommen=false`;

		return this._magister._privileges.needs('cijfers', 'read').then(function () {
			return _this2._magister.http.get(url);
		}).then(function (res) {
			return res.json();
		}).then(function (res) {
			return res.Items;
		}).then(function (grades) {
			grades = _lodash2.default.reject(grades, function (raw) {
				return raw.CijferId === 0;
			});

			var promises = grades.map(function (raw) {
				var grade = new _grade2.default(_this2._magister, raw);
				grade._fillUrl = `${urlPrefix}/extracijferkolominfo/${_lodash2.default.get(raw, 'CijferKolom.Id')}`;
				return Promise.resolve(fillGrades ? grade.fill() : grade);
			});

			return Promise.all(promises);
		}).then(function (r) {
			return _lodash2.default.sortBy(r, 'dateFilledIn');
		});
	}
}

exports.default = Course;