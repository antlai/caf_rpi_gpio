/*!
Copyright 2013 Hewlett-Packard Development Company, L.P.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

'use strict';

/**
 * Manage GPIO pins of a Raspberry PI.
 *
 * Properties:
 *
 *      {gpiomem: true, mapping: string, allowMock: boolean,
 *       mockRootDir: string}
 *
 * where:
 *
 * * `gpiomem`: enables non-privileged access to GPIO pins for recent Linux
 *  kernels.
 * * `mapping`:  refers to the pin numbering scheme being `physical`
 * (P01-P40 header layout) or `gpio` (Broadcomm GPIOxx naming). See
 * https://github.com/jperkin/node-rpio for details.
 * * `allowMock`: enables simulating GPIO pins with files on a temp directory.
 * * `mockRootDir`: default root directory for these files.
 *
 * @module caf_rpi_gpio/plug_iot_gpio
 * @augments external:caf_iot/gen_plug_iot
 *
 */
const assert = require('assert');
const caf_iot = require('caf_iot');
const caf_comp = caf_iot.caf_components;
const myUtils = caf_comp.myUtils;
const genPlugIoT = caf_iot.gen_plug_iot;

var rpio = null;
var disableWithError = null;
try {
    rpio = require('rpio');
} catch (ex) {
    // not running on RPi
    disableWithError = ex;
    rpio = require('./mock_gpio');
}

const NEVER_CALLED = -1;

