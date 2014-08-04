define(function (require, exports, module) {
/*
slick
*/
"use strict"
var global = window;

module.exports = "document" in global ? require("./finder") : { parse: require("./parser") }

});
