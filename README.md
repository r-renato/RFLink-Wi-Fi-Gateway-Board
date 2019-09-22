



<h1>Build a RFLink Wi-Fi Gateway (Radio Frequency Link Board) <h6>using <i>"Nodo Shop RFLink (433 Mhz) board"</i> and <i>"RobotDyn MEGA+WiFi R3 ATmega2560+ESP8266"</i></h6></h1>

[![BuyMeCoffee][buymecoffeebadge]][buymecoffee]

<p align="justify">
The project can help you to build a RFLink Gateway useful to integrate RF devices in your preferred home automation system.

The project core component is the firmware by Stuntteam that allows sniffing and sending 433 MHz radio frequencies frames. The frames are organized according to specific IOT protocols. The RFLink firmware is developed to run on the Arduino Mega board and it uses the USB port to communicate, no other communication interface is available.

To expose the RFLink Gateway (Arduino board) through Wi-Fi rather than USB, we can use an ESP8266-01 module.  It is equipped with  a customized firmware based on the ESPurna that is adapted to interface the RFLink Gateway. To simplify this integration we will use a customized board containing both Arduino Mega and ESP8266. This board is produced by RobotDyn.com.
The customized firmware, based on ESPurna, will be used to expose the RFLink data through a web service.

In the following, the  use hardware and software are shown, as well as the steps to assemble the gateway.
</p>
<h2>Hardware</h2>
<p>The project is realized using the following hardware:</p>
<table>
<thead>
<tr>
<th align="left" valign="top"><a href="https://www.nodo-shop.nl/en/rflink-gateway/148-rflink-gateway-components.html" target="_blank">RFLink 433.92 MHz Gateway components</a><br>Components for building a RFlink Gateway: a 433 MHz Transceiver from Aurel, various type headers, SMA connector and a pcb.</th>
<th align="left" valign="top"><a href="https://www.nodo-shop.nl/en/antennes/12-antenne-sma-voor-nodo.html" target="_blank">Antenna SMA for 433 MHz</a><br>433 MHz antenna</th>
</tr>
</thead>
<tbody>
<tr>
<td align="center"><img src="/md.images/board_full.jpg"  width="40%" height="40%" margin="0" alt="RFLink 433.92 MHz Gateway components"></td>
<td align="center"><img src="/md.images/antenne.jpg"  width="40%" height="40%" alt="Antenna SMA for 433 MHz"></td>
</tr>
<tr>
<td colspan=2 align="left"><a href="https://robotdyn.com/mega-wifi-r3-atmega2560-esp8266-flash-32mb-usb-ttl-ch340g-micro-usb.html" target="_blank">MEGA+WiFi R3 ATmega2560+ESP8266, flash 32Mb, USB-TTL CH340G, Micro-USB</a><br>Customized version of the classic ARDUINO MEGA R3 board.</td>
</tr>
<tr>
<td colspan=2 align="center"><img src="/md.images/arduino_board_atmega2560_plus_esp8266_full.jpg"  width="40%" height="40%" alt="MEGA+WiFi R3 ATmega2560+ESP8266, flash 32Mb, USB-TTL CH340G, Micro-USB"></td>
</tr>
</tbody>
</table>

<h2>Software</h2>
<table>
<tbody>
<tr>
<td>
<ol>
<li>
    <a href="http://www.rflink.nl" target="_blank">RFLink Gateway</a>
    <br>RFLink Firmware for Arduino MEGA (Version R48 is used in this project)
</li>
<li>
    <a href="https://github.com/xoseperez/espurna/wiki" target="_blank">ESPurna Firmware for ESP8285/ESP8266</a>
    <br>ESPurna Firmware (Version 1.13.5 is used in this project)
    <br>NB <a href="https://platformio.org/install" target="_blank">Platformio</a> is recommended to build ESPurna customized firmware, for more details see the <a href="https://github.com/xoseperez/espurna/wiki/PlatformIO" target="_blank">ESPurna wiki page</a>
</li>
<li>
    NodeJs rflink bridge for Home Assistant
</li>
</ol>
</td>
</tr>
</tbody>
</table>


