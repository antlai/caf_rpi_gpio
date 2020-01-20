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
 * A proxy to read/write GPIO ports in a Raspberry PI.
 *
 * @module caf_rpi_gpio/proxy_iot_gpio
 * @augments external:caf_components/gen_proxy
 *
 */
var caf_iot = require('caf_iot');
var caf_comp = caf_iot.caf_components;
var genProxy = caf_comp.gen_proxy;

exports.newInstance = function($, spec, cb) {

    var that = genProxy.create($, spec);

    /**
     * Gets the configuration of active GPIO pins.
     *
     * The type `caf.pinConfig` is:
     *
     *     { pinNumber : {
     *           input: boolean,
     *           initialState: {high: boolean}=,
     *           internalResistor: {pullUp: boolean}=,
     *           watcher: caf.watcherConfig=
     *        }
     *     }
     *
     * where pin numbers use physical layout by default, and `initialState` only
     * applies if `input` is false.
     *
     * Missing pins have a default configuration of (input, no resistor).
     *
     * `caf.watcherConfig` described in `setWatcher`
     *
     * @see  module:caf_rpi_gpio/proxy_iot_gpio#setWatcher
     *
     * @return {caf.pinConfig} The configuration of active pins.
     *
     * @memberof! module:caf_rpi_gpio/proxy_iot_gpio#
     * @alias getPinConfig
     */
    that.getPinConfig = function() {
        return $._.__iot_getPinConfig__();
    };

    /**
     * Sets a new pin configuration.
     *
     * Pins that were already set in the desired input/output mode are not
     * reset, i.e., `initialState`  or `internalResistor` fields are ignored.
     *
     * If reset is needed, call `setPinConfig` twice:
     *
     *  * First call with the pins to reset deleted, which are then given a
     *  default configuration (input, no resistor)
     *  * Second call with the desired config.
     *
     * @param {caf.pinConfig} config A new pin configuration.
     *
     * @memberof! module:caf_rpi_gpio/proxy_iot_gpio#
     * @alias setPinConfig
     */
    that.setPinConfig = function(config) {
        $._.__iot_setPinConfig__(config);
    };

    /**
     * Writes values for the given pins configured as outputs.
     *
     * @param {Object<pin, boolean>} newValues New values for output
     * pins.
     *
     * @throws Error If pin not in `OUTPUT` mode or not configured.
     *
     * @memberof! module:caf_rpi_gpio/proxy_iot_gpio#
     * @alias writeMany
     */
    that.writeMany = function(newValues) {
        $._.__iot_writeMany__(newValues);
    };

    /**
     * Reads the value of all the pins configured as inputs.
     *
     * @return {Object<pin, boolean>} Values of input pins. `True` is
     * `HIGH`, `false` is `LOW`, and pin numbers use physical layout by default.
     *
     * @memberof! module:caf_rpi_gpio/proxy_iot_gpio#
     * @alias readAll
     */
    that.readAll = function() {
        return $._.__iot_readAll__();
    };

    /**
     * Sets a watcher that will invoke a method when a particular pin
     * changes state.
     *
     * It replaces a previous watcher for that pin (if different setup).
     *
     *  The type `caf.watcherConfig` is:
     *
     *      { triggerLow: boolean, triggerHigh: boolean, methodName: string,
     *        debounceMsec: number=}
     *
     * where:
     *
     * * `triggerLow`: True if transitions to LOW state
     * should activate the watcher.
     *
     * * `triggerHigh`: True if transitions to HIGH state
     * should activate the watcher.
     *
     * * `methodName`: The name of the method used for
     * notifications. It should have a signature of the form
     * `function(pin:number, newValue: boolean, cb:caf.cb)` and call `cb`
     * after finish processing.
     *
     * * `debounceMsec`: Time interval after a notification in
     * which any other notification for that pin gets ignored.
     *
     * @param {number} pin A pin number to be watched (physical layout by
     * default).
     * @param {caf.watcherConfig} watcherConfig Configuration for the new
     * watcher.
     *
     * @throws Error if pin not exported.
     *
     * @memberof! module:caf_rpi_gpio/proxy_iot_gpio#
     * @alias setWatcher
     */
    that.setWatcher = function(pin, watcherConfig) {
        $._.__iot_setWatcher__(pin, watcherConfig);
    };

    /**
     * Unsets a watcher that will invoke a method when a particular pin
     * changes state.
     *
     * It does nothing if there was no watcher, or pin was not exported.
     *
     * @param {number} pin A pin number to be unwatched (physical
     * layout by default).
     *
     * @memberof! module:caf_rpi_gpio/proxy_iot_gpio#
     * @alias unsetWatcher
     */
    that.unsetWatcher = function(pin) {
        $._.__iot_unsetWatcher__(pin);
    };


    Object.freeze(that);
    cb(null, that);
};
