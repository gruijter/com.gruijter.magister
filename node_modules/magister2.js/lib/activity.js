'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _magisterThing = require('./magisterThing');

var _magisterThing2 = _interopRequireDefault(_magisterThing);

var _activityElement = require('./activityElement');

var _activityElement2 = _interopRequireDefault(_activityElement);

var _util = require('./util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @extends MagisterThing
 * @private
 */
class Activity extends _magisterThing2.default {
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
		this.title = raw.Titel;
		/**
   * @type String
   * @readonly
   */
		this.description = (0, _util.cleanHtmlContent)(raw.Details);

		/**
   * @type Date
   * @readonly
   */
		this.signinStart = (0, _util.parseDate)(raw.StartInschrijfdatum);
		/**
   * @type Date
   * @readonly
   */
		this.signinEnd = (0, _util.parseDate)(raw.EindeInschrijfdatum);

		/**
   * @type Date
   * @readonly
   */
		this.visibleFrom = (0, _util.parseDate)(raw.ZichtbaarVanaf);
		/**
   * @type Date
   * @readonly
   */
		this.visibleTo = (0, _util.parseDate)(raw.ZichtbaarTotEnMet);

		/**
   * @type String
   * @private
   * @readonly
   */
		this._url = `${magister._personUrl}/activiteiten/${this.id}`;
	}

	/**
  * @return {Promise<ActivityElement[]>}
  */
	elements() {
		var _this = this;

		var url = `${this._url}/onderdelen`;
		return this._magister.http.get(url).then(function (res) {
			return res.json();
		}).then(function (res) {
			return res.Items.map(function (e) {
				return new _activityElement2.default(_this._magister, _this, e);
			});
		});
	}
}

exports.default = Activity;