<h2>Instructions<h6>The following instruction explain how build your personal rflink Wi-Fi Gateway.</h6></h2>
<ol>
<li>
    <a href="http://www.rflink.nl/blog2/download" target="_blank">Download</a> the rflink firmware
</li>
<li>
    Unpack the zip file and get ready to burn it
</li>
<li>
    Set the MEGA+WiFi R3 ATmega2560+ESP8266 board dip switch to sketch upload mode. For details see the <a href="/arduino_board_atmega2560_plus_esp8266.md" target="_blank">full dip switch modes</a>.
    
    
| Mode                                |  1  |  2  |  3  |  4  |  5  |  6  |  7  |   8   | RXD/TXD |
|-------------------------------------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:-----:|:-------:|
| USB <-> ATmega2560 (upload sketch)  | --- | --- | ON  | ON  | --- | --- | --- | NoUSE |    0    |
</li>
<li>
Upload the rflink Gateway firmware using

```
avrdude -v -p atmega2560 -c stk500 -P /dev/cu.usbmodem411 -b 115200 -D -U flash:w:RFLink.cpp.hex:i -C avrdude.conf
```
On OSX with Arduino

```
/Applications/Arduino.app/Contents/Java/hardware/tools/avr/bin/avrdude -v -p atmega2560 -c stk500 -P /dev/cu.usbmodem411 -b 115200 -D -U flash:w:RFLink.cpp.hex:i -C /Applications/Arduino.app/Contents/Java/hardware/tools/avr/etc/avrdude.conf    
```
NB If necessary, replace /dev/cu.usbmodem411 with the USB port used to connect your device.        
</li>
<li>
Clone ESPurna repository using

```
git clone --branch 1.13.5 https://github.com/xoseperez/espurna.git
```
NB In this project I use ESPurna firmware 1.13.5        
</li>
<li>
    Customize the ESPurna firmware using the code located in the folder <strong>espurna_firmware_custom_code</strong>
    
