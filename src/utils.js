import Q from 'q';
import fs from 'fs';
import mime from 'mime';
import http from 'http';
import srt2vtt from 'srt2vtt';
import address from 'address';
import rangeParser from 'range-parser';
import routerFactory from 'router-factory';

/**
 * Convert Srt to VTT
 *
 * @param {String} subtitlePath
 */
export const srt2Vtt = (subtitlePath) => {

  const deferred = Q.defer();

  if(!subtitlePath){
    deferred.resolve(null);
  }
  else if(subtitlePath.split('.').pop() === 'vtt'){
    const vttData  = fs.readFileSync(subtitlePath);
    deferred.resolve(vttData);
  }
  else {
    const srtData  = fs.readFileSync(subtitlePath);

    srt2vtt(srtData, function(err, data) {
      if (err) {deferred.reject()}

      fs.writeFileSync(subtitlePath.replace('.srt', '.vtt'), data);
      deferred.resolve(data);
    });
  }

  return deferred.promise;
}

/**
 * Create a server with movie and subtitle
 *
 * @param {string} moviePath
 * @param {Buffer} subtitle
 */
export const server = (moviePath, subtitle) => {

  const deferred = Q.defer();
  const router   = new routerFactory();

  // The movie
  router.get('/movie', [], (req, res) => {

    const stat  = fs.statSync(moviePath);
    const total = stat.size;
    const range = req.headers.range;
    const type  = mime.lookup(moviePath);

    res.setHeader('Content-Type', type);
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (!range) {
      res.setHeader('Content-Length', total);
      res.statusCode = 200;
      return fs.createReadStream(moviePath).pipe(res);
    }

    const part      = rangeParser(total, range)[0];
    const chunksize = (part.end - part.start) + 1;
    const file      = fs.createReadStream(moviePath, {start: part.start, end: part.end});

    res.setHeader('Content-Range', 'bytes ' + part.start + '-' + part.end + '/' + total);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Length', chunksize);
    res.statusCode = 206;

    return file.pipe(res);
  });

  // The Subtitle
  if(subtitle){
    router.get('/subtitle', [], (req, res) => {
      res.setHeader('Content-Type', 'text/vtt; charset=utf-8');
      res.setHeader('Content-Length', subtitle.length);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.end(subtitle);
    });
  }

  const server = http.createServer(router.check.bind(router));

  server.listen(4000, (result, error) => {
    deferred.resolve({
      url   : `http://${address.ip()}:4000`,
      server: server
    });
  });

  return deferred.promise;

}