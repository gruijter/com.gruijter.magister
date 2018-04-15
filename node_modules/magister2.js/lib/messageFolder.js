'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _magisterThing = require('./magisterThing');

var _magisterThing2 = _interopRequireDefault(_magisterThing);

var _message = require('./message');

var _message2 = _interopRequireDefault(_message);

var _util = require('./util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var MAX_LIMIT = 250;

/**
 * @extends MagisterThing
 * @private
 */
class MessageFolder extends _magisterThing2.default {
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
		this.name = raw.Naam;
		/**
   * @type Number
   * @readonly
   */
		this.unreadCount = raw.OngelezenBerichten;
		/**
   * @type String
   * @readonly
   */
		this.parentId = raw.ParentId;

		/**
   * @type String
   * @readonly
   */
		this.type = {
			'postvak in': 'inbox',
			'verzonden items': 'sent',
			'verwijderde items': 'bin',
			'mededelingen': 'alerts'
		}[this.name.toLowerCase()] || 'unknown';
	}

	/**
  * @param {Object} [options={}]
  * 	@param {Number} [options.count=10] The limit of the amount of Messages to fetch. If `null`, all messages will be downloaded form the server.
  * 	@param {Number} [options.skip=0] The amount of messages in front of the
  * 	MessageFolder to skip.
  * 	@param {String} [options.readState='all'] One of: 'all', 'read', 'unread'.
  * 	@param {Boolean} [options.fill=true] Whether or not to call `fill` on every message.
  * 	@param {Boolean} [options.fillPersons=false] Whether or not to download the users from the server. `options.fill` has to be true for this option to take effect.
  * @return {Promise<Object>} { messages: Message[], totalCount: Number }
  */
	messages() {
		var _this = this;

		var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
		    _ref$count = _ref.count,
		    count = _ref$count === undefined ? 10 : _ref$count,
		    _ref$skip = _ref.skip,
		    skip = _ref$skip === undefined ? 0 : _ref$skip,
		    _ref$readState = _ref.readState,
		    readState = _ref$readState === undefined ? 'all' : _ref$readState,
		    _ref$fill = _ref.fill,
		    fill = _ref$fill === undefined ? true : _ref$fill,
		    _ref$fillPersons = _ref.fillPersons,
		    fillPersons = _ref$fillPersons === undefined ? false : _ref$fillPersons;

		if (!['all', 'read', 'unread'].includes(readState)) {
			return Promise.reject(new Error('Invalid option to readState'));
		}

		var url = `${this._magister._personUrl}/berichten?mapId=${this.id}&top=${count}&skip=${skip}`;
		if (['read', 'unread'].includes(readState)) {
			url += `&gelezen=${readState === 'read'}`;
		}

		count = count === null ? Infinity : count;
		if (count === 0) {
			return Promise.resolve([]);
		} else if (count > MAX_LIMIT) {
			url += '&count=true';

			return this._magister._privileges.needs('berichten', 'read').then(function () {
				return _this._magister.http.get(url);
			}).then(function (res) {
				return res.json();
			}).then(function (res) {
				return res.TotalCount;
			}).then(function (totalCount) {
				count = Math.min(count, totalCount);

				var promises = _lodash2.default.chain(count / MAX_LIMIT).range().map(function (n) {
					return _this.messages({
						count: MAX_LIMIT,
						skip: n * MAX_LIMIT,
						readState,
						fill,
						fillPersons
					});
				}).value();

				return Promise.all(promises).then(function (objects) {
					return {
						messages: (0, _lodash2.default)(objects).map('messages').flatten().value(),
						totalCount
					};
				});
			});
		}

		return this._magister._privileges.needs('berichten', 'read').then(function () {
			return _this._magister.http.get(url);
		}).then(function (res) {
			return res.json();
		}).then(function (res) {
			var messages = res.Items.map(function (m) {
				return new _message2.default(_this._magister, m);
			});
			var promise = fill ? Promise.all(messages.map(function (m) {
				return m.fill(fillPersons);
			})) : Promise.resolve(messages);

			return promise.then(function (messages) {
				return {
					messages,
					totalCount: res.TotalCount
				};
			});
		});
	}

	/**
  * @override
  * @return {Object}
  */
	toJSON() {
		return _lodash2.default.omit(super.toJSON(), 'type');
	}
}

exports.default = MessageFolder;