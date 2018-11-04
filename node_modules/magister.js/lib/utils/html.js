'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.cleanHtmlContent = cleanHtmlContent;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Strips HTML tags and entities from the given `str`
 * If `str` is `undefined` or `null` an empty string will be returned.
 *
 * @param {String} [str]
 * @return {String}
 */
function cleanHtmlContent(str) {
	if (str == null) {
		return '';
	}

	return _lodash2.default.unescape(str).replace(/<br\s*\/?>/g, '\n').replace(/<\/\s*p\s*>/g, '\n').replace(/&nbsp;/g, ' ').replace(/(<[^>]*>)|(&#x200b;)/g, '').replace(/\r?\n/g, '\n').trim();
}