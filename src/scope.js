'use strict';
var _ = require("lodash");

function Scope() {
  this.$$watchers = [];
}
function initWatchVal() {

}
Scope.prototype.$watch = function(watchFn, listenerFn) {
  var watcher = {
    watchFn: watchFn,
    listenerFn: listenerFn || function(){},
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

    if (newVal !== oldVal) {
      self.$$lastDirtyWatch = watcher;
      watcher.last = newVal;      
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