import Q from 'q';
import fs from 'fs';
import {server, srt2Vtt} from './utils'

/**
 * RemoteDevice class
 */
export default class RemoteDevice {

  /**
   * Constructor
   *
   * @param {Device} device
   * @param {Client} client
   */
  constructor(player, client){
    this.player = player;
    this.client = client;

    // Movie config
    this.media = {
      contentId  : null,
      contentType: 'video/mp4',
      streamType : 'BUFFERED', // or LIVE
      metadata: {
        type        : 0,
        metadataType: 0,
        title       : null,
        images: [
          { url: null }
        ]
      },
      textTrackStyle: {
        backgroundColor          : '#000000FF',
        foregroundColor          : '#FFFFFFFF',
        edgeType                 : 'OUTLINE',
        edgeColor                : '#000000FF',
        fontScale                : 1.3,
        fontStyle                : 'NORMAL',
        fontFamily               : 'Helvetica',
        fontGenericFamily        : 'SANS_SERIF',
        windowColor              : '#00000000',
        windowRoundedCornerRadius: 0,
        windowType               : 'NONE'
      }
    };

    // Play config
    this.playerConfig = {
      autoplay: 1
    };
  }

  // Play the video for the firt time
  load({moviePath, movieTitle, movieCover}, {subtitlePath, subtitleIsoCode, subtitleLang} = {}, cb){

    // Check if moviePath exist
    if(!fs.lstatSync(moviePath).isFile() || (subtitlePath && !fs.lstatSync(subtitlePath).isFile())){
      return cb(`Files don't exist`, null, null);
    }

    // Convert the subtitle
    srt2Vtt(subtitlePath)
      .then(subtitleData => {
        return server(moviePath, subtitleData); // Create a server with subtitle and movie
      })
      .then(result => {

        // Add metaData link to the movie
        this.media.contentId = `${result.url}/movie`;
        this.media.metadata.title = movieTitle;
        this.media.metadata.images[0].url = movieCover;

        // If we have subtitle add it in media config
        if(subtitlePath){
          this.playerConfig.activeTrackIds = [1];
          this.media.tracks = [];

          this.media.tracks.push({
            trackId         : 1,
            type            : 'TEXT',
            trackContentId  : `${result.url}/subtitle`,
            trackContentType: 'text/vtt',
            name            : (subtitleLang) ? subtitleLang : 'English',
            language        : (subtitleIsoCode) ? subtitleIsoCode : 'en-US',
            subtype         : 'SUBTITLES'
          });

        }

        // Play the video
        this.player.load(this.media, this.playerConfig, function(err, status) {
            cb(null, status, server);
        });

      })
      .catch(err => {
        cb(err, null, null);
      });

  }

  /**
   * Pause a video
   */
  pause(cb){
    this.player.pause(cb);
  }

  /**
   * UnPause a video
   */
  unPause(cb){
    this.player.play(cb);
  }

  /**
   * Seek to
   *
   * @param {number} newCurrentTime
   *
   * @return {Function}
   */
  seekTo(newCurrentTime, cb){
    this.player.seek(newCurrentTime, cb);
  }

  /**
   * Seek
   *
   * @param  {number} seconds
   *
   * @return {Function}
   */
  seek(seconds, cb){
    this.getStatus(newStatus => {
      const newCurrentTime = newStatus.currentTime + seconds;
      this.seekTo(newCurrentTime, cb);
    });
  }

  /**
   * Get status
   *
   * @param {Function} cb
   */
  getStatus(cb){
    this.player.on('status', cb);
  }

  /**
   * Stop the player and the client
   */
  stop(){
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
  setVolume(volume, cb){
    this.client.setVolume({ level: volume }, cb);
  }

  /**
   * Muted the video
   *
   * @param {boolean} muted
   *
   * @return {Function} cb
   */
  setVolumeMuted(muted = true, cb){
    this.client.setVolume({ muted }, cb);
  }

}