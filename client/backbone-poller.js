/*
 (c) 2012 Uzi Kilon, Splunk Inc.
 Backbone Poller 0.2.2
 https://github.com/uzikilon/backbone-poller
 Backbone Poller may be freely distributed under the MIT license.
 */
/*jshint maxstatements:10 */
/*global define:false*/
(function (root, factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['underscore', 'backbone'], function (_, Backbone) {
            // Use global variables if the locals are undefined.
            return factory(_ || root._, Backbone || root.Backbone);
        });
    }
    else {
        // RequireJS isn't being used.
        // Assume underscore and backbone are loaded in <script> tags
        root.Backbone.Poller = factory(root._, root.Backbone);
    }
}(this, function (_, Backbone) {

    'use strict';

    // Default settings
    var defaults = {
        delay: 1000,
        condition: function () {
            return true;
        }
    };

    // Available events
    var events = ['start', 'stop', 'fetch', 'success', 'error', 'complete' ];

    var pollers = [];
    function findPoller(model){
        return _.find(pollers, function(poller){
            return poller.model === model;
        });
    }

    var PollingManager = {

        // **Backbone.Poller.get(model[, options])**
        // <pre>
        // Retuns a singleton instance of a poller for a model
        // Stops it if running
        // If options.autostart is true, will start it
        // Retuns a poller isntance
        // </pre>
        /*jshint maxcomplexity:3 */
        get: function(model, options) {
            var poller = findPoller(model);
            if( ! poller ) {
                poller = new Poller(model, options);
                pollers.push(poller);
            }
            else {
                poller.set(options);
            }
            if( options && options.autostart === true ) {
                poller.start({silent: true});
            }
            return poller;
        },

        // **Backbone.Poller.getPoller()**
        // <pre>
        // Deprecated: Use Backbone.Poller.get()
        // </pre>
        getPoller: function() {
            if ( window.console ) {
                window.console.warn('getPoller() is depreacted, Use Backbone.Poller.get()');
            }
            return this.get.apply(this, arguments);
        },

        // **Backbone.Poller.size()**
        // <pre>
        // Returns the number of instanciated pollers
        // </pre>
        size: function(){
            return pollers.length;
        },

        // **Backbone.Poller.reset()**
        // <pre>
        // Stops all pollers and removes from the pollers pool
        // </pre>
        reset: function(){
            while( pollers.length ) {
                pollers.pop().stop();
            }
        }
    };

    function Poller(model, options) {
        this.model = model;
        this.set(options);
    }

    _.extend(Poller.prototype, Backbone.Events, {

        // **poller.set([options])**
        // <pre>
        // Reset poller options and stops the poller
        // </pre>
        set: function(options) {
            this.off();
            this.options = _.extend({}, defaults, options || {});
            _.each(events, function(name){
                var callback = this.options[name];
                if ( _.isFunction(callback) ) {
                    this.on(name, callback, this);
                }
            }, this);

            if ( this.model instanceof Backbone.Model ) {
                this.model.on('destroy', this.stop, this);
            }

            return this.stop({silent: true});
        },
        //
        // **poller.start([options])**
        // <pre>
        // Start the poller
        // Returns a poller instance
        // Triggers a 'start' events unless options.silent is set to true
        // </pre>
        start: function(options) {
            if( ! this.active() ) {
                options = options || {};
                if( !options.silent ) {
                    this.trigger('start', this.model);
                }
                this.options.active = true;
                run(this);
            }
            return this;
        },
        // **poller.stop([options])**
        // <pre>
        // Stops the poller
        // Returns a poller instance
        // Triggers a 'stop' events unless options.silent is set to true
        // </pre>
        stop: function(options){
            options = options || {};
            if( !options.silent ) {
                this.trigger('stop', this.model);
            }
            this.options.active = false;
            if ( this.xhr && _.isFunction(this.xhr.abort) ){
                this.xhr.abort();
            }
            this.xhr = null;
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
            return this;
        },
        // **poller.active()**
        // <pre>
        // Retunrs a bollean for poller status
        // </pre>
        active: function(){
            return this.options.active === true;
        }
    });

    function run(poller) {
        if ( poller.active() !== true ) {
            poller.stop({silent: true});
            return ;
        }
        var options = _.extend({ data: poller.options.data }, {
            success: function() {
                poller.trigger('success', poller.model);
                if( poller.options.condition(poller.model) !== true ) {
                    poller.stop({silent: true});
                    poller.trigger('complete', poller.model);
                }
                else {
                    poller.timeoutId = _.delay(run, poller.options.delay, poller);
                }
            },
            error: function(){
                poller.stop({silent: true});
                poller.trigger('error', poller.model);
            }
        });
        poller.trigger('fetch', poller.model);
        poller.xhr = poller.model.fetch(options);
    }

    return PollingManager;

}));