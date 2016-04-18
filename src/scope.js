'use strict';
var _ = require("lodash");

function Scope() {
  this.$$watchers = [];
  this.$$lastDirtyWatch = null;
  this.$$asyncQueue = [];
  this.$$applyAsyncQueue = [];
  this.$$applyAsyncId = null;
  this.$$phase = null;
}

function initWatchVal() {

}
Scope.prototype.$$flushApplyAsync = function() {
  while (this.$$applyAsyncQueue.length) {
    this.$$applyAsyncQueue.shift()();
  }
  this.$$applyAsyncId = null;
};
Scope.prototype.$applyAsync = function(expr) {
  var self = this;
  self.$$applyAsyncQueue.push(function() {
    self.$eval(expr);
  });

  //保证只有一个setTimeout
  if (self.$$applyAsyncId === null) {
    self.$$applyAsyncId = setTimeout(function() {
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
    this.$digest();
  }
};
Scope.prototype.$evalAsync = function(expr) {
  var self = this;
  if (!self.$$phase && !self.$$asyncQueue.length) {
    setTimeout(function() {
      if (self.$$asyncQueue.length) {
        self.$digest();
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
  var watcher = {
    watchFn: watchFn,
    listenerFn: listenerFn || function(){},
    valueEq: Boolean(valueEq),
    last: initWatchVal
  };
  this.$$watchers.push(watcher);
  this.$$lastDirtyWatch = null;
};
Scope.prototype.$$digestOnce = function() {
  var self = this;
  var newVal, oldVal, dirty;

  _.forEach(this.$$watchers, function(watcher) {
    newVal = watcher.watchFn(self);
    oldVal = watcher.last;

    if (!self.$$areEqual(newVal, oldVal, watcher.valueEq)) {
      self.$$lastDirtyWatch = watcher;
      watcher.last = watcher.valueEq ? _.cloneDeep(newVal) : newVal;      
      watcher.listenerFn(newVal, oldVal === initWatchVal ? newVal : oldVal, self);
      dirty = true;
    } else if (self.$$lastDirtyWatch === watcher) {
      return false;
    }
  });
  return dirty;
};
Scope.prototype.$digest = function() {
  var ttl = 10;
  var dirty;
  this.$$lastDirtyWatch = null;
  this.$beginPhase("$digest");

  if (this.$$applyAsyncId) {
    clearTimeout(this.$$applyAsyncId);
    this.$$flushApplyAsync();
  }
  do {
    while(this.$$asyncQueue.length) {
      var asyncTask = this.$$asyncQueue.shift();
      asyncTask.scope.$eval(asyncTask.expression);
    }
    dirty = this.$$digestOnce();
    if ((dirty || this.$$asyncQueue.length) && ttl-- === 0) {
      this.$clearPhase();
      throw "10 digest iteration reached";
    }
  } while(dirty || this.$$asyncQueue.length);
  this.$clearPhase();
};
module.exports = Scope;