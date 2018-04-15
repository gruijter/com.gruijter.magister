'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
/**
 * @extends Error
 */
class AuthError extends Error {
	/**
  * @param {String} error
  */
	constructor(message) {
		super(message);
	}

	/**
  * @override
  * @return {String}
  */
	toString() {
		return 'AuthError: ' + this.message;
	}
}

exports.default = AuthError;