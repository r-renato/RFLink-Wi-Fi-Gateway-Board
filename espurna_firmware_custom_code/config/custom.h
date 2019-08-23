//* espurna custom header template file
//* This is espurna custom header integration point
//* All custom defines goes Here
//* See plugin integration section on bottom of this file
//* Template Version: 0.0.1
//* files: /code/espurna/config/custom.h; code/espurna/plugin1.ino; /code/libplugin1/plugin1.h

#define MANUFACTURER            "RobotDyn Atmel ATmega2560 + ESP8266 board"
#define DEVICE                  "rflink board"

// Disable non-core modules
#define ALEXA_SUPPORT           0
#define BROKER_SUPPORT          0
#define DOMOTICZ_SUPPORT        0
#define HOMEASSISTANT_SUPPORT   0
#define I2C_SUPPORT             0
#define MQTT_SUPPORT            0
#define NTP_SUPPORT             1
#define SCHEDULER_SUPPORT       0
#define SENSOR_SUPPORT          0
#define THINGSPEAK_SUPPORT      0
#define WEB_SUPPORT             1
#define WEB_EMBEDDED            1
#define DEBUG_WEB_SUPPORT     	1
#define TELNET_SUPPORT          1
#define DEBUG_SERIAL_SUPPORT    0
#define TERMINAL_SUPPORT        1
#define SYSTEM_CHECK_ENABLED    1
#define HEARTBEAT_ENABLED       1
#define MDNS_SERVER_SUPPORT     1

// -----------------------------------------------------------------------------
// Hardware settings
// -----------------------------------------------------------------------------
#define API_BUFFER_SIZE             3072          // Size of the buffer for HTTP GET API responses


// -----------------------------------------------------------------------------
// Plugin integration strt here
// -----------------------------------------------------------------------------
//* To create plugin you need 3 files:
//* custom.h: espurna's entry point for custom headers integration
//*     This header will be included by all.h, depended on USE_CUSTOM_H flag
//*     read top of all.h header file for help how to ectivate
//*     in espurna code (the only change you need in code code)
//* plugin(x).h: plugin header file
//* plugin(x).ino plugin code file

//* Include flags include the plugins code in the image
//* The plugin can be enabled/diabled in run time (API + TERMINAL commands)
#define INCLUDE_ROBOTDYN_ATMEGA2560_ESP8266      1

//* USE_EXTRA is espurna 3rd party code integration hook
//* flag is used by espurna.ino to call extraSetup() function
#define USE_EXTRA            INCLUDE_ROBOTDYN_ATMEGA2560_ESP8266

//* Plugin integation point
#if USE_EXTRA
    //* include the plugin header (plugin entry point)
    #if INCLUDE_ROBOTDYN_ATMEGA2560_ESP8266
        #include "../libs/robotdyn_atmega2560_esp8266.h"
    #endif

    //* Declare espurna calling function
    void extraSetup();

    void extraSetup() {
        //* extraSetup is called by espurna.ino (depended on USE_EXTRA flag)
        //* This is a single entry point to the plugin code
        //* Call the plugin setup function
        #if INCLUDE_ROBOTDYN_ATMEGA2560_ESP8266
            robotdyn_atmega2560_esp8266Setup();
        #endif
    }
#endif
