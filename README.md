# Caf.js

Co-design permanent, active, stateful, reliable cloud proxies with your web app or gadget.

See https://www.cafjs.com

## Raspberry Pi Library for Accessing GPIO Pins
[![Build Status](https://travis-ci.org/cafjs/caf_rpi_gpio.svg?branch=master)](https://travis-ci.org/cafjs/caf_rpi_gpio)

This library provides access to GPIO pins in a Raspberry Pi. It runs in the device not in the cloud.

## API

See {@link module:caf_rpi_gpio/proxy_iot_gpio}

## Configuration Example

### iot.json

See {@link module:caf_rpi_gpio/plug_iot_gpio}
```
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
```
