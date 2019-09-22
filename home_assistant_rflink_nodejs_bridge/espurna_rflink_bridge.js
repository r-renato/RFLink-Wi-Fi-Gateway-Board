'use strict';

const fs = require( 'fs' ) ;
const http = require( 'http' ) ;
const net = require( 'net' ) ;
const mqtt = require( 'mqtt' ) ; // npm install mqtt -g ; export NODE_PATH=$(npm root -g)

let rawdata = fs.readFileSync( __dirname + '/espurna_rflink_bridge.json' ) ;
let params = JSON.parse(rawdata);

class MQTTClientHandler {
    constructor( rflinkConnectionParams, reset_minute, polling_mills ) {
        this.rflinkBoardResetCommand = '10;REBOOT;' ;

        this.connectionSettings = rflinkConnectionParams ;
        this.resetCycles = reset_minute * 1000*60 / polling_mills ;

        this.mqttURL =
            rflinkConnectionParams.protocol
            + '://'
            + rflinkConnectionParams.host
            + ':'
            + rflinkConnectionParams.port ;

        this.connOptions = {
            'username' : rflinkConnectionParams.options.username,
            'password' : rflinkConnectionParams.options.password,
            'clientId' : rflinkConnectionParams.options.clientId,
        } ;

        this.subscribeOptions = {
            'qos' : rflinkConnectionParams.options.qos || '2',
            'resubscribe' : rflinkConnectionParams.options.resubscribe || 'true'
        } ;

        this.mqttClient = mqtt.connect( this.mqttURL, this.connOptions ) ;

    }

    eventLoop( socket, socketKey ) {
        socketMap[socketKey].intervalCounter++ ;

        if( socketMap[socketKey].intervalCounter < this.resetCycles ) {
            if( ! this.socket ) {
                this.socket = socket ; this.socketKey = socketKey ;

                this.mqttClient.subscribe( this.connectionSettings.options.topic + '/gateway', this.subscribeOptions, (function( err, granted ) {
                    if( err ) {
                        console.log( 'Subscribe ' + err ) ;

                        if( undefined !== socketMap[ this.socketKey ] ) {
                            clearInterval( socketMap[ this.socketKey ].intervalId );
                            socketMap[ this.socketKey ].socket.destroy();
                        }
                        try {
                            this.mqttClient.unsubscribe( this.connectionSettings.options.topic + '/gateway', {}, function( err ) {
                            }) ;
                            this.mqttClient.end( true ) ;
                        } catch (e) {}
                    } else {
                        console.log( 'Subscribed: ' + JSON.stringify( granted ) ) ;
                    }
                }).bind( this ) ) ;

                this.mqttClient.on('message', (function( topic, payload ) {
                    let data = payload.toString() ;

                    try {
                        socket.write( data );
                        console.log( '+++ ' + (new Date())
                            + ' | socketKey: ' + this.socketKey
                            + ' | topic: ' + topic
                            + ' | ' + data.replace(/(\r\n|\n|\r)/gm, "")
                            + ' +++' ) ;
                    } catch (e) {
                        console.log( 'ERROR - Connection handled error for socketKey: ' + this.socketKey + '. ' +  e ) ;

                        if( undefined !== socketMap[ this.socketKey ] ) {
                            clearInterval( socketMap[ this.socketKey ].intervalId );
                            socketMap[ this.socketKey ].socket.destroy();
                        }
                        try {
                            this.mqttClient.unsubscribe( this.connectionSettings.options.topic + '/gateway', {}, function( err ) {
                                if( err ) {
                                    console.log( 'Unsubscribe error: ' + err ) ;
                                } else {
                                    console.log( 'Unsubscribed' ) ;
                                }
                            }) ;
                            this.mqttClient.end( true ) ;
                        } catch (e) {}
                    }
                }).bind( this ) ) ;
            }
        } else {
            socketMap[socketKey].intervalCounter = 0 ;
            this.sendRFLinkBoardReset() ;
        }
    }

    sendCommand( command ) {
        this.mqttClient.publish( this.connectionSettings.options.topic + '/command/set', command ) ;
        console.log( '--- ' + (new Date())
            + ' | command: ' + command.replace(/(\r\n|\n|\r)/gm, "")
            + ' ---'
            + '\n' ) ;
    }

    sendRFLinkBoardReset() {
        this.sendCommand( this.rflinkBoardResetCommand ) ;

        console.log( 'RFLink Board resetted now.' ) ;
    }
}

/**
 * HTTP Client Handler for RFLink Web Service API
 */
class HTTPClientHandler {

    constructor( rflinkConnectionParams, reset_minute, polling_mills ) {
        this.rflinkBoardResetCommand = '10;REBOOT;' ;

        this.connectionSettings = rflinkConnectionParams ;
        this.resetCycles = reset_minute * 1000*60 / polling_mills ;

        this.rflinkApiURL =
            rflinkConnectionParams.protocol
            + '://'
            + rflinkConnectionParams.host
            + ':'
            + rflinkConnectionParams.port
            + rflinkConnectionParams.options.uri
            + '?apikey='
            + rflinkConnectionParams.options.apikey ;

        this.putRequestOptions = {
            host: rflinkConnectionParams.host,
            port: rflinkConnectionParams.port,
            path: rflinkConnectionParams.options.uri,
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }
    }

