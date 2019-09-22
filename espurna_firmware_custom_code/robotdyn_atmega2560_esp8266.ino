#ifdef _ROBOTDYN_ATMEGA2560_ESP8266_H

//*---------------------------------------------------------------------------
//* Plugin includes
//*---------------------------------------------------------------------------
#include <EEPROM.h>
#include <Ticker.h>
#include <ArduinoJson.h>
#include <vector>
#include <functional>

#include <queue>

//*----------------------------------------------------------------------------
//* Private
//*----------------------------------------------------------------------------
//*----------------------------------------------------------------------------
//* Plugin globals
//*----------------------------------------------------------------------------
bool _robotdyn_atmega2560_esp8266_enabled = false;
unsigned long _robotdyn_atmega2560_esp8266ReportInterval = 1000 * ROBOTDYN_ATMEGA2560_ESP8266_REPORT_EVERY;
unsigned long _robotdyn_atmega2560_esp8266LastUpdate = 0;
unsigned long _robotdyn_atmega2560_esp8266DebugCounter = 0;

uint8_t serial_buf[ SERIAL_BUFFER_SIZE ] ;
size_t bytes_read = 0 ;
int cnt = 0;
bool ready = false;
bool isInPrepareStringBuffer = false ;

static std::queue<String> _serial_queue;

//*----------------------------------------------------------------------------
//* Plugin helper functions
//*----------------------------------------------------------------------------

//* Plugin loop helper function(s)
//*------------------------------

void serialWriteString(String stringData) { // Used to serially push out a String with Serial.write()

  for (int i = 0; i < stringData.length(); i++) {
    Serial.write(stringData[i]);   // Push each char 1 by 1 on each loop pass
  }

} // end writeString

void prepareStringBuffer( int RXWait ) {
    isInPrepareStringBuffer = true ;
    if (RXWait == 0) RXWait = 1;
    int timeOut = RXWait;
    while( timeOut > 0 ) {
        while( Serial.available() ) {
            if( bytes_read < SERIAL_BUFFER_SIZE ) {
                serial_buf[ bytes_read ] = Serial.read() ;
                bytes_read++;

                if( (bytes_read > 1) && (serial_buf[bytes_read - 2] == '\r') && (serial_buf[bytes_read - 1] == '\n') ) {
                    serial_buf[ bytes_read ] = '\0' ;
                    bytes_read = 0 ;

                    DEBUG_MSG_P(PSTR("[PLUGIN] buffer: %s\r\n"), serial_buf ) ;

                    //* Broker publish
                    //*-------------
                    #if BROKER_SUPPORT
                        brokerPublish(BROKER_MSG_TYPE_SENSOR, ROBOTDYN_ATMEGA2560_ESP8266_MQTT_TOPIC, (char*)serial_buf );
                        DEBUG_MSG_P(PSTR("[PLUGIN] MQTT message: %s\r\n"), (char*)serial_buf ) ;
                    #endif

                    //* MQTT publish
                    //*-------------
                    #if MQTT_SUPPORT
                        mqttSend(ROBOTDYN_ATMEGA2560_ESP8266_MQTT_TOPIC, (char*)serial_buf);
                    #endif

                    _serial_queue.push( String((char*)serial_buf) ) ;
                    if( _serial_queue.size() > 20 ) _serial_queue.pop() ;
                    DEBUG_MSG_P(PSTR("[PLUGIN] queue n.: %d\r\n"), _serial_queue.size() ) ;
                }
            } else {
                Serial.read();  // when the buffer is full, just read remaining input, but do not store...
            }

            timeOut = RXWait; // if serial received, reset timeout counter
        }
        delay(1);
        timeOut--;
    }
    isInPrepareStringBuffer = false ;
}

void _robotdyn_atmega2560_esp8266_serial_read() {

    prepareStringBuffer( 0 ) ;

    //* Debug messages (anywere in your code)
    //*--------------------------------------
    #if ROBOTDYN_ATMEGA2560_ESP8266_REPORT_EVERY != 0
      //DEBUG_MSG_P(PSTR("[PLUGIN] Plugin debug message c format: {%.}\n"), {.});
        if (millis() - _robotdyn_atmega2560_esp8266LastUpdate > _robotdyn_atmega2560_esp8266ReportInterval) {
            _robotdyn_atmega2560_esp8266LastUpdate = millis();
            DEBUG_MSG_P(PSTR("[PLUGIN] Loop counter: %d - \n"), _robotdyn_atmega2560_esp8266DebugCounter);
            _robotdyn_atmega2560_esp8266DebugCounter++;
        }
    #endif
}

