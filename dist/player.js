'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.connectToChromecast = exports.findChromecasts = exports.vlc = undefined;

var _q = require('q');

var _q2 = _interopRequireDefault(_q);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _mdnsJs = require('mdns-js');

var _mdnsJs2 = _interopRequireDefault(_mdnsJs);

var _remote = require('./remote');

var _remote2 = _interopRequireDefault(_remote);

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _vlcCommand = require('vlc-command');

var _vlcCommand2 = _interopRequireDefault(_vlcCommand);

var _castv2Client = require('castv2-client');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Play local video(s) on VLC
 *
 * @param  {Object} medias
 * @param  {Array} commands
 * @param  {Function} cb
 *
 * @return {Function}
 */
var vlc = exports.vlc = function vlc(medias) {
  var commands = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];
  var cb = arguments[2];

  (0, _vlcCommand2.default)(function (err, cmdVlc) {

    // Vlc is not on the computer
    if (err) return cb('VLC_NOT_INSTALL');

    // Create the content for playlist.pls
    var content = medias.reduce(function (acc, item, index, array) {

      var filesNumber = index + 1;

      acc += 'File' + filesNumber + '=' + item.filePath + '\nTitle' + filesNumber + '=' + item.name;

      if (index !== array.length - 1) {
        acc += '\n\n';
      }

      return acc;
    }, '[playlist]\nNumberOfEntries=' + medias.length + '\n\n');

    // Playlist directory
    var playlistDirectory = _path2.default.dirname(medias[0].filePath);

    // Playlist file path
    var plsPath = '' + playlistDirectory + _path2.default.sep + 'playlist.pls';

    // Create playlist.pls
    _fs2.default.writeFileSync(plsPath, content);

    // Create command
    var cmd = commands.reduce(function (acc, item, index, array) {
      acc += ' ' + item;
      return acc;
    }, '' + cmdVlc);

    // Execute the command
    _child_process2.default.exec(cmd + ' ' + plsPath);

    return cb(null, 'PLAYLIST_PLAYED');
  });
};

/**
 * Find all chromecasts available
 *
 * @param  {Function} cb
 * @param  {number} timer
 * @param  {Function} cbTimer
 */
var findChromecasts = exports.findChromecasts = function findChromecasts(cb, timer, cbTimer) {

  var browser = _mdnsJs2.default.createBrowser(_mdnsJs2.default.tcp('googlecast'));

  browser.on('ready', function () {
    browser.discover();
  });

  // When we find a chromecast
  browser.on('update', function (service) {
    cb({
      name: service.txt && service.txt[5] ? service.txt[5].replace('fn=', '') : 'Chromecast',
      host: service.addresses[0],
      port: service.port
    });
  });

  // If we have a timer return a callback specific after the time
  if (timer) {
    setTimeout(function () {
      browser.stop();
      cbTimer();
    }, timer);
  }
};

/**
 * Return Device instance
 *
 * @description
 * If resolve, return an instance of RemoteDevice, which is a facade to manipulate the video on chromecast
 *
 * @param {string} host
 */
var connectToChromecast = exports.connectToChromecast = function connectToChromecast(host) {

  var deferred = _q2.default.defer();
  var client = new _castv2Client.Client();

  client.connect(host, function () {

    client.launch(_castv2Client.DefaultMediaReceiver, function (err, player) {
      if (err) {
        deferred.reject(err);
      }

      deferred.resolve(new _remote2.default(player, client));
    });
  });

  client.on('error', function (err) {
    client.close();
    deferred.reject(err);
  });

  return deferred.promise;
};