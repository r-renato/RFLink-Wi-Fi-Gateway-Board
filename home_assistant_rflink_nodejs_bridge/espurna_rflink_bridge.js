'use strict';

const args = process.argv.slice(2) ;

const http = require('http');
const querystring = require('querystring');
const fs = require('fs');
let net = require('net');

let intervalId = null;

let lastSocketKey = 0 ;
let socketMap = {};

let rawdata = fs.readFileSync( __dirname + '/espurna_rflink_bridge.json' ) ;
let params = JSON.parse(rawdata);

let resetCicles = params.bridge.reset_minute * 1000*60 / params.bridge.polling_mills ;

let getURL = params.rflink.protocol + '://' + params.rflink.host + ':' + params.rflink.port
    + params.rflink.uri + '?apikey=' + params.rflink.apikey ;

//console.log( 'Request GET URL: ' + getURL ) ;
console.log( 'Reset rflink each: ' + resetCicles ) ;

let put_data = "apikey=4EC7A215FB867244&value=10;REBOOT;" ;

let put_options = {
  host: params.rflink.host,
  port: params.rflink.port,
  path: params.rflink.uri,
  method: 'PUT',
  headers: {
    'Accept' : 'application/json',
    'Content-Type' : 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(put_data)
  }
} ;

let destroyAllConnection = () => {
  Object.keys(socketMap).forEach(function(socketKey){
    console.log( 'Destroy socket: ' + socketKey ) ;
    socketMap[socketKey].destroy();
    delete socketMap[socketKey];
  });

  lastSocketKey = 0 ;
} ;

let resetRflink = () => {
  let post_req = http.request(put_options, function(res) {
    console.log('STATUS: ' + res.statusCode);
//    console.log('HEADERS: ' + JSON.stringify(res.headers));
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      console.log('PUT Response: ' + chunk);
    });
  });

  // post the data
  post_req.write(put_data);
  console.log( 'PUT request: ' + put_data ) ;
  post_req.end();

  console.log( 'Reset rflink now.' ) ;
} ;

let bridgeLoop = (socket, socketKey) => {
  socketMap[socketKey].intervalCounter++ ;

  if( socketMap[socketKey].intervalCounter < resetCicles ) {
    http.get( getURL, (resp) => {
      let data = '';

      // A chunk of data has been recieved.
      resp.on('data', (chunk) => {
        data += chunk;
      });

      // The whole response has been received. Print out the result.
      resp.on('end', () => {
        try {
          socket.write(data);
          console.log( '+++ ' + (new Date())
            + ' | socketKey: ' + socketKey
            + ' | cycle: ' + socketMap[socketKey].intervalCounter + ' +++' ) ;
          console.log(data);
        } catch (e) {
          console.log( 'ERROR - Connection handled error: ' +  e ) ;
          clearInterval( socketMap[socketKey].intervalId );
          try {
            socketMap[socketKey].socket.destroy();
          } catch (e) {}
        }
      });

    }).on("error", (e) => {
      console.log( 'ERROR - Rflink connection error: ' + e ) ;
    });
  } else {
    socketMap[socketKey].intervalCounter = 0 ;
    resetRflink() ;
  }

} ;

/**
 *
 * @param socket
 */
let connectionHandler = (socket) => {
  let socketKey = ++lastSocketKey;
  socket.setEncoding('utf8');

  socket.on('data', function(d) {
    console.log('>>' + d) ;
  }) ;

  socket.on('close', function(data) {
    console.log('Connection closed: ' + JSON.stringify( data ) + ' - Key: ' + socketKey ) ;
    clearInterval( socketMap[socketKey].intervalId ) ;
    delete socketMap[socketKey];
  });

  intervalId = setInterval( function () { bridgeLoop(socket, socketKey) ; }, params.bridge.polling_mills );

  /* add socket when it is connected */
  socketMap[socketKey] = { "socket" : socket, "intervalId" : intervalId, "intervalCounter" : 0 } ;

  socket.pipe( socket ) ;

  console.log( 'Connection handled: ' + socket.remoteAddress ) ;

} ;

console.log( 'espurna rflink tcp bridge 1.0' ) ;
let server = net.createServer( connectionHandler );

server.on('close', function(data) {
  console.log( 'Server closed.' ) ;
});

server.on('error', (err) => {
  console.log( 'Server error: ' + err ) ;
});


server.listen( params.bridge.port, '127.0.0.1');
console.log( 'Server initialized.' ) ;
