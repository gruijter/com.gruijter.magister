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
class Message extends _magisterThing2.default {
	/**
  * @param {Magister} magister
  * @param {Object} [raw]
  */
	constructor(magister, raw) {
		super(magister);

		/**
   * @type Boolean
   * @private
   * @readonly
   * @default true
   */
		this._canSend = true;
		/**
   * @type Number
   * @private
   * @readonly
   * @default 1
   */
		this._type = 1;
		/**
   * @type String
   * @readonly
   * @default ''
   */
		this.subject = '';
		/**
   * If creating a message, this will be an empty string per default.
   * When retrieving a message from Magister, this will be `undefined` per
   * default, you should use `Message#fill` to get the body.
   *
   * @type String
   * @readonly
   * @default ''
   */
		this.body = '';
		/**
   * @type Person[]
   * @readonly
   * @default []
   */
		this.recipients = [];

		if (raw != null) {
			this._canSend = false;
			this._type = raw.Soort;
			this.subject = raw.Onderwerp;
			this.body = undefined;
			this.recipients = raw.Ontvangers.map(function (p) {
				return new _person2.default(magister, p);
			});

			/**
    * @type String
    * @readonly
    */
			this.id = (0, _util.toString)(raw.Id);
			/**
    * @type String
    * @readonly
    */
			this.folderId = (0, _util.toString)(raw.MapId);
			/**
    * @type Person
    * @readonly
    */
			this.sender = new _person2.default(magister, raw.Afzender);
			/**
    * @type Date
    * @readonly
    */
			this.sendDate = (0, _util.parseDate)(raw.VerstuurdOp);
			/**
    * @type Date
    * @readonly
    */
			this.begin = (0, _util.parseDate)(raw.Begin);
			/**
    * @type Date
    * @readonly
    */
			this.end = (0, _util.parseDate)(raw.Einde);
			/**
    * @type Boolean
    * @readonly
    */
			this.isRead = raw.IsGelezen;
			/**
    * @type Number
    * @readonly
    */
			this.state = raw.Status;
			/**
    * @type Boolean
    * @readonly
    */
			this.isFlagged = raw.HeeftPrioriteit;
			/**
    * @type String
    * @readonly
    */
			this.summary = (0, _util.cleanHtmlContent)(raw.IngekortBericht);

			/**
    * This will be `undefined` per default, a fill using `Message#fill`
    * is required to retrieve the attachments for this Message.
    * @type File[]
    * @readonly
    * @default undefined
    */
			this.attachments = undefined;

			/**
    * @type String
    * @private
    * @readonly
    */
			this._url = `${magister._personUrl}/berichten/${this.id}`;
		}
	}

	/**
  * @type String
  * @readonly
  * @default 'message'
  */
	get type() {
		switch (this._type) {
			case 1:
				return 'message';
			case 2:
				return 'alert';
			default:
				return 'unknown';
		}
	}

	/**
  * @param {Person|Person[]} recipients
  */
	addRecipient(recipients) {
		if (!Array.isArray(recipients)) {
			recipients = [recipients];
		}

		if (!recipients.every(function (x) {
			return x instanceof _person2.default;
		})) {
			throw new Error('`recipients` should be a Person or an Array of Persons');
		}

		this.recipients = this.recipients.concat(recipients);
	}

	createReplyMessage() {
		var content = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

		var message = (0, _util.cloneClassInstance)(this);

		message.body = `${content}

---------------
${this.toString()}`;
		message.subject = `RE: ${this.subject}`;
		message.recipients = [this.sender];

		message._type = 1;
		message._canSend = true;

		return message;
	}

	createReplyToAllMessage() {
		var content = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

		var message = (0, _util.cloneClassInstance)(this);

		message.body = `${content}

---------------
${this.toString()}`;
		message.subject = `RE: ${this.subject}`;
		message.recipients = _lodash2.default.chain(this.recipients).reject({ id: this._magister.profileInfo.id }).push(this.sender).value();

		message._type = 1;
		message._canSend = true;

		return message;
	}

