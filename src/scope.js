'use strict';
var _ = require("lodash");

function Scope() {
  this.$$watchers = [];
  this.$$lastDirtyWatch = null;
  this.$$asyncQueue = [];
  this.$$applyAsyncQueue = [];
  this.$$applyAsyncId = null;
  this.$$postDigestQueue = [];
  this.$root = this;
  this.$$children = [];
  this.$$listeners = {};
  this.$$phase = null;
}

function initWatchVal() {

}
function isArrayLike(obj) {
  if (_.isNull(obj) || _.isUndefined(obj)) {
    return false;
  }
  var length = obj.length;
  return length === 0 || 
  (_.isNumber(length) && length > 0 && (length - 1) in obj);
}
Scope.prototype.$$fireEventOnScope = function(eventName, listenerArgs) {
 
  var listeners = this.$$listeners[eventName] || [];
  var i = 0;
  while (i < listeners.length) {
    if (listeners[i] === null) {
      listeners.splice(i, 1);
    } else {
      listeners[i].apply(null, listenerArgs);
      i++;
    }
  }
};
Scope.prototype.$emit = function(eventName) {
  var propogationStopped = false;
  var event = {
    name: eventName, 
    targetScope: this,
    stopPropogation: function() {
      propogationStopped = true;
    }
  };
  var listenerArgs = [event].concat(_.tail(arguments));
  var scope = this;
  do {
    event.currentScope = scope;
    scope.$$fireEventOnScope(eventName, listenerArgs);
    scope = scope.$parent;
  } while (scope && !propogationStopped);
  event.currentScope = null;
  return event;
};
Scope.prototype.$broadcast = function(eventName) {
  var event = {name: eventName, targetScope: this};
  var listenerArgs = [event].concat(_.tail(arguments));

  this.$$everyScope(function(scope) {
    event.currentScope = scope;
    scope.$$fireEventOnScope(eventName, listenerArgs);
    return true;
  });

  // this.$$fireEventOnScope(eventName, listenerArgs);
  event.currentScope = null;
  return event;
};
Scope.prototype.$on = function(eventName, listener) {
  var listeners = this.$$listeners[eventName];
  if (!listeners) {
    this.$$listeners[eventName] = listeners = [];
  }
  listeners.push(listener);
  return function() {
    var index = listeners.indexOf(listener);
    if (index >=0) {
      // listeners.splice(index, 1);
      listeners[index] = null;
    }
  };
};
Scope.prototype.$watchCollection = function(watchFn, listenerFn) {
  var self = this;
  var newVal;
  var oldVal;
  var oldLength;
  var veryOldValue;

  //只有这时才track
  var trackVeryOldValue = (listenerFn.length > 1);

  var changeCount = 0;
  var firstRun = true;

  var internalWatchFn = function(scope) {
    newVal = watchFn(scope);
    var newLength;

    if (_.isObject(newVal)) {
      if (isArrayLike(newVal)) {
        if (!_.isArray(oldVal)) {
          changeCount++;
          oldVal = [];
        }
        if (newVal.length !== oldVal.length) {
          changeCount++;
          oldVal.length = newVal.length;
        }

        _.forEach(newVal, function(newItem, i) {
          var bothNaN = _.isNaN(newItem) && _.isNaN(oldVal[i]);
          if (!bothNaN && newItem !== oldVal[i]) {
            changeCount++;
            oldVal[i] = newItem;
          }
        });
      } else {
        if (!_.isObject(oldVal) || isArrayLike(oldVal)) {
          changeCount++;
          oldVal = {};
          oldLength = 0;
        }
        newLength = 0;

        _.forOwn(newVal ,function(val, key) {
          newLength++;
          if (oldVal.hasOwnProperty(key)) {
            var bothNaN = _.isNaN(val) && _.isNaN(oldVal[key]);

            if (!bothNaN && oldVal[key] !== val) {
              changeCount++;
              oldVal[key] = val;
            }
          } else {
            changeCount++;
            oldLength++;
            oldVal[key] = val;
          }
        });

        if (oldLength > newLength) {
          changeCount++;
          _.forOwn(oldVal, function(val, key) {
            if (!newVal.hasOwnProperty(key)) {
              oldLength--;
              delete oldVal[key];
            }
          });
        }
      }
    } else {
      if (!self.$$areEqual(newVal, oldVal, false)) {
        changeCount++;
      }
    
      oldVal = newVal;
    }
   

    return changeCount;
  };

  var internalListenerFn = function() {
    if (firstRun) {
      listenerFn(newVal, newVal, self);
      firstRun = false;
    } else {
      listenerFn(newVal, veryOldValue, self);
    }

    if (trackVeryOldValue) {
      veryOldValue = _.clone(newVal);
    }
  };

  return this.$watch(internalWatchFn, internalListenerFn);
};
Scope.prototype.$$everyScope = function(fn) {
  if (fn(this)) {
    return this.$$children.every(function(child) {
      return child.$$everyScope(fn);
    });
  } else {
    return false;
  }
};
Scope.prototype.$new = function(isolated, parent) {
  var child;
  parent = parent || this;
  if (isolated) {
    child = new Scope();
    child.$root = parent.$root;
    //这里用parent和this一样，反正queue是共享的。
    child.$$asyncQueue = parent.$$asyncQueue;
    child.$$postDigestQueue = parent.$$postDigestQueue;
    child.$$applyAsyncQueue = parent.$$applyAsyncQueue;
  } else {
    var ChildScope = function() {};
    ChildScope.prototype = this;
    child = new ChildScope();
  }
  // 只属于parent的children
  parent.$$children.push(child);
  child.$$watchers = [];
  child.$$listeners = {};
  child.$$children = [];
  child.$parent = parent;
  return child;
};
Scope.prototype.$destroy = function() {
  if (this.$parent) {
    var siblings = this.$parent.$$children;
    var indexOfThis = siblings.indexOf(this);
    if (indexOfThis >=0) {
      siblings.splice(indexOfThis, 1);
    }
  }
  this.$$watchers = null;
};
Scope.prototype.$watchGroup = function(watchFns, listenerFn) {
  var self = this;
  var newValues = new Array(watchFns.length);
  var oldValues = new Array(watchFns.length);

  var changeReactionScheduled = false;
  var firstRun = true;

  if (watchFns.length === 0) {
    var shouldCall = true;

    self.$evalAsync(function() {
      if (shouldCall) {
        listenerFn(newValues, newValues, self);
      }
    });
    return function() {
      shouldCall = false;
    };
  }
  function watchGroupListener() {
    if (firstRun) {
      firstRun = false;
      listenerFn(newValues, newValues, self);
    } else {
      listenerFn(newValues, oldValues, self);
    }
    changeReactionScheduled = false;
  }

  var destroyFunctions = _.map(watchFns, function(watchFn, i) {
    return self.$watch(watchFn, function(newValue, oldValue) {
      newValues[i] = newValue;
      oldValues[i] = oldValue;
      if (!changeReactionScheduled) {
        changeReactionScheduled = true;
        self.$evalAsync(watchGroupListener);
      }
    });
  });
 
  return function() {
    _.forEach(destroyFunctions, function(destroyFunction) {
      destroyFunction();
    });
  };

};
Scope.prototype.$$postDigest = function(fn) {
  this.$$postDigestQueue.push(fn);
};
Scope.prototype.$$flushApplyAsync = function() {
  while (this.$$applyAsyncQueue.length) {
    try {
      this.$$applyAsyncQueue.shift()();
    } catch (e) {
      console.error(e);
    }
  }
  this.$root.$$applyAsyncId = null;
};
Scope.prototype.$applyAsync = function(expr) {
  var self = this;
  self.$$applyAsyncQueue.push(function() {
    self.$eval(expr);
  });

  //保证只有一个setTimeout
  if (self.$root.$$applyAsyncId === null) {
    self.$root.$$applyAsyncId = setTimeout(function() {
      self.$apply(_.bind(self.$$flushApplyAsync, self));
    }, 0);
  }

 
};
Scope.prototype.$beginPhase = function(phase) {
  if (this.$$phase) {
    throw this.$$phase + ' already in progress.';
  }
  this.$$phase = phase;
};
Scope.prototype.$clearPhase = function() {
  this.$$phase = null;
};
Scope.prototype.$apply = function(expr) {
  try {
    this.$beginPhase("$apply");
    return this.$eval(expr);
  } finally {
    this.$clearPhase();
    this.$root.$digest();
  }
};
Scope.prototype.$evalAsync = function(expr) {
  var self = this;
  if (!self.$$phase && !self.$$asyncQueue.length) {
    setTimeout(function() {
      if (self.$$asyncQueue.length) {
        self.$root.$digest();
      }
    }, 0);
  }
  this.$$asyncQueue.push({scope: this, expression: expr});
};
Scope.prototype.$eval = function(expr, locals) {
  return expr(this, locals);
};
Scope.prototype.$$areEqual = function(newVal, oldVal, valueEq) {
  if (valueEq) {
    return _.isEqual(newVal, oldVal);
  } else {
    return newVal === oldVal ||
      (typeof newVal === "number" && typeof oldVal === "number" && isNaN(newVal) && isNaN(oldVal)); 
  }
};

