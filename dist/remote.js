'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _q = require('q');

var _q2 = _interopRequireDefault(_q);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * RemoteDevice class
 */

var RemoteDevice = function () {

  /**
   * Constructor
   *
   * @param {Device} device
   * @param {Client} client
   */

  function RemoteDevice(player, client) {
    _classCallCheck(this, RemoteDevice);

    this.player = player;
    this.client = client;

    // Movie config
    this.media = {
      contentId: null,
      contentType: 'video/mp4',
      streamType: 'BUFFERED', // or LIVE
      metadata: {
        type: 0,
        metadataType: 0,
        title: null,
        images: [{ url: null }]
      },
      textTrackStyle: {
        backgroundColor: '#000000FF',
        foregroundColor: '#FFFFFFFF',
        edgeType: 'OUTLINE',
        edgeColor: '#000000FF',
        fontScale: 1.3,
        fontStyle: 'NORMAL',
        fontFamily: 'Helvetica',
        fontGenericFamily: 'SANS_SERIF',
        windowColor: '#00000000',
        windowRoundedCornerRadius: 0,
        windowType: 'NONE'
      }
    };

    // Play config
    this.playerConfig = {
      autoplay: 1
    };
  }

  // Play the video for the firt time


  _createClass(RemoteDevice, [{
    key: 'load',
    value: function load(_ref) {
      var moviePath = _ref.moviePath;
      var movieTitle = _ref.movieTitle;
      var movieCover = _ref.movieCover;

      var _this = this;

      var _ref2 = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var subtitlePath = _ref2.subtitlePath;
      var subtitleIsoCode = _ref2.subtitleIsoCode;
      var subtitleLang = _ref2.subtitleLang;
      var cb = arguments[2];


      // Check if moviePath exist
      if (!_fs2.default.lstatSync(moviePath).isFile() || subtitlePath && !_fs2.default.lstatSync(subtitlePath).isFile()) {
        return cb('Files don\'t exist', null, null);
      }

      // Convert the subtitle
      (0, _utils.srt2Vtt)(subtitlePath).then(function (subtitleData) {
        return (0, _utils.server)(moviePath, subtitleData); // Create a server with subtitle and movie
      }).then(function (result) {

        // Add metaData link to the movie
        _this.media.contentId = result.url + '/movie';
        _this.media.metadata.title = movieTitle;
        _this.media.metadata.images[0].url = movieCover;

        // If we have subtitle add it in media config
        if (subtitlePath) {
          _this.playerConfig.activeTrackIds = [1];
          _this.media.tracks = [];

          _this.media.tracks.push({
            trackId: 1,
            type: 'TEXT',
            trackContentId: result.url + '/subtitle',
            trackContentType: 'text/vtt',
            name: subtitleLang ? subtitleLang : 'English',
            language: subtitleIsoCode ? subtitleIsoCode : 'en-US',
            subtype: 'SUBTITLES'
          });
        }

        // Play the video
        _this.player.load(_this.media, _this.playerConfig, function (err, status) {
          cb(null, status, _utils.server);
        });
      }).catch(function (err) {
        cb(err, null, null);
      });
    }

    /**
     * Pause a video
     */

  }, {
    key: 'pause',
    value: function pause(cb) {
      this.player.pause(cb);
    }

    /**
     * UnPause a video
     */

  }, {
    key: 'unPause',
    value: function unPause(cb) {
      this.player.play(cb);
    }

    /**
     * Seek to
     *
     * @param {number} newCurrentTime
     *
     * @return {Function}
     */

  }, {
    key: 'seekTo',
    value: function seekTo(newCurrentTime, cb) {
      this.player.seek(newCurrentTime, cb);
    }

    /**
     * Seek
     *
     * @param  {number} seconds
     *
     * @return {Function}
     */

  }, {
    key: 'seek',
    value: function seek(seconds, cb) {
      var _this2 = this;

      this.getStatus(function (newStatus) {
        var newCurrentTime = newStatus.currentTime + seconds;
        _this2.seekTo(newCurrentTime, cb);
      });
    }

    /**
     * Get status
     *
     * @param {Function} cb
     */

  }, {
    key: 'getStatus',
    value: function getStatus(cb) {
      this.player.on('status', cb);
    }

    /**
     * Stop the player and the client
     */

  }, {
    key: 'stop',
    value: function stop() {
      this.client.stop();
      this.player.stop();
    }

    /**
     * Set the volume
     *
     * @param {number} volume
     *
     * @return {Function} cb
     */

  }, {
    key: 'setVolume',
    value: function setVolume(volume, cb) {
      this.client.setVolume({ level: volume }, cb);
    }

    /**
     * Muted the video
     *
     * @param {boolean} muted
     *
     * @return {Function} cb
     */

  }, {
    key: 'setVolumeMuted',
    value: function setVolumeMuted() {
      var muted = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];
      var cb = arguments[1];

      this.client.setVolume({ muted: muted }, cb);
    }
  }]);

  return RemoteDevice;
}();

exports.default = RemoteDevice;