* copy **custom.h** into the folder **code/espurna/config/**
* copy **robotdyn_atmega2560_esp8266.h** into the folder **code/espurna/libs/**
* copy **robotdyn_atmega2560_esp8266.ino** into the folder **code/espurna/**

* in the folder **code/** open the file **platformio.ini**, so put the following text under <strong>*GENERIC OTA ENVIRONMENTS*</strong> session
```
[env:generic-robotdyn-atmega2560-esp8266]
platform = ${common.platform}
framework = ${common.framework}
board = ${common.board_1m}
board_build.flash_mode = ${common.flash_mode}
lib_deps = ${common.lib_deps}
lib_ignore = ${common.lib_ignore}
build_flags = ${common.build_flags_1m0m} -DUSE_CUSTOM_H
monitor_speed = ${common.monitor_speed}
extra_scripts = ${common.extra_scripts}
```
</li>
<li>
    Go to in the folder **code/** and build the firmware using the command 

```
./build.sh generic-robotdyn-atmega2560-esp8266
```
NB Depending on your environment, the build process may be interrupted due to errors. In this cases,it is necessary to satisfy the missing dependencies and rerun the build.

After the successful build, you can found the customized firmware in the folder **firmware/espurna-1.13.5/**
</li>
<li>
    Set the MEGA+WiFi R3 ATmega2560+ESP8266 board dip switch to sketch upload mode
    
| Mode                                |  1  |  2  |  3  |  4  |  5  |  6  |  7  |   8   | RXD/TXD |
|-------------------------------------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:-----:|:-------:|
| USB <-> ESP8266 (upload sketch)     | --- | --- | --- | --- | ON  | ON  | ON  | NoUSE |    0    |
</li>
<li>
    Upload the ESPurna custom firmware using

```
esptool.py --port /dev/cu.wchusbserial1410 write_flash --flash_size 1MB --flash_mode dout 0x00000 espurna-1.13.6-dev-generic-robotdyn-atmega2560-esp8266.bin
```
</li>
<li>
    Set the MEGA+WiFi R3 ATmega2560+ESP8266 board dip switch to cooperation mode
    
| Mode                                |  1  |  2  |  3  |  4  |  5  |  6  |  7  |   8   | RXD/TXD |
|-------------------------------------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:-----:|:-------:|
| USB <-> Mega2560 <-> ESP8266 (COM3) | ON  | ON  | ON  | ON  | --- | --- | --- | NoUSE |    0    |

Change of connecting port between ATmega2560 and ESP8266 setting the switch to RXD0 <-> TXD0
</li>
<li>
    Connect the power adapter and configure the rflink gateway using the web interface; for more details see the <a href="https://github.com/xoseperez/espurna/wiki/Configuration">ESPurna wiki page</a>.
</li>
</ol>

<h2>Home Assistant integration (Optional, linux systems only)</h2>
<p align="justify">
Home Assistant is an open source home automation platform. If you use this platform and you want to interface the RFLink Wi-Fi Gateway then you must follow some simple steps.
</p>
<ol>
<li>
Copy the folder <strong>home_assistant_rflink_nodejs_bridge</strong> into your Home Assistant system
</li>
<li>
Add the following line:

```sh
@reboot <script full path>/espurna_rflink_bridge.sh >/dev/null 2>&1
*/5 * * * * source <user home>/.bashrc; <script full path>/espurna_rflink_bridge.sh >><user home>/espurna_rflink_bridge.log 2>&1
```
to crontab Home Assistant user by replacing <strong>&lt;script full path&gt;</strong> with the real full script path.
</li>
<li>
Configure the NodeJs bridge changing the file <strong>espurna_rflink_bridge.json</strong>

<h5>NodeJs bridge properties</h5>

| Attribute name | Default | Note                                |
|----------------|---------|-------------------------------------|
| port           | 7373    | Bridge local port                   |
| polling_mills  | 60000   | RFLink Gateway polling time         |
| reset_minute   | 480     | RFLink Gateway restart command time |

<h5>NodeJs RFLink properties for HTTP protocol</h5>

| Attribute name | Default     | Note                                      |
|----------------|-------------|-------------------------------------------|
| protocol       | http        | ESPurna support for http                  |
| host           |             | RFLink device host name or IP Address     |
| port           | 80          | RFLink device web service port            |
| uri            | /api/rflink | Not change, RFLink device web service uri |
| apikey         |             | RFLink device web service api key         |

JSON Examples:
```json
{
  "rflink" : {
    "protocol" : "http",
    "host" : "192.168.1.77",
    "port" : "80",
    "options" : {
      "uri": "/api/rflink",
      "apikey": "7EE7A415EB877244"
    }
  },

  "bridge" : {
    "port" : "7373",
    "polling_mills" : 60000,
    "reset_minute" : 480
  }
}
```

<h5>NodeJs RFLink properties for MQTT protocol</h5>

Before use MQTT bridge you must install support library using `npm install mqtt -g`, so add to your user .bashrc `export NODE_PATH=$(npm root -g)`.

| Attribute name | Default     | Note                                                                  |
|----------------|-------------|-----------------------------------------------------------------------|
| protocol       | mqtt        | ESPurna support for mqtt                                              |
| host           |             | MQTT server host                                                      |
| port           | 1883        | MQTT service port                                                     |
| username       |             | MQTT credential                                                       |
| password       |             | MQTT credential                                                       |
| clientId       |             | MQTT client ID                                                        |
| clean          |             | MQTT true, set to false to receive QoS 1 and 2 messages while offline |
| qos            |             | MQTT QoS                                                              |
| topic          |             | MQTT the topic to publish                                             |

JSON Examples:

```json
{
  "rflink" : {
    "protocol" : "mqtt",
    "host" : "localhost",
    "port" : "1883",
    "options" : {
      "username" : "rflinkserialbridge",
      "password" : "password",
      "clientId" : "rflinkserialbridge",
      "clean" : "true",
      "qos": 2,
      "topic": "rflinkgateway"
    }
  },

  "bridge" : {
    "port" : "7373",
    "polling_mills" : 60000,
    "reset_minute" : 480
  }
}
```
</li>
<li>

Configure the Home Assistant RFLink component

```
rflink:
  host: localhost
  port: 7373
  wait_for_ack: false
  reconnect_interval: 60
```
</li>
</ol>



[buymecoffee]: https://www.buymeacoffee.com/0D3WbkKrn
[buymecoffeebadge]: https://img.shields.io/badge/buy%20me%20a%20coffee-donate-yellow.svg?style=for-the-badge
