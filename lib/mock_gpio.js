// Modifications copyright 2020 Caf.js Labs and contributors
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
const assert = require('assert');
const mkdirp = require('mkdirp');
const rimraf = require('rimraf');
const path = require('path');
const fs = require('fs');

/*
 * Constants.
 */
const LOW = exports.LOW = 0x0;
const HIGH = exports.HIGH = 0x1;
const INPUT = exports.INPUT = 0x0;
const OUTPUT = exports.OUTPUT = 0x1;
exports.PWM = 0x2;
exports.PULL_OFF = 0x0;
const PULL_DOWN = exports.PULL_DOWN = 0x1;
const PULL_UP = exports.PULL_UP = 0x2;
const POLL_LOW = exports.POLL_LOW = 0x1;	/* Falling edge detect */
const POLL_HIGH = exports.POLL_HIGH = 0x2;	/* Rising edge detect */
const POLL_BOTH = exports.POLL_BOTH = 0x3;	/* POLL_LOW | POLL_HIGH */


const TMP_GPIO_DIR = '/tmp/gpio';

var rootDir = TMP_GPIO_DIR;
const pins = {};

/**
 * Mocks GPIO pins of a Raspberry PI.
 *
 * It uses two directories:
 *
 *     /tmp/gpio/in    //pins that are exported as inputs
 *     /tmp/gpio/out   //pins written by the app
 *
 * and a JSON file with the current config:
 *
 *     /tmp/gpio/meta.json
 *
 * Files use names `gpio<pin#>`, i.e., `gpio3`, and contain `1` or `0`.
 *
 *   An external app can just write files in `/tmp/gpio/in`  to trigger poll
 * actions.
 *
 * @module caf_rpi_gpio/mock_gpio
 *
 */

const dumpMeta = function() {
    fs.writeFileSync(path.resolve(rootDir, 'meta.json'),
                     JSON.stringify(pins, null, 2));
};

exports.init = function(options) {
    if (options) {
        rootDir = (options.mockRootDir ? options.mockRootDir : rootDir);
    }
    rimraf.sync(rootDir);
    mkdirp.sync(path.resolve(rootDir, 'in'));
    mkdirp.sync(path.resolve(rootDir, 'out'));
    dumpMeta();
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
        fs.writeFileSync(path.resolve(rootDir, 'in', 'gpio'+pin), '0');
    } else {
        pinConfig = {
            input: false
        };
        var value = '0';
        if (options === HIGH) {
            pinConfig.initialState = { high: true};
            value = '1';
        }
        if (options === LOW) {
            pinConfig.initialState = { high: false};
            value = '0';
        }
        fs.writeFileSync(path.resolve(rootDir, 'out', 'gpio'+pin), value);
    }
    pins[pin] = pinConfig;
    dumpMeta();
};

exports.poll = function(pin, callback, trigger) {
    trigger = trigger || POLL_BOTH;
    if (callback === null) {
        pins[pin] && delete pins[pin].watcher;
        fs.unwatchFile(path.resolve(rootDir, 'in', 'gpio'+pin));
    } else {
        var lastValue = null;
        const f = function(curr, prev) {
            if (curr.mtime !== prev.mtime) {
                const current = read(pin);
                if (lastValue !== current) {
                    if ((current === HIGH) && ((trigger === POLL_HIGH) ||
                                                (trigger === POLL_BOTH))) {
                        callback(pin);
                    }
                    if ((current === LOW) && ((trigger === POLL_LOW) ||
                                               (trigger === POLL_BOTH))) {
                        callback(pin);
                    }
                    lastValue = current;
                }
            }
        };
        fs.watchFile(path.resolve(rootDir, 'in', 'gpio'+pin), {
            persistent: false,
            interval: 100
        }, f);
        pins[pin].watcher = {trigger: trigger};
    }
    dumpMeta();
};

const read = exports.read = function(pin) {
    return parseInt(fs.readFileSync(path.resolve(rootDir, 'in', 'gpio'+pin)));
};

exports.write = function(pin, value) {
    assert((value === HIGH) || (value === LOW));
    const valStr = (value === HIGH ? '1' : '0');
    fs.writeFileSync(path.resolve(rootDir, 'out', 'gpio'+pin), valStr);
};

const close = exports.close = function(pin) {
    fs.unwatchFile(path.resolve(rootDir, 'in', 'gpio'+pin));
    rimraf.sync(path.resolve(rootDir, 'in', 'gpio'+pin));
    rimraf.sync(path.resolve(rootDir, 'out', 'gpio'+pin));
    delete pins[pin];
    dumpMeta();
};

exports.closeAll = function() {
    Object.keys(pins).forEach(close);
};
