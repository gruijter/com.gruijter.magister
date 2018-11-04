"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.cloneClassInstance = cloneClassInstance;
function cloneClassInstance(object) {
	return Object.assign(Object.create(object), object);
}