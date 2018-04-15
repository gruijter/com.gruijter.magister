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
class FileFolder extends _magisterThing2.default {
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
		this.rights = raw.Privilege;
		/**
   * @type String
   * @readonly
   */
		this.parentId = (0, _util.toString)(raw.ParentId);
	}

	/**
  * @param {Boolean} [fillPersons=false]
  * @return {Promise<File[]>}
  */
	files() {
		var _this = this;

		var fillPersons = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

		var url = `${this._magister._personUrl}/bronnen?parentId=${this.id}`;
		return this._magister._privileges.needs('bronnen', 'read').then(function () {
			return _this._magister.http.get(url);
		}).then(function (res) {
			return res.json();
		}).then(function (res) {
			var promises = res.Items.map(function (f) {
				var file = new _file2.default(_this._magister, _this, f);
				return fillPersons ? file.addedBy.getFilled().then(function () {
					return file;
				}) : Promise.resolve(file);
			});
			return Promise.all(promises);
		});
	}
}

exports.default = FileFolder;