'use strict';
var _ = require("lodash");

function Scope() {
  this.$$watchers = [];
}
Scope.prototype.$watch = function(watchFn, listenerFn) {
  var watcher = {
    watchFn: watchFn,
    listenerFn: listenerFn
  };
  this.$$watchers.push(watcher);
};
Scope.prototype.$digest = function() {
  var self = this;
  var newVal, oldVal;

  _.forEach(this.$$watchers, function(watcher) {
    newVal = watcher.watchFn(self);
    oldVal = watcher.last;

    if (newVal !== oldVal) {
      watcher.last = newVal;      
      watcher.listenerFn(newVal, oldVal, self);
    }
  });
};

module.exports = Scope;