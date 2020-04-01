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

"use strict";


exports.methods = {
    '__iot_setup__' : function(cb) {
        this.state.wakeCounters = {};
        cb(null);
    },

    '__iot_loop__' : function(cb) {
        var now = (new Date()).getTime();
        this.$.log && this.$.log.debug(now + ' loop:');
        this.$.gpio.setPinConfig(this.fromCloud.get('meta'));
        this.$.gpio.writeMany(this.fromCloud.get('out'));
        this.toCloud.set('in', this.$.gpio.readAll());
        cb(null);
    },

    'pinWake' : function(pin, value, cb) {
        var now = (new Date()).getTime();
        var current = this.state.wakeCounters[pin] || 0;
        this.state.wakeCounters[pin] = current + 1;
        this.$.log && this.$.log.debug(now + ' wakeup pin:' + pin + ' value:' +
                                       value);
        cb(null);
    },

    //backdoor for testing
    'debugGetAll' : function() {
        return { state: this.state, toCloud: this.toCloud,
                 fromCloud: this.fromCloud };
    }
};