	createForwardMessage() {
		var content = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

		var message = (0, _util.cloneClassInstance)(this);

		message.body = `${content}

---------------
${this.toString()}`;
		message.subject = `FW: ${this.subject}`;

		message._type = 1;
		message._canSend = true;

		return message;
	}

	/**
  * @param {Boolean} [fillPersons=false]
  * @return {Promise<Message>}
  */
	fill() {
		var _this = this;

		var fillPersons = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

		if (this._filled && (this._filledPersons || !fillPersons)) {
			return Promise.resolve(this);
		}

		var url = `${this._magister._personUrl}/berichten/${this.id}?berichtSoort=${this._type}`;
		return this._magister.http.get(url).then(function (res) {
			return res.json();
		}).then(function (res) {
			_this.body = (0, _util.cleanHtmlContent)(res.Inhoud);
			_this.attachments = (res.Bijlagen || []).map(function (a) {
				return new _file2.default(_this._magister, undefined, a);
			});

			if (fillPersons) {
				var promises = [];

				// fill sender
				promises.push(_this.sender.getFilled().then(function (r) {
					return _this.sender = r;
				}).catch(function () {
					return _this.sender;
				}));

				// fill recipients
				promises = promises.concat(_this.recipients.map(function (r) {
					return r.getFilled().then(function (x) {
						return x;
					}).catch(function () {
						return r;
					});
				}));

				return Promise.all(promises);
			}
		}).then(function () {
			_this._filled = true;
			return _this;
		});
	}

	// REVIEW
	move(destination) {
		if (_lodash2.default.isObject(destination)) {
			destination = destination.id;
		}

		if (this.folderId === destination) {
			return Promise.resolve(undefined);
		}

		this.folderId = destination;
		return this.saveChanges();
	}

	/**
  * @return {Promise<Error|undefined>}
  */
	remove() {
		var _this2 = this;

		return this._magister._privileges.needs('berichten', 'delete').then(function () {
			return _this2._magister.http.delete(_this2._url);
		});
	}

	/**
  * Update the server to reflect the changes made on the properties of this
  * Message instance.
  * @return {Promise<undefined>}
  */
	saveChanges() {
		var _this3 = this;

		return this._magister._privileges.needs('berichten', 'update').then(function () {
			return _this3._magister.http.put(_this3._url, _this3._toMagister());
		}).then(function () {
			return undefined;
		});
	}

	/**
  * @return {Promise<Message>}
  */
	send() {
		var _this4 = this;

		var reject = function reject(message) {
			return Promise.reject(new Error(message));
		};

		if (!this._canSend) {
			return reject('message is marked as unsendable');
		} else if (this.recipients.length === 0) {
			return reject('message doesn\'t have recipients');
		} else if (this.subject.length === 0) {
			return reject('subject is empty');
		}

		return this._magister._privileges.needs('berichten', 'create').then(function () {
			return _this4._magister.http.post(`${_this4._magister._personUrl}/berichten`, _this4._toMagister());
		}).then(function () {
			return _this4;
		});
	}

	toString() {
		return `<b>Van:</b> ${this.sender.description}
<b>Verzonden:</b> ${this.sendDate.toLocaleString()}
<b>Aan:</b> ${this.recipients.map(function (p) {
			return p.description;
		}).join(', ')}
<b>Onderwerp:</b> ${this.subject}

${this.body}`;
	}

	/**
  * @private
  * @return {Object}
  */
	_toMagister() {
		return {
			Id: this.id,
			Inhoud: this.body,
			MapId: this.folderId, // number?
			Onderwerp: this.subject,
			Ontvangers: this.recipients.map(function (p) {
				return p._toMagister();
			}),
			VerstuurdOp: this.sendDate || new Date(),
			Begin: this.begin,
			Einde: this.end,
			IsGelezen: this.isRead,
			Status: this.state,
			HeeftPrioriteit: this.isFlagged,
			Soort: this._type
		};
	}
} /* global dedent */

exports.default = Message;