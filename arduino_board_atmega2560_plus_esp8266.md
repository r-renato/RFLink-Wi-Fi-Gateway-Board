<h1>Customized Arduino board ATmega2560+ESP8266 by <a href="https://robotdyn.com/mega-wifi-r3-atmega2560-esp8266-flash-32mb-usb-ttl-ch340g-micro-usb.html" target="_blank">robotdyn.com</a></h1>
<h4>MEGA+WiFi_R3ATmega2560+ESP8266, flash 32Mb, USB-TTL CH340G, Micro-USB</h4>

It is a customized version of the classic ARDUINO MEGA R3 board. Full integration of Atmel ATmega2560 microcontroller and ESP8266 Wi-Fi IC, with 32 Mb (megabits) of flash memory, and CH340G USB-TTL converter on a single board! All components can be set up to work together or independently.

Operating mode is selected by means of DIP switches on-board:

![Alt text](/md.images/board_operational_mode_dip_switchs.png?raw=true "ATmega2560+ESP8266 DIP Switchs")

Switch status and mode selection:

| Mode                                |  1  |  2  |  3  |  4  |  5  |  6  |  7  |   8   | RXD/TXD |
|-------------------------------------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:-----:|:-------:|
| USB <-> ESP8266 (upload sketch)     | --- | --- | --- | --- | ON  | ON  | ON  | NoUSE |    0    |
| USB <-> ESP8266 (connect)           | --- | --- | --- | --- | ON  | ON  | --- | NoUSE |    0    |
| USB <-> ATmega2560 (upload sketch)  | --- | --- | ON  | ON  | --- | --- | --- | NoUSE |    0    |
| USB <-> Mega2560 <-> ESP8266 (COM3) | ON  | ON  | ON  | ON  | --- | --- | --- | NoUSE |    0    |
| Mega2560 <-> ESP8266                | ON  | ON  | --- | --- | --- | --- | --- | NoUSE |    0    |
| All modules work independent        | --- | --- | --- | --- | --- | --- | --- | NoUSE |    0    |

Also, have switch for change of connecting port between ATmega2560 and ESP8266

![Alt text](/md.images/board_port_switch.png?raw=true "ATmega2560 <-> ESP8266 Port Switch")

After choosing the mode of the board can proceed to set up the IDE
It is important that when the ESP8266 module is programming, it is necessary to press the button “Mode”

![Alt text](/md.images/board_programming_button.png?raw=true "ATmega2560, ESP8266 programming button")