exports.newInstance = async function($, spec) {
    try {
        /* The type `pinConfig` is
         *     { <pinNumber:string> : {
         *           input: boolean,
         *           initialState: {high: boolean}=,
         *           internalResistor: {pullUp: boolean}=,
         *           watcher: caf.watcherConfig=
         *        }
         *     }
         *  and `caf.watcherConfig`:
         *   {
         *     triggerLow: boolean,
         *     triggerHigh: boolean,
         *     methodName: string,
         *     debounceMsec: number=
         *   }
         */
        let pinConfig = {};

        const that = genPlugIoT.create($, spec);

        $._.$.log && $._.$.log.debug('New GPIO plug');

        assert.equal(typeof spec.env.gpiomem, 'boolean',
                     "'spec.env.gpiomem' not a boolean");

        assert.equal(typeof spec.env.mapping, 'string',
                     "'spec.env.mapping' not a string");

        assert.equal(typeof spec.env.allowMock, 'boolean',
                     "'spec.env.allowMock' not a boolean");

        assert.equal(typeof spec.env.mockRootDir, 'string',
                     "'spec.env.mockRootDir' not a string");

        if (disableWithError && spec.env.allowMock) {
            $._.$.log && $._.$.log.warn('Cannot load rpio, using a MOCK!');
        }

        const checkDisable = function() {
            if (disableWithError && !spec.env.allowMock) {
                throw disableWithError;
            }
        };

        /*
         * Gets pin configuration.
         */
        that.__iot_getPinConfig__ = function() {
            return myUtils.deepClone(pinConfig);
        };


        const openPin = function(pin, conf) {
            const resistor = function(conf) {
                assert(typeof conf.pullUp, 'boolean');
                return (conf.pullUp ? rpio.PULL_UP : rpio.PULL_DOWN);
            };

            const gpioState = function(conf) {
                assert(typeof conf.high, 'boolean');
                return (conf.high ? rpio.HIGH : rpio.LOW);
            };

            pin = parseInt(pin);
            assert(typeof conf.input, 'boolean');
            if (conf.input) {
                if (conf.internalResistor) {
                    rpio.open(pin, rpio.INPUT, resistor(conf.internalResistor));
                } else {
                    rpio.open(pin, rpio.INPUT);
                }
            } else {
                if (conf.initialState) {
                    rpio.open(pin, rpio.OUTPUT, gpioState(conf.initialState));
                } else {
                    rpio.open(pin, rpio.OUTPUT);
                }
            }
        };

        const closePin = function(pin) {
            pin = parseInt(pin);
            rpio.close(pin);
            unwatchPin(pin);
        };

        const boolToPin = function(val) {
            assert(typeof val, 'boolean');
            return (val ? rpio.HIGH : rpio.LOW);
        };

        const pinToBool = function(val) {
            assert(typeof val, 'number');
            if (val === rpio.HIGH) {
                return true;
            } else if (val === rpio.LOW) {
                return false;
            } else {
                throw new Error('Invalid pin value :' + val);
            }
        };

        const readPin = function(pin) {
            pin = parseInt(pin);
            return pinToBool(rpio.read(pin));
        };

        const writePin = function(pin, value) {
            pin = parseInt(pin);
            rpio.write(pin, boolToPin(value));
        };

        const unwatchPin = function(pin) {
            pin = parseInt(pin);
            try {
                rpio.poll(pin, null);
            } catch (ex) {
                // make idempotent
            }
        };

        const watchPin = function(pin, config) {
            pin = parseInt(pin);
            var lastCall = NEVER_CALLED;
            const newF = function(pinNum) {
                const now = (new Date()).getTime();

                if (pin !== pinNum) {
                    throw new Error('Pin not matching:' + pin + ' vs ' +
                                    pinNum);
                }
                if ((lastCall === NEVER_CALLED) ||
                    (typeof config.debounceMsec !== 'number') ||
                    (now - lastCall > config.debounceMsec)) {
                    lastCall = now;
                    const args = [pin, readPin(pin)];
                    $._.$.queue.process(config.methodName, args);
                } else {
                    $._.$.log && $._.$.log.trace('Debouncing input ' + pin);
                }
            };

            var dir = null;
            if (config.triggerLow && config.triggerHigh) {
                dir = rpio.POLL_BOTH;
            } else if (config.triggerLow) {
                dir = rpio.POLL_LOW;
            } else if (config.triggerHigh) {
                dir = rpio.POLL_HIGH;
            } else {
                throw new Error('Invalid watcher ' + JSON.stringify(config));
            }

            unwatchPin(pin); // make idempotent
            rpio.poll(pin, newF, dir);
        };

        /*
         * Sets new pin configuration.
         */
        that.__iot_setPinConfig__ = function(newConfig) {
            checkDisable();
            const hasWatcherChanged = function(oldW, newW) {
                return !myUtils.deepEqual(oldW, newW);
            };

            // freshly exported  pins
            Object.keys(newConfig).forEach(function(x) {
                const conf = newConfig[x];
                if (!pinConfig[x] || (pinConfig[x].input !== conf.input)) {
                    openPin(x, conf);
                }
                if (hasWatcherChanged((pinConfig[x] && pinConfig[x].watcher)
                                      || null, conf.watcher || null)) {
                    if (conf.watcher) {
                        watchPin(x, conf.watcher);
                    } else if (pinConfig[x] && pinConfig[x].watcher) {
                        unwatchPin(x);
                    }
                }
            });

            // unexported pins
            Object.keys(pinConfig).forEach(function(x) {
                if (!newConfig[x]) {
                    closePin(x);
                }
            });

            pinConfig = myUtils.deepClone(newConfig);
        };

        that.__iot_readAll__ = function() {
            checkDisable();
            const results = {};
            Object.keys(pinConfig).filter(function(x) {
                const val = pinConfig[x];
                return val.input;
            }).forEach(function(x) {
                results[x] = readPin(x);
            });
            return results;
        };

        that.__iot_writeMany__ = function(newValues) {
            checkDisable();
            Object.keys(newValues).forEach(function(x) {
                const value = pinConfig[x];
                if (value && !value.input) {
                    writePin(x, newValues[x]);
                } else {
                    const err = new Error('Cannot write to pin ' + x);
                    err.newValues = newValues;
                    throw err;
                }
            });
        };

        that.__iot_setWatcher__ = function(pin, watcherConfig) {
            if (pinConfig[pin]) {
                const newConfig = that.__iot_getPinConfig__();
                newConfig[pin].watcher = myUtils.deepClone(watcherConfig);
                that.__iot_setPinConfig__(newConfig);
            } else {
                throw new Error('Pin not exported:' + pin);
            }
        };

        that.__iot_unsetWatcher__ = function(pin) {
            if (pinConfig[pin]) {
                const newConfig = that.__iot_getPinConfig__();
                delete newConfig[pin].watcher;
                that.__iot_setPinConfig__(newConfig);
            }
        };

        const initF = function() {
            rpio.init({
                gpiomem: spec.env.gpiomem,
                mapping: spec.env.mapping,
                mockRootDir: spec.env.mockRootDir
            });
        };

        rpio.on && rpio.on('warn', function(ev) {
            $._.$.log && $._.$.log.warn('No rpio, using a MOCK!');
            rpio.removeAllListeners('warn');
            disableWithError = new Error(ev);
            rpio = require('./mock_gpio');
            initF();
        });

        initF();

        return [null, that];
    } catch (err) {
        return [err];
    }
};
