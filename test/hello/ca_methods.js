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

"use strict";
var caf = require('caf_core');
var caf_comp = caf.caf_components;
var myUtils = caf_comp.myUtils;

exports.methods = {
    '__ca_init__' : function(cb) {
        this.state.out  = {};
        this.state.meta = {};
        this.state.in = {};
        this.state.trace__iot_sync__ = 'traceSync';
        cb(null);
    },
    'addPin' : function(pin, dir, options, cb) {
        var pinConf = {input : dir};
        if (typeof options === 'boolean') {
            if (dir) {
                pinConf.internalResistor = {pullUp : options};
            } else {
                 pinConf.initialState = {high : options};
            }
        }
        this.state.meta[pin] = pinConf;
        this.meta(this.state.meta, cb);
    },
    'removePin' : function(pin, cb) {
        delete this.state.meta[pin];
        delete this.state.out[pin];
        this.meta(this.state.meta, cb);
    },
    'watchPin' : function(pin, method, options, cb) {
        var watcher = {methodName: method};
        myUtils.mixin(watcher, options ||
                      {triggerLow: true, triggerHigh: true});
        this.state.meta[pin].watcher = watcher;
        this.meta(this.state.meta, cb);
    },
    'unwatchPin' : function(pin, cb) {
        delete this.state.meta[pin].watcher;
        this.meta(this.state.meta, cb);
    },
    'meta' : function(meta, cb) {
        var $$ = this.$.sharing.$;
        this.state.meta = meta;
        $$.fromCloud.set('meta', myUtils.deepClone(this.state.meta));
        this.getState(cb);
    },
    'out' : function(pin, value, cb) {
        var $$ = this.$.sharing.$;
        this.state.out[pin] = value;
        $$.fromCloud.set('out', myUtils.deepClone(this.state.out));
        this.getState(cb);
    },
    'getState' : function(cb) {
        cb(null, this.state);
    },
    'traceSync' : function(cb) {
        var $$ = this.$.sharing.$;
        this.state.in = $$.toCloud.get('in');
        cb(null);
    }   
};

