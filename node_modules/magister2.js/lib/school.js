'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _nodeFetch = require('node-fetch');

var _nodeFetch2 = _interopRequireDefault(_nodeFetch);

var _versionInfo = require('./versionInfo');

var _versionInfo2 = _interopRequireDefault(_versionInfo);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @typedef {Object} VersionInfo
 * @property {String} core
 * @property {String} api
 * @property {String} db
 * @property {String} product
 * @property {Date} releasedOn
 */

/**
 * @private
 */
class School {
	/**
  * @param {Object} raw
  * @param {String} id
  * @param {String} name
  * @param {String} url
  */
	constructor(raw) {
		/**
   * @type String
   * @readonly
   */
		this.id = raw.Id;
		/**
   * @type String
   * @readonly
   */
		this.name = raw.Name;
		/**
   * @type String
   * @readonly
   */
		this.url = raw.Url;
	}

	/**
  * @return {Promise<VersionInfo>}
  */
	versionInfo() {
		return (0, _nodeFetch2.default)(`${this.url}/api/versie`).then(function (res) {
			return res.json();
		}).then(function (obj) {
			return new _versionInfo2.default(obj);
		});
	}
}

exports.default = School;