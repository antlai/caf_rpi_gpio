# CAF (Cloud Assistant Framework)

Co-design permanent, active, stateful, reliable cloud proxies with your web app or gadget.

See http://www.cafjs.com 

## CAF RPI GPIO
[![Build Status](http://ci.cafjs.com/api/badges/cafjs/caf_rpi_gpio/status.svg)](http://ci.cafjs.com/cafjs/caf_rpi_gpio)

This library provides access to GPIO pins in a Raspberry Pi. It runs in the device not in the cloud.

## API

    lib/proxy_iot_gpio.js
 
## Configuration Example

### iot.json

    {
            "module": "caf_rpi_gpio#plug_iot",
            "name": "gpio",
            "description": "Access to GPIO pins for this device.",
            "env" : {
                "maxRetries" : "$._.env.maxRetries",
                "retryDelay" : "$._.env.retryDelay",
                "gpiomem" : "process.env.GPIO_MEM||true",
                "mapping" : "process.env.MAPPING||physical",
                "allowMock" : "process.env.ALLOW_MOCK||true",
                "mockRootDir" : "process.env.MOCK_ROOT_DIR||/tmp/gpio"
            },
            "components" : [
                {
                    "module": "caf_rpi_gpio#proxy_iot",
                    "name": "proxy",
                    "description": "Proxy to access GPIO pins",
                    "env" : {
                    }
                }
            ]
    }

where `gpiomem` enables non-privileged access to GPIO pins for recent Linux kernels, and `mapping` refers to the pin numbering scheme being `physical` (P01-P40 header layout)  or `gpio` (Broadcomm GPIOxx naming). See https://github.com/jperkin/node-rpio for details.

`allowMock` ensures that your program can run on non-RPi devices by simulating GPIO pins with files on a temp directory. `mockRootDir` is the default root directory for these files.
