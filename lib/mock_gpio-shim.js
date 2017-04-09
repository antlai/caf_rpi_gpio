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
var assert = require('assert');

/*
 * Constants.
 */
var LOW = exports.LOW = 0x0;
var HIGH = exports.HIGH = 0x1;
var INPUT = exports.INPUT = 0x0;
var OUTPUT = exports.OUTPUT = 0x1;
exports.PWM = 0x2;
exports.PULL_OFF = 0x0;
var PULL_DOWN = exports.PULL_DOWN = 0x1;
var PULL_UP = exports.PULL_UP = 0x2;
exports.POLL_LOW = 0x1;	/* Falling edge detect */
exports.POLL_HIGH = 0x2;	/* Rising edge detect */
exports.POLL_BOTH = 0x3;	/* POLL_LOW | POLL_HIGH */


var pins = {};

var pinsConfig = {};

/**
 * Mocks GPIO pins of a Raspberry PI in the browser.
 *
 *
 * @module caf_rpi_gpio/mock_gpio-shim
 *
 */

var dumpAll = function() {
    /* eslint-disable */
    console.log('----- PINS START -----');
    console.log(JSON.stringify(pins));
    console.log(JSON.stringify(pinsConfig));
    console.log('----- PINS END -----');
    /* eslint-enable */
};

exports.init = function() {
    pins = {};
    pinsConfig = {};
};


exports.open = function(pin, dir, options) {
    assert((dir === INPUT) || (dir === OUTPUT));
    close(pin);
    var pinConfig;
    if (dir === INPUT) {
        pinConfig = {
            input: true
        };
        if (options === PULL_UP) {
            pinConfig.internalResistor = { pullUp: true};
        }
        if (options === PULL_DOWN) {
            pinConfig.internalResistor = { pullUp: false};
        }
        pins[pin] = HIGH;
    } else {
        pinConfig = {
            input: false
        };
        if (options === HIGH) {
            pinConfig.initialState = { high: true};
        }
        if (options === LOW) {
            pinConfig.initialState = { high: false};
        }
    }
    pinsConfig[pin] = pinConfig;
    dumpAll();
};

exports.poll = function() {
    dumpAll();
};

exports.read = function(pin) {
    return pins[pin];
};

exports.write = function(pin, value) {
    assert((value === HIGH) || (value === LOW));
    pins[pin] = value;
    dumpAll();
};

var close = exports.close = function(pin) {
    delete pins[pin];
    delete pinsConfig[pin];
    dumpAll();
};

exports.closeAll = function() {
    Object.keys(pins).forEach(close);
};
