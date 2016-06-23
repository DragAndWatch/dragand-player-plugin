# Dragand Player Plugin
![Dependencies](https://david-dm.org/DragAndWatch/dragand-player-plugin.svg)

Open Source library to play a local video on VLC or Chromecast

We use it on the Dragand Application download at http://www.dragand.watch.

## Getting Started

### Chromecast

```javascript
var findChromecasts     = require('dragand-player-plugin').findChromecasts;
var connectToChromecast = require('dragand-player-plugin').connectToChromecast;

// Find chromecasts
findChromecasts(service => {
  console.log('found device "%s" at %s:%d', service.name, service.host, service.port);

  // Connect to the chromecast
  connectToChromecast(service.host)
    .then(remote => {

      // Play a video
      remote.load({
        moviePath : '<FilePath>', // Local path
        movieTitle: 'My movie',
        movieCover: '' // Url of a cover
      }, {
        subtitlePath   : '<filePath>', // Local path : .srt or .vtt
        subtitleIsoCode: 'fr-FR', // Can be null
        subtitleLang   : 'French' // Can be null
      }, (err, status, server) => {

        // Get the duration in seconds
        console.log(status.media.duration);

        /**
         * Available commands:
         *
         * remote.pause()
         * remote.stop()
         * remote.unPause()
         * remote.seek(5)
         * remote.seekTo(30)
         * remote.getStatus()
         * remote.setVolume(1)
         * remote.setVolumeMuted(true)
         */

      });

    });

}, 10000, function() {
  console.log('Completed research');
}); // Search for 10s
```

### VLC
This command works on Windows (x64/x32), MacOS and Linux
```javascript
var vlc = require('dragand-player-plugin').vlc;

const filesPath = [
  {
    name: "Grey's Anatomy S12E23",
    filePath: "/Users/Downloads/Greys.Anatomy.S12E23.FASTSUB.VOSTFR.HDTV.XviD-ZT.avi"
  },
  {
    name: "Grey's Anatomy S12E24",
    filePath: "/Users/Downloads/Greys.Anatomy.S12E24.FiNAL.FASTSUB.VOSTFR.HDTV.XviD-ZT.avi"
  }
];

// Commands Vlc : Can be empty array
const commands = ['-f'];

vlc(filesPath, commands, cb => {
  console.log(cb); // Return true if good, or false is vlc is not install
});
```