'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _nodeFetch = require('node-fetch');

var _nodeFetch2 = _interopRequireDefault(_nodeFetch);

var _magisterError = require('./magisterError');

var _magisterError2 = _interopRequireDefault(_magisterError);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var DEFAULT_REQUEST_TIMEOUT = 1000 * 30; // 30 seconds

/**
 * Class to communicate with the outside world. With those delicious cookies
 * inserted for you.
 * Wraps around fetch.
 * @private
 */
class Http {
	/**
  * @param {Number} [requestTimeout=DEFAULT_REQUEST_TIMEOUT] A time in ms
  * after the start of a request when it should be timed out.
  */
	constructor() {
		var requestTimeout = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : DEFAULT_REQUEST_TIMEOUT;

		/**
   * @type Object
   * @private
   * @readonly
   */
		this._ratelimit = {
			queue: [],
			timeoutId: undefined
			/**
    * @type String
    * @private
    */
		};this._cookie = '';
		/**
   * @type Number
   * @private
   * @readonly
   */
		this._requestTimeout = requestTimeout;
	}

	/**
  * @private
  * @param {Object} request
  */
	_enqueue(request) {
		var _this = this;

		return new Promise(function (resolve, reject) {
			_this._ratelimit.queue.push({
				request,
				resolve,
				reject
			});
		});
	}
	/**
  * @private
  * @param {Number} timeLeft time left for the ratelimit in seconds.
  */
	_setRatelimitTime(timeLeft) {
		var info = this._ratelimit;
		if (info.timeoutId !== undefined) {
			return;
		}

		info.timeoutId = setInterval(function () {
			var _iteratorNormalCompletion = true;
			var _didIteratorError = false;
			var _iteratorError = undefined;

			try {
				for (var _iterator = info.queue[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
					var item = _step.value;

					(0, _nodeFetch2.default)(item.request).then(item.resolve, item.reject);
				}
			} catch (err) {
				_didIteratorError = true;
				_iteratorError = err;
			} finally {
				try {
					if (!_iteratorNormalCompletion && _iterator.return) {
						_iterator.return();
					}
				} finally {
					if (_didIteratorError) {
						throw _iteratorError;
					}
				}
			}

			info.queue = [];
			info.timeoutId = undefined;
		}, timeLeft * 1000 + 10);
	}

	/**
  * @param {Object} obj
  * @return {Request}
  */
	makeRequest(obj) {
		var init = {
			method: obj.method,
			timeout: this._requestTimeout,
			headers: _extends({}, obj.headers, {
				cookie: this._cookie,
				'X-API-Client-ID': '12D8'
			})
		};

		if (obj.data != null) {
			init.body = JSON.stringify(obj.data);
			init.headers['Content-Type'] = 'application/json;charset=UTF-8';
		}

		return new _nodeFetch2.default.Request(obj.url, init);
	}

	/**
  * @private
  * @param {Object} obj
  */
	_request(obj) {
		var _this2 = this;

		var request = this.makeRequest(obj);

		var promise = void 0;
		var info = this._ratelimit;

		if (info.timeoutId === undefined) {
			promise = (0, _nodeFetch2.default)(request);
		} else {
			promise = this._enqueue(request);
		}

		return promise.then(function (res) {
			return res.ok ? res : res.json();
		}).then(function (res) {
			if (res instanceof _nodeFetch2.default.Response) {
				return res;
			}

			if ('SecondsLeft' in res) {
				// Handle rate limit errors
				_this2._setRatelimitTime(Number.parseInt(res.SecondsLeft, 10));
				return _this2._request(obj);
			} else {
				// Other errors we could parse
				throw new _magisterError2.default(res);
			}
		});
	}

	/**
  * Gets the content at `url`
  * @param {String} url
  * @return {Promise<Response>}
  */
	get(url) {
		return this._request({
			method: 'get',
			url: url
		});
	}

	/**
  * Posts the given `data` to `url`
  * @param {String} url
  * @param {Object} [data]
  * @param {Object} [opt]
  * @return {Promise<Response>}
  */
	post(url, data, opt) {
		return this._request(_extends({}, opt, {
			method: 'post',
			url: url,
			data: data
		}));
	}

	/**
  * Puts the given `data` to `url`
  * @param {String} url
  * @param {Object} [data]
  * @param {Object} [opt]
  * @return {Promise<Response>}
  */
	put(url, data, opt) {
		return this._request(_extends({}, opt, {
			method: 'put',
			url: url,
			data: data
		}));
	}

	/**
  * Deletes the content at `url`
  * @param {String} url
  * @return {Promise<Response>}
  */
	delete(url) {
		return this._request({
			method: 'delete',
			url: url
		});
	}
}

exports.default = Http;