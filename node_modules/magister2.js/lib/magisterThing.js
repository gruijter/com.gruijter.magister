'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _magister = require('./magister');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @private
 */
class MagisterThing {
	/**
  * @param {Magister} magister
  * @throws Error when `magister` isn't a {@link Magister} instance.
  */
	constructor(magister) {
		if (!(magister instanceof _magister.Magister)) {
			throw new Error('`magister` must be a `Magister` instance');
		}

		/**
   * @type Magister
   * @private
   * @readonly
   */
		this._magister = magister;
	}

	/**
  * @return {Object}
  */
	toJSON() {
		// REVIEW: do we want to omit all keys starting with '_'?
		return _lodash2.default.omit(this, ['_magister']);
	}
}

exports.default = MagisterThing;