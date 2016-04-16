'use strict';
var _ = require("lodash");

function Scope() {
  this.$$watchers = [];
}
function initWatchVal() {

}
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

  do {
    dirty = this.$$digestOnce();
    if (dirty && ttl-- === 0) {
      throw "10 digest iteration reached";
    }
  } while(dirty);
};
module.exports = Scope;