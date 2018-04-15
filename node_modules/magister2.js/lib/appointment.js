'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _magisterThing = require('./magisterThing');

var _magisterThing2 = _interopRequireDefault(_magisterThing);

var _person = require('./person');

var _person2 = _interopRequireDefault(_person);

var _file = require('./file');

var _file2 = _interopRequireDefault(_file);

var _util = require('./util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @extends MagisterThing
 */
class Appointment extends _magisterThing2.default {
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
   * @type Number
   * @readonly
   */
		this.startBySchoolhour = raw.LesuurVan;
		/**
   * @type Number
   * @readonly
   */
		this.endBySchoolhour = raw.LesuurTotMet;
		/**
   * @type Boolean
   * @readonly
   */
		this.isFullDay = raw.DuurtHeleDag;
		/**
   * @type String
   * @readonly
   */
		this.description = _lodash2.default.trim(raw.Omschrijving);
		/**
   * @type String
   * @readonly
   */
		this.location = _lodash2.default.trim(raw.Lokatie);
		/**
   * @type String
   * @readonly
   */
		this.status = raw.Status;
		/**
   * @type String
   * @readonly
   */
		this.type = raw.Type;
		/**
   * @type String
   * @readonly
   */
		this.displayType = raw.WeergaveType;
		/**
   * @type String
   * @readonly
   */
		this.content = raw.Inhoud;
		/**
   * @type String
   * @readonly
   */
		this.infoType = raw.InfoType;
		/**
   * @type String
   * @readonly
   */
		this.annotation = raw.Aantekening;
		/**
   * @type Boolean
   * @readonly
   */
		this.isDone = raw.Afgerond;
		/**
   * @type String[]
   * @readonly
   */
		this.classes = raw.Vakken != null ? _lodash2.default.map(raw.Vakken, 'Naam') : []; // REVIEW: moeten we de key 'Naam' wel plucken?
		/**
   * @type String[]
   * @readonly
   */
		this.teachers = raw.Docenten != null ? _lodash2.default.map(raw.Docenten, function (p) {
			return new _person2.default(magister, p);
		}) : [];
		/**
   * @type String[]
   * @readonly
   */
		this.classRooms = raw.Lokalen != null ? _lodash2.default.map(raw.Lokalen, 'Naam') : []; // REVIEW: moeten we de key 'Naam' wel plucken?
		/**
   * @type String[]
   * @readonly
   */
		this.groups = raw.Groepen; // ?
		/**
   * @type String
   * @readonly
   */
		this.appointmentId = raw.OpdrachtId; // REVIEW
		/**
   * @type Boolean
   * @readonly
   */
		this.hasAttachments = raw.HeeftBijlagen;
		/**
   * @type Boolean
   * @readonly
   */
		this.isCancelled = [4, 5].includes(raw.Status);
		/**
   * @type Boolean
   * @readonly
   */
		this.isChanged = [3, 9, 10].includes(raw.Status);
		/**
   * @type AbsenceInfo
   * @readonly
   */
		this.absenceInfo = undefined;

		/**
   * @type String
   * @private
   * @readonly
   */
		this._url = `${magister._personUrl}/afspraken/${this.id}`;
	}

	/**
  * @return {Promise<Error|File[]}>
  */
	attachments() {
		var _this = this;

		if (!this.hasAttachments) {
			return Promise.resolve([]);
		}

		return this._magister.http.get(this._url).then(function (res) {
			return res.json();
		}).then(function (res) {
			var attachments = res.Bijlagen;
			var person = _this.teachers[0];

			return attachments.map(function (raw) {
				var f = new _file2.default(_this._magister, undefined, raw);
				f.addedBy = person;
				return f;
			});
		});
	}

	/**
  * @return {Promise<Error|undefined>}
  */
	remove() {
		var _this2 = this;

		if (this.type !== 1 && this.type !== 16) {
			return Promise.reject(new Error('Appointment not created by user'));
		}

		return this._magister._privileges.needs('afspraken', 'delete').then(function () {
			return _this2._magister.http.delete(_this2._url);
		});
	}

	/**
  * Update the server to reflect the changes made on the properties of this
  * Appointment instance.
  * @return {Promise<undefined>}
  */
	saveChanges() {
		var _this3 = this;

		return this._magister._privileges.needs('afspraken', 'update').then(function () {
			return _this3._magister.http.put(_this3._url, _this3._toMagister());
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
			Id: this.id,
			Start: this.start.toISOString(),
			Einde: this.end.toISOString(),
			LesuurVan: this.startBySchoolhour,
			LesuurTotMet: this.endBySchoolhour,
			DuurtHeleDag: this.isFullDay,
			Omschrijving: this.description,
			Lokatie: this.location,
			Status: this.status,
			Type: this.type,
			WeergaveType: this.displayType,
			Inhoud: this.content,
			InfoType: this.infoType,
			Aantekening: this.annotation,
			Afgerond: this.isDone,
			Vakken: this.classes,
			Docenten: this.teachers,
			Lokalen: this.classRooms,
			Groepen: this.groups,
			OpdrachtId: this.appointmentId,
			HeeftBijlagen: this.hasAttachments
		};
	}
}

exports.default = Appointment;