'use strict';
/**
 * HTTP Client Handler for RFLink Web Service API
 */
var HTTPClientHandler = /** @class */ (function () {
    function HTTPClientHandler(rflinkConnectionParams, reset_minute, polling_mills, socketMap) {
        this.rflinkBoardResetCommand = '10;REBOOT;';
        this.socketMap = socketMap;
        this.connectionSettings = rflinkConnectionParams;
        this.resetCycles = reset_minute * 1000 * 60 / polling_mills;
        this.rflinkApiURL =
            rflinkConnectionParams.protocol
                + '://'
                + rflinkConnectionParams.host
                + ':'
                + rflinkConnectionParams.port
                + rflinkConnectionParams.options.uri
                + '?apikey='
                + rflinkConnectionParams.options.apikey;
        this.putRequestOptions = {
            host: rflinkConnectionParams.host,
            port: rflinkConnectionParams.port,
            path: rflinkConnectionParams.options.uri,
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };
    }
    /**
     *
     * @param data
     * @returns {string}
     */
    HTTPClientHandler.prototype.prepareRequestData = function (data) {
        return ("apikey=" + this.connectionSettings.options.apikey + "&value=" + data);
    };
    /**
     *
     * @param requestData
     * @returns {*}
     */
    HTTPClientHandler.prototype.prepareRequestOptions = function (requestData) {
        var putRequestOptions = Object.assign({}, this.putRequestOptions);
        putRequestOptions.headers['Content-Length'] = Buffer.byteLength(requestData);
        return (putRequestOptions);
    };
    /**
     *
     * @param socket
     * @param socketKey
     */
    HTTPClientHandler.prototype.eventLoop = function (socket, socketKey) {
        var _this = this;
        this.socketMap[socketKey].intervalCounter++;
        this.socketKey = socketKey;
        if (this.socketMap[socketKey].intervalCounter < this.resetCycles) {
            http.get(this.rflinkApiURL, function (resp) {
                var data = '';
                // A chunk of data has been recieved.
                resp.on('data', function (chunk) {
                    data += chunk;
                });
                // The whole response has been received. Print out the result.
                resp.on('end', function () {
                    try {
                        socket.write(data);
                        console.log('+++ ' + (new Date())
                            + ' | socketKey: ' + socketKey
                            + ' | cycle: ' + _this.socketMap[socketKey].intervalCounter + ' +++'
                            + '\n'
                            + data);
                    }
                    catch (e) {
                        console.log('ERROR - Connection handled error: ' + e);
                        clearInterval(_this.socketMap[socketKey].intervalId);
                        try {
                            _this.socketMap[socketKey].socket.destroy();
                        }
                        catch (e) { }
                    }
                });
            }).on("error", function (e) {
                console.log('ERROR - Rflink connection error: ' + e);
            });
        }
        else {
            this.socketMap[socketKey].intervalCounter = 0;
            this.sendRFLinkBoardReset();
        }
    };
    /**
     *
     * @param command
     */
    HTTPClientHandler.prototype.sendCommand = function (command) {
        var requestData = this.prepareRequestData(command);
        var requestOptions = this.prepareRequestOptions(requestData);
        var post_req = http.request(requestOptions, (function (res) {
            //      console.log('STATUS: ' + res.statusCode);
            //      console.log('HEADERS: ' + JSON.stringify(res.headers));
            res.setEncoding('utf8');
            res.on('data', (function (response) {
                var data = (response['rflink'] == undefined ? "" : response['rflink']);
                console.log('--- ' + (new Date())
                    + ' | command: ' + command.replace(/(\r\n|\n|\r)/gm, "")
                    + ' ---'
                    + '\n'
                    + data);
                this.socketMap[this.socketKey].socket.write(data);
            }).bind(this));
            res.on('end', (function () {
            }).bind(this));
        }).bind(this));
        // post the data
        post_req.write(requestData);
        post_req.end();
    };
    HTTPClientHandler.prototype.sendRFLinkBoardReset = function () {
        this.sendCommand(this.rflinkBoardResetCommand);
        console.log('RFLink Board resetted now.');
    };
    return HTTPClientHandler;
}());
var MQTTClientHandler = /** @class */ (function () {
    function MQTTClientHandler(rflinkConnectionParams, reset_minute, polling_mills, socketMap) {
        var _this = this;
        this.rflinkBoardResetCommand = '10;REBOOT;';
        var connectionErrorHandler = function (error) {
            var _a;
            // Inizio disconnessione
            if (undefined !== _this.socketMap[_this.socketKey]) {
                clearInterval(_this.socketMap[_this.socketKey].intervalId);
                setTimeout(function () {
                    _this.socketMap[_this.socketKey].socket.destroy();
                }, 120000);
            }
            try {
                _this.mqttClient.unsubscribe((_a = {}, _a[_this.connectionSettings.options.topic + '/gateway'] = {}, _a), function (err, granted) {
                    // Non faccio altro
                });
            }
            catch (e) { }
            try {
                _this.mqttClient.end(true);
            }
            catch (e) { }
            console.error("MQTT error, connection resetted. http connection reset in 120 seconds.");
        };
        this.socketMap = socketMap;
        this.connectionSettings = rflinkConnectionParams;
        this.resetCycles = reset_minute * 1000 * 60 / polling_mills;
        this.mqttURL =
            rflinkConnectionParams.protocol
                + '://'
                + rflinkConnectionParams.host
                + ':'
                + rflinkConnectionParams.port;
        this.connOptions = {
            'username': rflinkConnectionParams.options.username,
            'password': rflinkConnectionParams.options.password,
            'clientId': rflinkConnectionParams.options.clientId,
        };
        this.subscribeOptions = {
            'qos': rflinkConnectionParams.options.qos || '2',
            'resubscribe': rflinkConnectionParams.options.resubscribe || 'true'
        };
        this.mqttClient = mqtt.connect(this.mqttURL, this.connOptions);
        this.mqttClient.on('connect', function (packet) {
            console.log("MQTT connected | socketKey: " + _this.socketKey + " |", JSON.stringify(packet));
        }).on("offline", connectionErrorHandler).on('error', connectionErrorHandler);
        console.log("MQTTClientHandler constructor done " + this.mqttClient._nextId() + ".");
    }
    MQTTClientHandler.prototype.eventLoop = function (socket, socketKey) {
        var _this = this;
        var _a;
        this.socketMap[socketKey].intervalCounter++;
        if (this.socketMap[socketKey].intervalCounter < this.resetCycles) {
            if (!this.socket) {
                this.socket = socket;
                this.socketKey = socketKey;
                this.mqttClient.subscribe((_a = {}, _a[this.connectionSettings.options.topic + '/gateway'] = this.subscribeOptions, _a), function (err, granted) {
                    granted.forEach(function (_a) {
                        var topic = _a.topic, qos = _a.qos;
                        console.log("MQTT Subscribed to " + topic + " with qos=" + qos + " | socketKey: " + _this.socketKey + " ");
                    });
                }).on('message', function (topic, payload) {
                    // console.log(`message from ${topic}: ${payload}`) ;
                    var _a;
                    var data = payload.toString();
                    try {
                        socket.write(data);
                        console.log('+++ ' + (new Date())
                            + ' | socketKey: ' + _this.socketKey
                            + ' | topic: ' + topic
                            + ' | ' + data.replace(/(\r\n|\n|\r)/gm, "")
                            + ' +++');
                    }
                    catch (e) {
                        console.error("ERROR - Connection handled error for socketKey: " + _this.socketKey + "." + e);
                        if (undefined !== _this.socketMap[_this.socketKey]) {
                            clearInterval(_this.socketMap[_this.socketKey].intervalId);
                            _this.socketMap[_this.socketKey].socket.destroy();
                        }
                        try {
                            _this.mqttClient.unsubscribe((_a = {}, _a[_this.connectionSettings.options.topic + '/gateway'] = {}, _a), function (err, granted) {
                                if (err) {
                                    console.error('Unsubscribe error: ' + err);
                                }
                                else {
                                    console.error('Unsubscribed');
                                }
                            });
                        }
                        catch (e) { }
                        try {
                            _this.mqttClient.end(true);
                        }
                        catch (e) { }
                        console.error("Subscribe error: " + e);
                    }
                });
                // this.mqttClient.subscribe( this.connectionSettings.options.topic + '/gateway', this.subscribeOptions, (function( err, granted ) {
                //   if( err ) {
                //     console.log( 'Subscribe ' + err ) ;
                //
                //     if( undefined !== this.socketMap[ this.socketKey ] ) {
                //       clearInterval( this.socketMap[ this.socketKey ].intervalId );
                //       this.socketMap[ this.socketKey ].socket.destroy();
                //     }
                //     try {
                //       this.mqttClient.unsubscribe( this.connectionSettings.options.topic + '/gateway', {}, function( err ) {
                //       }) ;
                //       this.mqttClient.end( true ) ;
                //     } catch (e) {}
                //   } else {
                //     console.log( 'Subscribed: ' + JSON.stringify( granted ) ) ;
                //   }
                // }).bind( this ) ) ;
                // this.mqttClient.on('message', (function( topic, payload ) {
                //   let data = payload.toString() ;
                //
                //   try {
                //     socket.write( data );
                //     console.log( '+++ ' + (new Date())
                //       + ' | socketKey: ' + this.socketKey
                //       + ' | topic: ' + topic
                //       + ' | ' + data.replace(/(\r\n|\n|\r)/gm, "")
                //       + ' +++' ) ;
                //   } catch (e) {
                //     console.log( 'ERROR - Connection handled error for socketKey: ' + this.socketKey + '. ' +  e ) ;
                //
                //     if( undefined !== this.socketMap[ this.socketKey ] ) {
                //       clearInterval( this.socketMap[ this.socketKey ].intervalId );
                //       this.socketMap[ this.socketKey ].socket.destroy();
                //     }
                //     try {
                //       this.mqttClient.unsubscribe( this.connectionSettings.options.topic + '/gateway', {}, function( err ) {
                //         if( err ) {
                //           console.log( 'Unsubscribe error: ' + err ) ;
                //         } else {
                //           console.log( 'Unsubscribed' ) ;
                //         }
                //       }) ;
                //       this.mqttClient.end( true ) ;
                //     } catch (e) {}
                //   }
                // }).bind( this ) ) ;
            }
        }
        else {
            this.socketMap[socketKey].intervalCounter = 0;
            this.sendRFLinkBoardReset();
        }
    };
    MQTTClientHandler.prototype.sendCommand = function (command) {
        this.mqttClient.publish(this.connectionSettings.options.topic + '/command/set', command);
        console.log('--- ' + (new Date())
            + ' | command: ' + command.replace(/(\r\n|\n|\r)/gm, "")
            + ' ---'
            + '\n');
    };
    MQTTClientHandler.prototype.sendRFLinkBoardReset = function () {
        this.sendCommand(this.rflinkBoardResetCommand);
        console.log('RFLink Board resetted now.');
    };
    return MQTTClientHandler;
}());
var _this = this;
var fs = require('fs');
var http = require('http');
var net = require('net');
var mqtt = require('mqtt'); // npm install mqtt -g ; export NODE_PATH=$(npm root -g)
var rawdata = fs.readFileSync(__dirname + '/espurna_rflink_bridge.json');
var params = JSON.parse(rawdata);
/* ******* ******* ******* ******* ******* ******* *******
**
**         HTTP Local Server Bridge
**
** ******* ******* ******* ******* ******* ******* ******* */
var socketMap = {};
var lastSocketKey = 0;
var intervalId = null;
console.log('espurna rflink tcp bridge 1.2 - copyright @renatorssz 2019');
/**
 * HTTP Local Server Bridge Connection Handler
 *
 * @param socket
 */
