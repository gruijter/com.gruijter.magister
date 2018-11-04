'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
/**
 * @extends Error
 */
class MagisterError extends Error {
	/**
  * @param {Object} raw
  */
	constructor(raw) {
		super(raw.Message || raw.message);
	}

	/**
  * @override
  * @return {String}
  */
	toString() {
		return 'MagisterError: ' + this.message;
	}
}

exports.default = MagisterError;