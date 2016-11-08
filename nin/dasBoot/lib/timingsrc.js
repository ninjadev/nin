(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        //Allow using this built library as an AMD module
        //in another project. That other project will only
        //see this AMD call, not the internal modules in
        //the closure below.
        define([], factory);
    } else {
        //Browser globals case. Just assign the
        //result to a property on the global.
        root.TIMINGSRC = factory();
    }
}(this, function () {
    //almond, and your modules will be inlined here
    /**
 * @license almond 0.3.1 Copyright (c) 2011-2014, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice,
        jsSuffixRegExp = /\.js$/;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap, lastIndex,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                name = name.split('/');
                lastIndex = name.length - 1;

                // Node .js allowance:
                if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                    name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
                }

                //Lop off the last part of baseParts, so that . matches the
                //"directory" and not name of the baseName's module. For instance,
                //baseName of "one/two/three", maps to "one/two/three.js", but we
                //want the directory, "one/two" for this normalization.
                name = baseParts.slice(0, baseParts.length - 1).concat(name);

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            var args = aps.call(arguments, 0);

            //If first arg is not require('string'), and there is only
            //one arg, it is the array form without a callback. Insert
            //a null so that the following concat is correct.
            if (typeof args[0] !== 'string' && args.length === 1) {
                args.push(null);
            }
            return req.apply(undef, args.concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            callbackType = typeof callback,
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (callbackType === 'undefined' || callbackType === 'function') {
            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback ? callback.apply(defined[name], args) : undefined;

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (config.deps) {
                req(config.deps, config.callback);
            }
            if (!callback) {
                return;
            }

            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        return req(cfg);
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function (name, deps, callback) {
        if (typeof name !== 'string') {
            throw new Error('See almond README: incorrect module build, no module name');
        }

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define("../build/almond", function(){});

/*
	Copyright 2015 Norut Northern Research Institute
	Author : Ingar Mæhlum Arntzen

  This file is part of the Timingsrc module.

  Timingsrc is free software: you can redistribute it and/or modify
  it under the terms of the GNU Lesser General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  Timingsrc is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Lesser General Public License for more details.

  You should have received a copy of the GNU Lesser General Public License
  along with Timingsrc.  If not, see <http://www.gnu.org/licenses/>.
*/




define('util/eventutils',[],function () {

	'use strict';

	/*
		UTILITY
	*/

	// unique ID generator 
	var id = (function(length) {
	 	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	    return function (len) { // key length
	    	len = len || length; 
	    	var text = "";
		    for( var i=0; i < len; i++ )
	    	    text += possible.charAt(Math.floor(Math.random() * possible.length));
	    	return text;
		};
	})(10); // default key length


	Array.prototype.concatAll = function() {
		var results = [];
		this.forEach(function(subArray) {
			results.push.apply(results, subArray);
		}, this);
		return results;
	};
	Array.prototype.concatMap = function(projectionFunctionThatReturnsArray, ctx) {
		return this.
			map(function(item) {
				return projectionFunctionThatReturnsArray.call(ctx, item);
			}).
			// apply the concatAll function to flatten the two-dimensional array
			concatAll();
	};


	/*
		HANDLER MAP
	*/


	// handler bookkeeping for one event type
	var HandlerMap = function () {
		this._id = 0;
		this._map = {}; // ID -> {handler:, ctx:, pending:, count: }
	};
	
	HandlerMap.prototype._newID = function () {
		this._id += 1;
		return this._id;
	};

	HandlerMap.prototype._getID = function (handler) {
		var item;
		var res = Object.keys(this._map).filter(function (id) {
			item = this._map[id];
			return (item.handler === handler);
		}, this);
		return (res.length > 0) ? res[0] : -1;
	};

	HandlerMap.prototype.getItem = function (id) {
		return this._map[id];
	};

	HandlerMap.prototype.register = function (handler, ctx) {
		var ID = this._getID(handler);
		if (ID > -1) {
			throw new Error("handler already registered");
		}
		ID = this._newID();
		this._map[ID] = {
			ID : ID,
			handler: handler,
			ctx : ctx,
			count : 0,
			pending : false
		};
		return ID;
	};

	HandlerMap.prototype.unregister = function (handler) {
		var ID = this._getID(handler);
		if (ID !== -1) {
			delete this._map[ID];
		}
	};

	HandlerMap.prototype.getItems = function () {
		return Object.keys(this._map).map(function (id) {
			return this.getItem(id);
		}, this);
	};





	/*
	
		EVENTIFY

		Eventify brings eventing capabilities to any object.

		In particular, eventify supports the initial-event pattern.
		Opt-in for initial events per event type.

		A protected event type "events" provides a callback with a batch of events in a list,
		instead as individual callbacks.

		if initial-events are used
		eventified object must implement this._makeInitEvents(type)
		- expect [{type:type, e:eArg}]

	*/

	var eventify = function (object, _prototype) {

		/*
			Default event name "events" will fire a list of events
		*/
		object._ID = id(4);
		object._callbacks = {}; // type -> HandlerMap
		// special event "events"
		object._callbacks["events"] = new HandlerMap();
		object._callbacks["events"]._options = {init:true};




		/*
			DEFINE EVENT TYPE
			type is event type (string)
			{init:true} specifies init-event semantics for this event type
		*/
		_prototype.eventifyDefineEvent = function (type, options) {
			if (type === "events") throw new Error("Illegal event type : 'events' is protected");
			options = options || {};
			options.init = (options.init === undefined) ? false : options.init;
			this._callbacks[type] = new HandlerMap();
			this._callbacks[type]._options = options;
		};

		/*
			MAKE INIT EVENTS

			Produce init events for a specific callback handler - right after on("type", callback)
			Return list consistent with input .eventifyTriggerEvents
			[{type: "type", e: e}]
			If [] list is returned there will be no init events.

			Protected event type 'events' is handled automatically

			Implement
			.eventifyMakeInitEvents(type)

		*/
		_prototype._eventifyMakeInitEvents = function (type) {
			var makeInitEvents = this.eventifyMakeInitEvents || function (type) {return [];};
			var typeList;
			if (type !== "events") {
				typeList = [type];
			} else {
				// type === 'events'
				typeList = Object.keys(this._callbacks).filter(function (key) {
					return (key !== "events" && this._callbacks[key]._options.init === true);
				}, this);
			}
			return typeList.concatMap(function (type) {
				return makeInitEvents.call(this, type);
			}, this);		
		};

		/*
			EVENT FORMATTER

			Format the structure of EventArgs. 
			Parameter e is the object that was supplied to triggerEvent
			Parameter type is the event type that was supplied to triggerEvent
			Default is to use 'e' given in triggerEvent unchanged.

			Note, for protected event type 'events', eventFormatter is also applied recursively
			within the list of events
			ex: { type: "events", e: [{type:"change",e:e1},])  

			Implement
			.eventifyEventFormatter(type, e) to override default
		*/
		_prototype._eventifyEventFormatter = function (type, e) {
			var eventFormatter = this.eventifyEventFormatter || function (type, e) {return e;};
			if (type === "events") {
				// e is really eList - run eventformatter on every item in list
				e = e.map(function(item){
					return eventFormatter.call(this, item.type, item.e);
				});
			}			
			return eventFormatter(type,e);
		};

		/*
			CALLBACK FORMATTER

			Format which parameters are included in event callback.
			Returns a list of parameters. 
			Default is to exclude type and eInfo and just deliver the event supplied to triggerEvent

			Implement
			.eventifyCallbackForamtter(type, e, eInfo) to override default
		*/
		_prototype._eventifyCallbackFormatter = function (type, e, eInfo) {
			var callbackFormatter = this.eventifyCallbackFormatter || function (type, e, eInfo) { return [e];};
			return callbackFormatter.call(this, type, e, eInfo);
		};

		/* 
			TRIGGER EVENTS

			Parameter is a list of objects where 'type' specifies the event type and 'e' specifies the event object.
			'e' may be undefined
			- [{type: "type", e: e}]
		*/
		_prototype.eventifyTriggerEvents = function (eItemList) {
			// check list for illegal events
			eItemList.forEach(function (eItem) {
				if (eItem.type === undefined) throw new Error("Illegal event type; undefined");
				if (eItem.type === "events") throw new Error("Illegal event type; triggering of events on protocted event type 'events'" );
			}, this);
			if (eItemList.length === 0) return;
			this._eventifyTriggerProtectedEvents(eItemList);
			this._eventifyTriggerRegularEvents(eItemList);
			return this;
        };

        /*
         	TRIGGER EVENT
         	Shorthand for triggering a single event
        */
        _prototype.eventifyTriggerEvent = function (type, e) {
        	return this.eventifyTriggerEvents([{type:type, e:e}]);
        };

    	/*
			Internal method for triggering events
			- distinguish "events" from other event names
    	*/
      	_prototype._eventifyTriggerProtectedEvents = function (eItemList, handlerID) {
      		// trigger event list on protected event type "events"      		
      		this._eventifyTriggerEvent("events", {type:"events", e:eItemList}, handlerID);
      	};

      	_prototype._eventifyTriggerRegularEvents = function (eItemList, handlerID) {
      		// trigger events on individual event types
      		eItemList.forEach(function (eItem) {
      			this._eventifyTriggerEvent(eItem.type, eItem, handlerID);
	      	}, this);
      	};

    	/*
			Internal method for triggering a single event.
			- if handler specificed - trigger only on given handler (for internal use only)
			- awareness of init-events	
        */
        _prototype._eventifyTriggerEvent = function (type, eItem, handlerID) {
			var argList, e, eInfo = {};
			if (!this._callbacks.hasOwnProperty(type)) throw new Error("Unsupported event type " + type); 
			var handlerMap = this._callbacks[type];
			var init = handlerMap._options.init;
    		handlerMap.getItems().forEach(function (handlerItem) {
    			if (handlerID === undefined) {
           			// all handlers to be invoked, except those with initial pending
            		if (handlerItem.pending) { 
              			return false;
            		}
          		} else {
            		// only given handler to be called - ensuring that it is not removed
            		if (handlerItem.ID === handlerID) {
            			eInfo.init = true;
            			handlerItem.pending = false;
            		} else {
              			return false;
            		}
          		}
          		// eInfo
          		if (init) {
          			eInfo.init = (handlerItem.ID === handlerID) ? true : false;
          		}
          		eInfo.count = handlerItem.count;
          		eInfo.src = this;
          		// formatters
          		e = this._eventifyEventFormatter(eItem.type, eItem.e);
          		argList = this._eventifyCallbackFormatter(type, e, eInfo);
          		try {
            		handlerItem.handler.apply(handlerItem.ctx, argList);
            		handlerItem.count += 1;
          			return true;
	          	} catch (err) {
    	        	console.log("Error in " + type + ": " + handlerItem.handler + " " + handlerItem.ctx + ": ", err);
          		}
    		}, this);
    		return false;
    	};

    	/*
			ON

			register callback on event type. Available directly on object
			optionally supply context object (this) used on callback invokation.
    	*/
		_prototype.on = function (type, handler, ctx) {
			if (!handler || typeof handler !== "function") throw new Error("Illegal handler");
		    if (!this._callbacks.hasOwnProperty(type)) throw new Error("Unsupported event type " + type);
			var handlerMap = this._callbacks[type];
  			// register handler
  			ctx = ctx || this;
  			var handlerID = handlerMap.register(handler, ctx);
    	    // do initial callback - if supported by source
    	    if (handlerMap._options.init) {
    	    	// flag handler
    	    	var handlerItem = handlerMap.getItem(handlerID);
    	    	handlerItem.pending = true;
    	    	var self = this;
	    	    setTimeout(function () {
	    	    	var eItemList = self._eventifyMakeInitEvents(type);
    	    		if (eItemList.length > 0) {
    	    			if (type === "events") {
    	    				self._eventifyTriggerProtectedEvents(eItemList, handlerID);
    	    			} else {
    	    				self._eventifyTriggerRegularEvents(eItemList, handlerID);
    	    			}
    	    		} else {
    	    			// initial callback is noop
    	    			handlerItem.pending = false;
    	    		}
	    	    }, 0);
    	    }
	      	return this;
		};

		/*
			OFF
			Available directly on object
			Un-register a handler from a specfic event type
		*/

		_prototype.off = function (type, handler) {
			if (this._callbacks[type] !== undefined) {
				var handlerMap = this._callbacks[type];
				handlerMap.unregister(handler);
				
      		}
      		return this;
		};

		// Eventify returns eventified object
		return object;
	};

	// module api
	return {
		eventify:eventify
	};
});


/*
	Copyright 2015 Norut Northern Research Institute
	Author : Ingar Mæhlum Arntzen

  This file is part of the Timingsrc module.

  Timingsrc is free software: you can redistribute it and/or modify
  it under the terms of the GNU Lesser General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  Timingsrc is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Lesser General Public License for more details.

  You should have received a copy of the GNU Lesser General Public License
  along with Timingsrc.  If not, see <http://www.gnu.org/licenses/>.
*/


define('util/motionutils',[],function () {

	'use strict';
	
    // Calculate a snapshot of the motion vector,
    // given initials conditions vector: [p0,v0,a0,t0] and t (absolute - not relative to t0) 
    // if t is undefined - t is set to now
    var calculateVector = function(vector, tsSec) {
		if (tsSec === undefined) {
		    throw new Error ("no ts provided for calculateVector");
		}
		var deltaSec = tsSec - vector.timestamp;	
		return {
			position : vector.position + vector.velocity*deltaSec + 0.5*vector.acceleration*deltaSec*deltaSec,
			velocity : vector.velocity + vector.acceleration*deltaSec,
			acceleration : vector.acceleration, 
			timestamp : tsSec
		};
    };


    //	RANGE STATE is used for managing/detecting range violations.
	var RangeState = Object.freeze({
	    INIT : "init",
	    INSIDE: "inside",
	    OUTSIDE_LOW: "outsidelow",
	    OUTSIDE_HIGH: "outsidehigh"
	});

	/*
		A snapshot vector is checked with respect to range,
		calclulates correct RangeState (i.e. INSIDE|OUTSIDE)
	*/
	var getCorrectRangeState = function (vector, range) {
		var p = vector.position,
			v = vector.velocity,
			a = vector.acceleration;
		if (p > range[1]) return RangeState.OUTSIDE_HIGH;
		if (p < range[0]) return RangeState.OUTSIDE_LOW;
		// corner cases
		if (p === range[1]) {
			if (v > 0.0) return RangeState.OUTSIDE_HIGH;
			if (v === 0.0 && a > 0.0) return RangeState.OUTSIDE_HIGH;
		} else if (p === range[0]) {
		    if (v < 0.0) return RangeState.OUTSIDE_LOW;
		    if (v == 0.0 && a < 0.0) return RangeState.OUTSIDE_HIGH;
		}
		return RangeState.INSIDE;
	};

	/*

		A snapshot vector is checked with respect to range.
		Returns vector corrected for range violations, or input vector unchanged.
	*/
	var checkRange = function (vector, range) {
		var state = getCorrectRangeState(vector, range);
		if (state !== RangeState.INSIDE) {
			// protect from range violation
			vector.velocity = 0.0;
			vector.acceleration = 0.0;
			if (state === RangeState.OUTSIDE_HIGH) {
				vector.position = range[1];
			} else vector.position = range[0];
		}
		return vector;
	};


    
    // Compare values
    var cmp = function (a, b) {
		if (a > b) {return 1;}
		if (a === b) {return 0;}
		if (a < b) {return -1;}
    };

	// Calculate direction of movement at time t.
	// 1 : forwards, -1 : backwards: 0, no movement
    var calculateDirection = function (vector, tsSec) {
		/*
		  Given initial vector calculate direction of motion at time t 
		  (Result is valid only if (t > vector[T]))
		  Return Forwards:1, Backwards -1 or No-direction (i.e. no-motion) 0.
		  If t is undefined - t is assumed to be now.
		*/
		var freshVector = calculateVector(vector, tsSec);
		// check velocity
		var direction = cmp(freshVector.velocity, 0.0);
		if (direction === 0) {
		    // check acceleration
	        direction = cmp(vector.acceleration, 0.0);
		}
		return direction;
    };

    // Given motion determined from p,v,a,t. 
    // Determine if equation p(t) = p + vt + 0.5at^2 = x 
    // has solutions for some real number t.
    var hasRealSolution = function (p,v,a,x) {
		if ((Math.pow(v,2) - 2*a*(p-x)) >= 0.0) return true;
		else return false;
    };
    
    // Given motion determined from p,v,a,t. 
    // Determine if equation p(t) = p + vt + 0.5at^2 = x 
    // has solutions for some real number t.
    // Calculate and return real solutions, in ascending order.
    var calculateRealSolutions = function (p,v,a,x) {
		// Constant Position
		if (a === 0.0 && v === 0.0) {
		    if (p != x) return [];
		    else return [0.0];
		}
		// Constant non-zero Velocity
		if (a === 0.0) return [(x-p)/v];
		// Constant Acceleration
		if (hasRealSolution(p,v,a,x) === false) return [];
		// Exactly one solution
		var discriminant = v*v - 2*a*(p-x);
		if (discriminant === 0.0) {
		    return [-v/a];
		}
		var sqrt = Math.sqrt(Math.pow(v,2) - 2*a*(p-x));
		var d1 = (-v + sqrt)/a;
		var d2 = (-v - sqrt)/a;
		return [Math.min(d1,d2),Math.max(d1,d2)];
    };

    // Given motion determined from p,v,a,t. 
    // Determine if equation p(t) = p + vt + 0.5at^2 = x 
    // has solutions for some real number t.
    // Calculate and return positive real solutions, in ascending order.
    var calculatePositiveRealSolutions = function (p,v,a,x) {
		var res = calculateRealSolutions(p,v,a,x);
		if (res.length === 0) return [];
		else if (res.length == 1) {
		    if (res[0] > 0.0) { 
				return [res[0]];
		    }
		    else return []; 
		}
		else if (res.length == 2) {
		    if (res[1] < 0.0) return [];
		    if (res[0] > 0.0) return [res[0], res[1]];
		    if (res[1] > 0.0) return [res[1]];
		    return [];
		}
		else return [];
    };

    // Given motion determined from p,v,a,t. 
    // Determine if equation p(t) = p + vt + 0.5at^2 = x 
    // has solutions for some real number t.
    // Calculate and return the least positive real solution.
    var calculateMinPositiveRealSolution = function (vector,x) {
		var p = vector.position;
		var v = vector.velocity;
		var a = vector.acceleration;
		var res = calculatePositiveRealSolutions(p,v,a,x);
		if (res.length === 0) return null;
		else return res[0];
    };
    
    // Given motion determined from p0,v0,a0
    // (initial conditions or snapshot)
    // Supply two posisions, posBefore < p0 < posAfter.
    // Calculate which of these positions will be reached first,
    // if any, by the movement described by the vector.
    // In addition, calculate when this position will be reached.
    // Result will be expressed as time delta relative to t0, 
    // if solution exists,
    // and a flag to indicate Before (false) or After (true)
    // Note t1 == (delta + t0) is only guaranteed to be in the 
    // future as long as the function
    // is evaluated at time t0 or immediately after.
    var calculateDelta = function (vector, range) {
		// Time delta to hit posBefore
		var deltaBeforeSec = calculateMinPositiveRealSolution(vector, range[0]);
		// Time delta to hit posAfter
		var deltaAfterSec = calculateMinPositiveRealSolution(vector, range[1]);
		// Pick the appropriate solution
		if (deltaBeforeSec !== null && deltaAfterSec !== null) {
		    if (deltaBeforeSec < deltaAfterSec)
				return [deltaBeforeSec, range[0]];
		    else 
				return [deltaAfterSec, range[1]];
		}
		else if (deltaBeforeSec !== null)
		    return [deltaBeforeSec, range[0]];
		else if (deltaAfterSec !== null)
		    return [deltaAfterSec, range[1]];
		else return [null,null];
    };
  

    /*
      calculate_solutions_in_interval (vector, d, plist)
      
      Find all intersects in time between a motion and a the
      positions given in plist, within a given time-interval d. A
      single position may be intersected at 0,1 or 2 two different
      times during the interval.
      
      - vector = (p0,v0,a0) describes the initial conditions of
      (an ongoing) motion
      
      - relative time interval d is used rather than a tuple of
      absolute values (t_start, t_stop). This essentially means
      that (t_start, t_stop) === (now, now + d). As a consequence,
      the result is independent of vector[T]. So, if the goal is
      to find the intersects of an ongoing motion during the next
      d seconds, be sure to give a fresh vector from msv.query()
      (so that vector[T] actually corresponds to now).
      
      
      - plist is an array of objects with .point property
      returning a floating point. plist represents the points
      where we investigate intersects in time.
      
      The following equation describes how position varies with time
      p(t) = 0.5*a0*t*t + v0*t + p0
      
      We solve this equation with respect to t, for all position
      values given in plist.  Only real solutions within the
      considered interval 0<=t<=d are returned.  Solutions are
      returned sorted by time, thus in the order intersects will
      occur.

    */
    var sortFunc = function (a,b){return a[0]-b[0];};
    var calculateSolutionsInInterval = function(vector, deltaSec, plist) {
		var solutions = [];
		var p0 = vector.position;
		var v0 = vector.velocity;
		var a0 = vector.acceleration;
		for (var i=0; i<plist.length; i++) {
		    var o = plist[i];
		    var intersects = calculateRealSolutions(p0,v0,a0, o.point);
		    for (var j=0; j<intersects.length; j++) {
				var t = intersects[j];
				if (0.0 <= t && t <= deltaSec) {
				    solutions.push([t,o]);
				}
		    }
		}
		// sort solutions
		solutions.sort(sortFunc);
		return solutions;
    };
    
    /*
      Within a definite time interval, a motion will "cover" a
      definite interval on the dimension. Calculate the min, max
      positions of this interval, essentially the smallest
      position-interval that contains the entire motion during the
      time-interval of length d seconds.
      
      relative time interval d is used rather than a tuple of absolute values
      (t_start, t_stop). This essentially means that (t_start, t_stop) ===
      (now, now + d). As a consequence, the result
      is independent of vector[T]. So, if the goal is to
      find the interval covered by an ongoing motion during the
      next d seconds, be sure to give a fresh vector from
      msv.query() (so that vector[T] actually corresponds to
      now).
      
      The calculation takes into consideration that acceleration
      might turn the direction of motion during the time interval.
    */
    
    var calculateInterval = function (vector, deltaSec) {
		var p0 = vector.position;
		var v0 = vector.velocity;
		var a0 = vector.acceleration;
		var p1 = p0 + v0*deltaSec + 0.5*a0*deltaSec*deltaSec;
		
		/*
		  general parabola
		  y = ax*x + bx + c
		  turning point (x,y) : x = - b/2a, y = -b*b/4a + c
		  
		  p_turning = 0.5*a0*d_turning*d_turning + v0*d_turning + p0
		  a = a0/2, b=v0, c=p0
		  turning point (d_turning, p_turning):
		  d_turning = -v0/a0
		  p_turning = p0 - v0*v0/(2*a0)
		*/
		
		if (a0 !== 0.0) {
		    var d_turning = -v0/a0;
		    if (0.0 <= d_turning && d_turning <= d) {
				// turning point was reached p_turning is an extremal value            
				var p_turning = p0 - 0.5*v0*v0/a0;
				// a0 > 0 => p_turning minimum
				// a0 < 0 => p_turning maximum
				if (a0 > 0.0) {
					return [p_turning, Math.max(p0, p1)];
				}
				else {
				    return [Math.min(p0,p1), p_turning];
				}
		    }
		}
		// no turning point or turning point was not reached
		return [Math.min(p0,p1), Math.max(p0,p1)];
    };


	// return module object
	return {
		calculateVector : calculateVector,
		calculateDirection : calculateDirection,
		calculateMinPositiveRealSolution : calculateMinPositiveRealSolution,
		calculateDelta : calculateDelta,
		calculateInterval : calculateInterval,
		calculateSolutionsInInterval : calculateSolutionsInInterval,
		getCorrectRangeState : getCorrectRangeState,
		checkRange : checkRange,
		RangeState : RangeState
	};
});


/*
	Copyright 2015 Norut Northern Research Institute
	Author : Ingar Mæhlum Arntzen

  This file is part of the Timingsrc module.

  Timingsrc is free software: you can redistribute it and/or modify
  it under the terms of the GNU Lesser General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  Timingsrc is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Lesser General Public License for more details.

  You should have received a copy of the GNU Lesser General Public License
  along with Timingsrc.  If not, see <http://www.gnu.org/licenses/>.
*/

/*
	TimingBase defines base classes for TimingObject and ConverterBase used to implement timing converters.
	It makes use of eventutils for event stuff, including immediate events.
	It makes use of motionutils for timing calculations. 
*/

define('timingobject/timingbase',['util/eventutils', 'util/motionutils'], function (eventutils, motionutils) {

	'use strict';

	// Utility inheritance function.
	var inherit = function (Child, Parent) {
		var F = function () {}; // empty object to break prototype chain - hinder child prototype changes to affect parent
		F.prototype = Parent.prototype;
		Child.prototype = new F(); // child gets parents prototypes via F
		Child.uber = Parent.prototype; // reference in parent to superclass
		Child.prototype.constructor = Child; // resetting constructor pointer 
	};


	// TIMING BASE
	/*
		Base class for TimingObject and ConverterBase

		essential internal state
		- range, vector
	
		external methods
		query, update

		event stuff from eventutils
		on/off "change", "timeupdate"
		
		internal methods for range timeouts
		
		defines internal processing steps
		- preProcess(vector) <- from external timingobject
			- vector = onChange(vector)
			- process(vector) <- from timeout or preProcess
		- process (vector) 
			- set internal vector
			- postProcess(vector)
			- renew range timeout
		- postprocess (vector)
			- emit change event and timeupdate event
			- turn periodic timeupdate on or off
	
		individual steps in this structure may be specialized
		by subclasses
	*/


	var TimingBase = function (options) {
		this._version = 3;
		// options
		this._options = options || {};
		// range timeouts off by default
		if (!this._options.hasOwnProperty("timeout")) {
			this._options.timeout = false;
		}
		// cached vector
		this._vector = null;
		// cached range
		this._range = null;
		// timeout support
		this._timeout = null; // timeout for range violation etc.
		this._tid = null; // timeoutid for timeupdate
		// readiness
		this._ready = false;
		// event support
		eventutils.eventify(this, TimingBase.prototype);
		this.eventifyDefineEvent("ready", {init:true}) // define ready event
		this.eventifyDefineEvent("change", {init:true}); // define change event (supporting init-event)
		this.eventifyDefineEvent("timeupdate", {init:true}); // define timeupdate event (supporting init-event)
	};


	// Accessors 

	Object.defineProperty(TimingBase.prototype, 'version', {
		get : function () { 
			return this._version;
		}
	});

	Object.defineProperty(TimingBase.prototype, 'range', {
		get : function () {
			if (this._range === null) return null;
			// copy internal range
			return [this._range[0], this._range[1]];
		}
	});

	// Accessor internal vector
	Object.defineProperty(TimingBase.prototype, 'vector', {
		get : function () {	
			if (this._vector === null) return null;
			// copy cached vector
			return {
				position : this._vector.position,
				velocity : this._vector.velocity,
				acceleration : this._vector.acceleration,
				timestamp : this._vector.timestamp
			};
		}
	});


	Object.defineProperty(TimingBase.prototype, 'ready', {
		get : function () {
			return this._ready;
		}
	});

	Object.defineProperty(TimingBase.prototype, 'readyPromise', {
		get : function () {
			var self = this;
			return new Promise (function (resolve, reject) {
				if (self._ready) {
					resolve();
				} else {
					var onReady = function () {
						self.off("ready", onReady);
						resolve()
					};
					self.on("ready", onReady);
				}
			});
		}
	});


	// Shorthand accessors
	Object.defineProperty(TimingBase.prototype, 'pos', {
		get : function () {
			return this.query().position;
		}
	});

	Object.defineProperty(TimingBase.prototype, 'vel', {
		get : function () {
			return this.query().velocity;
		}
	});

	Object.defineProperty(TimingBase.prototype, 'acc', {
		get : function () {
			return this.query().acceleration;
		}
	});




	/*
	  	overrides how immediate events are constructed
	  	specific to eventutils
		change event fires immediately if timing object is well 
		defined, i.e. query() not null
		no event args are passed (undefined) 
	*/
	TimingBase.prototype.eventifyMakeInitEvents = function (type) {
		if (type === "change") {
			return (this._ready) ? [{type: type, e: undefined}] : []; 
		} else if (type === "timeupdate") {
			return (this._ready) ? [{type:type, e: undefined}] : []; 
		} else if (type === "ready") {
			return (this._ready) ? [{type:type, e: undefined}] : []; 
		}
		return [];
	};

	/*
		Basic query. Insensitive to range violations.
		Must be overrided by subclasses with specified range.
	*/
	TimingBase.prototype.query = function () {
		if (this.vector === null) return {position:undefined, velocity:undefined, acceleration:undefined};
		return motionutils.calculateVector(this.vector, this.clock.now());
	};

	// to be overridden
	TimingBase.prototype.update = function (vector) {};

	/*
		To be overridden
		get range is useful for setting the range internally,
		when the range depends on the range of an external (upstream)
		timing object. Get range is invoked when first change
		event is received from external object, thereby guaranteeing 
		that range of external timing object is well defined.
		(see _preProcess)
		return correct range [start, end]

		Invoked every time the external object is switched,
		thus is may change.
	*/
	TimingBase.prototype._getRange = function () {return null;};



	// CHANGE EVENTS


	/*
		do not override
		Handle incoming vector, from "change" from external object
		or from an internal timeout.
		
		_onChange is invoked allowing subclasses to specify transformation
		on the incoming vector before processing.
	*/
	TimingBase.prototype._preProcess = function (vector) {
		if (this._range === null) {
			this._range = this._getRange();
		}
		var vector = this._onChange(vector);
		this._process(vector);
	};

	/*
		to be ovverridden
		specify transformation
		on the incoming vector before processing.
		useful for Converters that do mathematical transformations,
		or as a way to enforse range restrictions.
		invoming vectors from external change events or internal
		timeout events

		returning null stops further processing, exept renewtimeout 
	*/
	TimingBase.prototype._onChange = function (vector) {
		return vector;
	};
	
	// TIMEOUTS
	// Use range to implement timeouts on range violation

	/*
		do not override
		renew timeout is called during evenry processing step
		in order to recalculate timeouts.
		the calculation may be specialized in
		_calculateTimeoutVector
	*/
	TimingBase.prototype._renewTimeout = function () {
		if (this._options.timeout === true) {
			this._clearTimeout();
			var vector = this._calculateTimeoutVector();
			if (vector === null) {return;}	 		
			var now = this.clock.now();
	 		var secDelay = vector.timestamp - now;
	 		var self = this;
	 		this._timeout = this.clock.setTimeout(function () {
				self._process(self._onTimeout(vector));
	      	}, secDelay, {anchor: now, early: 0.005}); 
		}
	};

	/*
		to be overridden
		must be implemented by subclass if range timeouts are required
		calculate a vector that will be delivered to _process().
		the timestamp in the vector determines when it is delivered.
	*/
	TimingBase.prototype._calculateTimeoutVector = function () {
		return null;
	};

	/*
		do not override
		internal utility function for clearing vector timeout
	*/
	TimingBase.prototype._clearTimeout = function () {
		if (this._timeout !== null) {
			this._timeout.cancel();
			this._timeout = null;
		}
	};

	/*
		to be overridden
		subclass may implement transformation on timeout vector
		before it is given to process.
		returning null stops further processing, exept renewtimeout 
	*/
	TimingBase.prototype._onTimeout = function (vector) {
		return vector;
	};

	// PROCESS
	/*
		do not override
		Core processing step after change event or timeout
		assignes the internal vector
	*/
	TimingBase.prototype._process = function (vector) {
		if (vector !== null) {
			var old_vector = this._vector;
			// update internal vector
			this._vector = vector;
			// trigger events
			if (old_vector === null) {
				this._ready = true;
				this.eventifyTriggerEvent("ready");
			}
			this._postProcess(this.vector);
		}
		// renew timeout
		this._renewTimeout();
	};

	/*
		may be overridden
		process a new vector applied in order to trigger events
		overriding this is only necessary if external change events 
		need to be suppressed,
	*/
	TimingBase.prototype._postProcess = function (vector) {
		// trigger change events
		this.eventifyTriggerEvent("change");
		// trigger timeupdate events
		this.eventifyTriggerEvent("timeupdate");
		var moving = vector.velocity !== 0.0 || vector.acceleration !== 0.0;
		if (moving && this._tid === null) {
			var self = this;
			this._tid = setInterval(function () {
				self.eventifyTriggerEvent("timeupdate");
			}, 200);
		} else if (!moving && this._tid !== null) {
			clearTimeout(this._tid);
			this._tid = null;
		}
	};


	// CONVERTER BASE

	/*
		ConverterBase extends TimingBase to provide a
		base class for chainable Converters/emulators of timing objects
		ConverterBase conceptually add the notion of a timing source,
		a pointer to a timing object up the chain. Change events 
		may be received from the timing object, and update requests 
		are forwarded in the opposite direction. 
	*/


	var ConverterBase = function (timingObject, options) {
		TimingBase.call(this, options);
		// timing source
		this._timingsrc = null;	

		/*
			store a wrapper function on the instance used as a callback handler from timingsrc
			(if this was a prototype function - it would be shared by multiple objects thus
			prohibiting them from subscribing to the same timingsrc)
		*/
		var self = this;
		this._internalOnChange = function () {
			var vector = self.timingsrc.vector;
			self._preProcess(vector);
		};

		// set timing source
		this.timingsrc = timingObject;
	};
	inherit(ConverterBase, TimingBase);


	// Accessor internal clock
	Object.defineProperty(ConverterBase.prototype, 'clock', {
		get : function () {	return this.timingsrc.clock; }	
	});

	/*
		Accessor for timingsrc.
		Supports dynamic switching of timing source by assignment.
	*/
	Object.defineProperty(ConverterBase.prototype, 'timingsrc', {
		get : function () {return this._timingsrc;},
		set : function (timingObject) {
			if (this._timingsrc) {
				this._timingsrc.off("change", this._internalOnChange, this);
			}
			// reset internal state
			this._range = null;
			this._vector = null;
			this._clearTimeout();
			clearTimeout(this._tid);
			this._timingsrc = timingObject;
			this._timingsrc.on("change", this._internalOnChange, this);
		}
	});

	/*
		to be overridden
		default forwards update request to timingsrc unchanged.
	*/
	ConverterBase.prototype.update = function (vector) {
		return this.timingsrc.update(vector);
	};

	/*
		to be overridden
		by default the Converter adopts the range of timingsrc 
	*/
	ConverterBase.prototype._getRange = function () {
		return this.timingsrc.range;
	};

	// module
	return {
		TimingBase : TimingBase,
		ConverterBase : ConverterBase,
		inherit: inherit,
		motionutils : motionutils
	};
});



/*
	Copyright 2015 Norut Northern Research Institute
	Author : Ingar Mæhlum Arntzen

  This file is part of the Timingsrc module.

  Timingsrc is free software: you can redistribute it and/or modify
  it under the terms of the GNU Lesser General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  Timingsrc is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Lesser General Public License for more details.

  You should have received a copy of the GNU Lesser General Public License
  along with Timingsrc.  If not, see <http://www.gnu.org/licenses/>.
*/


/*
	SKEW CONVERTER

	Skewing the timeline by 2 means that the timeline position 0 of the timingsrc becomes position 2 of Converter.

*/

define('timingobject/skewconverter',['./timingbase'], function (timingbase) {

	'use strict';

	var ConverterBase = timingbase.ConverterBase;
	var inherit = timingbase.inherit;

	var SkewConverter = function (timingObject, skew) {
		this._skew = skew;
		ConverterBase.call(this, timingObject);
	};
	inherit(SkewConverter, ConverterBase);

	// overrides
	SkewConverter.prototype._getRange = function () {
		var range = this.timingsrc.range;
		range[0] = (range[0] === -Infinity) ? range[0] : range[0] + this._skew;
		range[1] = (range[1] === Infinity) ? range[1] : range[1] + this._skew;
		return range;
	};
	
	// overrides
	SkewConverter.prototype._onChange = function (vector) {
		vector.position += this._skew;	
		return vector;
	};

	SkewConverter.prototype.update = function (vector) {
		if (vector.position !== undefined && vector.position !== null) {
			vector.position = vector.position - this._skew;
		}
		return this.timingsrc.update(vector);
	};


	Object.defineProperty(SkewConverter.prototype, 'skew', {
		get : function () {
			return this._skew;
		}
	});

	SkewConverter.prototype.setSkew = function (skew) {
		this._skew = skew;
		// pick up vector from timingsrc
		var src_vector = this.timingsrc.vector;
		// use this vector to emulate new event from timingsrc
		this._preProcess(src_vector);
	};

	return SkewConverter;
});
/*
	Copyright 2015 Norut Northern Research Institute
	Author : Ingar Mæhlum Arntzen

  This file is part of the Timingsrc module.

  Timingsrc is free software: you can redistribute it and/or modify
  it under the terms of the GNU Lesser General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  Timingsrc is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Lesser General Public License for more details.

  You should have received a copy of the GNU Lesser General Public License
  along with Timingsrc.  If not, see <http://www.gnu.org/licenses/>.
*/


/*
	DELAY CONVERTER

	Delay Converter introduces a positive time delay on a source timing object.

	Generally - if the source timing object has some value at time t, 
	then the delayConverter will provide the same value at time t + delay.

	Since the delay Converter is effectively replaying past events after the fact,
	it is not LIVE and not open to interactivity (i.e. update)
	
*/


define('timingobject/delayconverter',['./timingbase'], function (timingbase) {

	'use strict';
	
	var ConverterBase = timingbase.ConverterBase;
	var inherit = timingbase.inherit;

	var DelayConverter = function (timingObject, delay) {
		if (delay < 0) {throw new Error ("negative delay not supported");}
		if (delay === 0) {throw new Error ("zero delay makes delayconverter pointless");}
		ConverterBase.call(this, timingObject);
		// fixed delay
		this._delay = delay;
	};
	inherit(DelayConverter, ConverterBase);

	// overrides
	DelayConverter.prototype._onChange = function (vector) {
		/* 			
			Vector's timestamp always time-shifted (back-dated) by delay

			Normal operation is to delay every incoming vector update.
			This implies returning null to abort further processing at this time,
			and instead trigger a later continuation.

			However, delay is calculated based on the timestamp of the vector (age), not when the vector is 
			processed in this method. So, for small small delays the age of the vector could already be
			greater than delay, indicating that the vector is immediately valid and do not require delayed processing.

			This is particularly true for the first vector, which may be old. 

			So we generally check the age to figure out whether to apply the vector immediately or to delay it.
		*/

		// age of incoming vector
		var age = this.clock.now() - vector.timestamp;
		
		// time-shift vector timestamp
		vector.timestamp += this._delay;

		if (age < this._delay) {
			// apply vector later - abort processing now
			var self = this;
			var delayMillis = (this._delay - age) * 1000;
			setTimeout(function () {
				self._process(vector);
			}, delayMillis);	
			return null;
		}
		// apply vector immediately - continue processing
		return vector;
	};

	DelayConverter.prototype.update = function (vector) {
		// Updates are prohibited on delayed timingobjects
		throw new Error ("update is not legal on delayed (non-live) timingobject");
	};

	return DelayConverter;
});
/*
	Copyright 2015 Norut Northern Research Institute
	Author : Ingar Mæhlum Arntzen

  This file is part of the Timingsrc module.

  Timingsrc is free software: you can redistribute it and/or modify
  it under the terms of the GNU Lesser General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  Timingsrc is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Lesser General Public License for more details.

  You should have received a copy of the GNU Lesser General Public License
  along with Timingsrc.  If not, see <http://www.gnu.org/licenses/>.
*/

/*
	SCALE CONVERTER

	Scaling by a factor 2 means that values of the timing object (position, velocity and acceleration) are multiplied by two.
	For example, if the timing object represents a media offset in seconds, scaling it to milliseconds implies a scaling factor of 1000.

*/


define('timingobject/scaleconverter',['./timingbase'], function (timingbase) {

	'use strict';

	var ConverterBase = timingbase.ConverterBase;	
	var inherit = timingbase.inherit;

	var ScaleConverter = function (timingObject, factor) {
		this._factor = factor;
		ConverterBase.call(this, timingObject);
	};
	inherit(ScaleConverter, ConverterBase);

	// overrides
	ScaleConverter.prototype._getRange = function () {
		var range = this.timingsrc.range;
		return [range[0]*this._factor, range[1]*this._factor];
	};

	// overrides
	ScaleConverter.prototype._onChange = function (vector) {
		vector.position = vector.position * this._factor;
		vector.velocity = vector.velocity * this._factor;
		vector.acceleration = vector.acceleration * this._factor;
		return vector;
	};
	
	ScaleConverter.prototype.update = function (vector) {
		if (vector.position !== undefined && vector.position !== null) vector.position = vector.position / this._factor;
		if (vector.velocity !== undefined && vector.velocity !== null) vector.velocity = vector.velocity / this._factor;
		if (vector.acceleration !== undefined && vector.acceleration !== null) vector.acceleration = vector.acceleration / this._factor;
		return this.timingsrc.update(vector);
	};

	return ScaleConverter;
});
/*
	Copyright 2015 Norut Northern Research Institute
	Author : Ingar Mæhlum Arntzen

  This file is part of the Timingsrc module.

  Timingsrc is free software: you can redistribute it and/or modify
  it under the terms of the GNU Lesser General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  Timingsrc is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Lesser General Public License for more details.

  You should have received a copy of the GNU Lesser General Public License
  along with Timingsrc.  If not, see <http://www.gnu.org/licenses/>.
*/


/*
	LOOP CONVERTER

	This is a modulo type transformation where the converter will be looping within
	a given range. Potentially one could create an associated timing object keeping track of the 
	loop number.
*/


define('timingobject/loopconverter',['./timingbase'], function (timingbase) {

	'use strict';

	var motionutils = timingbase.motionutils;
	var ConverterBase = timingbase.ConverterBase;	
	var inherit = timingbase.inherit;

	/* 
		Coordinate system based on counting segments
		skew + n*length + offset === x
		skew : coordinate system is shifted by skew, so that segment 0 starts at offset.
		n : segment counter
		length : segment length
		offset : offset of value x into the segment where it lies
		x: float point value
	*/
	var SegmentCoords = function (skew, length) {
		this.skew = skew;
		this.length = length;
	};

	/* 
		Static method
		ovverride modulo to behave better for negative numbers 
	*/
	SegmentCoords.mod = function (n, m) {
		return ((n % m) + m) % m;
	};
	
	// get point representation from float
	SegmentCoords.prototype.getPoint = function (x) {
		return {
			n : Math.floor((x-this.skew)/this.length),
			offset : SegmentCoords.mod(x-this.skew,this.length)
		};
	};
	
	// get float value from point representation
	SegmentCoords.prototype.getFloat = function (p) {
		return this.skew + (p.n * this.length) + p.offset;
	};

	// transform float x into segment defined by other float y 
	// if y isnt specified - transform into segment [skew, skew + length]
	SegmentCoords.prototype.transformFloat = function (x, y) {
		y = (y === undefined) ? this.skew : y;
		var xPoint = this.getPoint(x);
		var yPoint = this.getPoint(y);
		return this.getFloat({n:yPoint.n, offset:xPoint.offset});
	};


	/*
		LOOP CONVERTER
	*/

	var LoopConverter = function (timingObject, range) {
		ConverterBase.call(this, timingObject, {timeout:true});
		this._range = range;
		this._coords = new SegmentCoords(range[0], range[1]-range[0]);
	};
	inherit(LoopConverter, ConverterBase);

	// transform value from coordiantes X of timing source
	// to looper coordinates Y
	LoopConverter.prototype._transform = function (x) {
		return this._coords.transformFloat(x);
	};

	// transform value from looper coordinates Y into 
	// coordinates X of timing object - maintain relative diff 
	LoopConverter.prototype._inverse = function (y) {
		var current_y = this.query().position;
		var current_x = this.timingsrc.query().position;
		var diff = y - current_y;
		var x = diff + current_x;
		// verify that x is witin range
		return x;
	};

	// overrides
	LoopConverter.prototype.query = function () {
		if (this.vector === null) return {position:undefined, velocity:undefined, acceleration:undefined};
		var vector = motionutils.calculateVector(this.vector, this.clock.now());
		// trigger state transition if range violation is detected
		if (vector.position > this._range[1]) {
			this._process(this._calculateInitialVector());
		} else if (vector.position < this._range[0]) {
			this._process(this._calculateInitialVector());
		} else {
			// no range violation
			return vector;
		}
		// re-evaluate query after state transition
		return motionutils.calculateVector(this.vector, this.clock.now());
	};

	// overrides
	LoopConverter.prototype.update = function (vector) {
		if (vector.position !== undefined && vector.position !== null) {
			vector.position = this._inverse(vector.position);
		}
		return this.timingsrc.update(vector);
	};

	// overrides
	LoopConverter.prototype._calculateTimeoutVector = function () {
		var freshVector = this.query();
		var res = motionutils.calculateDelta(freshVector, this.range);
		var deltaSec = res[0];
		if (deltaSec === null) return null;
		var position = res[1];
		var vector = motionutils.calculateVector(freshVector, freshVector.timestamp + deltaSec);
		vector.position = position; // avoid rounding errors
		return vector;
	};

	// overrides
	LoopConverter.prototype._onTimeout = function (vector) {
		return this._calculateInitialVector();
	};

	// overrides
	LoopConverter.prototype._onChange = function (vector) {
		return this._calculateInitialVector();
	};

	LoopConverter.prototype._calculateInitialVector = function () {
		// parent snapshot 
		var parentVector = this.timingsrc.query();
		// find correct position for looper
		var position = this._transform(parentVector.position);
		// find looper vector
		return {
			position: position,
			velocity: parentVector.velocity,
			acceleration: parentVector.acceleration,
			timestamp: parentVector.timestamp
		};
	};

	return LoopConverter;
});
/*
	Copyright 2015 Norut Northern Research Institute
	Author : Ingar Mæhlum Arntzen

  This file is part of the Timingsrc module.

  Timingsrc is free software: you can redistribute it and/or modify
  it under the terms of the GNU Lesser General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  Timingsrc is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Lesser General Public License for more details.

  You should have received a copy of the GNU Lesser General Public License
  along with Timingsrc.  If not, see <http://www.gnu.org/licenses/>.
*/

/*

	RANGE CONVERTER

	The converter enforce a range on position.

	It only has effect if given range is a restriction on the range of the timingsrc.
	Range converter will pause on range endpoints if timingsrc leaves the range. 
	Range converters will continue mirroring timingsrc once it comes into the range.
*/

define('timingobject/rangeconverter',['./timingbase'], function (timingbase) {

	'use strict';

	var motionutils = timingbase.motionutils;
	var ConverterBase = timingbase.ConverterBase;	
	var RangeState = motionutils.RangeState;
	var inherit = timingbase.inherit;

	var state = function () {
		var _state = RangeState.INIT;
		var is_real_state_change = function (old_state, new_state) {
			// only state changes between INSIDE and OUTSIDE* are real state changes.
			if (old_state === RangeState.OUTSIDE_HIGH && new_state === RangeState.OUTSIDE_LOW) return false;
			if (old_state === RangeState.OUTSIDE_LOW && new_state === RangeState.OUTSIDE_HIGH) return false;
			if (old_state === RangeState.INIT) return false;
			return true;
		}
		var get = function () {return _state;};
		var set = function (new_state) {
			if (new_state === RangeState.INSIDE || new_state === RangeState.OUTSIDE_LOW || new_state === RangeState.OUTSIDE_HIGH) {
				if (new_state !== _state) {
					var old_state = _state;
					_state = new_state;
					return {real: is_real_state_change(old_state, new_state), abs: true};
				}
			};
			return {real:false, abs:false};
		}
		return {get: get, set:set};
	};


	/*
		Range converter allows a new (smaller) range to be specified.
	*/

	var RangeConverter = function (timingObject, range) {
		ConverterBase.call(this, timingObject, {timeout:true});
		this._state = state();
		// todo - check range
		this._range = range;
	};
	inherit(RangeConverter, ConverterBase);

	// overrides
	RangeConverter.prototype.query = function () {
		if (this.vector === null) return {position:undefined, velocity:undefined, acceleration:undefined};
		// reevaluate state to handle range violation
		var vector = motionutils.calculateVector(this.timingsrc.vector, this.clock.now());
		var state = motionutils.getCorrectRangeState(vector, this._range);
		if (state !== RangeState.INSIDE) {
			this._preProcess(vector);
		} 
		// re-evaluate query after state transition
		return motionutils.calculateVector(this.vector, this.clock.now());
	};
	
	// overridden
	RangeConverter.prototype._calculateTimeoutVector = function () {
		var freshVector = this.timingsrc.query();
		var res = motionutils.calculateDelta(freshVector, this.range);
		var deltaSec = res[0];
		if (deltaSec === null) return null;
		var position = res[1];
		var vector = motionutils.calculateVector(freshVector, freshVector.timestamp + deltaSec);
		vector.position = position; // avoid rounding errors
		return vector;
	};

	// overrides
	RangeConverter.prototype._onTimeout = function (vector) {		
		return this._onChange(vector);
	};

	// overrides
	RangeConverter.prototype._onChange = function (vector) {
		var new_state = motionutils.getCorrectRangeState(vector, this._range);
		var state_changed = this._state.set(new_state);	
		if (state_changed.real) {
			// state transition between INSIDE and OUTSIDE
			if (this._state.get() === RangeState.INSIDE) {
				// OUTSIDE -> INSIDE, generate fake start event
				// vector delivered by timeout 
				// forward event unchanged
			} else {
				// INSIDE -> OUTSIDE, generate fake stop event
				vector = motionutils.checkRange(vector, this._range);
			}
		}
		else {
			// no state transition between INSIDE and OUTSIDE
			if (this._state.get() === RangeState.INSIDE) {
				// stay inside or first event inside
				// forward event unchanged
			} else {
				// stay outside or first event inside 
				// drop unless 
				// - first event outside
				// - skip from outside-high to outside-low
				// - skip from outside-low to outside-high
				if (state_changed.abs) {
					vector = motionutils.checkRange(vector, this._range);
				} else {
					// drop event

					return null;
				}
			}
		}
		return vector;
	};

	return RangeConverter;
});
/*
	Copyright 2015 Norut Northern Research Institute
	Author : Ingar Mæhlum Arntzen

  This file is part of the Timingsrc module.

  Timingsrc is free software: you can redistribute it and/or modify
  it under the terms of the GNU Lesser General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  Timingsrc is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Lesser General Public License for more details.

  You should have received a copy of the GNU Lesser General Public License
  along with Timingsrc.  If not, see <http://www.gnu.org/licenses/>.
*/

/*
	TIMESHIFT CONVERTER

	Timeshift Converter timeshifts a timing object by timeoffset.
	Positive timeoffset means that the timeshift Converter will run ahead of the source timing object.
	Negative timeoffset means that the timeshift Converter will run behind the source timing object.
	
	Updates affect the converter immediately. This means that update vector must be re-calculated
	to the value it would have at time-shifted time. Timestamps are not time-shifted, since the motion is still live.
	For instance, (0, 1, ts) becomes (0+(1*timeshift), 1, ts) 

	However, this transformation may cause range violation 
		- this happens only when timing object is moving.
		- implementation requires range converter logic

	To fix this, the timeshift converter is always wrapped in a range converter. Range is inherited from timingsrc, if not specified.
*/


define('timingobject/timeshiftconverter',['./timingbase', './rangeconverter'], function (timingbase, RangeConverter) {

	'use strict';

	var motionutils = timingbase.motionutils;
	var ConverterBase = timingbase.ConverterBase;	
	var inherit = timingbase.inherit;



	var TimeShiftConverter = function (timingObject, timeOffset) {
		ConverterBase.call(this, timingObject);
		this._timeOffset = timeOffset;
	};
	inherit(TimeShiftConverter, ConverterBase);

	// overrides
	TimeShiftConverter.prototype._onChange = function (vector) {
		// calculate timeshifted vector
		var newVector = motionutils.calculateVector(vector, vector.timestamp + this._timeOffset);
		newVector.timestamp = vector.timestamp;
		return newVector;
	};

	/*
		Hides wrapping of range converter to specify new ranges.
		If range is not specified, default is to use range of timingObject
	*/
	var RangeTimeShiftConverter = function (timingObject, timeOffset, range) {
		range = range || timingObject.range;
		return new RangeConverter(new TimeShiftConverter(timingObject, timeOffset), range);
	};

	return RangeTimeShiftConverter;
});
/*
	Copyright 2015 Norut Northern Research Institute
	Author : Ingar Mæhlum Arntzen

  This file is part of the Timingsrc module.

  Timingsrc is free software: you can redistribute it and/or modify
  it under the terms of the GNU Lesser General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  Timingsrc is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Lesser General Public License for more details.

  You should have received a copy of the GNU Lesser General Public License
  along with Timingsrc.  If not, see <http://www.gnu.org/licenses/>.
*/


/*
	LOCAL CONVERTER

	Update requests are cached locally, visible to the query
	operation, thus allowing them to take effect immediately
	(speculatively).

	This allows as remote timing object to emulate the low latency of a local timing object.

	A timeout clears the speculative internal vector after some time,
	unless a change notification is received in the mean time.

	NO SUPPORT for STREAMING updates. 
	- This implementation is simple, and does not provide support
	for streaming updates.

	This would require the ability to bind update request to update notification, and to have this
	supported by the timing provider.
*/

define('timingobject/localconverter',['./timingbase'], function (timingbase) {

	'use strict';

	var ConverterBase = timingbase.ConverterBase;	
	var inherit = timingbase.inherit;

	var LocalConverter = function (timingObject) {
		ConverterBase.call(this, timingObject);
		this._speculative = false;
	};
	inherit(LocalConverter, ConverterBase);

	// overrides
	LocalConverter.prototype.update = function (vector) {		
		var newVector = this.timingsrc.update(vector);
		this._speculative = true;
		// process update immediately
		var self = this;
		setTimeout(function () {
			self._preProcess(newVector);
		}, 0);
		return newVector;
	};

	// overrides
	LocalConverter.prototype._onChange = function (vector) {
		if (this._speculative) {
			this._speculative = false;
			// todo - suppress change only if it corresponds to change request sent by self
		}
		return vector;
	};

	return LocalConverter;
});
/*
	Copyright 2015 Norut Northern Research Institute
	Author : Ingar Mæhlum Arntzen

  This file is part of the Timingsrc module.

  Timingsrc is free software: you can redistribute it and/or modify
  it under the terms of the GNU Lesser General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  Timingsrc is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Lesser General Public License for more details.

  You should have received a copy of the GNU Lesser General Public License
  along with Timingsrc.  If not, see <http://www.gnu.org/licenses/>.
*/

/*
	DERIVATIVE CONVERTER

	this Converter implements the derivative of it source timing object.
	
	The velocity of timingsrc becomes the position of the Converter.

	This means that the derivative Converter allows sequencing on velocity of a timing object, 
	by attatching a sequencer on the derivative Converter.
*/

define('timingobject/derivativeconverter',['./timingbase'], function (timingbase) {

	'use strict';

	var ConverterBase = timingbase.ConverterBase;	
	var inherit = timingbase.inherit;

	var DerivativeConverter = function (timingObject, factor) {
		ConverterBase.call(this, timingObject);
	};
	inherit(DerivativeConverter, ConverterBase);

	// overrides
	DerivativeConverter.prototype._getRange = function () { return [-Infinity, Infinity];};

	// overrides
	DerivativeConverter.prototype._onChange = function (vector) {
		var newVector = {
			position : vector.velocity,
			velocity : vector.acceleration,
			acceleration : 0,
			timestamp : vector.timestamp
		};
		return newVector;
	};
	
	DerivativeConverter.prototype.update = function (vector) {
		throw new Error("updates illegal on derivative of timingobject");
	};

	return DerivativeConverter;
});
/*
	Copyright 2015 Norut Northern Research Institute
	Author : Ingar Mæhlum Arntzen

  This file is part of the Timingsrc module.

  Timingsrc is free software: you can redistribute it and/or modify
  it under the terms of the GNU Lesser General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  Timingsrc is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Lesser General Public License for more details.

  You should have received a copy of the GNU Lesser General Public License
  along with Timingsrc.  If not, see <http://www.gnu.org/licenses/>.
*/


define('timingobject/timingprovider',['util/motionutils', 'util/eventutils'], function (motionutils, eventutils) {

	// Polyfill for performance.now as Safari on ios doesn't have it...
	(function(){
	    if ("performance" in window === false) {
	        window.performance = {};
	        window.performance.offset = new Date().getTime();
	    }
	    if ("now" in window.performance === false){
	      window.performance.now = function now(){
	        return new Date().getTime() - window.performance.offset;
	      };
	    }
 	})();

	// local clock in seconds
 	var clock = { now : function () {
		return performance.now()/1000.0;}
	}; 

	// readystates
	var TimingProviderState = Object.freeze({
	    CONNECTING :"connecting",
	    OPEN : "open",
	    CLOSING : "closing",
    	CLOSED : "closed"
	});
	

	/*
		LOCAL TIMING Provider

		Used by timing object if no timing provider is specified.
	*/

	var LocalTimingProvider = function (options) {
		options = options || {};
		// initialise internal state
		this._range = options.range || [-Infinity, Infinity];
		this._vector = {
			position : 0.0,
			velocity : 0.0,
			acceleration : 0.0,
			timestamp : clock.now() // skew 0
		};
		this._skew = 0;
		this._readyState = TimingProviderState.OPEN;
		// events
		eventutils.eventify(this, LocalTimingProvider.prototype);
		this.eventifyDefineEvent("vectorchange", {init:false}); // define vector change event (not supporting init-event)
		this.eventifyDefineEvent("skewchange", {init:false}); // define skew change event (not supporting init-event) 
		this.eventifyDefineEvent("readystatechange", {init:false}) // define readystatechange event (not supporting init-event)

		// set initial vector if provided
		if (options.vector) {
			this.update(options.vector);
		}
	};

	LocalTimingProvider.prototype._setSkew = function (skew) {
		this._skew = skew;
		this.eventifyTriggerEvent("skewchange");
		//this._doCallbacks("skewchange");
	};

	LocalTimingProvider.prototype._setVector = function (vector) {
		this._vector = vector;
		this.eventifyTriggerEvent("vectorchange");
		//this._doCallbacks("vectorchange");
	};

	LocalTimingProvider.prototype.update = function (vector) {
		if (!this._clock === null) throw new Error ("timing provider not ready to accept update");
		if (vector === undefined || vector === null) {throw new Error ("drop update, illegal updatevector");}

		var pos = (vector.position === undefined || vector.position === null) ? undefined : vector.position;
		var vel = (vector.velocity === undefined || vector.velocity === null) ? undefined : vector.velocity;
		var acc = (vector.acceleration === undefined || vector.acceleration === null) ? undefined : vector.acceleration;

		if (pos === undefined && vel === undefined && acc === undefined) {
			throw new Error ("drop update, noop");
		}

		var now = vector.timestamp || clock.now();
		var nowVector = motionutils.calculateVector(this._vector, now);
		nowVector = motionutils.checkRange(nowVector, this._range);
		var p = nowVector.position;
		var v = nowVector.velocity;
		var a = nowVector.acceleration;
		pos = (pos !== undefined) ? pos : p;
		vel = (vel !== undefined) ? vel : v;
		acc = (acc !== undefined) ? acc : a;
		var newVector = {
			position : pos,
			velocity : vel,
			acceleration : acc,
			timestamp : now
		};
		// break control flow
		var self = this;
		setTimeout(function () {
			self._setVector(newVector);
		});
		return newVector;
	};
	

	Object.defineProperty(LocalTimingProvider.prototype, 'range', {
		get : function () { 
			// copy internal range
			return [this._range[0], this._range[1]];
		}
	});

	Object.defineProperty(LocalTimingProvider.prototype, 'skew', {
		get : function () { return this._skew;}
	});

	Object.defineProperty(LocalTimingProvider.prototype, 'vector', {
		get : function () { return this._vector; }
	});

	Object.defineProperty(LocalTimingProvider.prototype, 'readyState', {
		get : function () { return this._readyState; }
	});

	return {
		LocalTimingProvider: LocalTimingProvider,
		TimingProviderState : TimingProviderState
	};
});
/*
	Copyright 2015 Norut Northern Research Institute
	Author : Ingar Mæhlum Arntzen

  This file is part of the Timingsrc module.

  Timingsrc is free software: you can redistribute it and/or modify
  it under the terms of the GNU Lesser General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  Timingsrc is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Lesser General Public License for more details.

  You should have received a copy of the GNU Lesser General Public License
  along with Timingsrc.  If not, see <http://www.gnu.org/licenses/>.
*/


define('util/timeoututils',[],function () {

	'use strict';

	/*
	  TIMEOUT

	  Wraps setTimeout() to implement improved version
	  - guarantee that timeout does not wake up too early
	  - offers precise timeout by "busy"-looping just before timeout 
	  - wraps a single timeout
	  - clock operates in seconds
	  - parameters expected in seconds - breaking conformance with setTimeout
	  - wakes up 3 seconds before on long timeouts to readjust
	*/

	var Timeout = function (clock, callback, delay, options) {	
		// clock
		this._clock = clock; // seconds
		var now = this._clock.now(); // seconds
		// timeout
		this._tid = null;
		this._callback = callback;
		this._delay_counter = 0;
		this._options = options || {};

		// options
		this._options.anchor = this._options.anchor || now; // seconds
		this._options.early = Math.abs(this._options.early) || 0; // seconds
		this._target = this._options.anchor + delay; // seconds

		// Initialise
		var self = this;
		window.addEventListener("message", this, true); // this.handleEvent
		var time_left = this._target - this._clock.now(); // seconds
		if (time_left > 10) {
			// long timeout > 10s - wakeup 3 seconds earlier to readdjust
			this._tid = setTimeout(function () {self._ontimeout();}, time_left - 3000);
		} else {
			// wake up just before
			this._tid = setTimeout(function () {self._ontimeout();}, (time_left - self._options.early)*1000);
		}
	};

	Object.defineProperty(Timeout.prototype, 'target', {
		get : function () { 
			return this._target;
		}
	});

	// Internal function
	Timeout.prototype._ontimeout = function () {
	    if (this._tid !== null) {
	    	var time_left = this._target - this._clock.now(); // seconds
			if (time_left <= 0) {
			    // callback due
			    this.cancel();
			    this._callback();
			} else if (time_left > this._options.early) {
				// wakeup before target - options early sleep more
				var self = this;
				this._tid = setTimeout(function () {self._ontimeout();}, (time_left - this._options.early)*1000);
			} else {
				// wake up just before (options early) - event loop
			    this._smalldelay();
			}
	    }
	};
	
	// Internal function - handler for small delays
	Timeout.prototype.handleEvent = function (event) {
	    if (event.source === window && event.data.indexOf("smalldelaymsg_") === 0) {
			event.stopPropagation();
			// ignore if timeout has been canceled
			var the_tid = parseInt(event.data.split("_")[1]);
			if (this._tid !== null && this._tid === the_tid) {
			    this._ontimeout();
			}
	    }
	};

	Timeout.prototype._smalldelay = function () {
	    this._delay_counter ++;
	    var self = this;
	    window.postMessage("smalldelaymsg_" + self._tid, "*");
	};

	Timeout.prototype.cancel = function () {
	    if (this._tid !== null) {
			clearTimeout(this._tid);
			this._tid = null;
			var self = this;
			window.removeEventListener("message", this, true);
	    }
	};
	
	// return module object
	return {
		setTimeout: function (clock, callback, delay, options) {
			return new Timeout(clock, callback, delay, options);
		}
	};
});


/*
	Copyright 2015 Norut Northern Research Institute
	Author : Ingar Mæhlum Arntzen

  This file is part of the Timingsrc module.

  Timingsrc is free software: you can redistribute it and/or modify
  it under the terms of the GNU Lesser General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  Timingsrc is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Lesser General Public License for more details.

  You should have received a copy of the GNU Lesser General Public License
  along with Timingsrc.  If not, see <http://www.gnu.org/licenses/>.
*/


/*
	MASTER CLOCK


	MasterClock is the reference clock used by TimingObjects.
	
	It is implemented using performance.now,
	but is skewed and rate-adjusted relative to this local clock.

	This allows it to be used as a master clock in a distributed system,
	where synchronization is generally relative to some other clock than the local clock. 

	The master clock may need to be adjusted in time, for instance as a response to 
	varying estimation of clock skew or drift. The master clock supports an adjust primitive for this purpose.
 
	What policy is used for adjusting the master clock may depend on the circumstances
	and is out of scope for the implementation of the MasterClock.
	This policy is implemented by the timing object. This policy may or may not
	provide monotonicity.

	A change event is emitted every time the masterclock is adjusted.
	
	Vector values define 
	- position : absolute value of the clock in seconds
	- velocity : how many seconds added per second (1.0 exactly - or very close)
	- timestamp : timstamp from local system clock (performance) in seconds. Defines point in time where position and velocity are valid.

	If initial vector is not provided, default value is 
	{position: now, velocity: 1.0, timestamp: now};
	implying that master clock is equal to local clock.
*/

define('util/masterclock',['./eventutils', './timeoututils'], function (eventutils, timeoututils) {

	'use strict';

	// Need a polyfill for performance,now as Safari on ios doesn't have it...
	(function(){
	    if ("performance" in window === false) {
	        window.performance = {};
	        window.performance.offset = new Date().getTime();
	    }
	    if ("now" in window.performance === false){
	      window.performance.now = function now(){
	        return new Date().getTime() - window.performance.offset;
	      };
	    }
 	})();

	// local clock in seconds
	var localClock = {
		now : function () {return performance.now()/1000.0;}
	}; 

	var calculateVector = function (vector, tsSec) {
		if (tsSec === undefined) tsSec = localClock.now();
		var deltaSec = tsSec - vector.timestamp;	
		return {
			position : vector.position + vector.velocity*deltaSec,
			velocity : vector.velocity, 
			timestamp : tsSec
		};
	};

	var MasterClock = function (options) {
		var now = localClock.now();
		options = options || {};
		this._vector  = {position: now, velocity: 1.0, timestamp: now};	
		// event support
		eventutils.eventify(this, MasterClock.prototype);
		this.eventifyDefineEvent("change"); // define change event (no init-event)
		// adjust
		this.adjust(options);
	};

	/*
		ADJUST
		- could also accept timestamp for velocity if needed?
		- given skew is relative to local clock 
		- given rate is relative to local clock
	*/
	MasterClock.prototype.adjust = function (options) {
		options = options || {};
		var now = localClock.now();
		var nowVector = this.query(now);
		if (options.skew === undefined && options.rate === undefined) {
			return;
		}
		this._vector = {
			position : (options.skew !== undefined) ? now + options.skew : nowVector.position,
			velocity : (options.rate !== undefined) ? options.rate : nowVector.velocity,
			timestamp : nowVector.timestamp
		}
		this.eventifyTriggerEvent("change");
	};

	/*
		NOW
		- calculates the value of the clock right now
		- shorthand for query
	*/
	MasterClock.prototype.now = function () {
		return calculateVector(this._vector, localClock.now()).position;
	};

	/* 
		QUERY 
		- calculates the state of the clock right now
		- result vector includes position and velocity		
	*/
	MasterClock.prototype.query = function (now) {
		return calculateVector(this._vector, now);
	};

	/*
		Timeout support
	*/
	MasterClock.prototype.setTimeout = function (callback, delay, options) {
		return timeoututils.setTimeout(this, callback, delay, options);
	};

	return MasterClock;
});
/*
	Copyright 2015 Norut Northern Research Institute
	Author : Ingar Mæhlum Arntzen

  This file is part of the Timingsrc module.

  Timingsrc is free software: you can redistribute it and/or modify
  it under the terms of the GNU Lesser General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  Timingsrc is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Lesser General Public License for more details.

  You should have received a copy of the GNU Lesser General Public License
  along with Timingsrc.  If not, see <http://www.gnu.org/licenses/>.
*/


/*
	TIMING OBJECT

	range and initial vector may be specified.

	master clock is the clock used by the timing object.
	timestamps in vectors refer to this clock.

	for local timing objects master clock is equal to performance.now
	for timing objects with a timing provider, the master clock will be
	maintained as a representation of the clock used by the timing provider.
	
*/

define('timingobject/timingobject',['./timingbase', './timingprovider', 'util/masterclock'], function (timingbase, timingprovider, MasterClock) {

	'use strict';

	var motionutils = timingbase.motionutils;	
	var TimingBase = timingbase.TimingBase;
	var inherit = timingbase.inherit;
	var LocalTimingProvider = timingprovider.LocalTimingProvider;
	var TimingProviderState = timingprovider.TimingProviderState;

	var TimingObject = function (options) {
		options = options || {};
		TimingBase.call(this, {timeout:true});
		this._clock = null;
		this._range = null;
		this._vector = null;

		// timing provider
		var self = this;
		this._provider = options.provider || new LocalTimingProvider(options);
		this._onSkewChangeWrapper = function () {self._onSkewChange();};
		this._onVectorChangeWrapper = function () {self._onVectorChange();};
		this._onReadystateChangeWrapper = function () {self._onReadystateChange();};
		this._provider.on("readystatechange", this._onReadystateChangeWrapper, this);

		// initialise
		this._initialise();
	};
	inherit(TimingObject, TimingBase);

	TimingObject.prototype._initialise = function () {
		if (this._provider.readyState !== TimingProviderState.OPEN) return;
		if (this._clock === null) {
			this._range = this._provider.range;
			this._clock = new MasterClock({skew: this._provider.skew});
			this._preProcess(this._provider.vector);
			this._provider.on("vectorchange", this._onVectorChangeWrapper, this);
			this._provider.on("skewchange", this._onSkewChangeWrapper, this);
		}
	};

	TimingObject.prototype._onReadystateChange = function () {
		this._initialise();
	};

	TimingObject.prototype._onSkewChange = function () {
		this._clock.adjust({skew: this._provider.skew});
	};

	TimingObject.prototype._onVectorChange = function () {
		this._preProcess(this._provider.vector);		
	};

	// Accessors for timing object
	Object.defineProperty(TimingObject.prototype, 'clock', {
		get : function () {	return this._clock; }	
	});
	Object.defineProperty(TimingObject.prototype, 'provider', {
		get : function () {return this._provider; }
	});

	// overrides
	TimingObject.prototype.query = function () {
		if (this.vector === null) return {position:undefined, velocity:undefined, acceleration:undefined};
		// reevaluate state to handle range violation
		var vector = motionutils.calculateVector(this.vector, this.clock.now());
		var state = motionutils.getCorrectRangeState(vector, this._range);
		if (state !== motionutils.RangeState.INSIDE) {
			this._preProcess(vector);
		} 
		// re-evaluate query after state transition
		return motionutils.calculateVector(this.vector, this.clock.now());
	};

	TimingObject.prototype.update = function (vector) {
		return this._provider.update(vector);
	};

	TimingObject.prototype._onChange = function (vector) {
		return motionutils.checkRange(vector, this._range);
	};

	// overrides
	TimingObject.prototype._calculateTimeoutVector = function () {
		var freshVector = this.query();
		var res = motionutils.calculateDelta(freshVector, this.range);
		var deltaSec = res[0];
		if (deltaSec === null) return null;
		if (deltaSec === Infinity) return null;
		var position = res[1];
		var vector = motionutils.calculateVector(freshVector, freshVector.timestamp + deltaSec);
		vector.position = position; // avoid rounding errors
		return vector;
	};

	// overrides
	TimingObject.prototype._onTimeout = function (vector) {		
		return motionutils.checkRange(vector, this._range);
	};

	return TimingObject;
});
/*
	Copyright 2015 Norut Northern Research Institute
	Author : Ingar Mæhlum Arntzen

  This file is part of the Timingsrc module.

  Timingsrc is free software: you can redistribute it and/or modify
  it under the terms of the GNU Lesser General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  Timingsrc is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Lesser General Public License for more details.

  You should have received a copy of the GNU Lesser General Public License
  along with Timingsrc.  If not, see <http://www.gnu.org/licenses/>.
*/

define('timingobject/main',[
	'./timingbase', 
	'./skewconverter', 
	'./delayconverter', 
	'./scaleconverter', 
	'./loopconverter', 
	'./rangeconverter', 
	'./timeshiftconverter', 
	'./localconverter', 
	'./derivativeconverter',
	'./timingobject',
	'./timingprovider'], 
	function (timingbase, SkewConverter, DelayConverter, ScaleConverter, LoopConverter, RangeConverter, TimeShiftConverter, LocalConverter, DerivativeConverter, TimingObject, timingprovider) {		
		'use strict';
		return {
			inherit : timingbase.inherit,
			ConverterBase : timingbase.ConverterBase,
			SkewConverter : SkewConverter,
			DelayConverter : DelayConverter,
			ScaleConverter : ScaleConverter,
			LoopConverter : LoopConverter,
			RangeConverter : RangeConverter,
			TimeShiftConverter : TimeShiftConverter,
			LocalConverter : LocalConverter,
			DerivativeConverter : DerivativeConverter,
			TimingObject : TimingObject,
			TimingProviderState: timingprovider.TimingProviderState
		};
	}
);
/*
	Copyright 2015 Norut Northern Research Institute
	Author : Ingar Mæhlum Arntzen

  This file is part of the Timingsrc module.

  Timingsrc is free software: you can redistribute it and/or modify
  it under the terms of the GNU Lesser General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  Timingsrc is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Lesser General Public License for more details.

  You should have received a copy of the GNU Lesser General Public License
  along with Timingsrc.  If not, see <http://www.gnu.org/licenses/>.
*/

define('util/interval',[],function () {

	'use strict';

	/*
		INTERVAL
	*/

	var isNumber = function(n) {
		var N = parseFloat(n);
	    return (n===N && !isNaN(N));
	};

	var IntervalError = function (message) {
		this.name = "IntervalError";
		this.message = (message||"");
	};
	IntervalError.prototype = Error.prototype;


	var Interval = function (low, high, lowInclude, highInclude) {
		var lowIsNumber = isNumber(low);
		var highIsNumber = isNumber(high);
		// new Interval(3.0) defines singular - low === high
		if (lowIsNumber && high === undefined) high = low; 
		if (!isNumber(low)) throw new IntervalError("low not a number");
		if (!isNumber(high)) throw new IntervalError("high not a number");	
		if (low > high) throw new IntervalError("low > high");
		if (low === high) {
			lowInclude = true;
			highInclude = true;
		}
		if (low === -Infinity) lowInclude = true;
		if (high === Infinity) highInclude = true;
		if (lowInclude === undefined) lowInclude = true;
		if (highInclude === undefined) highInclude = false;
		if (typeof lowInclude !== "boolean") throw new IntervalError("lowInclude not boolean");
		if (typeof highInclude !== "boolean") throw new IntervalError("highInclude not boolean");
		this.__defineGetter__("length", function () {return high - low;});
		this.__defineGetter__("low", function () {return low;});
		this.__defineGetter__("high", function () {return high;});
		this.__defineGetter__("lowInclude", function () {return lowInclude;});
		this.__defineGetter__("highInclude", function () {return highInclude;});
	};


	Interval.prototype.toString = function () {
		var lowBracket = (this.lowInclude) ? "[" : "<";
		var highBracket = (this.highInclude) ? "]" : ">";
		var low = (this.low === -Infinity) ? "<--" : this.low.toFixed(2);
		var high = (this.high === Infinity) ? "-->" : this.high.toFixed(2);
		if (this.isSingular())
			return lowBracket + low + highBracket;
		return lowBracket + low + ',' + high + highBracket;
	};
	Interval.prototype.isFinite = function () { 
		return (isFinite(this.low) && isFinite(this.high));
	};
	Interval.prototype.isSingular = function () {
		return (this.low === this.high);
	};
	Interval.prototype.coversPoint = function (x) {
		if (this.low < x && x < this.high) return true;
		if (this.lowInclude && x === this.low) return true;
		if (this.highInclude && x === this.high) return true;
		return false;
	};

	// overlap : it exists at least one point x covered by both interval 
	Interval.prototype.overlapsInterval = function (other) {
		if (other instanceof Interval === false) throw new IntervalError("paramenter not instance of Interval");	
		// singularities
		if (this.isSingular() && other.isSingular()) 
			return (this.low === other.low);
		if (this.isSingular())
			return other.coversPoint(this.low);
		if (other.isSingular())
			return this.coversPoint(other.low); 
		// not overlap right
		if (this.high < other.low) return false;
		if (this.high === other.low) {
			return this.coversPoint(other.low) && other.coversPoint(this.high);
		}
		// not overlap left
		if (this.low > other.high) return false;
		if (this.low === other.high) {
			return (this.coversPoint(other.high) && other.coversPoint(this.low));
		}
		return true;
	};
	Interval.prototype.coversInterval = function (other) {
		if (other instanceof Interval === false) throw new IntervalError("paramenter not instance of Interval");
		if (other.low < this.low || this.high < other.high) return false;
		if (this.low < other.low && other.high < this.high) return true;
		// corner case - one or both endpoints are the same (the other endpoint is covered)
		if (this.low === other.low && this.lowInclude === false && other.lowInclude === true)
			return false;
		if (this.high === other.high && this.highInclude === false && other.highInclude === true)
			return false;
		return true;
	};
	Interval.prototype.equals = function (other) {
		if (this.low !== other.low) return false;
		if (this.high !== other.high) return false;
		if (this.lowInclude !== other.lowInclude) return false;
		if (this.highInclude !== other.highInclude) return false;
		return true;
	};

	/* 
		Possibility for more interval methods such as union, intersection, 
	*/

	return Interval;
});


/*
    Copyright 2015 Norut Northern Research Institute
    Author : Ingar Mæhlum Arntzen

  This file is part of the Timingsrc module.

  Timingsrc is free software: you can redistribute it and/or modify
  it under the terms of the GNU Lesser General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  Timingsrc is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Lesser General Public License for more details.

  You should have received a copy of the GNU Lesser General Public License
  along with Timingsrc.  If not, see <http://www.gnu.org/licenses/>.
*/


define ('sequencing/sortedarraybinary',['util/interval'], function (Interval) {

    'use strict';

    // check if n is a number
    var is_number = function(n) {
    	var N = parseFloat(n);
        return (n==N && !isNaN(N));
    };


    var SortedArrayError = function (message) {
        this.name = "SortedArrayError";
        this.message = (message||"");
    };
    SortedArrayError.prototype = Error.prototype;

    /*

    SORTED ARRAY BINARY

    */

    var SortedArrayBinary = function () {
    	/*
    	  use binary search to implement sorted insert
    	  guard against duplicates
    	 */
    	this.array = [];
    };
    	
    /**
     * Binary search on sorted array
     * @param {*} searchElement The item to search for within the array.
     * @return {Number} The index of the element which defaults to -1 when not found.
     */
    SortedArrayBinary.prototype.binaryIndexOf = function (searchElement) {
        var minIndex = 0;
        var maxIndex = this.array.length - 1;
        var currentIndex;
        var currentElement;
        while (minIndex <= maxIndex) {
    		currentIndex = (minIndex + maxIndex) / 2 | 0;
    		currentElement = this.array[currentIndex];
    		if (currentElement < searchElement) {
    		    minIndex = currentIndex + 1;
    		}
    		else if (currentElement > searchElement) {
    		    maxIndex = currentIndex - 1;
    		}
    		else {
    		    return currentIndex;
    		}
        }
    	return ~maxIndex;
    	
        // NOTE : ambiguity?
        // search for minimum element returns 0 if it exists, and 0 if it does not exists
    };
    	
    SortedArrayBinary.prototype.insert = function (element) {
        var index = this.binaryIndexOf(element);
        if (index < 0 || (index === 0 && this.array[0] !== element)) { 
    		this.array.splice(Math.abs(index), 0, element);
        }
    };

    SortedArrayBinary.prototype.indexOf = function (element) {
        var index = this.binaryIndexOf(element);
        if (index < 0 || (index === 0 && this.array[0] !== element)) { 
    		return -1;
        } else {
    		return index;
        }
    };

    SortedArrayBinary.prototype.hasElement = function (element) {
        var index = this.binaryIndexOf(element);
        if (index < 0 || (index === 0 && this.array[0] !== element)) { 
    		return false;
        } else {
    		return true;
        }
    };

    SortedArrayBinary.prototype.remove = function (element) {
        var index = this.binaryIndexOf(element);
        if (index < 0 || (index === 0 && this.array[0] !== element)) { 
    		return;
        } else {
    		this.array.splice(index, 1);
        }
    };

    SortedArrayBinary.prototype.getMinimum = function () {
        return (this.array.length > 0) ? this.array[0] : null;
    };

    SortedArrayBinary.prototype.getMaximum = function () {
        return (this.array.length > 0) ? this.array[this.array.length - 1] : null;
    };

    /* 
       Find index of largest value less than x
       Returns -1 if noe values exist that are less than x
     */
    SortedArrayBinary.prototype.ltIndexOf = function(x) {
        var i = this.binaryIndexOf(x);
        // consider element to the left
        i = (i < 0) ? Math.abs(i) - 1 : i - 1;
        return (i >= 0) ? i : -1;
    };

    /* 
       Find index of largest value less than x or equal to x 
       Returns -1 if noe values exist that are less than x or equal to x
     */
    SortedArrayBinary.prototype.leIndexOf = function(x) {
        var i = this.binaryIndexOf(x);
        // equal
        if (i > 0 || (i === 0 && this.array[0] === x)) {
    		return i;
        }
        // consider element to the left
        i = Math.abs(i) - 1;
        return (i >= 0) ? i : -1;
    };

    /* 
       	Find index of smallest value greater than x
       	Returns -1 if noe values exist that are greater than x

    	note ambiguity :
    	
    	search for for an element that is less than array[0]
    	should return a negative value indicating that the element 
    	was not found. Furthermore, as it escapes the while loop
    	the returned value should indicate the index that this element 
    	would have had - had it been there - as is the idea of this bitwise 
    	or trick
    	
    	it should return a negative value x so that
    	Math.abs(x) - 1 gives the correct index which is 0
    	thus, x needs to be -1

    	instead it returns 0 - indicating that the non-existing value
    	was found!
    	
    	I think this bug is specific to breaking out on (minIndex,maxIndex) === (0,-1)



    */

    SortedArrayBinary.prototype.gtIndexOf = function (x) {
        var i = this.binaryIndexOf(x);
        
    	// ambiguity if i === 0
    	if (i === 0) {
    		if (this.array[0] === x) {
    			// found element - need to exclude it
    			// since this is gt it is element to the right
    			i = 1;
    		} else {
    			// did not find element 
    			// - the first element is the correct
    			// i === 0
    		}
    	}
    	else {		
    		i = (i < 0) ? Math.abs(i): i + 1;
    	}
        return (i < this.array.length) ? i : -1;
    };


    /* 
       Find index of smallest value greater than x or equal to x 
       Returns -1 if noe values exist that are greater than x or equal to x
     */

     SortedArrayBinary.prototype.geIndexOf = function(x) {
        var i = this.binaryIndexOf(x);
        // equal
        if (i > 0 || (i === 0 && this.array[0] === x)) {
    		return i;
        }
    	/*		    
    	if (i === 0) {
        	// ambiguity - either there is no element > x or array[0] is the smallest value > x
        	if (array.length >= 0 && array[0] > x) {
        		return 0;
        	} else return -1;
        } else {
        	// consider element to the right
        	i = Math.abs(i);
    	}
    	*/
    	i = Math.abs(i);	
        return (i < this.array.length) ? i : -1;
    };

    SortedArrayBinary.prototype.indexOf = function (element) {
        var index = this.binaryIndexOf(element);
        if (index < 0 || (index === 0 && this.array[0] !== element)) { 
    		return -1;
        } else {
    		return index;
        }
    };

    SortedArrayBinary.prototype.lookup = function (interval) {
    	if (interval === undefined) 
    		interval = new Interval(-Infinity, Infinity, true, true);
    	if (interval instanceof Interval === false) 
            throw new SortedArrayError("lookup requires Interval argument");
        var start_index = -1, end_index = -1;
        if (interval.lowInclude) {
    		start_index = this.geIndexOf(interval.low);
        } else {
    		start_index = this.gtIndexOf(interval.low);
        }
        if (start_index === -1) {
    		return [];
        }
        if (interval.highInclude) {
    		end_index = this.leIndexOf(interval.high);
        } else {
    		end_index = this.ltIndexOf(interval.high);
        }
        if (end_index === -1) { // not reachable - I think
    		return [];
        }
        return this.array.slice(start_index, end_index + 1);
    };

    SortedArrayBinary.prototype.get = function (i) {return this.array[i];};
    SortedArrayBinary.prototype.list = function () {return this.array;};

    return SortedArrayBinary;
});




/*
	Copyright 2015 Norut Northern Research Institute
	Author : Ingar Mæhlum Arntzen

  This file is part of the Timingsrc module.

  Timingsrc is free software: you can redistribute it and/or modify
  it under the terms of the GNU Lesser General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  Timingsrc is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Lesser General Public License for more details.

  You should have received a copy of the GNU Lesser General Public License
  along with Timingsrc.  If not, see <http://www.gnu.org/licenses/>.
*/

define ('sequencing/multimap',[],function () {

	'use strict';

	/*
		MULTI MAP

	  	MultiMap stores (key,value) tuples  
	  	- one key may be bound to multiple values  
		- protection from duplicate (key, value) bindings.
		- values are not assumed to be unique, i.e., the same value may be
	  	associated with multiple points.
	  
		MultiMap supports addition and removal of (key,value) bindings.  
		- insert (key, value) 
		- remove (key, value)
	*/

	var MultiMap = function () {
		this._map = {}; // key -> [value,]
	};

	MultiMap.prototype.insert = function (key, value) {
	    return this.insertAll([{key:key, value:value}]);
	};

	MultiMap.prototype.insertAll = function (tuples) {
	    var values, added = [];
	    tuples.forEach(function (tuple){
	    	if (!this._map.hasOwnProperty(tuple.key)) {
			    this._map[tuple.key] = [];
			}
			// protect against duplicate (key,value) bindings
			values = this._map[tuple.key];
			if (values.indexOf(tuple.value) === -1) {
			    values.push(tuple.value);
			    added.push(tuple);
			}
	    }, this);
	    return added;
	};

	MultiMap.prototype.remove = function (key, value) {
	    return this.removeAll([{key:key, value:value}]);
	};

	MultiMap.prototype.removeAll = function (tuples) {
		var index, values, removed = [];
		tuples.forEach(function (tuple) {
			if (this._map.hasOwnProperty(tuple.key)) {
			    values = this._map[tuple.key];
			    index = values.indexOf(tuple.value);
			    if (index > -1) {
					values.splice(index, 1);
					removed.push(tuple);
					// clean up if empty
					if (values.length === 0) {
					    delete this._map[tuple.key];
					}
			    }
			}
		}, this);
	    return removed;
	};

	MultiMap.prototype.hasKey = function (key) {
		return this._map.hasOwnProperty(key);
	};

	MultiMap.prototype.keys = function () {
		return Object.keys(this._map);
	};

	MultiMap.prototype.getItemsByKey = function (key) {
		var res = [];
		if (this.hasKey(key)) {
			this._map[key].forEach(function (value) {
				res.push({key: key, value: value});
			});	
		}
		return res;
	};

	MultiMap.prototype.getItemsByKeys = function (_keys) {
		if (_keys === undefined) _keys = this.keys();
		var res = [];
		_keys.forEach(function (key) {
			res = res.concat(this.getItemsByKey(key));	
		}, this);
		return res;
	};
	MultiMap.prototype.list = MultiMap.prototype.getItemsByKeys;

	return MultiMap;
});



/*
	Copyright 2015 Norut Northern Research Institute
	Author : Ingar Mæhlum Arntzen

  This file is part of the Timingsrc module.

  Timingsrc is free software: you can redistribute it and/or modify
  it under the terms of the GNU Lesser General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  Timingsrc is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Lesser General Public License for more details.

  You should have received a copy of the GNU Lesser General Public License
  along with Timingsrc.  If not, see <http://www.gnu.org/licenses/>.
*/


define ('sequencing/axis',['util/interval', './sortedarraybinary', './multimap'], 
	function (Interval, SortedArrayBinary, MultiMap) {

	'use strict';

	var AxisError = function (message) {
		this.name = "AxisError";
		this.message = (message || "");
	};
	AxisError.prototype = Error.prototype;


	// Operation Types
	var OpType = Object.freeze({
		NOOP : "noop",
		CREATE: "create",
		UPDATE: "update",
		REMOVE: "remove"
	});

	// POINT TYPES
    var PointType = Object.freeze({
		LOW: "low",
		SINGULAR: "singular",
		HIGH: "high",
		INSIDE: "inside",
		OUTSIDE: "outside",
		toInteger: function (s) {
		    if (s === PointType.LOW) return -1;
		    if (s === PointType.HIGH) return 1;
		    if (s === PointType.INSIDE) return 2;
		    if (s === PointType.OUTSIDE) return 3;
		    if (s === PointType.SINGULAR) return 0;
		    throw new AxisError("illegal string value for point type");
		},
		fromInteger: function (i) {
			if (i === -1) return PointType.LOW;
			else if (i === 0) return PointType.SINGULAR;
			else if (i === 1) return PointType.HIGH;
			else if (i === 2) return PointType.INSIDE;
			else if (i === 3) return PointType.OUTSIDE;
			throw new AxisError("illegal integer value for point type");
		}
    });


	/*
		AXIS

		Manages a collection of Intervals.
		Each interval is identified by a key, and may be inserted or removed using the key, just like a map/dictionary.
		Interval objects represents an interval on the Axis or real floating point numbers.

		In addition to key access, the Axis provides efficient access to Intervals by search.
		- lookupByInterval (searchInterval) returns all Intervals whose endpoints are covered by given search Interval
		- lookupByPoint (x) returns all Intervals in the collection that covers given point.
	*/

	var Axis = function () {
		// Mapping key to Intervals
		this._map = {}; // key -> Interval(point,point)
		// Revers-mapping Interval points to Interval keys
		this._reverse = new MultiMap(); // point -> [key, ...]
		// Index for searching Intervals effectively by endpoints - used by lookupByInterval
		this._index = new SortedArrayBinary(); // [point, point, ...]
		// No index provided for lookupByPoint

		// Callbacks - change event - list of axis operations
		this._callbacks = {'change': []};
	};

	// internal helper function to insert (key, interval) into map, reverse and index
	Axis.prototype._insert = function (key, interval) {
		// map
		this._map[key] = interval;
		// index add to index if reverse is empty before insert
		if (!this._reverse.hasKey(interval.low)) {
			this._index.insert(interval.low);
		}
		if (!this._reverse.hasKey(interval.high)) {
			this._index.insert(interval.high);
		}
		// reverse index
		this._reverse.insert(interval.low, key);
		this._reverse.insert(interval.high, key);
	};



	// internal helper function to clean up map, reverse and index during (key,interval) removal
	Axis.prototype._remove = function (key) {
		if (!this._map.hasOwnProperty(key)) 
			throw new AxisError("attempt to remove non-existing key");
		var interval = this._map[key];
		// map
		delete this._map[key];
		// reverse
		this._reverse.remove(interval.low, key);
		this._reverse.remove(interval.high, key);
		// index remove from index if reverse is empty after remove
		if (!this._reverse.hasKey(interval.low)) {
			this._index.remove(interval.low);
		}
		if (!this._reverse.hasKey(interval.high)) {
			this._index.remove(interval.high);
		}
		// return old interval
		return interval;		
	};


	/*
		UPDATEALL
		- process a batch of operations
		- creates, replaces or removes args [{key:key, interval:interval},] 
	*/
	Axis.prototype.updateAll = function (args) {
		var e, elist = [], oldInterval, key, interval;
		args.forEach(function(arg){
			key = arg.key;
			if (typeof key !== 'string') throw new AxisError("key is " + typeof key + " - must be string");
			interval = arg.interval;
			// INTERVAL is undefined
			if (interval === undefined) {
				if (this._map.hasOwnProperty(key)) {
					// REMOVE
					oldInterval = this._remove(key);
					e = {type: OpType.REMOVE, key: key, interval: oldInterval, data: arg.data};
				} else {
					// NOOP
					e = {type: OpType.NOOP, key: key, interval: undefined, data: undefined};
				}
			} 
			// INTERVAL defined
			else {
				if (interval instanceof Interval === false) throw new AxisError("parameter must be instanceof Interval");
				if (this._map.hasOwnProperty(key)) {
					oldInterval = this._map[key];

					if (interval.equals(oldInterval)) {
						e = {type: OpType.NOOP, key: key, interval: oldInterval, data: arg.data};
					} else {
						this._remove(key);
						this._insert(key, interval);
						e = {type: OpType.UPDATE, key: key, interval: interval, data: arg.data};
					}
				} else {
					// CREATE
					this._insert(key, interval);
					e = {type: OpType.CREATE, key: key, interval: interval, data: arg.data};
				}
			}
			elist.push(e);
		}, this);
		// trigger events
		this._doCallbacks("change", elist);
		// return elist
		return elist;	
	};

	// shorthand for update single (key, interval) pair
	Axis.prototype.update = function (key, interval) {
		return this.updateAll([{key:key, interval:interval}]);
	};

	/*
		AXIS EVENTS
	*/

	// register callback
	Axis.prototype.on = function (what, handler, ctx) {
    	if (!handler || typeof handler !== "function") 
    		throw new AxisError("Illegal handler");
    	if (!this._callbacks.hasOwnProperty(what)) 
    		throw new AxisError("Unsupported event " + what);
    	var index = this._callbacks[what].indexOf(handler);
        if (index === -1) {
        	// register handler
        	handler["_ctx_"] = ctx || this;
        	this._callbacks[what].push(handler);
        }
        return this;
    };

	// unregister callback
    Axis.prototype.off = function (what, handler) {
    	if (this._callbacks[what] !== undefined) {
    		var index = this._callbacks[what].indexOf(handler);
        	if (index > -1) {
        		this._callbacks[what].splice(index, 1);
	  		}
    	}
    	return this;
    };

    // perform callback
    Axis.prototype._doCallbacks = function(what, e) {
	 	var err;
		// invoke callback handlers
		this._callbacks[what].forEach(function(h) {
			try {
	          h.call(h["_ctx_"], e);
	        } catch (err) {
	          console.log("Error in " + what + ": " + h + ": " + err);
	        }	    
		}, this);
    };


    /*
		AXIS SEARCH
    */

	/*
		Find (key,interval) pairs for intervals that cover x.
		Simply scan all intervals in collection - no index provided.
		x undefined means all (key, interval)
	*/
	Axis.prototype.lookupByPoint = function (x) {
		var interval, res = [];
		Object.keys(this._map).forEach(function(key){
			interval = this._map[key];
			if (x === undefined || interval.coversPoint(x)) {
				res.push({key:key, interval: interval});
			}
		}, this);
		return res;
	};

	/*
		Find all interval endpoints within given interval 
	*/
	Axis.prototype.lookupByInterval = function (interval) {
		// [point,]
		var points = this._index.lookup(interval);
		// [{key: key, point: point, interval:interval},]
		var res = [], items, point;
		this._index.lookup(interval).forEach(function (point) {
			this._reverse.getItemsByKey(point).forEach(function (item) {
				point = item.key;
				interval = this._map[item.value];
				res.push({
					key: item.value,
					interval: interval,
					point: point,
					pointType: this.getPointType(point, interval)
				});
			}, this);
		}, this);
		return res;
	};

	Axis.prototype.items = function () {return this.lookupByPoint();};
	Axis.prototype.keys = function () {return Object.keys(this._map);};

	Axis.prototype.getPointType = function (point, interval) {
		if (interval.isSingular() && point === interval.low) return PointType.SINGULAR;
	    if (point === interval.low) return PointType.LOW;
	    if (point === interval.high) return PointType.HIGH;
	    if (interval.low < point && point < interval.high) return PointType.INSIDE;
	    else return PointType.OUTSIDE;
	};

	Axis.prototype.getIntervalByKey = function (key) {
		return this._map[key];
	};

	Axis.prototype.hasKey = function (key) {
		return this._map.hasOwnProperty(key);
	};

	// module definition
	return {
		Axis: Axis,
		OpType : OpType,
		PointType: PointType
	};
});


/*
	Copyright 2015 Norut Northern Research Institute
	Author : Ingar Mæhlum Arntzen

  This file is part of the Timingsrc module.

  Timingsrc is free software: you can redistribute it and/or modify
  it under the terms of the GNU Lesser General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  Timingsrc is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Lesser General Public License for more details.

  You should have received a copy of the GNU Lesser General Public License
  along with Timingsrc.  If not, see <http://www.gnu.org/licenses/>.
*/

define('sequencing/sequencer',['util/motionutils', 'util/eventutils', 'util/interval', './axis'], 
	function (motionutils, eventutils, Interval, axis)  {

	'use strict';

	// UTILITY

	var isMoving = function (vector) {
		return (vector.velocity !== 0.0 || vector.acceleration !== 0.0);
	};

	/*
      unique
      return list of elements that are unique to array 1
     */
    var unique = function (array1, array2) {
		var res = [];
		for (var i=0; i<array1.length;i++) {
		    var found = false;
		    for (var j=0; j<array2.length;j++) {
				if (array1[i] === array2[j]) {
				    found = true;
				    break;
				} 
	    	}
	   		if (!found) {
				res.push(array1[i]);
	    	}	 
		}
		return res;
    };


    // VERBS
    var VerbType = Object.freeze({
		ENTER: "enter",
		EXIT: "exit",
		CHANGE: "change",
		toInteger: function (s) {
		    if (s === VerbType.ENTER) return 1;
		    if (s === VerbType.EXIT) return -1;
		    if (s === VerbType.CHANGE) return 0;
		    throw new SequencerError("illegal string value verb type " + s);
		},
		fromInteger : function (i) {
			if (i === -1) return VerbType.EXIT;
			else if (i === 1) return VerbType.ENTER;
			else if (i === 0) return VerbType.CHANGE;
			throw new SequencerError("illegal integer value for direction type " + i);
		}
    });

    // DIRECTIONS
    var DirectionType = Object.freeze({
		BACKWARDS: "backwards",
		FORWARDS: "forwards",
		NODIRECTION : "nodirection",
		toInteger : function (s) {
		    if (s === DirectionType.BACKWARDS) return -1;
		    if (s === DirectionType.FORWARDS) return 1;
		    if (s === DirectionType.NODIRECTION) return 0;
		    throw new SequencerError("illegal string value direction type " + string);
		},
		fromInteger : function (i) {
			if (i === 0) return DirectionType.NODIRECTION;
			else if (i === -1) return DirectionType.BACKWARDS;
			else if (i === 1) return DirectionType.FORWARDS;
			throw new SequencerError("illegal integer value for direction type" + i + " " + typeof(i));
		}
    });


	/*

      SCHEDULE

      The purpose of schedule is to keep tasks planned for execution
      in the near future.
      
      <start> and <end> timestamps defines the time
      interval covered by the schedule - the <covering interval>. The
      idea is to move this interval stepwise, to eventually cover the
      entire time-line. The length of this interval is defined by the
      option <lookahead>. The default value is 5 seconds.

      The <advance> operation moves the interval so that the next
      interval <start> matches the previous interval <end>. If
      lookahead is 5 seconds, the general idea is to advance the
      covering interval every 5 seconds.  However, it is safe to
      advance it more often. It is also safe to advance it less
      often. In this case the covering interval will grow in length to
      cover otherwise lost parts of the timeline - but events will be 
      delivered too late.

      The push(ts,task) operation allows tasks to be added to the
      schedule, provided their due-times fall within the covering
      interval. The push_immediate(task) will assign <ts> === now.
      Push maintains time ordering.
      
      The pop() operation is used to get all tasks that are due for
      execution. The schedule should be popped regularly/frequently to
      keep tasks from being delayed in execution. The delay_next()
      operation returns the time (milliseconds) until the next task is
      due. This can be used with setTimeout() to arrange timely
      popping. However, note that this timeout may have to be
      re-evealuated as new tasks are pushed onto the schedule.

      Associated with the <covering interval> (time), there is also a
      "covering interval" with respect to timing object(position). Eg. In real-time
      (epoch) interval [1434891233.407, 1434891235.407] movement of timing object covers
      positions [23.0, 25.0].  All tasks are associated with a position on a
      dimension. This is set by the advance() operation.  The position
      interval is used (externally) to quickly evaluate relevance of tasks, essentially to
      avoid calculating the due-times of a task only to find that it falls
      outside the time convering interval. Position interval is only managed
      externally.

     */

    var Schedule = function (now, options) {
		this.queue = [];
		// options
		this.options = options || {};	
		this.options.lookahead = this.options.lookahead || 5.0;
		// time-interval
		this.timeInterval = new Interval(now, now + this.options.lookahead, true, true);
		// position-interval
		this.posInterval = null;
	};

	Schedule.prototype.getTimeInterval = function (){return this.timeInterval;};
	Schedule.prototype.getPosInterval = function (){return this.posInterval;};
	Schedule.prototype.setPosInterval = function (interval) {this.posInterval = interval;};
	Schedule.prototype.sortFunc = function(a,b) {return a.ts - b.ts;};

	// push
	// task assumed to have a key -- se usage by Sequencer
	Schedule.prototype.push = function (now, ts, task) {
		if (this.timeInterval.coversPoint(ts)) {
			var entry = {
			    ts: ts,
			    task: task,
		    	push_ts: now
			};
			if (ts >= now) {
			    this.queue.push(entry);
			    this.queue.sort(this.sortFunc); // maintain ordering
			    return true;
			} else {
				console.log("Schedule : task pushed a bit too late, ts < now ", (ts-now));
			}
	    }
	    return false;
	};

		// pop
	Schedule.prototype.pop = function (now) {
	    var res = [];
	    while (this.queue.length > 0 && this.queue[0].ts <= now) {
			var entry = this.queue.shift();
			var info = {
			    task: entry.task,
			    pop_ts: now, // fresh timestamp?
			    push_ts: entry.push_ts,
			    ts: entry.ts
			};
			res.push(info);
	    }
	    return res;
	};
		

	/* Invalidate task with given key */
	Schedule.prototype.invalidate = function (key) {
	    var i, index, entry, remove = [];
	    // Find
	    for (i=0; i<this.queue.length; i++) {
			entry = this.queue[i];
			if (entry.task.key === key) {
			    remove.push(entry);
			}
	    }
	    // Remove
	    for (i=0; i<remove.length; i++) {
			entry = remove[i];
			index = this.queue.indexOf(entry);
			if (index > -1) {
			    this.queue.splice(index, 1);
			}
		}
    };


    /*

  		ADVANCE

      The covering time interval is defined by [start,end>
      The covering interval should be advanced so that it always
      contains real-time, e.g., now.

      Advancing the covering interval assumes task queues to be empty.
      Therefore, make sure to pop all task before calling advance.

      Also, the time-sequence of covering intervals should ideally
      lay back-to-back on the time-line. To achive this the end of
      one interval becomes the start of the next. The end of the interval is 
      now + lookahead.
  
      If advance is called before the current interval is expired,
      the current interval is cut short.
  
      If advance is not called for an extended time, the next
      invocation will cause the covering interval to stretch long
      into the past.
    
      If parameter start is supplied, this is used as starting point
      for covering interval.

	*/

	Schedule.prototype.advance = function(now) {
	    if (now < this.timeInterval.low) {
			console.log("Schedule : Advancing backwards " + (now - this.timeInterval.low));
	    } 
	    this.queue = []; // drop tasks (time interval cut off)
	    this.timeInterval = new Interval(now, now + this.options.lookahead, false, true);
	    this.posInterval = null; // reset
	};
	
	/* 
		Current schedule is expired (at given time)
	*/	
	Schedule.prototype.isExpired = function(now) {
		return (now > this.timeInterval.high);
	};

	/* 
		delay until the next due task in schedule, or until the
		current time_interval expires 
	*/
	Schedule.prototype.getDelayNextTs = function (ts) {
	    // ts should be fresh timestamp in seconds
	    if (this.queue.length > 0) {
			return Math.max(0.0, this.queue[0].ts - ts);
	    }
	    return Math.max(0.0, this.timeInterval.high - ts);
	};
	
	Schedule.prototype.getNextTaskPoint = function () {
		return (this.queue.length > 0) ? this.queue[0].task.point : null;
	};

	/*
		BUILDER

		Build arguments for updateAll function of Sequencer
	*/

	var Builder = function (sequencer) {
		this._argOrder = [];
		this._argMap = {};
		this._sequencer = sequencer;
	};

	Builder.prototype.addCue = function (key, interval, data) {
		this._argOrder.push(key);
		this._argMap[key] = {key:key, interval:interval, data: data};
		return this;
	};
	
	Builder.prototype.removeCue = function (key, removedData) {
		return this.addCue(key, undefined, removedData);
	};

	Builder.prototype.submit = function () {
		var argList = [];
		this._argOrder.forEach(function (key) {
			argList.push(this._argMap[key]);
		}, this);
		// reset
		this._argMap = {};
		this._argOrder = [];
		if (argList.length > 0) {
			return this._sequencer.updateAll(argList);
		}
		return [];
	};


	/*
		Sequencer Error
	*/
	var SequencerError = function (message) {
		this.name = "SequencerError";
		this.message = (message || "");
	};
	SequencerError.prototype = Error.prototype;


	/*
		Sequencer EArgs
	*/
	var SequencerEArgs = function (sequencer, key, interval, data, point, pointType, ts, dueTs, directionType, verbType) {
		this.src = sequencer;
		this.key = key;
		this.interval = interval;
		this.point = point;
		this.pointType = pointType;
		this.dueTs = dueTs;
		this.delay = ts - dueTs;
		this.directionType = directionType;
		this.type = verbType;
		this.data = data;
	};

	SequencerEArgs.prototype.toString = function () {
		var s = "[" +  this.point.toFixed(2) + "]";
        s += " " + this.key;
        s += " " + this.interval.toString();
        s += " " + this.type;
        s += " " + this.directionType;
        s += " " + this.pointType;
        s += " delay:" + this.delay.toFixed(4);
        if (this.data) s += " " + JSON.stringify(this.data);
        return s;
	};


	/*
		SequencerCue
	*/
	var SequencerCue = function (key, interval, data) {
		this.key = key;
		this.interval = interval;
		this.data = data;
	};

	SequencerCue.prototype.toString = function () {
		var s = this.key + " " + this.interval.toString();
		if (this.data) s += " " + JSON.stringify(this.data);
		return s;
	};


	/*
	
		SEQUENCER

	*/
	var Sequencer = function (timingObject, _axis) {
		this._to = timingObject;
		this._clock = timingObject.clock;
		this._axis = _axis || new axis.Axis();
		this._schedule = null;
		this._timeout = null; // timeout
		this._currentTimeoutPoint = null; // point associated with current timeout
		this._activeKeys = []; // active intervals

		// set up eventing stuff
		eventutils.eventify(this, Sequencer.prototype);
		this.eventifyDefineEvent("enter", {init:true}); // define enter event (supporting init-event)
		this.eventifyDefineEvent("exit"); 
		this.eventifyDefineEvent("change");

		// wrap prototype handlers and store ref on instance
		this._wrappedOnTimingChange = function () {this._onTimingChange();};
		this._wrappedOnAxisChange = function (e) {this._onAxisChange(e);};

		// initialise
		this._to.on("change", this._wrappedOnTimingChange, this);
		// Allow subclass to load data into the sequencer
		this.loadData();
	};

	// making Interval constructor available on all sequencer instances
	Object.defineProperty(Sequencer.prototype, "Interval", {
		get : function () {return Interval;}
	});

	/*
	  	overrides how immediate events are constructed 
	*/
	Sequencer.prototype.eventifyMakeInitEvents = function (type) {
		if (type === "enter") {
			return this._processInitialEvents();
		}
		return [];
	};

	// To be overridden by subclass specializations
	Sequencer.prototype.loadData = function () {};
	Sequencer.prototype.getData = function (key) {};

	/* 
	
		ON TIMING OBJECT CHANGE

		Whenever the timingobject position changes abruptly we need to
	        re-evaluate intervals. 

		A) Abrupt changes in position occur 
		   1) after certain timing object changes or 
		   2) when the timing object is initially loaded.

		B) Non-abrupts changes occur when velocity or acceleration is
		changed without immediately affecting the position

		In all cases - the schedule and timeout need to be re-evaluated.

        In case A. 1) the timing object change is possibly late due to network
        latency. To include effects of singulars/intervals from the small "lost"
        time interval, make sure to advance according to the timestamp of the
		timing object vector.  2) is not delayed.
     

        Furthermore in a small time-interval just before timing object updates
        the previous vector incorrectly drove the sequencer instead of the new
        updated vector.  This may have caused the sequencer to falsely
        report some events, and to not report other events.  This time
        interval is (initVector[T], now). For non-singular Intervals this will be
        corrected by the general re-evalution of Intervals. For singular Intervals
        explicit action is required to signal incorrect events. This implementation
        does not support this.

	*/

	Sequencer.prototype._isReady = function () {
		return (this._schedule !== null);
	};

	Sequencer.prototype._onTimingChange = function (event) {
		// Set the time for this processing step
	    var now = this._clock.now(); 
	    var initVector = this._to.vector;

	    if (this._isReady() === false) {
			// Initial update from timing object starts the sequencer
			this._schedule = new Schedule(now);
			// Register handler on axis
			this._axis.on("change", this._wrappedOnAxisChange, this);
	    } else {
	    	// Deliberately set time (a little) back for delayed updates
	    	now = initVector.timestamp;
	    	// Empty schedule
	    	this._schedule.advance(now); 
	    }

	    /*
	      Re-evaluate non-singularities
	      This is strictly not necessary after vector changes that
          preserve position. However, for simplicity we
	      re-evaluate intervals whenever vector changes.
	    */
	    var nowVector = motionutils.calculateVector(initVector, now);
	    var oldKeys = this._activeKeys;
	    var newKeys = this._axis.lookupByPoint(nowVector.position).map(function (item) {
	    	return item.key;
	    });
	    var exitKeys = unique(oldKeys, newKeys);
	    var enterKeys = unique(newKeys, oldKeys);



	    /*
			Corner Case: Exiting Singularities
			and
			Exiting closed intervals ]
			and 
			Entering open intervals <
	    */
	    var _isMoving = isMoving(initVector);
	    if (_isMoving) {
	    	var nowPos = nowVector.position;
		    var points = this._axis.lookupByInterval(new Interval(nowPos, nowPos, true, true));
		    points.forEach(function (pointInfo) {
		    	// singularities
				if (pointInfo.pointType === axis.PointType.SINGULAR) {
				    exitKeys.push(pointInfo.key);
				} else {
					// closed interval?
					var interval = pointInfo.interval;
					var closed = false;
					if (pointInfo.pointType === axis.PointType.LOW && interval.lowInclude) {
						closed = true;
					} else if (pointInfo.pointType === axis.PointType.HIGH && interval.highInclude) {
						closed = true;
					}
					// exiting or entering interval?
					var direction = DirectionType.fromInteger(motionutils.calculateDirection(initVector, now));
					var entering = true;						
					if (pointInfo.pointType === axis.PointType.LOW && direction === DirectionType.BACKWARDS)
						entering = false;
					if (pointInfo.pointType === axis.PointType.HIGH && direction === DirectionType.FORWARDS)
						entering = false;
					// exiting closed interval
					if (!entering && closed) {
						exitKeys.push(pointInfo.key);
					}
					// entering open interval
					if (entering && !closed) {
						enterKeys.push(pointInfo.key);
					}
				}
		    }, this);
	    }

	  
	    /* 
	    	Note : is it possible that a key for singularity
	    	may be in both enterKeys and exitKeys? 
	    	- only in the corner case of movement and evaluation at eaxctly the point
	    	where the singularity lies - have duplicate protection elsewhere - ignore
		*/
	   
	    var exitItems = exitKeys.map(function (key) {
	    	return {key:key, interval: this._axis.getIntervalByKey(key), data: this.getData(key)};
	    }, this);
	    var enterItems = enterKeys.map(function (key) {
	    	return {key:key, interval: this._axis.getIntervalByKey(key), data: this.getData(key)};
	    }, this);
	    // Trigger interval events
	    this._processIntervalEvents(now, exitItems, enterItems, []);


	    /*
	      	Rollback falsely reported events
	      	Non-singular Intervals entered/left wrongly before update was sorted out above.
	      	- So far we do not roll back events. 
	    */

        /* 
        	Re-creating events lost due to network latency in timing object changes. 
        	This is achieved by advancing and loading from <now> which is derived 
        	from update vector rather than an actual timestamp. 
        */

	    // Kick off main loop
    	this._load(now);
    	this._main(now);
	};



	/*
	  UPDATE

	  Updates the axis. Updates have further effect
	  if they relate to intervals within the immediate future.  
	  This roughly corresponds to the covering
	  time-interval and covering position-interval.

		- EVENTS (i.e. singular intervals)
	  
	  Relevant events for the sequencer are those that apply to the immediate future
	  i.e. the Schedule.

	  - removed events may have to be invalidated if they were due in immediate future
	  - new events may be added to the schedule if due in immedate future

	  - INTERVALS
	  Relevant interval changes trigger exit or enter events,
	  and since their relevance is continuous they will be delayed
	  no matter how late they are, as long as the interval update is
	  relevant for the current position of the timing object.
	 */

	Sequencer.prototype.updateAll = function(argList) {
		this._axis.updateAll(argList);
	};


	Sequencer.prototype._onAxisChange = function (origOpList) {
		var self = this;
		var i, e, key, interval, data;	

		// filter out NOOPs
		var opList = origOpList.filter(function (op) {
			return (op.type !== axis.OpType.NOOP);
		});
		
	    var now = this._clock.now();
	    var nowVector = motionutils.calculateVector(this._to.vector, now);
	    var nowPos = nowVector.position;

	    // EXIT and ENTER Intervals
	    var enterItems = []; // {key:key, interval:interval}
	    var exitItems = []; // {key:key, interval:interval}
	    var isActive, shouldBeActive;

	    opList.forEach(function (op) {
	    	interval = op.interval;
	    	key = op.key;
		    /*
		      	Re-evaluate active intervals. Immediate action is required only if 
			    a interval was active, but no longer is -- or the opposite.

				Singularity intervals may not be ignored here - as a singluarity 
				might have been an active interval and just now collapsed
				into a singularity
		    */
		    isActive = this.isActive(key);
		    shouldBeActive = false;
		    if (op.type === axis.OpType.CREATE || op.type === axis.OpType.UPDATE) {
		    	if (interval.coversPoint(nowPos)) {
					shouldBeActive = true;
		    	}
		    }
		    // set data element
		    if (op.type === axis.OpType.REMOVE) {
		    	data = op.data 
		    } else {
		    	data = op.data || this.getData(key)
		    }
		    if (isActive && !shouldBeActive) {
				exitItems.push({key:key, interval:interval, data: data});
			} else if (!isActive && shouldBeActive) {
				enterItems.push({key:key, interval:interval, data: data});
		    }
	    }, this);


		/* 
			change events
			generate change events for currently active spans, which did change, 
			but remained active - thus no enter/exit events will be emitted).
		
			these are items that are active, but not in enterItems list
			including NOOP operation (change in non-temporal sense)
		*/
		var exitKeys = exitItems.map(function (item) {return item.key;});
		var changeItems = origOpList.
			filter (function (op) {
				return (this.isActive(op.key) && exitKeys.indexOf(op.key) === -1);
			}, this).
			map (function (op) {
				return {key: op.key, interval: op.interval, data: op.data};
			}, this);

		/* 
			special case 
			- no changes to axis - no need to touch the SCHEDULE
		*/
		if (opList.length === 0) {
			if (changeItems.length > 0) {
				// break control flow so that events are emitted after addCue has completed
				setTimeout(function () {
					// enterItems and exitItems are empty
					self._processIntervalEvents(now, [], [], changeItems);
					// no need to call main - will be called by scheduled timeout
				}, 0);
			}			
			return;
		}

		/*
			special case
			- not moving - no need to touch the SCHEDULE
		*/
		var _isMoving = isMoving(nowVector);
		if (!_isMoving) {
			// break control flow so that events are emitted after addCue has completed
			setTimeout(function () {
				self._processIntervalEvents(now, exitItems, enterItems, changeItems);
				// not moving should imply that SCHEDULE be empty
				// no need to call main - will be called by scheduled timeout
			}, 0);
			return;
		}


		/*
			filter cue operation relevant to (remainder of) current scheduler window
			purpose - detect common condition that cue operation is irrelevant for SCHEDULE
			no need to touch SCHEDULE.
			- cue endpoint included in scheduler, but needs to be excluded due to cue operation
			- cue endpoitn not in scheduler, but needs to be included due to cue operation
		*/
		// TODO

		/* 
			special case 
			- no cue operation relevant to (remainder of) current scheduler window - no need to touch SCHEDULE
		*/
		// TODO


		// INVALIDATE events in the SCHEDULE
		/*
	      Re-evaluate the near future. The SCHEDULE may include
	      tasks that refer to these keys. These may have to
	      change as a result of cue intervals changing. 

	      Basic solution (assumes that this cue operation is relevant for SCHEDULE)
	      - invalidate all tasks in the schedule
	      - invalidate even if the timing object is not moving
			if timing object is not moving, the schedule may not have been advanced in a while
			simply advance it - to empty it - as an effective way of invalidation
		*/

		// TODO - simplify the following based on above filtering of relevant cue operatiosn

		if (!_isMoving) {
			// not moving - not sure this is necessary
			this._schedule.advance(now);
		} else {
			// moving - invalidate all events - possibly advance is just as good
			opList.forEach(function (op) {
				this._schedule.invalidate(op.key);
			}, this);

			// RELOAD events into the SCHEDULE
			var point, reloadPoints = [];
			opList.forEach(function (op) {
				interval = op.interval;
	    		key = op.key;

	    		// Nothing to reload for remove events
		    	if (op.type === axis.OpType.REMOVE) {
					return;
		    	}

				/* 
			       Corner Case: If the new interval is singularity, and if it
			       happens to be exactly at <nowPos>, then it needs to be
			       fired. 
			    */

			    // Reload only required if the msv is moving
				if (_isMoving) {
					/*
				      Load interval endpoints into schedule			      
				      The interval has one or two endpoints that might or might not be
				      relevant for the remainder of the current time-interval of the schedule.
				      Check relevance, i.t. that points are within the
				      position range of the schedule.
				    */
					var item = {key: key, interval: interval}; 
				    var rangeInterval = this._schedule.getPosInterval();
				    if (rangeInterval !== null) {
				    	if (rangeInterval.coversPoint(interval.low)) {
				    		item.point = interval.low;
				    	} 
				    	if (rangeInterval.coversPoint(interval.high)) {
				    		item.point = interval.high;
				    	}
				    	item.pointType = this._axis.getPointType(item.point, item.interval);
				    	reloadPoints.push(item);
				    }
				}
			}, this);

		   	// reload relevant points
		    if (reloadPoints.length > 0) {
				this._load(now, reloadPoints);
		    }
		}
	
		// break control so that events are emitted after addCue has completed
		setTimeout(function () {
			// notify interval events and change events
			self._processIntervalEvents(now, exitItems, enterItems, changeItems);
			// kick off main loop (should only be required if moving?)
			// TODO - should only be necessary if the SCHEDULE is touched - to cause a new timeout to be set.
			self._main(now);
		}, 0);
	
	};


	/*
        Sequencer core loop, loops via the timeout mechanism as long
        as the timing object is moving.
	*/
	Sequencer.prototype._main = function (now) {
		var eList;
	    now = now || this._clock.now();
	    // process tasks (empty due tasks from schedule)
        eList = this._processScheduleEvents(now, this._schedule.pop(now));
        this.eventifyTriggerEvents(eList);
        // advance schedule window
        var _isMoving = isMoving(this._to.vector);
        if (_isMoving && this._schedule.isExpired(now)) {		
			now = this._schedule.getTimeInterval().high;
            this._schedule.advance(now);
            this._load(now);
            // process tasks again
            eList = this._processScheduleEvents(now, this._schedule.pop(now));
	    	this.eventifyTriggerEvents(eList);
	    }
        // adjust timeout if moving
        if (_isMoving) {
			var newTimeoutRequired = false;
			if (this._timeout === null) newTimeoutRequired = true;
			else {
				// timeout exist - modify?
				// avoid modifying timeout if new timeout is equal to existing timeout
				// i.e. if task point is the same as last time
				var nextTimeoutPoint = this._schedule.getNextTaskPoint();
				if (nextTimeoutPoint === null) {
					// timeout is set for schedule window - no tasks in schedule 
					// do not modify timeout			
				} else {
					// nextTimeoutPoint defined - tasks in the schedule
					if (nextTimeoutPoint === this._currentTimeoutPoint) {
						// do not modify timeout
					} else {
						// modify timeout
						newTimeoutRequired = true
					}
				}
			}
					
			if (newTimeoutRequired) {
				// clear timeout
				this._clearTimeout();
				// update timeout 
	        	var secAnchor = this._clock.now();	
				var secDelay = this._schedule.getDelayNextTs(secAnchor); // seconds
				this._currentTimeoutPoint = nextTimeoutPoint;
				var self = this;
				this._timeout = this._clock.setTimeout(function () {
					self._clearTimeout();
					self._main();
				}, secDelay, {anchor: secAnchor, early: 0.005});
			}
	    }
	};


	Sequencer.prototype._clearTimeout = function () {
    	this._currentTimeoutPoint = null;
    	if (this._timeout !== null) {
			this._timeout.cancel();
			this._timeout = null;
    	}
	};

	/* 
	   LOAD

       Sequencer loads a new batch of points from axis into
       the schedule

       If given_points is specified, this implies that the
       points to load are known in advance. This is the case when
       axis is being updated dynamically during execution. If
       points are not known the load function fetches points from
       the axis by means of the time cover of the schedule.

	   load only makes sense when timing object is moving
	*/

	Sequencer.prototype._load = function (now, givenPoints) {
		var initVector = this._to.vector;
	    if (!isMoving(initVector)) {
			return;
	    }


	    /* 
	       MOVING
	       Load events from time interval
	    */
	    var timeInterval = this._schedule.getTimeInterval();
	    var tStart = timeInterval.low;
	    var tEnd = timeInterval.high;
	    var tDelta = tEnd - tStart;
	    // range
		var range = this._to.range;
	    var vectorStart = motionutils.calculateVector(initVector, tStart);
	    var points = givenPoints;

	    // Calculate points if not provided
	    if (!points) {
			// 1) find the interval covered by the movement of timing object during the time delta
			var posRange = motionutils.calculateInterval(vectorStart, tDelta);
			var pStart = Math.max(posRange[0], range[0]);
			var pEnd = Math.min(posRange[1], range[1]);
			var posInterval = new Interval(pStart, pEnd, true, true);
			this._schedule.setPosInterval(posInterval);

			// 2) find all points in this interval
			points = this._axis.lookupByInterval(posInterval);
	    }

	    /*
			Add data to points
	    */
	    points.forEach(function (pointInfo){
	    	pointInfo.data = this.getData(pointInfo.key);
	    }, this);

	    /*
	      Note : 1) and 2) could be replaced by simply fetching
	      all points of the axis. However, in order to avoid
	      calculating time intercepts for a lot of irrelevant points, we
	      use step 1) and 2) to reduce the point set.
	    */
	    
	    // create ordered list of all events for time interval t_delta 
	    var eventList = motionutils.calculateSolutionsInInterval(vectorStart, tDelta, points);
	    
	    /* 
	       SUBTLE 1 : adjust for range restrictions within
	       time-interval tasks with larger delta will not be
	       pushed to schedule it is not necessary to truncate the
	       time interval of schedule similarly - just drop all
	       events after prospective range violations. <rDelta> is
	       time to (first) range violation
	    */	    
	    var rDelta = motionutils.calculateDelta(vectorStart, range)[0];
	  
 	    /* 
	       SUBTLE 2: avoid tasks exactly at start of time-interval
	       assume that this point should already be processed by the
	       previous covering interval.
	    */
	    
	    // filter and push events on sched
	    eventList.forEach(function (e)  {

	    	var d = e[0];
			var task = e[1];
			var push = true;
			
			/* 
			   drop events exactly at the start of the time covering
			   interval. 
			*/
			if (d === 0) {
			    push = false; 
			}
			/* 
			   drop all events scheduled after (in time) range
			   violation should occur
			*/
			if (d > rDelta) {
				push = false;  
			}
			/*
			  event scheduled exactly at range point.
			  - interval : 
			  Exiting/entering a interval should not happen at range point - drop
			*/
			if (d === rDelta) {
			    push = false;
			}
			
			/* 
			   check if we are touching an interval without
			   entering or exiting. Note that direction will
			   not be zero at this point, because direction
			   includes acceleration, which is not zero in
			   this case.
			   drop all interval events that have zero velocity
			   at the time it is supposed to fire
			*/
			if (task.pointType === axis.PointType.LOW || task.pointType === axis.PointType.HIGH) {
			    var v = motionutils.calculateVector(initVector, tStart + d);
			    if (v.velocity === 0){
					push = false;
			    }
			}
			// push
			if (push) {		    
			    this._schedule.push(now, tStart + d, task);
			} 
	    }, this); 
	};


	/*
		Helper function to make event messages
	*/
	Sequencer.prototype._makeEArgs = function(key, interval, data, directionInt, verbType, point, ts, dueTs) {
		var directionType = DirectionType.fromInteger(directionInt);
		var pointType = this._axis.getPointType(point, interval);
		if (verbType === undefined) {
			var pointInt = axis.PointType.toInteger(pointType);
			var verbInt = pointInt * directionInt * -1;
			verbType = VerbType.fromInteger(verbInt);
		}
		return new SequencerEArgs(this, key, interval, data, point, pointType, ts, dueTs, directionType, verbType);
	};


	// Process point events originating from the schedule
	Sequencer.prototype._processScheduleEvents = function (now, eventList) {
	   	var msg, msgList = [];	   		
	   	var nowVector = motionutils.calculateVector(this._to.vector, now);
   		var directionInt = motionutils.calculateDirection(nowVector, now);
		var ts = this._clock.now(); 
	    eventList.forEach(function (e) {
			if (e.task.interval.isSingular()) {
				// make two event messages for singular
				msg = this._makeEArgs(e.task.key, e.task.interval, e.task.data, directionInt, VerbType.ENTER,e.task.point, ts, e.ts);
				msgList.push(msg);
				msg = this._makeEArgs(e.task.key, e.task.interval, e.task.data, directionInt, VerbType.EXIT,e.task.point, ts, e.ts);
				msgList.push(msg);
			} else {				
		    	msg = this._makeEArgs(e.task.key, e.task.interval, e.task.data, directionInt, undefined, e.task.point, ts, e.ts);
		    	msgList.push(msg);	
			}			
	    }, this);
	    return this._makeEvents(now, msgList);
	};

	// Process interval events orignating from axis change, timing object change or active keys
	Sequencer.prototype._processIntervalEvents = function (now, exitItems, enterItems, changeItems) {
	    if (exitItems.length + enterItems.length + changeItems.length === 0) {
			return;
	    }
	    var nowVector = motionutils.calculateVector(this._to.vector, now);
		var directionInt = motionutils.calculateDirection(nowVector, now);
		var ts = this._clock.now(); 
	    var msgList = [];
    	// trigger events
    	exitItems.forEach(function (item){
			msgList.push(this._makeEArgs(item.key, item.interval, item.data, directionInt, VerbType.EXIT, nowVector.position, ts, now));
		}, this); 
		enterItems.forEach(function (item){
			msgList.push(this._makeEArgs(item.key, item.interval, item.data, directionInt, VerbType.ENTER, nowVector.position, ts, now));
		}, this);
		changeItems.forEach(function (item) {
			msgList.push(this._makeEArgs(item.key, item.interval, item.data, directionInt, VerbType.CHANGE, nowVector.position, ts, now));
		}, this);
		this.eventifyTriggerEvents(this._makeEvents(now, msgList));
	};


	Sequencer.prototype._processInitialEvents = function () {
		// called by makeInitEvents - return event list based on activeKeys
		var interval, data, eArg;
		var now = this._clock.now();
		var nowVector = motionutils.calculateVector(this._to.vector, now);
		var directionInt = motionutils.calculateDirection(nowVector, now);
		var ts = this._clock.now();
		return this._activeKeys.map(function (key) {
			interval = this._axis.getIntervalByKey(key);
			data = this.getData(key);
			eArg = this._makeEArgs(key, interval, data, directionInt, VerbType.ENTER, nowVector.position, ts, now);
			return {type: VerbType.ENTER, e: eArg}; 
		}, this);
	};

	
	/*
		make events ensures consistency of active keys as changes
		to active keys are driven by actual notifications
	*/

	Sequencer.prototype._makeEvents = function (now, msgList) {
		if (msgList.length === 0) {
			return [];
		}
		// manage active keys
		var index, eventList = [];
		msgList.forEach(function (msg) {
			// exit interval - remove keys 
		    if (msg.type === VerbType.EXIT) {
				index = this._activeKeys.indexOf(msg.key);
				if (index > -1) {
			    	this._activeKeys.splice(index, 1);		
				}
		    }
		    // enter interval - add key
		    if (msg.type === VerbType.ENTER) {
				index = this._activeKeys.indexOf(msg.key);
				if (index === -1) {
				    this._activeKeys.push(msg.key);
				} 
		    }
		    eventList.push(msg);
		}, this);
		// make sure events are correctly ordered
		eventList = this._reorderEventList(eventList);
		// finalise events
		return eventList.map(function (item) {
			return {type: item.type, e:item};
		});	    	    
	};

	/*
		Event list is sorted by time. 
		There can be multiple events on the same time.
		Events with the same point (thus time) need to be sorted according to the following precedence
		a. exit interval > (interval does not include exit-point)
		x. enter interval [ (interval includes enter-point)
		b. enter singular
		c. exit singular			
		y. exit intervals ] (interval includes exit-point)
		d. enter intervals < (interval does not include enter-point)
	*/
	Sequencer.prototype._reorderEventList = function (msgList) {
		if (msgList.length < 2) return msgList;
		// stack events per point
		var point, dueTs, newList = [];
		var s = {"a": [], "x": [], "b": [], "c": [], "y": [], "d": []};
		msgList.forEach(function(msg) {
			// new point - pop from stack
			if (msg.point !== point || msg.dueTs !== dueTs) {
				newList = newList
					.concat(s["a"])
					.concat(s["x"])
					.concat(s["b"])
					.concat(s["c"])
					.concat(s["y"])
					.concat(s["d"]);
				s = {"a": [], "x": [], "b": [], "c": [], "y": [], "d": []};
				point = msg.point;
				dueTs = msg.dueTs;
			}
			// push on stack
			if (msg.pointType === axis.PointType.SINGULAR) {
				if (msg.type === VerbType.ENTER) {
					// enter singular
					s["b"].push(msg);
				} else {
					// exit singular
					s["c"].push(msg);
				}
			} else {
				/* 
					Interval
					special ordering when we enter or exit interval
					through endpoint (low or high) and this endpoint is CLOSED ] as opposed to OPEN >
				*/
				var closed = false;
				if ((msg.pointType === axis.PointType.LOW) && msg.interval.lowInclude) {
					closed = true;
				} else if ((msg.pointType === axis.PointType.HIGH) && msg.interval.highInclude) {
					closed = true;
				}
				if (msg.type === VerbType.ENTER) {
					// enter interval
					if (closed) s["x"].push(msg);
					else s["d"].push(msg);
				} else {
					// exit interval
					if (closed) s["y"].push(msg);
					else s["a"].push(msg);
				}
			}
		}, this);

		// pop last from stack
		return newList
				.concat(s["a"])
				.concat(s["x"])
				.concat(s["b"])
				.concat(s["c"])
				.concat(s["y"])
				.concat(s["d"]);
	};

	
    // get request builder object
	Sequencer.prototype.request = function () {
		return new Builder(this);
	};

	// TODO : force SequencerCue object on input?
	Sequencer.prototype.addCue = function (key, interval, data) {
		return this.updateAll([{key:key, interval:interval, data: data}]);
	};

	Sequencer.prototype.removeCue = function (key, removedData) {
		return this.updateAll([{key:key, interval:undefined, data:removedData}]);
	};

	// true if cues exists with given key
	Sequencer.prototype.hasCue = function (key) {
		return this._axis.hasKey(key);
	};

	// Get all keys
	Sequencer.prototype.keys = function () {
		return this._axis.keys();
	};
	
	// get specific cue {key: key, interval:interva} given key
	Sequencer.prototype.getCue = function (key) {
		if (this._axis.hasKey(key)) {
			return new SequencerCue (key, this._axis.getIntervalByKey(key), this.getData(key));
		}  
	};

	// get all cues
	Sequencer.prototype.getCues = function () {
		return this.keys().map(function (key) {
			return this.getCue(key);
		}, this);
	};

	// return true if cue of given key is currently active
	Sequencer.prototype.isActive = function (key) {
	    return (this._activeKeys.indexOf(key) > -1);
	};

	// Get keys of active cues
	Sequencer.prototype.getActiveKeys = function () {
		// copy keys
		var res = [];
		this._activeKeys.forEach(function (key) {
			res.push(key);
		}, this);
		return res;
	};

	Sequencer.prototype.getActiveCues = function () {
		var res = [];
		this._activeKeys.forEach(function (key) {
			res.push(this.getCue(key));
		}, this);
		return res;
	};


	// return all (key, inteval, data) tuples, where interval covers point
	Sequencer.prototype.getCuesByPoint = function (point) {
		return this._axis.lookupByPoint(point).map(function (item) {
			return this.getCue(item.key);
		}, this);
	};

	// return all cues with at least one endpoint within searchInterval
	Sequencer.prototype.getCuesByInterval = function (searchInterval) {
		// keys may be mentioned for 2 points in searchInterval - use dict to avoid duplicating intervals
		var _dict = {};
		this._axis.lookupByInterval(searchInterval).forEach(function (pointInfo) {
			_dict[pointInfo.key] = pointInfo.interval;
		});
		return Object.keys(_dict).
			map(function(key){
				return this.getCue(key);
			}, this).
			filter(function (cue) {
				return (searchInterval.overlapsInterval(cue.interval));
			}, this);
	};

	// return all cues covered by searchInterval
	Sequencer.prototype.getCuesCoveredByInterval = function (searchInterval) {
		return this.getCuesByInterval(searchInterval).filter(function (cue) {
			return (searchInterval.coversInterval(cue.interval)) ? true : false;
		}, this);
	};

	// shutdown
	Sequencer.prototype.close = function () {
	    this._to.off("change", this._wrappedOnTimingChange, this);
	    this._axis.off("change", this._wrappedOnAxisChange, this);
	    if (this._timeout !== null) {
			this._timeout.cancel();
			this._timeout = null;		
	    }
	};


	// Inherit function used for specialized sequencers.
	var inherit = function (Child, Parent) {
		var F = function () {}; // empty object to break prototype chain - hinder child prototype changes to affect parent
		F.prototype = Parent.prototype;
		Child.prototype = new F(); // child gets parents prototypes via F
		Child.uber = Parent.prototype; // reference in parent to superclass
		Child.prototype.constructor = Child; // resetting constructor pointer 
	};

	// Module Definition
	return {
		inherit : inherit,
		Interval : Interval,
		DefaultSequencer : Sequencer,
		Axis : axis.Axis,
		SequencerError : SequencerError,
	};

});




/*
	Copyright 2015 Norut Northern Research Institute
	Author : Ingar Mæhlum Arntzen

  This file is part of the Timingsrc module.

  Timingsrc is free software: you can redistribute it and/or modify
  it under the terms of the GNU Lesser General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  Timingsrc is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Lesser General Public License for more details.

  You should have received a copy of the GNU Lesser General Public License
  along with Timingsrc.  If not, see <http://www.gnu.org/licenses/>.
*/


/* 
	WINDOW SEQUENCER

	- a collection of Intervals are defined on an axis
	- a searchInterval is defined by two endpoints.
	- we are interested in all Intervals on the axis that are partially/fully covered by searchInterval
	- we then want to move the searchInterval along the axis
	- trigger onenter/onexit events as Intervals go from being not covered to partialy/fully covered and vica versa
	- define searchInterval endpoints by two motions that may or may not be dependent
	- use pointsequencer on each motion to generate events.	
*/


define('sequencing/windowsequencer',['util/eventutils', 'util/motionutils', './axis', './sequencer'], 
	function (eventutils, motionutils, axis, seq) {
	
	'use strict';

	/*
      unique
      return list of elements that are unique to array 1
     */
    var unique = function (array1, array2) {
		var res = [];
		for (var i=0; i<array1.length;i++) {
		    var found = false;
		    for (var j=0; j<array2.length;j++) {
				if (array1[i] === array2[j]) {
				    found = true;
				    break;
				} 
	    	}
	   		if (!found) {
				res.push(array1[i]);
	    	}	 
		}
		return res;
    };


	var Interval = seq.Interval;

	var WindowSequencer = function (timingObjectA, timingObjectB, _axis) {
		this._axis = _axis || new axis.Axis();
		this._toA = timingObjectA;
		this._toB = timingObjectB;
		this._seqA = new seq.DefaultSequencer(this._toA, this._axis);
		this._seqB = new seq.DefaultSequencer(this._toB, this._axis);
		this._readyA = false;
		this._readyB = false;

		// active keys
		this._activeKeys = [];

		// Define Events API
		// event type "events" defined by default
		eventutils.eventify(this, WindowSequencer.prototype);
		this.eventifyDefineEvent("enter", {init:true}) // define enter event (supporting init-event)
		this.eventifyDefineEvent("exit") 
		this.eventifyDefineEvent("change"); 

		// Wrapping prototype event handlers and store references on instance
		this._wrappedOnAxisChange = function (e) {this._onAxisChange(e);};
		this._wrappedOnTimingChangeA = function () {this._onTimingChangeA();};
		this._wrappedOnTimingChangeB = function () {this._onTimingChangeB();};
		this._wrappedOnSequencerChangeA = function (e) {this._onSequencerChangeA(e);};
		this._wrappedOnSequencerChangeB = function (e) {this._onSequencerChangeB(e);};

		this._toA.on("change", this._wrappedOnTimingChangeA, this);
		this._toB.on("change", this._wrappedOnTimingChangeB, this);
		this._seqA.on("events", this._wrappedOnSequencerChangeA, this);
		this._seqB.on("events", this._wrappedOnSequencerChangeB, this);
	};



	// making Interval constructor available on all windowsequencer instances
	Object.defineProperty(WindowSequencer.prototype, "Interval", {
		get : function () {return Interval;}
	});

	/*
		READY STATE

		The interval sequencer is ready when both timing objects are ready
	*/
	WindowSequencer.prototype._setReadyA = function() {
		if (!this._readyA) {
			this._readyA = true;
			if (this._readyB) this._onReady();
		}
	};

	WindowSequencer.prototype._setReadyB = function() {
		if (!this._readyB) {
			this._readyB = true;
			if (this._readyA) this._onReady();
		}
	};

	WindowSequencer.prototype._isReady = function() {
		return (this._readyA && this._readyB);
	};

	WindowSequencer.prototype._onReady = function () {
		this._axis.on("change", this._wrappedOnAxisChange, this);
	};

	/*

		EVENT HANDLERS

	*/

	/*
		Timing events
		
		- Jumps may some intervals to be covered or cease to be covered.
		Some of these intervals may remain active of inactive with respect
		to the point-sequencer, implying that there will be no events from the sequencer

		- Non-jumps (i.e. speed changes) can not cause changes to the WindowSequencer
		without also causing changes to the sequencers
		
		Sequencer events
		- required during playback to trigger timed refresh
		- sequencer provides events on both jumps and non-jumps

		There is possible event redundancy for events caused by jumps and non-jumps of the timing object.
		I.e. we receive an event from both timing object as well as
		events from the sequencer that were caused by the same event from the timing object. 

		Fortunately, the overhead of this event duplication is small, 
		since it only involves an extra reevaluate(). 
		The second invokation will not have any effect.'


		Possible optimization 1)
		ignore non-jumps from timing object and depend on the sequencer for this
		- requires cashing the vector from the timing object, so that the new vector can be compared
		to the old one. This is necessary for discriminating between jumps and non-jumps.
		- not implemented

		Possible optimization 2)
		ignore sequencer events for jumps.
		- difficult because the sequencer at present does not distinguish event event causes 
		{jump|non-jump|playback}
		- not implemented
 
		Possible optimization 3)
		It is also possible to filter out updates from axis that are not relevant, in order to not invoke 
		re-evaluate when it is not needed.
		- easy, but basically just saves a lookup on the axis, and only if all updates are non relevant.
		- not implemented
	*/

	WindowSequencer.prototype._onTimingChangeA = function () {
		this._setReadyA();
		this._reevaluate();
	}; 

	WindowSequencer.prototype._onTimingChangeB = function () {
		this._setReadyB();
		this._reevaluate();
	};

	WindowSequencer.prototype._onAxisChange = function (opList) {
		this._reevaluate(opList);
	};

	WindowSequencer.prototype._onSequencerChangeA = function () {
		this._reevaluate();
	}; 

	WindowSequencer.prototype._onSequencerChangeB = function () {
		this._reevaluate();
	};

	/*
	  	overrides how immediate events are constructed
	*/
	WindowSequencer.prototype.eventifyMakeInitEvents = function (type) {
		if (type === "enter") {
			return this._reevaluate();
		}
		return [];
	};

	/*
		figure out the current active interval
	*/
	WindowSequencer.prototype._getActiveInterval = function () {
		var vectorA = this._toA.query();
		var vectorB = this._toB.query();
		var start = Math.min(vectorA.position, vectorB.position);
		var end = Math.max(vectorA.position, vectorB.position);
		return new Interval(start, end, true, true);
	};

	WindowSequencer.prototype._getOpFromAxisOpList = function (axisOpList, key) {
		var op = {};
		if (axisOpList) {
			for (var i=0; i<axisOpList.length; i++) {
				var item = axisOpList[i];
				if (item.key === key) {
					op = item;
					break;
				}
			}
		}
		return op;
	};

	/*
		RE-EVALUATE

		Figure out what kind of events need to be triggered (if any)
		in order to bring the WindowSequencer to the correct state.
	*/
	WindowSequencer.prototype._reevaluate = function (axisOpList) {
		if (!this._isReady()) {
			return [];
		}

		var activeInterval = this._getActiveInterval();

		// find keys of all cues, where cue interval is partially or fully covered by searchInterval
		var oldKeys = this._activeKeys;		
		var newKeys = this._seqA.getCuesByInterval(activeInterval).map(function (item) {
			return item.key;
		});	
	    var exitKeys = unique(oldKeys, newKeys);
	    var enterKeys = unique(newKeys, oldKeys);

	    /* 
	    	changeKeys
	    	change keys are elements that remain in activeKeys,
	    	but were reported as changed by the axis 
	    */
	    var changeKeys = [];
	    if (axisOpList) {
		    axisOpList.forEach(function (op) {
		    	if (oldKeys.indexOf(op.key) > -1 && newKeys.indexOf(op.key) > -1) {
		    		changeKeys.push(op.key);
		    	}
		    });
		}
	    
		// update active keys
	    this._activeKeys = newKeys;

	    // make event items from enter/exit keys
	    var eList = [];
	    var exitItems = exitKeys.forEach(function (key) {
	    	var op = this._getOpFromAxisOpList(axisOpList, key);
	    	var interval, data;
	    	if (op.type === axis.OpType.REMOVE) {
	    		interval = op.interval;
	    		data = op.data;
	    	} else {
	    		interval = this._axis.getIntervalByKey(key);
	    		data = this.getData(key);
	    	}
	    	eList.push({
	    		type: "exit", 
	    		e: {
	    			key : key, 
	    			interval : interval,
	    			type : "exit",
	    			data : data
	    		}
	    	});
	    }, this);
	    var enterItems = enterKeys.forEach(function (key) {
	    	eList.push({
	    		type: "enter", 
	    		e: {
	    			key:key, 
	    			interval: this._axis.getIntervalByKey(key),
	    			type: "enter",
	    			data: this.getData(key)
	    		}
	    	});
	    }, this);
	    var changeItems = changeKeys.forEach(function (key) {
	    	eList.push({
	    		type: "change", 
	    		e: {
	    			key:key, 
	    			interval: this._axis.getIntervalByKey(key),
	    			type: "change",
	    			data: this.getData(key)
	    		}
	    	});
	    }, this);
	    this.eventifyTriggerEvents(eList);
 
	    // make event items from active keys
	    return this._activeKeys.map(function (key) {
	    	return {
	    		type: "enter", 
	    		e: {
	    			key:key, 
	    			interval: this._axis.getIntervalByKey(key),
	    			type : "enter"
	    		}
	    	};
	    }, this);
	};

	/*
		API

		Operations that affect the axis can safely be directed to 
		one of the sequencers, since the two sequencers forward these operations to a shared axis.
	*/

	WindowSequencer.prototype.request = function () {
		return this._seqA.request();
	};

	WindowSequencer.prototype.addCue = function (key, interval, data) {
		return this._seqA.addCue(key, interval, data);
	};

	WindowSequencer.prototype.removeCue = function (key, removedData) {
		return this._seqA.removeCue(key, removedData);
	};

	// true if cues exists with given key
	WindowSequencer.prototype.hasCue = function (key) {
		return this._seqA.hasCue(key);
	};

	// Get all keys
	WindowSequencer.prototype.keys = function () {
		return this._seqA.keys();
	};
	
	// get specific cue {key: key, interval:interva} given key
	WindowSequencer.prototype.getCue = function (key) {
 		return this._seqA.getCue(key);
	};

	// get all cues
	WindowSequencer.prototype.getCues = function () {
		return this._seqA.getCues();
	};

	// return true if cue of given key is currently active
	WindowSequencer.prototype.isActive = function (key) {
		return (this._activeKeys.indexOf(key) > -1);
	};

	// Get keys of active cues
	WindowSequencer.prototype.getActiveKeys = function () {
		// copy keys
		var res = [];
		this._activeKeys.forEach(function (key) {
			res.push(key);
		}, this);
		return res;
	};

	WindowSequencer.prototype.getActiveCues = function () {
		var res = [];
		this._activeKeys.forEach(function (key) {
			res.push(this.getCue(key));
		}, this);
		return res;

	};

	// return all (key, inteval, data) tuples, where interval covers point
	WindowSequencer.prototype.getCuesByPoint = function (point) {
		return this._seqA.getCuesByPoint(point);
	};

	// return all cues with at least one endpoint within searchInterval
	WindowSequencer.prototype.getCuesByInterval = function (searchInterval) {
		return this._seqA.getCuesByInterval(searchInterval);
	};

	// return all cues covered by searchInterval
	WindowSequencer.prototype.getCuesCoveredByInterval = function (searchInterval) {
		return this._seqA.getCuesCoveredByInterval(searchInterval);
	};

	// shutdown
	WindowSequencer.prototype.close = function () {
		this._axis.off("change", this._wrappedOnAxisChange);
		this._toA.off("change", this._wrappedOnTimingChangeA);
		this._toB.off("change", this._wrappedOnTimingChangeB);
		this._seqA.off("events", this._wrappedOnSequencerChangeA);
		this._seqB.off("events", this._wrappedOnSequencerChangeB);
		this._seqA.close();
		this._seqB.close();
	};

	// inheritance
	// To be overridden by subclass specializations
	WindowSequencer.prototype.loadData = function () {};
	WindowSequencer.prototype.getData = function (key) {};

	return WindowSequencer;
});
/*
    Copyright 2015 Norut Northern Research Institute
    Author : Ingar Mæhlum Arntzen

  This file is part of the Timingsrc module.

  Timingsrc is free software: you can redistribute it and/or modify
  it under the terms of the GNU Lesser General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  Timingsrc is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Lesser General Public License for more details.

  You should have received a copy of the GNU Lesser General Public License
  along with Timingsrc.  If not, see <http://www.gnu.org/licenses/>.
*/

define ('sequencing/timingcallbacks',['util/motionutils'], function (motionutils) {

  'use strict';

    // Utility inheritance function.
  var inherit = function (Child, Parent) {
    var F = function () {}; // empty object to break prototype chain - hinder child prototype changes to affect parent
    F.prototype = Parent.prototype;
    Child.prototype = new F(); // child gets parents prototypes via F
    Child.uber = Parent.prototype; // reference in parent to superclass
    Child.prototype.constructor = Child; // resetting constructor pointer 
  };

  var TimingCallbackBase = function (timingObject, handler) {
    this._timingsrc = timingObject;
    this._handler = handler;
    this._timeout = null;
    this._wrappedOnChange = function () {this._onChange();};
    // initialise
    this.timingsrc = timingObject;
  }; 

  TimingCallbackBase.prototype._renewTimeout = function () {
    this._clearTimeout();
    var res = this._calculateTimeout();
    if (res.delay === null) return null;
    var self = this;
    this._timeout = this._timingsrc.clock.setTimeout(function () {
      self._onTimeout();
    }, res.delay, {anchor: res.anchor, early: 0.005});    
  };

  // update event from timing object
  TimingCallbackBase.prototype._clearTimeout = function () {
    // cleanup
    if (this._timeout !== null) {
      this._timeout.cancel();
      this._timeout = null;
    }
  };

  // update event from timing object
  TimingCallbackBase.prototype.cancel = function () {
    // cleanup
    this._clearTimeout();
    this._timingsrc.off("change", this._wrappedOnChange, this);  
  };

  /*
    Accessor for timingsrc.
    Supports dynamic switching of timing source by assignment.
  */
  Object.defineProperty(TimingCallbackBase.prototype, 'timingsrc', {
    get : function () {return this._timingsrc;},
    set : function (timingObject) {
      if (this._timingsrc) {
        this._timingsrc.off("change", this._wrappedOnChange, this);
      }
      clearTimeout(this._tid);
      this._timingsrc = timingObject;
      this._timingsrc.on("change", this._wrappedOnChange, this);
    }
  });


  /*
      SET POINT CALLBACK
      callback when timing object position is equal to point
      options {repeat:true} implies that callback will occur repeatedly
      every time timing object passes point.
      Default is to fire only once, similar to setTimeout
  */

  var SetPointCallback = function (timingObject, handler, point, options) {
    TimingCallbackBase.call(this, timingObject, handler);
    this._options = options || {}; 
    this._options.repeat = (this._options.repeat !== undefined) ? this._options.repeat : false;
    this._point = point;
  };
  inherit(SetPointCallback, TimingCallbackBase);


  // update event from timing object
  SetPointCallback.prototype._onChange = function () {
    if (this._timingsrc.query().position === this._point) {
      this._handler();
    }
    this._renewTimeout();
  };

  // update event from timing object
  SetPointCallback.prototype._onTimeout = function () {
    if (!this._options.repeat) {
      this.cancel();
    };
    this._handler();
    this._renewTimeout();
  };

  SetPointCallback.prototype._calculateTimeout = function () {
    var vector = this._timingsrc.query();
    var delay = motionutils.calculateMinPositiveRealSolution(vector, this._point);
    return {
      anchor: vector.timestamp,
      delay: delay
    };
  };

  
  /*
    
    SET INTERVAL CALLBACK

    callback callback for every point x, where (x - offset) % length === 0
    options : {offset:offset}
    Default is offset 0
  */

  var SetIntervalCallback = function (timingObject, handler, length, options) {
    TimingCallbackBase.call(this, timingObject, handler);
    this._options = options || {}; 
    this._options.offset = (this._options.offset !== undefined) ? this._options.offset : 0;
    this._length = length;
  };
  inherit(SetIntervalCallback, TimingCallbackBase);

  // ovverride modulo to behave better for negative numbers 
  SetIntervalCallback.prototype._mod = function (n, m) {
    return ((n % m) + m) % m;
  };

  // get point representation from float
  SetIntervalCallback.prototype._getPoint = function (x) {
    var skew = this._options.offset;
    return {
      n : Math.floor((x-skew)/this._length),
      offset : this._mod(x-skew, this._length)
    };
  };

    // get float value from point representation
  SetIntervalCallback.prototype._getFloat = function (p) {
    var skew = this._options.offset;
    return skew + (p.n * this._length) + p.offset;
  };

  // update event from timing object
  SetIntervalCallback.prototype._onChange = function () {
    var points = this._calculatePoints(this._timingsrc.query().position);
    if (points.isTarget) {
      this._handler();
    }
    this._renewTimeout();
  };

  // update event from timing object
  SetIntervalCallback.prototype._onTimeout = function () {
    this._handler();
    this._renewTimeout();
  };

  /*
    Calculate target points before and after a given position.
    If the given position is itself a target point, this will
    be reported as isTarget===true.
  */

  SetIntervalCallback.prototype._calculatePoints = function (position) {
    var beforePoint = {}, afterPoint = {};
    var target;
    var point = this._getPoint(position);
    if (point.offset === 0) {
      target = true;
      beforePoint.n = point.n - 1;
      beforePoint.offset = point.offset;
      afterPoint.n = point.n + 1;
      afterPoint.offset = point.offset;
    } else {
      target = false;
      beforePoint.n = point.n;
      beforePoint.offset = 0;
      afterPoint.n = point.n + 1;
      afterPoint.offset = 0;
    }
    return {
      isTarget : target,
      before : this._getFloat(beforePoint),
      after : this._getFloat(afterPoint)
    }
  };

  SetIntervalCallback.prototype._calculateTimeout = function () {
    var vector = this._timingsrc.query();
    var points = this._calculatePoints(vector.position);
    var delay = motionutils.calculateDelta(vector, [points.before, points.after])[0];
    return {
      anchor: vector.timestamp,
      delay: delay
    };
  };


  // module definition
  return {
    setPointCallback: function (timingObject, handler, point, options) { return new SetPointCallback(timingObject, handler, point, options);},
    setIntervalCallback : function (timingObject, handler, length, options) { return new SetIntervalCallback(timingObject, handler, length, options);}
  };
}); 
define('sequencing/jerkyinterval',['util/eventutils', 'util/motionutils'], 
		function (eventutils, motionutils) {


	/*
		JERKY INTERVAL

		This describes an interval that can be controlled using one or two timing objects.
		
		- advances in a step-wise manner (i.e. DISCRETE or JERKY) along the timeline, when needed 
			- triggered by change events from timingobjects, or
			- timingobjects violate left or right restrictions

		- left  : buffer to the left of the leftmost timing object - defaults to 5 units (i.e. 5 seconds at velocity 1 unit/second)
		- right : buffer to the rigth of the rightmost timing object - defaults to 5 units (i.e. 5 seconds at velocity 1 unit/second)

		- total length of interval fixed when reevaluated - as the union of three intervals 
			- [left, toA.position] U [toA.position, toB.position] U [toB.position, right]

		- the second timing object toB is optional. If missing the interval is fixed as
		 	- [left, toA.position] U [toA.position, right]
	*/


	var JerkyInterval = function (toA, toB, options) {
		// timingobjects
		this._toA = toA;
		this._toB = toB;
		this._toList = [this._toA];
		if (this._toB) this._toList.push(this._toB);

		// timeouts needed to detect left|right violations
		this._timeout = null;

		// options
		options = options || {};
		this._left = options.left || 5;
		this._right = options.right || 5;

		// internal state
		this._low;
		this._high;
		this._ready = false;

		// event support
		eventutils.eventify(this, JerkyInterval.prototype);
		this.eventifyDefineEvent("ready", {init:true}) // define ready event
		this.eventifyDefineEvent("change", {init:true}); // define change event (supporting init-event)

		// ready when all timingobjects are ready
		var self = this;
		var promises = this._toList.map(function(to) {
			return to.readyPromise;
		});
		Promise.all(promises).then(function (values) {
			self._initialise();
		});

		// subscribe to events from all timing objects
		this._toList.forEach(function (to) {
			to.on("change", this._onChange, this);
		}, this);
	};

	JerkyInterval.prototype._initialise = function () {
		this._ready = true;
		this.eventifyTriggerEvent("ready");
	};

	JerkyInterval.prototype.eventifyMakeInitEvents = function (type) {
		if (type === "change") {
			return [{type: type, e: undefined}]; 
		} else if (type === "ready") {
			return (this._ready) ? [{type:type, e: undefined}] : []; 
		} 
		return [];
	};

	Object.defineProperty(JerkyInterval.prototype, 'ready', {
		get : function () {
			return this._ready;
		}
	});

	Object.defineProperty(JerkyInterval.prototype, 'low', {
		get : function () {
			return this._low;
		}
	});

	Object.defineProperty(JerkyInterval.prototype, 'high', {
		get : function () {
			return this._high;
		}
	});

	Object.defineProperty(JerkyInterval.prototype, 'readyPromise', {
		get : function () {
			var self = this;
			return new Promise (function (resolve, reject) {
				if (self._ready) {
					resolve();
				} else {
					var onReady = function () {
						self.off("ready", onReady);
						resolve()
					};
					self.on("ready", onReady);
				}
			});
		}
	});

	Object.defineProperty(JerkyInterval.prototype, 'range', {
		get : function () {
			return [this._low, this._high];
		}
	});

	JerkyInterval.prototype._onChange = function () {
		this._refresh();
	};

	JerkyInterval.prototype._onTimeout = function () {
		this._refresh();
	}


	JerkyInterval.prototype._refresh = function () {
		var self = this;
		var snapshots = this._toList.map(function (to) {
			return to.query();
		});
		var ok = this._checkRange(snapshots);
		if (!ok) {
			// not ok - update low and high based on snapshot
			this._update(snapshots);
		}
		this._resetTimeout();
	};

	JerkyInterval.prototype._update = function (vectorList) {
		var low = vectorList.reduce(function (prevLow, vector) {
			return Math.min(prevLow, vector.position);
		}, Infinity) - this._left;
		var high = vectorList.reduce(function (prevHigh, vector) {
			return Math.max(prevHigh, vector.position);
		}, -Infinity) + this._right;
		var dirty = false;
		if (low !== this._low){
			this._low = low;
			dirty = true;
		}
		if (high !== this._high) {
			this._high = high;
			dirty = true;
		}
		if (dirty) {
			this.eventifyTriggerEvent("change");
		}
	};

	JerkyInterval.prototype._checkRange = function (vectorList) {
		return vectorList.map(function (vector) {
			var direction = motionutils.calculateDirection(vector, vector.timestamp);
			var ok = true;		
			if (this._low === undefined || this._high === undefined) {
				ok = false;
			} else if (vector.position < this._low || this._high < vector.position) {
				ok = false;
			} else if (vector.position === this._low && direction === -1) {
				ok = false;
			} else if (vector.position === this._high && direction === 1) {
				ok = false;
			}
			return ok;
		}, this)
		.reduce(function (prevResult, bool) {
			return prevResult && bool;
		}, true);
	};

	JerkyInterval.prototype._calculateTimeout = function () {
		var self = this;
		return this._toList.map(function (to) {
			return motionutils.calculateDelta(to.query(), [self._low, self._high])[0];
		})
		.reduce(function (prevDelay, delay) {
			// delta positive value or null
			if (prevDelay !== null && delay !== null) return Math.min(prevDelay, delay);
			else if (delay !== null) return delay;
			else if (prevDelay !== null) return prevDelay;
			else return null;
		}, null);
	};

	JerkyInterval.prototype._clearTimeout = function () {
		if (this._timeout !== null) {
			this._timeout.cancel();
			this._timeout = null;
		}
	};

	JerkyInterval.prototype._resetTimeout = function () {
		this._clearTimeout();
		var delay = this._calculateTimeout();
		if (delay !== null) {
	 		var self = this;
	 		this._timeout = this._toA.clock.setTimeout(function () {
				self._onTimeout();
	      	}, delay, {early: 0.005}); 
      	}	
	};

	return JerkyInterval;
});
/*
	Copyright 2015 Norut Northern Research Institute
	Author : Ingar Mæhlum Arntzen

  This file is part of the Timingsrc module.

  Timingsrc is free software: you can redistribute it and/or modify
  it under the terms of the GNU Lesser General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  Timingsrc is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Lesser General Public License for more details.

  You should have received a copy of the GNU Lesser General Public License
  along with Timingsrc.  If not, see <http://www.gnu.org/licenses/>.
*/

define('sequencing/main',['./sequencer', './windowsequencer', './timingcallbacks','./jerkyinterval'], 
	function (seq, WindowSequencer, timingcallbacks, JerkyInterval) {		
		'use strict';

    // Common constructor for Sequencer and WindowConstructor
    var Sequencer = function (timingObjectA, timingObjectB, _axis) {
      if (timingObjectB === undefined) {
        return new seq.DefaultSequencer(timingObjectA, _axis);
      } else {
        return new WindowSequencer(timingObjectA, timingObjectB, _axis); 
      }
    };

		return {
			Sequencer : Sequencer,
			Interval : seq.Interval,
			inherit : seq.inherit,
      setPointCallback : timingcallbacks.setPointCallback,
      setIntervalCallback : timingcallbacks.setIntervalCallback,
      JerkyInterval : JerkyInterval
		};
	}
);
/*
  Copyright 2015 Norut Northern Research Institute
  Author : Njaal Trygve Borch njaal.borch@norut.no

  This file is part of the Timingsrc module.

  Timingsrc is free software: you can redistribute it and/or modify
  it under the terms of the GNU Lesser General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  Timingsrc is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Lesser General Public License for more details.

  You should have received a copy of the GNU Lesser General Public License
  along with Timingsrc.  If not, see <http://www.gnu.org/licenses/>.
*/

/*
  MEDIASYNC

  Time-aligning a HTMLMediaElement to a Timing Object

*/

define ('mediasync/mediasync',[],function () {

  'use strict';

  /**
   * Detect if we need to kick the element
   * If it returns true, you can re-run this function on
   * a user interaction to actually perform the kick
   */
  var _need_kick;
  function needKick(elem) {
    if (_need_kick === false) {
      return false;
    }
    if (elem.canplay) {
      _need_kick = false;
      return false;
    }
    var m = elem.muted;
    elem.muted = true
    elem.play();
    _need_kick = elem.paused == true;
    elem.pause();
    elem.muted = m;
    return _need_kick;
  }

  /**
   * The mediaSync object will try to synchronize an HTML 
   * media element to a Shared Motion.  It exploits 
   * playbackRate functionality if possible, but will fallback 
   * to only currentTime manipulation (skipping) if neccesariy.
   *
   * Options: 
   *  * skew (default 0.0) 
   *     how many seconds (float) should be added to the 
   *     motion before synchronization.  Calculate by 
   *     start point of element - start point of motion
   *  * automute (default true)
   *     Mute the media element when playing too fast (or too slow) 
   *  * mode (default "auto")
   *     "skip": Force "skip" mode - i.e. don't try using playbackRate.
   *     "vpbr": Force variable playback rate.  Normally not a good idea
   *     "auto" (default): try playbackRate. If it's not supported, it will
   *     struggle for a while before reverting.  If 'remember' is not set to
   *     false, this will only happen once after each browser update.
   *  * loop (default false)
   *     Loop the media   
   *  * debug (default null)
   *     If debug is true, log to console, if a function, the function
   *     will be called with debug info
   *  * target (default 0.025 - 25ms ~ lipsync)
   *     What are we aiming for?  Default is likely OK, if we can do 
   *     better, we will.  If the target is too narrow, you'll end up
   *     with a more skippy experience.  When using variable playback
   *     rates, this parameter is ignored (target is always 0)
   *  * remember (default false)
   *     Remember the last experience on this device - stores support
   *     or lack of support for variable playback rate.  Records in
   *     localStorage under key "mediascape_vpbr", clear it to re-learn
   */
  function mediaSync(elem, motion, options) {
    var API;
    var _options = options || {};
    _options.skew = _options.skew || 0.0;
    _options.target = _options.target || 0.025;
    _options.original_target = _options.target;
    _options.loop = _options.loop || false;
    _options.target = _options.target * 2; // Start out coarse
    if (_options.remember === undefined){
      _options.remember = false;
    }
    if (_options.debug || _options.remember === false) {
      localStorage.removeItem("mediascape_vpbr")
      _options.remember = false;
    }
    if (_options.automute === undefined) {
      _options.automute = true;
    }
    var _auto_muted = false;


    var onchange = function(e) {
      _bad = 0;
      _samples = [];
      _last_skip = null;

      // If we're paused, ignore
      if (_stopped || _paused) {
        return;
      }
     
      if (_update_func != undefined) {
        _update_func(e);          
      } else {
        console.log("WARNING: onchange but no update func yet");
      }
    }

    var setMotion = function(motion) {
      _bad = 0;
      if (_motion) {
        _motion.off("change", onchange);        
      }
      _motion = motion;

      // if motion is a timing object, we add some shortcuts
      if (_motion.version == 3) {
        _motion.__defineGetter__("pos", function() {return _motion.query().position});
        _motion.__defineGetter__("vel", function() {return _motion.query().velocity});
        _motion.__defineGetter__("acc", function() {return _motion.query().acceleration});
      }

      _motion.on("change", onchange);
    };

    if (!motion) {
      console.log("WARNING: No motion has been set");
    } else {
      //setMotion(motion);      
    }


    var _stopped = false;
    var _paused = false;
    var _motion;

    function onpaused() {
      if (_motion.vel == 1) {
        elem.play();
      }      
    }
    function onplay() {
      console.log("onplay");
      if (_motion.vel == 0) {
        elem.pause();
      }
    }
    function onerror() {
      console.log(err); // TODO: REPORT ERRORS
      stop();      
    }

    var pause = function(val) {
      if (val == undefined) val = true;
      _paused = val;
      if (!_paused) {
        onchange();
      }
    }

    var stop = function() {
      _stopped = true;
      elem.removeEventListener("paused", onpaused);
      elem.removeEventListener("play", onplay);
      elem.removeEventListener("error", onerror);
    }


    var _update_func;
    var _bad = 0;
    var _amazing = 0;
    var last_update;
    var _samples = [];
    var _vpbr; // Variable playback rate
    var _last_bad = 0;
    var _perfect = 5;
    var _is_in_sync = false;

    
    var _last_skip;
    var _thrashing = 0;
    var skip = function(pos) {
      if (elem.readyState == 0) {
        return;
      }
      if (_motion.vel != 1) {
        // Just skip, don't do estimation
        elem.currentTime = pos;
        _last_skip = undefined;
        _doCallbacks("skip", {event:"skip", pos:pos, target:_motion.pos, adjust:0})
        return;
      }

      var adjust = 0;
      var now = performance.now();
      if (_last_skip) {
        if (now - _last_skip.ts < 1500) {
          _thrashing += 1;
          if (_thrashing > 3) {
            // We skipped just a short time ago, we're thrashing
            _dbg("Lost all confidence (thrashing)");
            _options.target = Math.min(1, _options.target*2);            
            _doCallbacks("target_change", {
              event: "target_change",
              target: _options.target,
              reason: "thrashing"
            });
            _thrashing = 0;
          }
        } else {
          _thrashing = 0;
        }
        var elapsed = (now - _last_skip.ts) / 1000;
        var cur_pos = elem.currentTime;
        var miss = (loop(_last_skip.pos + elapsed)) - cur_pos;
        adjust = _last_skip.adjust + miss;
        if (Math.abs(adjust) > 5) adjust = 0; // Too sluggish, likely unlucky
      }
      // Ensure that we're playing back at speed 1
      elem.playbackRate = 1.0;
      _dbg({type:"skip", pos:pos + adjust, target:loop(_motion.pos), adjust:adjust});
      _perfect = Math.min(5, _perfect + 5);
      if (_motion.vel != 1) {
        elem.currentTime = pos;
      } else {
        elem.currentTime = pos + adjust;
        _last_skip = {
          ts: now, //performance.now(),
          pos: pos,
          adjust: adjust
        }
      }
      if (_is_in_sync) {
        _is_in_sync = false;
        _doCallbacks("sync", {event:"sync", sync:false});
      }
      _doCallbacks("skip", {event:"skip", pos:pos + adjust, target:_motion.pos, adjust:adjust})
    };


    function loop(pos) {
      if (_options.loop) {
        if (_options.duration) {
          return pos % _options.duration;          
        } else {
          return pos % elem.duration;                    
        }
      }
      return pos;
    }

    // onTimeChange handler for variable playback rate
    var update_func_playbackspeed = function(e) {
      if (_stopped || _paused) {
        return;
      }
        var snapshot = query();
        if (loop(snapshot.pos) == last_update) {
          return;
        }
        last_update = loop(snapshot.pos);

        // If we're outside of the media range, don't stress the system
        var p = loop(snapshot.pos + _options.skew);
        var duration = elem.duration;
        if (duration) {
          if (p < 0 || p > duration) {
            if (!elem.paused) {
              elem.pause();
            }
            return;
          }
        }

        // Force element to play/pause correctly
        if (snapshot.vel != 0) {
          if (elem.paused) {
            elem.play();
          }
        } else if (!elem.paused) {
          elem.pause();
        }

        try {
          if (!_vpbr && _bad > 40) {
            if (_auto_muted) {
              elem.muted = false;
              _auto_muted = false;              
            }
            _doCallbacks("muted", {event:"muted", muted:false});
            throw new Error("Variable playback rate seems broken - " + _bad + " bad");
          }
          // If we're WAY OFF, jump
          var diff = p - elem.currentTime;
          if ((diff < -1) || (snapshot.vel == 0 || Math.abs(diff) > 1)) {
            _dbg({type:"jump", diff:diff});
            // Stationary, we need to just jump
            var new_pos = loop(snapshot.pos + _options.skew);
            if (performance.now() - _last_bad > 150) {
              //_bad += 10;
              _last_bad = performance.now();            
              skip(new_pos);
            }
            return;
          }

          // Need to smooth diffs, many browsers are too inconsistent!
          _samples.push(diff);
          if (_samples.length >= 3) {
            var avg = 0;
            for (var i = 0; i < _samples.length; i++) {
              avg += _samples[i];
            }
            diff = avg / _samples.length;
            _samples = _samples.splice(0, 1);;
          } else {
            return;
          }

          // Actual sync
          _dbg({type:"dbg", diff:diff, bad:_bad, vpbr:_vpbr});
          var getRate = function(limit, suggested) {
            return Math.min(_motion.vel+limit, Math.max(_motion.vel-limit, _motion.vel + suggested));
          }

          if (Math.abs(diff) > 1) {
            _samples = [];
            elem.playbackRate = getRate(1, diff*1.3); //Math.max(0, _motion.vel + (diff * 1.30));
            _dbg({type:"vpbr", level:"coarse", rate:elem.playbackRate});
            _bad += 4;
          } else if (Math.abs(diff) > 0.5) {
            _samples = [];
            elem.playbackRate = getRate(0.5, diff*0.75);//Math.min(1.10, _motion.vel + (diff * 0.75));
            _dbg({type:"vpbr", level:"mid", rate:elem.playbackRate});
            _bad += 2;
          } else if (Math.abs(diff) > 0.1) {
            _samples = [];
            elem.playbackRate = getRate(0.4, diff*0.75);//Math.min(1.10, _motion.vel + (diff * 0.75));
            _dbg({type:"vpbr", level:"midfine", rate:elem.playbackRate});
            _bad += 1;
          } else if (Math.abs(diff) > 0.025) {
            _samples = [];
            elem.playbackRate = getRate(0.30, diff*0.60)//Math.min(1.015, _motion.vel + (diff * 0.30));
            _dbg({type:"vpbr", level:"fine", rate:elem.playbackRate});
          } else {
            if (!_vpbr) {
              _bad = Math.max(0, _bad-20);
              _amazing++;
              if (_amazing > 5) {
                _vpbr = true; // Very unlikely to get here if we don't support it!
                if (localStorage && _options.remember) {
                  _dbg("Variable Playback Rate capability stored");
                  localStorage["mediascape_vpbr"] = JSON.stringify({'appVersion':navigator.appVersion, "vpbr":true});
                }
              }
            }
            if (!_is_in_sync) {
              _is_in_sync = true;
              _doCallbacks("sync", {
                event: "sync",
                sync: true
              });
            }
            elem.playbackRate = getRate(0.02, diff * 0.07); //_motion.vel + (diff * 0.1);
          }
        if (_options.automute) {
          if (!elem.muted && (elem.playbackRate > 1.05 || elem.playbackRate < 0.95)) {
            _auto_muted = true;              
            elem.muted = true;
            _doCallbacks("muted", {event:"muted", muted:true});
            _dbg({type:"mute", muted:true});
          } else if (elem.muted && _auto_muted) {
            _auto_muted = false;
            elem.muted = false;
            _dbg({type:"mute", muted:false});
            _doCallbacks("muted", {event:"muted", muted:false});
          }
        }

      } catch (err) {
        // Not supported after all!
        if (_options.automute) {
          elem.muted = false;
        }
        _last_skip = null;  // Reset skip stuff
        if (localStorage && _options.remember) {
          _dbg("Variable Playback Rate NOT SUPPORTED, remembering this  ");
          localStorage["mediascape_vpbr"] = JSON.stringify({'appVersion':navigator.appVersion, "vpbr":false});
        }
        console.log("Error setting variable playback speed - seems broken", err);
        _setUpdateFunc(update_func_skip);
      }
    };

    var last_pos;
    var last_diff;
    // timeUpdate handler for skip based sync
    var update_func_skip = function(ev) {
      if (_stopped || _paused) {
        return;
      }

      var snapshot = query();
      if (snapshot.vel > 0) {
        if (elem.paused) {
          elem.play();
        }
      } else if (!elem.paused) {
        elem.pause();
      }

      if (snapshot.vel != 1) {
        if (loop(snapshot.pos) == last_pos) {
          return;
        }
        last_pos = snapshot.pos;
        _dbg("Jump, playback speed is not :", snapshot.vel);
        // We need to just jump
        var new_pos = loop(snapshot.pos + _options.skew);
        if (elem.currentTime != new_pos) {
          skip(new_pos, "jump");
        }
        return;
      }

      var p = snapshot.pos + _options.skew;
      var diff = p - elem.currentTime;

      // If this was a Motion jump, skip immediately
      if (ev != undefined && ev.pos != undefined) {
        _dbg("MOTION JUMP");
        var new_pos = snapshot.pos + _options.skew;
        skip(new_pos);
        return;
      }

      // Smooth diffs as currentTime is often inconsistent
      _samples.push(diff);
      if (_samples.length >= 3) {
        var avg = 0;
        for (var i = 0; i < _samples.length; i++) {
          avg += _samples[i];
        }
        diff = avg / _samples.length;
        _samples.splice(0, 1);
      } else {
        return;
      }

      // We use the number of very good hits to build confidence
      if (Math.abs(diff) < 0.001) {
        _perfect = Math.max(5, _perfect); // Give us some breathing space!      
      }

      if (_perfect <= -2) {
        // We are failing to meet the target, make target bigger
        _dbg("Lost all confidence");
        _options.target = Math.min(1, _options.target*1.4);
        _perfect = 0;
        _doCallbacks("target_change", {
          event: "target_change",
          target: _options.target,
          reason: "unknown"
        });
      } else if (_perfect > 15) {
        // We are hitting the target, make target smaller if we're beyond the users preference
        _dbg("Feels better");
        if (_options.target == _options.original_target) {
          // We're improving yet 'perfect', trigger "good" sync event
          if (!_is_in_sync) {
            _is_in_sync = true;
            _doCallbacks("sync", {event:"sync", sync:true});
          }
        }
        _options.target = Math.max(Math.abs(diff) * 0.7, _options.original_target);
        _perfect -= 8;
        _doCallbacks("target_change", {
          event: "target_change",
          target: _options.target,
          reason: "improving"
        });
      }

      _dbg({type:"dbg", diff:diff, target:_options.target, perfect:_perfect});

      if (Math.abs(diff) > _options.target) {
        // Target miss - if we're still confident, don't do anything about it
        _perfect -= 1;
        if (_perfect > 0) {
          return;
        }
        // We've had too many misses, skip
        new_pos = _motion.pos + _options.skew
        //_dbg("Adjusting time to " + new_pos);
        _perfect += 8;  // Give some breathing space
        skip(new_pos);
      } else {
        // Target hit
        if (Math.abs(diff - last_diff) < _options.target / 2) {
          _perfect++;
        }
        last_diff = diff;
      }
    }

    var _initialized = false;
    var init = function() {
      if (_initialized) return;
      _initialized = true;
      if (_motion === undefined) {
        setMotion(motion);
      }
      if (localStorage && _options.remember) {
         if (localStorage["mediascape_vpbr"]) {
            var vpbr = JSON.parse(localStorage["mediascape_vpbr"]);
            if (vpbr.appVersion === navigator.appVersion) {
              _vpbr = vpbr.vpbr;
            }
         }
      }

      if (_options.mode === "vpbr") {
        _vpbr = true;
      }
      if (_options.mode === "skip" || _vpbr === false) {
        elem.playbackRate = 1.0;
        _update_func = update_func_skip;
      } else {
        if (_options.automute) {
          elem.muted = true;
          _auto_muted = true;
          _doCallbacks("muted", {event:"muted", muted:true});
        }
        _update_func = update_func_playbackspeed;
      }
      elem.removeEventListener("canplay", init);
      elem.removeEventListener("playing", init);
      _setUpdateFunc(_update_func);
      _motion.on("change", onchange);
    } 

    elem.addEventListener("canplay", init);
    elem.addEventListener("playing", init);    

    var _last_update_func;
    var _poller;
    var _setUpdateFunc = function(func) {
      if (_last_update_func) {
        clearInterval(_poller);
        elem.removeEventListener("timeupdate", _last_update_func);
        elem.removeEventListener("pause", _last_update_func);
        elem.removeEventListener("ended", _last_update_func);        
      }
      _last_update_func = func;
      elem.playbackRate = 1.0;
      elem.addEventListener("timeupdate", func);
      elem.addEventListener("pause", func);
      elem.addEventListener("ended", func);

      if (func === update_func_playbackspeed) {
        _doCallbacks("mode_change", {event:"mode_change", mode:"vpbr"});
      } else {
        _doCallbacks("mode_change", {event:"mode_change", mode:"skip"});
      }
    }

    var query = function() {
      // Handle both msvs and timing objects
      if (_motion.version == 3) {
        var q = _motion.query();
        return {
          pos: q.position,
          vel: q.velocity,
          acc: q.acceleration
        }
      }
      return _motion.query();
    }


    var setSkew = function(skew) {
      _options.skew = skew;
    }

    var getSkew = function() {
      return _options.skew;
    }

    var setOption = function(option, value) {
      _options[option] = value;
      if (option === "target") {
        _options.original_target = value;
      }
    }

    /*
     * Return 'playbackRate' or 'skip' for play method 
     */
    var getMethod = function() {
      if (_update_func === update_func_playbackspeed) {
        return "playbackRate";
      } 
      return "skip";
    }

    // As we are likely asynchronous, we don't really know if elem is already
    // ready!  If it has, it will not emit canplay.  Also, canplay seems shady
    // regardless
    var beater = setInterval(function() {
      if (elem.readyState >= 2) {
        clearInterval(beater);
        try {
          var event = new Event("canplay");
          elem.dispatchEvent(event);
        } catch (e) {
          var event = document.createEvent("Event");
          event.initEvent("canplay", true, false)
          elem.dispatchEvent(event);
        }
      };
    }, 100);


    // callbacks    
    var _callbacks = {
      skip: [],
      mode_change: [],
      target_change: [],
      muted: [],
      sync: []
    };
    var _doCallbacks = function(what, e) {
      if (!_callbacks.hasOwnProperty(what)) {
        throw "Unsupported event: " + what;
      }
      for (var i = 0; i < _callbacks[what].length; i++) {
        h = _callbacks[what][i];
        try {
          h.call(API, e);
        } catch (e) {
          console.log("Error in " + what + ": " + h + ": " + e);
        }
      }
    };

    // unregister callback
    var off = function(what, handler) {
      if (!_callbacks.hasOwnProperty(what)) throw "Unknown parameter " + what;
      var index = _callbacks[what].indexOf(handler);
      if (index > -1) {
        _callbacks[what].splice(index, 1);
      }
      return API;
    };

    var on = function(what, handler, agentid) {
      if (!_callbacks.hasOwnProperty(what)) {
        throw new Error("Unsupported event: " + what);
      }
      if (!handler || typeof handler !== "function") throw "Illegal handler";
      var index = _callbacks[what].indexOf(handler);
      if (index != -1) {
        throw new Error("Already registered");
      }

      // register handler
      _callbacks[what].push(handler);

      // do immediate callback?
      setTimeout(function() {
        if (what === "sync") {
          _doCallbacks(what, {
            event: what,
            sync: _is_in_sync
          }, handler);          
        }
        if (what === "muted") {
          _doCallbacks(what, {
            event: what,
            muted: _auto_muted
          }, handler);          
        }
      }, 0);
      return API;
    };


    function _dbg() {
      if (!_options.debug) {
        return;
      }
      if (typeof(_options.debug) === "function") {
        //_options.debug(arguments);
        var args = arguments;
        setTimeout(function() {
          _options.debug.apply(window, args);
        }, 0);
      } else {
        var args = [];
        for (var k in arguments) {
          args.push(arguments[k]);
        }
        console.log(JSON.stringify(args));
      }
    }




    // Export the API
    API = {
      setSkew: setSkew,
      getSkew: getSkew,
      setOption: setOption,
      getMethod: getMethod,
      setMotion: setMotion,
      stop: stop,
      pause: pause,
      on: on,
      off: off,
      init:init
    };
    return API;
  }


  var MediaSync = function (elem, timingObject, options) {
    this._sync = mediaSync(elem, timingObject, options);
  };

  MediaSync.prototype.setSkew = function (skew) {
    this._sync.setSkew(skew);
  };

  MediaSync.prototype.getSkew = function () {
    this._sync.getSkew();
  };

  MediaSync.prototype.setOption = function (option, value) {
    this._sync.setOption(option, value);
  };

  MediaSync.prototype.getMethod = function () {
    this._sync.getMethod();
  };

  /*
    Accessor for timingsrc.
    Supports dynamic switching of timing source by assignment.
  */
  Object.defineProperty(MediaSync.prototype, 'timingsrc', {
    get : function () {return this._sync._motion;},
    set : function (timingObject) {
      this._sync.setMotion(timingObject);
    }
  });

  MediaSync.prototype.stop = function () {
    this._sync.stop();
  };

  MediaSync.prototype.pause = function (val) {
    this._sync.pause(val);
  };

  MediaSync.prototype.on = function (what, handler, agentid) {
    this._sync.on(what, handler, agentid);
  };

  MediaSync.prototype.off = function (type, handler) {
    this._sync.off(type, handler);
  };

  // export module
  return {
    mediaSync : mediaSync,
    MediaSync: MediaSync,
    mediaNeedKick : needKick
  };
});


/*
  Written by Ingar Arntzen, Norut
*/

define ('timingsrc',['./timingobject/main', './sequencing/main', './mediasync/mediasync'], 
	function (timingobject, sequencing, mediasync) {
	return {
		version : "v1",

		// Utils
		inherit : timingobject.inherit,

		// Timing Object
		TimingObject : timingobject.TimingObject,
		TimingProviderState : timingobject.TimingProviderState,

		// Timing Converters
		ConverterBase : timingobject.ConverterBase,
		SkewConverter : timingobject.SkewConverter,
		DelayConverter : timingobject.DelayConverter,
		ScaleConverter : timingobject.ScaleConverter,
		LoopConverter : timingobject.LoopConverter,
		RangeConverter : timingobject.RangeConverter,
		TimeShiftConverter : timingobject.TimeShiftConverter,
		LocalConverter : timingobject.LocalConverter,
		DerivativeConverter : timingobject.DerivativeConverter,
		
		// Sequencing
		Interval : sequencing.Interval,
		Sequencer : sequencing.Sequencer,
		setPointCallback : sequencing.setPointCallback,
		setIntervalCallback : sequencing.setIntervalCallback,
		JerkyInterval : sequencing.JerkyInterval,

		// MediaSync
		MediaSync: mediasync.MediaSync,
    	mediaNeedKick : mediasync.needKick
	};
});

    //The modules for your project will be inlined above
    //this snippet. Ask almond to synchronously require the
    //module value for 'main' here and return it as the
    //value to use for the public API for the built file.
    return require('timingsrc');
}));