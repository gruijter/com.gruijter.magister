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
class ActivityElement extends _magisterThing2.default {
	/**
  * @param {Magister} magister
  * @param {Object} raw
  */
	constructor(magister, activity, raw) {
		var _this;

		_this = super(magister);

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
   * @type Number
   * @readonly
   */
		this.minParticipants = raw.MinAantalDeelnemers;
		/**
   * @type Number
   * @readonly
   */
		this.maxParticipants = raw.MaxAantalDeelnemers;
		/**
   * @type Number
   * @readonly
   */
		this.placesLeft = raw.AantalPlaatsenBeschikbaar;

		/**
   * @type Boolean
   * @readonly
   */
		this.signedup = raw.IsIngeschreven;
		/**
   * @type Boolean
   * @readonly
   */
		this.ableToSignup = raw.IsOpInTeSchrijven;
		/**
   * @type Boolean
   * @readonly
   */
		this.mandatorilySignedup = raw.IsVerplichtIngeschreven;

		/**
   * @type File[]
   * @readonly
   */
		this.attachments = (raw.Bijlagen || []).map(function (a) {
			return new _file2.default(_this._magister, undefined, a);
		});

		// REVIEW: do we want a reference to the parent activity?
		// this._activity = activity
		/**
   * @type String
   * @readonly
   */
		this.activityId = (0, _util.toString)(activity.id);
		/**
   * @type String
   * @private
   * @readonly
   */
		this._url = `${activity._url}/onderdelen/${this.id}`;
	}

	/**
  * @param {Boolean} val
  * @return {ActivityElement}
  */
	signup(val) {
		var _this2 = this;

		// TODO: handle errors, I have no idea how an error looks like, though.

		if (!this.ableToSignup || this.signedup === val) {
			return;
		}

		return Promise.resolve().then(function () {
			var url = `${_this2._url}/inschrijvingen`;

			if (val) {
				var payload = {
					persoonId: _this2._magister.profileInfo.id,
					activiteitId: Number.parseInt(_this2.activityId, 10),
					onderdeelId: Number.parseInt(_this2.id, 10)
				};

				return _this2._magister._privileges.needs('activiteiten', 'update').then(function () {
					return _this2._magister.http.post(url, payload);
				});
			} else {
				return _this2._magister._privileges.needs('activiteiten', 'delete').then(function () {
					return _this2._magister.http.delete(url);
				});
			}
		}).then(function () {
			_this2.signedup = val;
			return _this2;
		});
	}

	/**
  * @private
  * @return {Object}
  */
	_toMagister() {
		return {
			Id: Number.parseInt(this.id, 10),
			Titel: this.title,
			Details: this.description,

			StartInschrijfdatum: this.signinStart.toJSON(),
			EindeInschrijfdatum: this.signinEnd.toJSON(),

			MinAantalDeelnemers: this.minParticipants,
			MaxAantalDeelnemers: this.maxParticipants,
			AantalPlaatsenBeschikbaar: this.placesLeft,

			IsIngeschreven: this.signedup,
			IsOpInTeSchrijven: this.ableToSignup,
			IsVerplichtIngeschreven: this.mandatorilySignedup,

			activiteitId: Number.parseInt(this.activityId, 10)
		};
	}
}

exports.default = ActivityElement;