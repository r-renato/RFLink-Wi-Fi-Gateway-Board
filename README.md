<h1>Build a RFLink Wi-Fi Gateway (Radio Frequency Link Board) <h6>using <i>"Nodo Shop RFLink (433 Mhz) board"</i> and <i>"RobotDyn MEGA+WiFi R3 ATmega2560+ESP8266"</i></h6></h1>

<p align="justify">
The project can help you to build a RFLink Gateway useful to integrate RF devices in your preferred home automation system.

The project core component is the firmware by Stuntteam that permit to sniffing and sending 433 MHz radio frequencies frames, frames organized in accord to specific IOT protocols. The RFLink firmware, developed to be running on the Arduino Mega board, use the platform USB port to communicate, no other communication interfaces are available.

To expose the RFLink Gateway (Arduino board) through Wi-Fi instead of USB, we can use a ESP8266-01 module with installed a customized firmware based on the ESPurna, but adapted to interface the RFLink Gateway. To simplify this integration we will use a customized board containing both Arduino Mega and ESP8266. This board is produced by <a href="https://robotdyn.com">RobotDyn.com</a>.
The customized firmware, based on ESPurna, will be use to expose the RFLink data through one service web. 

In the following are shown the hardware and software used, as well as the steps to assemble the gateway.
</p>
<h2>Hardware</h2>
<p>The project is realized using the following hardware:</p>
<table>
<thead>
<tr>
<th align="left" valign="top"><a href="https://www.nodo-shop.nl/en/rflink-gateway/148-rflink-gateway-components.html" target="_blank">RFLink 433.92 MHz Gateway components</a><br>The components for building a RFlink Gateway (consisting of a 433 MHz Transceiver from Aurel, various type headers, SMA connector and a pcb)</th>
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
    <br>NB Is recommended use <a href="https://platformio.org/install" target="_blank">Platformio</a> to build ESPurna customized firmware, for more details see the <a href="https://github.com/xoseperez/espurna/wiki/PlatformIO" target="_blank">ESPurna wiki page</a>
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
NB Depending on your environment, the build process may be interrupted due to errors. In this cases is enough satisfy the missing dependencies and rerun the build.

At the successful build end you can found the customized firmware in the folder **firmware/espurna-1.13.5/**
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
</li
</ol>

<h2>Home Assistant integration (Optional)</h2>