Scope.prototype.$watch = function(watchFn, listenerFn, valueEq) {
  var self = this;
  var watcher = {
    watchFn: watchFn,
    listenerFn: listenerFn || function(){},
    valueEq: Boolean(valueEq),
    last: initWatchVal
  };
  this.$$watchers.unshift(watcher);
  this.$root.$$lastDirtyWatch = null;

  return function() {
    var index = self.$$watchers.indexOf(watcher);
    if (index >=0) {
      self.$$watchers.splice(index, 1);
      self.$root.$$lastDirtyWatch = null;
    }
  };
};
Scope.prototype.$$digestOnce = function() {
  var self = this;
  var dirty;
  var continueLoop = true;

  this.$$everyScope(function(scope) {
    var newVal, oldVal;
    _.forEachRight(scope.$$watchers, function(watcher) {
      try {
        if (watcher) {
          newVal = watcher.watchFn(scope);
          oldVal = watcher.last;

          if (!scope.$$areEqual(newVal, oldVal, watcher.valueEq)) {
            self.$root.$$lastDirtyWatch = watcher;
            watcher.last = watcher.valueEq ? _.cloneDeep(newVal) : newVal;      
            watcher.listenerFn(newVal, oldVal === initWatchVal ? newVal : oldVal, scope);
            dirty = true;
          } else if (self.$root.$$lastDirtyWatch === watcher) {
            continueLoop = false;
            return false;
          }
        }
        
      } catch(e) {
        console.error(e);
      }
      
    });
    return continueLoop;
  });


  return dirty;
};
Scope.prototype.$digest = function() {
  var ttl = 10;
  var dirty;
  this.$root.$$lastDirtyWatch = null;
  this.$beginPhase("$digest");

  if (this.$root.$$applyAsyncId) {
    clearTimeout(this.$root.$$applyAsyncId);
    this.$$flushApplyAsync();
  }
  do {
    while(this.$$asyncQueue.length) {
      try {
        var asyncTask = this.$$asyncQueue.shift();
        asyncTask.scope.$eval(asyncTask.expression);
      } catch (e) {
        console.error(e);
      }
    }
    dirty = this.$$digestOnce();
    if ((dirty || this.$$asyncQueue.length) && ttl-- === 0) {
      this.$clearPhase();
      throw "10 digest iteration reached";
    }
  } while(dirty || this.$$asyncQueue.length);
  this.$clearPhase();

  while(this.$$postDigestQueue.length) {
    try {
      this.$$postDigestQueue.shift()();
    } catch (e) {
      console.error(e);
    }
  }
};
module.exports = Scope;