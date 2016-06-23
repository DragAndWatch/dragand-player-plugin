'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.server = exports.srt2Vtt = undefined;

var _q = require('q');

var _q2 = _interopRequireDefault(_q);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _mime = require('mime');

var _mime2 = _interopRequireDefault(_mime);

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _srt2vtt = require('srt2vtt');

var _srt2vtt2 = _interopRequireDefault(_srt2vtt);

var _address = require('address');

var _address2 = _interopRequireDefault(_address);

var _rangeParser = require('range-parser');

var _rangeParser2 = _interopRequireDefault(_rangeParser);

var _routerFactory = require('router-factory');

var _routerFactory2 = _interopRequireDefault(_routerFactory);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Convert Srt to VTT
 *
 * @param {String} subtitlePath
 */
var srt2Vtt = exports.srt2Vtt = function srt2Vtt(subtitlePath) {

  var deferred = _q2.default.defer();

  if (!subtitlePath) {
    deferred.resolve(null);
  } else if (subtitlePath.split('.').pop() === 'vtt') {
    var vttData = _fs2.default.readFileSync(subtitlePath);
    deferred.resolve(vttData);
  } else {
    var srtData = _fs2.default.readFileSync(subtitlePath);

    (0, _srt2vtt2.default)(srtData, function (err, data) {
      if (err) {
        deferred.reject();
      }

      _fs2.default.writeFileSync(subtitlePath.replace('.srt', '.vtt'), data);
      deferred.resolve(data);
    });
  }

  return deferred.promise;
};

/**
 * Create a server with movie and subtitle
 *
 * @param {string} moviePath
 * @param {Buffer} subtitle
 */
var server = exports.server = function server(moviePath, subtitle) {

  var deferred = _q2.default.defer();
  var router = new _routerFactory2.default();

  // The movie
  router.get('/movie', [], function (req, res) {

    var stat = _fs2.default.statSync(moviePath);
    var total = stat.size;
    var range = req.headers.range;
    var type = _mime2.default.lookup(moviePath);

    res.setHeader('Content-Type', type);
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (!range) {
      res.setHeader('Content-Length', total);
      res.statusCode = 200;
      return _fs2.default.createReadStream(moviePath).pipe(res);
    }

    var part = (0, _rangeParser2.default)(total, range)[0];
    var chunksize = part.end - part.start + 1;
    var file = _fs2.default.createReadStream(moviePath, { start: part.start, end: part.end });

    res.setHeader('Content-Range', 'bytes ' + part.start + '-' + part.end + '/' + total);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Length', chunksize);
    res.statusCode = 206;

    return file.pipe(res);
  });

  // The Subtitle
  if (subtitle) {
    router.get('/subtitle', [], function (req, res) {
      res.setHeader('Content-Type', 'text/vtt; charset=utf-8');
      res.setHeader('Content-Length', subtitle.length);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.end(subtitle);
    });
  }

  var server = _http2.default.createServer(router.check.bind(router));

  server.listen(4000, function (result, error) {
    deferred.resolve({
      url: 'http://' + _address2.default.ip() + ':4000',
      server: server
    });
  });

  return deferred.promise;
};