//* If API support needed
//* API register helper function
//*-----------------------------
#if WEB_SUPPORT
    //* register api functions
    //* apiRegister(key, _getFunction, _putFunction);
    //* this is API registraion to enable disable the plugin
    //* use this as template to create additional API calls for the plugin
    void _robotdyn_atmega2560_esp8266SetupAPI() {
          char key[15];
          snprintf_P(key, sizeof(key), PSTR("%s"), ROBOTDYN_ATMEGA2560_ESP8266_REST_URI);
          apiRegister(key,
            [](char * buffer, size_t len) { // GET
                if( ! isInPrepareStringBuffer ) {
                    String apiResponse = String() ;
                    String row ;

                    while( !_serial_queue.empty() ) {
                        row = _serial_queue.front();
                        apiResponse.concat( row ) ;
                        _serial_queue.pop();
                    }

                    char respBuffer[ apiResponse.length() + 2] ;
                    apiResponse.toCharArray(respBuffer, apiResponse.length() + 1);

                    DEBUG_MSG_P(PSTR("[PLUGIN1] API len: %d, respBuffer: %d, "), len, sizeof(respBuffer) );
                    //snprintf_P(buffer, sizeof(buffer), PSTR("Ok - %d"), _pluginCounter);
                    snprintf_P(buffer, len, PSTR("%s"), respBuffer );
                    DEBUG_MSG_P(PSTR("return data:\n%s\n"), buffer);
                } else {
                    snprintf_P(buffer, len, PSTR("%s"), "" );
                    DEBUG_MSG_P(PSTR("[PLUGIN1] API NOP") );
                }
               },

            [](const char * payload) { // PUT

                if( payload != NULL ) {
                    String command = String( payload ) ;

                    if( command.startsWith( "10;" ) ) {
                        DEBUG_MSG_P(PSTR("[PLUGIN1] API PUT value: %s\n"), payload);
                        command += "\r\n" ;
                        serialWriteString( command ) ;
                        Serial.flush();
                        if( command.startsWith( "10;REBOOT;" ) ) {
                            _robotdyn_atmega2560_esp8266DebugCounter = 0 ;
                        }
                    } else if( command.startsWith( "ON" ) || command.startsWith( "OFF" ) ) {
                        DEBUG_MSG_P(PSTR("[PLUGIN1] API PUT value: %s\n"), payload);
                        _robotdyn_atmega2560_esp8266_enabled = command.equals( "ON" ) ;
                        setSetting(ROBOTDYN_ATMEGA2560_ESP8266_ENABLE_KEY, _robotdyn_atmega2560_esp8266_enabled);
                    } else {
                        DEBUG_MSG_P(PSTR("[PLUGIN1] API PUT value: %s is invalid command\n"), payload);
                    }
                }
          });
	    }
#endif

#if BROKER_SUPPORT
    void _pluginBrokerCallback(const unsigned char type, const char * topic, unsigned char id, const char * payload) {
        DEBUG_MSG_P(PSTR("[PLUGIN1] BROKER topic: %s\n"), topic);
        // Only process status messages
        if (BROKER_MSG_TYPE_STATUS != type) return;

        if (strcmp(MQTT_TOPIC_RELAY, topic) == 0) {
            //ledUpdate(true);
        }

    }

    void _robotdyn_atmega2560_esp8266SetupBroker() {
        brokerRegister(_pluginBrokerCallback);
    }
#endif // BROKER_SUPPORT

//* If MQTT support needed
//* MQTT callback handling helper functions
//*----------------------------------------
#if MQTT_SUPPORT
    void _pluginMQTTCallback(unsigned int type, const char * topic, const char * payload) {

        if (type == MQTT_CONNECT_EVENT) {
            // Subscribe to own /set topic
            char buffer[strlen(ROBOTDYN_ATMEGA2560_ESP8266_MQTT_COMMAND_TOPIC) + 3];
            snprintf_P(buffer, sizeof(buffer), PSTR("%s/"), ROBOTDYN_ATMEGA2560_ESP8266_MQTT_COMMAND_TOPIC);
            DEBUG_MSG_P(PSTR("[PLUGIN] MQTT subscribe topic: %s\n"), buffer);
            mqttSubscribe( buffer );
            // Subscribe to group topics
            //mqttSubscribeRaw(group);
        }
        if (type == MQTT_MESSAGE_EVENT) {
            // manage mtww palyload here
            String t = mqttMagnitude((char *) topic);
            // manage group topics code here
            char respBuffer[ t.length() + 2] ;
            t.toCharArray(respBuffer, t.length() + 1);
            DEBUG_MSG_P(PSTR("[PLUGIN] MQTT TOPIC: %s\n"), respBuffer);
            DEBUG_MSG_P(PSTR("[PLUGIN] MQTT topic: %s\n"), topic);

            String command = String( payload ) ;

            if( t.equals( ROBOTDYN_ATMEGA2560_ESP8266_MQTT_COMMAND_TOPIC ) && command.startsWith( "10;" ) ) {
                DEBUG_MSG_P(PSTR("[PLUGIN] MQTT PUT value: %s\n"), payload);
                command += "\r\n" ;
                serialWriteString( command ) ;
                Serial.flush();
                if( command.startsWith( "10;REBOOT;" ) ) {
                    _robotdyn_atmega2560_esp8266DebugCounter = 0 ;
                }
            }
        }

        if (type == MQTT_DISCONNECT_EVENT) {
            // MQTT disonnect code here
        }

//        DEBUG_MSG_P(PSTR("[PLUGIN] MQTT topic: %s\n"), topic);
//        DEBUG_MSG_P(PSTR("[PLUGIN1] MQTT payload: %s\n"), payload);
//        DEBUG_MSG_P(PSTR("[PLUGIN1] MQTT type: %i\n"), type);
      }

      void _robotdyn_atmega2560_esp8266SetupMQTT() {
          mqttRegister(_pluginMQTTCallback);
      }