    /**
     *
     * @param data
     * @returns {string}
     */
    prepareRequestData( data ) {
        return( "apikey=" + this.connectionSettings.options.apikey + "&value=" + data ) ;
    }

    /**
     *
     * @param requestData
     * @returns {*}
     */
    prepareRequestOptions( requestData ) {
        let putRequestOptions = Object.assign({}, this.putRequestOptions ) ;
        putRequestOptions.headers[ 'Content-Length' ] = Buffer.byteLength( requestData ) ;

        return( putRequestOptions ) ;
    }

    /**
     *
     * @param socket
     * @param socketKey
     */
    eventLoop( socket, socketKey ) {
        socketMap[socketKey].intervalCounter++ ;
        this.socketKey = socketKey ;

        if( socketMap[socketKey].intervalCounter < this.resetCycles ) {
            http.get( this.rflinkApiURL, (resp) => {
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
                            + ' | cycle: ' + socketMap[socketKey].intervalCounter + ' +++'
                            + '\n'
                            + data ) ;
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
            this.sendRFLinkBoardReset() ;
        }
    }

    /**
     *
     * @param command
     */
    sendCommand( command ) {
        let requestData = this.prepareRequestData( command ) ;
        let requestOptions = this.prepareRequestOptions( requestData ) ;

        let post_req = http.request( requestOptions, (function(res) {
//      console.log('STATUS: ' + res.statusCode);
//      console.log('HEADERS: ' + JSON.stringify(res.headers));
            res.setEncoding('utf8');

            res.on('data', (function( response ) {
                let data = (response['rflink'] == undefined ? "" : response['rflink'] ) ;
                console.log( '--- ' + (new Date())
                    + ' | command: ' + command.replace(/(\r\n|\n|\r)/gm, "")
                    + ' ---'
                    + '\n'
                    + data ) ;
                socketMap[ this.socketKey ].socket.write( data ) ;
            }).bind( this ) );

            res.on('end', (function() {

            }).bind( this ) ) ;
        }).bind( this ) ) ;

        // post the data
        post_req.write( requestData );
        post_req.end();
    }

    sendRFLinkBoardReset() {
        this.sendCommand( this.rflinkBoardResetCommand ) ;

        console.log( 'RFLink Board resetted now.' ) ;
    }
}

/* ******* ******* ******* ******* ******* ******* *******
**
**         HTTP Local Server Bridge
**
** ******* ******* ******* ******* ******* ******* ******* */

let socketMap = {};
let lastSocketKey = 0 ;
let intervalId = null ;

console.log( 'espurna rflink tcp bridge 1.1 - copyright @renatorssz 2019' ) ;

/**
 * HTTP Local Server Bridge Connection Handler
 *
 * @param socket
 */
let connectionHandler = (socket) => {
    let clientHandler = ('http' === params.rflink.protocol
            ? new HTTPClientHandler( params.rflink, params.bridge.reset_minute, params.bridge.polling_mills )
            : new MQTTClientHandler( params.rflink, params.bridge.reset_minute, params.bridge.polling_mills )
    ) ;

    let socketKey = ++lastSocketKey ; if( socketKey > 0x3B9ACA00 ) { socketKey = 1 ; }
    socket.setEncoding( 'utf8' ) ;

    socket.on('data', function( data ) {
        clientHandler.sendCommand( data ) ;
    }) ;

    socket.on('close', (function(data) {
        console.log('Connection closed: ' + JSON.stringify( data ) + ' - Key: ' + socketKey ) ;
        clearInterval( socketMap[ socketKey ].intervalId ) ;
        socketMap[ socketKey ].socket.destroy() ;
        delete socketMap[socketKey];
    }).bind( this ) ) ;

    intervalId = setInterval( function () { clientHandler.eventLoop(socket, socketKey) ; }, params.bridge.polling_mills );

    /* add socket when it is connected */
    socketMap[socketKey] = { "socket" : socket, "intervalId" : intervalId, "intervalCounter" : 0 } ;

    socket.pipe( socket ) ;
    clientHandler.eventLoop(socket, socketKey) ;

    console.log( 'Connection handled from: ' + socket.remoteAddress
        + ' - Key: ' + socketKey
    ) ;

} ;

let server = net.createServer( connectionHandler );

server.on('close', function(data) {
    console.log( 'Server closed.' ) ;
});

server.on('error', (err) => {
    console.log( 'Server error: ' + err ) ;
});

server.listen( params.bridge.port, params.bridge.host || '127.0.0.1' );
console.log( 'Bridge initialized using RFLink ' + ('http' === params.rflink.protocol ? "WEB API" : "MQTT Broker" ) ) ;
