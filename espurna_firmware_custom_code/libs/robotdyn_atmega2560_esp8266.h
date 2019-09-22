#ifdef INCLUDE_ROBOTDYN_ATMEGA2560_ESP8266
#ifndef _ROBOTDYN_ATMEGA2560_ESP8266_H
#define _ROBOTDYN_ATMEGA2560_ESP8266_H

//*---------------------------------------------------------------------------
//* Espurna overrides
//* -------------------------------------------------------------------------
//*  Here put espurna plugin specific overrides
#define RELAY_PROVIDER          RELAY_PROVIDER_HW655
#define SERIAL_BAUDRATE         9600
//---------------------------------------------------------------------------
//* Plugin defines
//----------------------------------------------------------------------------
//---------------------------------------------------------------------------
//* plese refer to plugin1.ino for more help and inline documentaion
//* Plugin enabled flag (enabling or disabling execution)
#define ROBOTDYN_ATMEGA2560_ESP8266_ENABLE             1
//* component environment enable status key
#define ROBOTDYN_ATMEGA2560_ESP8266_ENABLE_KEY         "RAE_EN"
//* component environment enable status key
#define ROBOTDYN_ATMEGA2560_ESP8266_PREFIX_KEY         "RATM+ESP"
//* sample plugin MTQQ topic
#define ROBOTDYN_ATMEGA2560_ESP8266_MQTT_TOPIC          "gateway"
//* sample plugin MTQQ topic
#define ROBOTDYN_ATMEGA2560_ESP8266_MQTT_COMMAND_TOPIC  "command"
//* sample plugin REST uri
#define ROBOTDYN_ATMEGA2560_ESP8266_REST_URI            "rflink"
//* Sample plugin reporting interval (0 no reporting)
#define ROBOTDYN_ATMEGA2560_ESP8266_REPORT_EVERY       5
//* Sample plugin parameter values
#define ROBOTDYN_ATMEGA2560_ESP8266_PARAMETER_1        0

#define SERIAL_BUFFER_SIZE 128
//------------------------------------------------------------
//* Plugin public interface
//------------------------------------------------------------
//* declare the plugin setup function (used by custom.h)
void robotdyn_atmega2560_esp8266Setup();
//* get plugin enabled state
bool robotdyn_atmega2560_esp8266Enabled();

class StringTokenizer
{
  public:
    StringTokenizer(String str, String del);
    boolean hasNext();
    String nextToken();
  private:
    String _str;
	String _del;
	int ptr;
};

#endif
#endif