#endif

//* If terminal Terminal commands needed
//* Plugin terminal commands helper function
//*-----------------------------------------
#if TERMINAL_SUPPORT
      void _pluginInitCommands() {
          //* Register Terminal commad to turn on/off the plugin
          //* use this as template to create additional plugin terminal commands
//          settingsRegisterCommand(F("PLUGIN1"), [](Embedis* e) {
//                  if (e->argc == 0) {
//                      DEBUG_MSG_P(PSTR("Pluin1 Status: %s\n"), _plugin1_enabled ? "ON" : "OFF");
//                      DEBUG_MSG_P(PSTR("Send 0/1 to enable/disable\n"));
//                      DEBUG_MSG_P(PSTR("+OK\n"));
//                      return;
//                  }
//                  _plugin1_enabled = (String(e->argv[1]).toInt() == 1);
//                  setSetting("PLG1_EN", _plugin1_enabled);
//                  DEBUG_MSG_P(PSTR("Pluin1 Set Status: %s\n"), _plugin1_enabled ? "ON" : "OFF");
//                  DEBUG_MSG_P(PSTR("+OK\n"));
//              });

      }
#endif

//*----------------------------------------------------------------------------
//* Plugin setup
//*----------------------------------------------------------------------------
void robotdyn_atmega2560_esp8266Setup() {
    //*    plugin setup code
    //* myPluginSetup() is called by custom.h - espurna plugin entry point

    //delay(30000);  //delay to allow buffer to fill
    Serial.begin(57600, SERIAL_8N1);
    while (!Serial) {
      ; // wait for serial port to connect. Needed for native USB (Leo, Teensy, etc)
    }

    //Serial.setTimeout(3000);
    serialWriteString( "10;VERSION;\r\n" ) ;
    Serial.flush();

    _robotdyn_atmega2560_esp8266_enabled = getSetting(ROBOTDYN_ATMEGA2560_ESP8266_ENABLE_KEY, ROBOTDYN_ATMEGA2560_ESP8266_ENABLE).toInt() == 1;

    //* Register plugin loop to espurna main loop
    //*------------------------------------------
    espurnaRegisterLoop( _robotdyn_atmega2560_esp8266Loop );

    //* If API used set up Api
    //*-----------------------
    #if WEB_SUPPORT
        _robotdyn_atmega2560_esp8266SetupAPI();
    #endif

    //* If Web Sockets set up WS
    //*-------------------------
//    #if WEB_SUPPORT
//        _pluginSetupWS();
//    #endif

    //* If MQTT used set up MQTT
    //*-------------------------
    #if MQTT_SUPPORT
        _robotdyn_atmega2560_esp8266SetupMQTT();
    #endif

    #if BROKER_SUPPORT
        _robotdyn_atmega2560_esp8266SetupBroker() ;
    #endif

    //* If trminal used set up terminal
    //*-------------------------------
	  #if TERMINAL_SUPPORT
	      _pluginInitCommands();
      #endif

    DEBUG_MSG_P(PSTR("[PLUGIN] Plugin setup code finished \n"));
}
//* end of plugin setup
//*----------------------------------------------------------------------------

//*----------------------------------------------------------------------------
//* PLUGIN loop
//*----------------------------------------------------------------------------
void _robotdyn_atmega2560_esp8266Loop() {
    //*   plugin loop code
    //* _pluginLoop regitered (espurnaRegisterLoop) by myPluginSetup()
    //* myPluginSetup() is called by custom.h - espurna plugin entry point

    //* if plugin disabled dont run the coded
    if( _robotdyn_atmega2560_esp8266_enabled != 1 ) return;

    //* here call all plugin loop functions (copy sumple function as needed)
    _robotdyn_atmega2560_esp8266_serial_read();
}

//*----------------------------------------------------------------------------
//* Public - Plugin API
//*----------------------------------------------------------------------------
//* Here goes ublic plugin API definitions and coded
//* currently plugin enabled query implemented
//* use this as template to create additionl API calls
//* to Set/Get internal plugin data or use plugin functions
bool plugin1Enabled() {
    return _robotdyn_atmega2560_esp8266_enabled ;
}

StringTokenizer::StringTokenizer(String str, String del)
{
  _str = str;
  _del = del;
  ptr = 0;
}

boolean StringTokenizer::hasNext()
{
  if(ptr < _str.length()){
	return true;
  }else{
	return false;
  }
}

String StringTokenizer::nextToken()
{
	if(ptr >= _str.length()){
		ptr = _str.length();
		return "";
	}

	String result = "";
	int delIndex = _str.indexOf(_del, ptr);

	if(delIndex == -1){
	  result = _str.substring(ptr);
	  ptr = _str.length();
	  return result;
	}else{
		result = _str.substring(ptr, delIndex);
		ptr = delIndex + _del.length();
		return result;
	}
}
#endif