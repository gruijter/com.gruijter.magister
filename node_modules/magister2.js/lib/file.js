'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _magisterThing = require('./magisterThing');

var _magisterThing2 = _interopRequireDefault(_magisterThing);

var _person = require('./person');

var _person2 = _interopRequireDefault(_person);

var _util = require('./util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @extends MagisterThing
 * @private
 */
class File extends _magisterThing2.default {
	/**
  * @param {Magister} magister
  * @param {FileFolder} fileFolder
  * @param {Object} raw
  */
	constructor(magister, fileFolder, raw) {
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
		this.type = raw.BronSoort; // REVIEW: string?
		/**
   * @type String
   * @readonly
   */
		this.name = raw.Naam;
		/**
   * @type String
   * @readonly
   */
		this.uri = raw.Uri;
		/**
   * @type Number
   * @readonly
   */
		this.size = raw.Grootte;
		// REVIEW
		/**
   * @type Number
   * @readonly
   */
		this.rights = raw.Privilege;
		/**
   * @type String
   * @readonly
   */
		this.mime = raw.ContentType || 'application/octet-stream';

		/**
   * @type Date
   * @readonly
   */
		this.changedDate = (0, _util.parseDate)(raw.GewijzigdOp);
		/**
   * @type Date
   * @readonly
   */
		this.creationDate = (0, _util.parseDate)(raw.GemaaktOp || raw.Datum);

		/**
   * @type Person
   * @readonly
   */
		this.addedBy = new _person2.default(magister, { Naam: raw.GeplaatstDoor });

		/**
   * @type String
   * @readonly
   */
		this.fileBlobId = (0, _util.toString)(raw.FileBlobId);
		/**
   * @type FileFolder
   * @readonly
   */
		this.fileFolder = fileFolder;
		/**
   * @type String
   * @readonly
   */
		this.uniqueId = raw.UniqueId;
		/**
   * @type String
   * @readonly
   */
		this.referenceId = (0, _util.toString)(raw.Referentie);

		var selfUrl = _lodash2.default.find(raw.Links, { Rel: 'Self' });
		var contentUrl = _lodash2.default.find(raw.Links, { Rel: 'Contents' });
		var getUrl = function getUrl(link) {
			return !link ? null : _url2.default.resolve(magister.school.url, link.Href);
		};

		/**
   * @type String|null
   * @readonly
   * @private
   */
		this._selfUrl = getUrl(selfUrl);
		/**
   * @type String
   * @readonly
   * @private
   */
		this._downloadUrl = getUrl(contentUrl || selfUrl);
	}

	/**
  * Opens a stream to the current file
  * @return {Promise<Stream>}
  */
	download() {
		var _this = this;

		return this._magister._privileges.needs('bronnen', 'read').then(function () {
			return _this._magister.http.get(_this._downloadUrl);
		}).then(function (res) {
			return res.body;
		});
	}

	/**
  * Removes the current file permanently
  * @return {Promise<undefined>}
  */
	remove() {
		var _this2 = this;

		return this._magister._privileges.needs('bronnen', 'delete').then(function () {
			return _this2._magister.http.delete(_this2._selfUrl);
		}).then(function () {
			return undefined;
		}); // throw away the useless result from magister. (current object)
	}

	/**
  * Update the server to reflect the changes made on the properties of this
  * File instance.
  * @return {Promise<undefined>}
  */
	saveChanges() {
		var _this3 = this;

		return this._magister._privileges.needs('bronnen', 'update').then(function () {
			return _this3._magister.http.put(_this3._selfUrl, _this3._toMagister());
		}).then(function () {
			return undefined;
		});
	}

	/**
  * @private
  * @return {Object}
  */
	_toMagister() {
		var toNumberSafe = function toNumberSafe(val) {
			return val == null ? val : parseInt(val, 10);
		};

		return {
			Id: parseInt(this.id, 10),
			BronSoort: this.type,
			Naam: this.name,
			Uri: this.uri,
			Grootte: this.size,
			Privilege: this.rights,
			ContentType: this.mime,
			FileBlobId: toNumberSafe(this.fileBlobId),
			ParentId: this.fileFolder.id,
			UniqueId: this.uniqueId,
			Referentie: toNumberSafe(this.referenceId)
		};
	}
}

exports.default = File;