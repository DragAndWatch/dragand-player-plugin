import Q from 'q';
import fs from 'fs';
import path from 'path';
import mdns from 'mdns-js';
import RemoteDevice from './remote';
import childProcess from 'child_process';
import vlcCommand from 'vlc-command';
import { Client, DefaultMediaReceiver } from 'castv2-client';


/**
 * Play local video(s) on VLC
 *
 * @param  {Object} medias
 * @param  {Array} commands
 * @param  {Function} cb
 *
 * @return {Function}
 */
export const vlc = (medias, commands = [], cb) => {
  vlcCommand((err, cmdVlc) => {

    // Vlc is not on the computer
    if(err) return cb('VLC_NOT_INSTALL');

    // Create the content for playlist.pls
    const content = medias.reduce((acc, item, index, array) => {

      const filesNumber = index + 1;

      acc += `File${filesNumber}=${item.filePath}\nTitle${filesNumber}=${item.name}`;

      if(index !== array.length - 1){
        acc += '\n\n';
      }

      return acc;
    },`[playlist]\nNumberOfEntries=${medias.length}\n\n`);

    // Playlist directory
    const playlistDirectory = path.dirname(medias[0].filePath);

    // Playlist file path
    const plsPath = `${playlistDirectory}${path.sep}playlist.pls`;

    // Create playlist.pls
    fs.writeFileSync(plsPath, content);

    // Create command
    const cmd = commands.reduce((acc, item, index, array) => {
      acc += ` ${item}`;
      return acc;
    }, `${cmdVlc}`);

    // Execute the command
    childProcess.exec(`${cmd} ${plsPath}`);

    return cb(null, 'PLAYLIST_PLAYED');
  });
}

/**
 * Find all chromecasts available
 *
 * @param  {Function} cb
 * @param  {number} timer
 * @param  {Function} cbTimer
 */
export const findChromecasts = (cb, timer, cbTimer) => {

  const browser = mdns.createBrowser(mdns.tcp('googlecast'));

  browser.on('ready', function () {
      browser.discover();
  });

    // When we find a chromecast
  browser.on('update', function (service) {
    cb({
      name: (service.txt && service.tx[5]) ? service.txt[5].replace('fn=', '') : 'Chromecast',
      host: service.addresses[0],
      port: service.port
    });
  });

  // If we have a timer return a callback specific after the time
  if(timer){
    setTimeout( () => {
      browser.stop();
      cbTimer()
    }, timer);
  }

}

/**
 * Return Device instance
 *
 * @description
 * If resolve, return an instance of RemoteDevice, which is a facade to manipulate the video on chromecast
 *
 * @param {string} host
 */
export const connectToChromecast = (host) => {

  const deferred = Q.defer();
  const client   = new Client();

  client.connect(host, function() {

    client.launch(DefaultMediaReceiver, function(err, player) {
      if(err){
        deferred.reject();
      }

      deferred.resolve(new RemoteDevice(player, client));
    });

  });

  client.on('error', function(err) {
    client.close();
    deferred.reject(err);
  });

  return deferred.promise;

}