var connectionHandler = function (socket) {
    var clientHandler = ('http' === params.rflink.protocol
        ? new HTTPClientHandler(params.rflink, params.bridge.reset_minute, params.bridge.polling_mills, socketMap)
        : new MQTTClientHandler(params.rflink, params.bridge.reset_minute, params.bridge.polling_mills, socketMap));
    var socketKey = ++lastSocketKey;
    if (socketKey > 0x3B9ACA00) {
        socketKey = 1;
    }
    socket.setEncoding('utf8');
    socket.on('data', function (data) {
        clientHandler.sendCommand(data);
    });
    socket.on('close', (function (data) {
        console.log('Connection closed: ' + JSON.stringify(data) + ' - Key: ' + socketKey);
        clearInterval(socketMap[socketKey].intervalId);
        socketMap[socketKey].socket.destroy();
        delete socketMap[socketKey];
    }).bind(_this));
    intervalId = setInterval(function () { clientHandler.eventLoop(socket, socketKey); }, params.bridge.polling_mills);
    /* add socket when it is connected */
    socketMap[socketKey] = { "socket": socket, "intervalId": intervalId, "intervalCounter": 0 };
    socket.pipe(socket);
    clientHandler.eventLoop(socket, socketKey);
    console.log('Connection handled from: ' + socket.remoteAddress
        + ' - Key: ' + socketKey);
};
var server = net.createServer(connectionHandler);
server.on('close', function (data) {
    console.log('Server closed.');
});
server.on('error', function (err) {
    console.log('Server error: ' + err);
});
server.listen(params.bridge.port, params.bridge.host || '127.0.0.1');
console.log('Bridge initialized using RFLink ' + ('http' === params.rflink.protocol ? "WEB API" : "MQTT Broker"));
