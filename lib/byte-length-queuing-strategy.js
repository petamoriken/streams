'use strict';

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _require = require('./helpers.js');

var createDataProperty = _require.createDataProperty;


module.exports = function () {
  function ByteLengthQueuingStrategy(_ref) {
    var highWaterMark = _ref.highWaterMark;
    (0, _classCallCheck3.default)(this, ByteLengthQueuingStrategy);

    createDataProperty(this, 'highWaterMark', highWaterMark);
  }

  (0, _createClass3.default)(ByteLengthQueuingStrategy, [{
    key: 'size',
    value: function size(chunk) {
      return chunk.byteLength;
    }
  }]);
  return ByteLengthQueuingStrategy;
}();