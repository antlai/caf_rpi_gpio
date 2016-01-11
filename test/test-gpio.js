var hello = require('./hello/main.js');
var helloIoT = require('./hello/iot/main.js');
var caf_iot = require('caf_iot');
var caf_components = caf_iot.caf_components;
var cli = caf_iot.caf_cli;
var myUtils = caf_components.myUtils;
var async = caf_components.async;
var app = hello;
var appIoT = helloIoT;
var crypto = require('crypto');
var fs = require('fs');
var path = require('path');

process.on('uncaughtException', function (err) {
    console.log("Uncaught Exception: " + err);
    console.log(myUtils.errToPrettyStr(err));
    process.exit(1);
});

var CA_NAME = 'antonio-' + crypto.randomBytes(16).toString('hex');
process.env['MY_ID'] = CA_NAME;

var PIN_IN_1 = 8;
var PIN_OUT_1 = 9;
var PIN_OUT_2 = 10;

var MOCK_ROOT_DIR='/tmp/gpio';

var readMockInput = function(pin) {
    return parseInt(fs.readFileSync(path.resolve(MOCK_ROOT_DIR,'in',
                                                 'gpio'+pin)));
};

var writeMockInput = function(pin, value) {
    fs.writeFileSync(path.resolve(MOCK_ROOT_DIR,'in', 'gpio'+pin), '' + value);
};

var readMockOutput = function(pin) {
    return parseInt(fs.readFileSync(path.resolve(MOCK_ROOT_DIR,'out',
                                                 'gpio'+pin)));
};




module.exports = {
    setUp: function (cb) {
        var self = this;
        app.load(null, {name: 'top'}, 'framework.json', null,
                 function(err, $) {
                     if (err) {
                         console.log('setUP Error' + err);
                         console.log('setUP Error $' + $);
                         // ignore errors here, check in method
                         cb(null);
                     } else {
                         self.$ = $;
                         cb(err, $);
                     }
                 });
    },
    tearDown: function (cb) {
        var self = this;
        if (!this.$) {
            cb(null);
        } else {
            this.$.top.__ca_graceful_shutdown__(null, cb);
        }
    },

    hello: function(test) {
        test.expect(11);
        var s;
        async.series([
            function(cb) {
                s = new cli.Session('http://root-helloiot.vcap.me:3000',
                                    CA_NAME, {from: CA_NAME,
                                              log: function(x) {
                                                  console.log(x);
                                              }});
                s.onopen = function() {
                    var cb1 = function(err, data) {
                        test.ifError(err);
                        console.log('GOT: '+ JSON.stringify(data));
                        cb(err, data);
                    };
                    async.series([
                        function(cb2) {
                            // input, pullup
                            s.addPin(PIN_IN_1, true, true, cb2); 
                        },
                        function(cb2) {
                            s.watchPin(PIN_IN_1, 'pinWake', {triggerLow: false,
                                                             triggerHigh: true},
                                       cb2); 
                        },
                        function(cb2) {
                             // output, initial low
                            s.addPin(PIN_OUT_1, false, false, cb2);
                        },
                        function(cb2) {
                              // output, initial high
                            s.addPin(PIN_OUT_2, false, true, cb2);
                        },
                        function(cb2) {
                              // switch to low
                            s.out(PIN_OUT_2, false,  cb2);
                        }
                    ], cb1);
                };
                s.onerror = function(err) {
                    test.ifError(err);
                    console.log(err);
                };
            },
            function(cb) {
                var self = this;
                appIoT.load(null, {name: 'topIoT'}, null, null,
                 function(err, $) {
                     if (err) {
                         console.log('setUP Error' + err);
                         console.log('setUP Error $' + $);
                         // ignore errors here, check in method
                         cb(null);
                     } else {
                         self.$IoT = $;
                         cb(err, $);
                     }
                 });
            },
            function(cb) {
                setTimeout(function() {cb(null);}, 5000);
            },
            function(cb) {
                var self = this;
                s.getState(function(err, state) {
                    console.log(state);
                    var t = (new Date()).getTime();
                    test.equal(false, state.out[PIN_OUT_2]);
                    test.equal(0, readMockOutput(PIN_OUT_2));
                    test.equal(0, readMockOutput(PIN_OUT_1));
                    cb(err, state);
                });
            },
            function(cb) {
                var all = this.$IoT.topIoT.$.iot.$.handler.debugGetAll();
                test.equal(0, all.fromCloud.get('out')[PIN_OUT_2]);
                test.equal(0, Object.keys(all.state.wakeCounters).length);
                console.log(all);
                writeMockInput(PIN_IN_1, '1');
                cb(null);
            },
            function(cb) {
                setTimeout(function() {cb(null);}, 5000);
            },
            function(cb) {
                var all = this.$IoT.topIoT.$.iot.$.handler.debugGetAll();
                test.equal(1, all.toCloud.get('in')[PIN_IN_1]);
                test.equal(1, Object.keys(all.state.wakeCounters).length);
                test.equal(1, all.state.wakeCounters[PIN_IN_1]);
                console.log(all);
                cb(null);
            },            
            function(cb) {
                if (!this.$IoT) {
                    cb(null);
                } else {
                    this.$IoT.topIoT.__ca_graceful_shutdown__(null, cb);
                }
            },
            function(cb) {
                s.onclose = function(err) {
                    test.ifError(err);
                    cb(null);
                };
                s.close();
            }
        ], function(err, res) {
            test.ifError(err);
            test.done();
        });

    }
};
