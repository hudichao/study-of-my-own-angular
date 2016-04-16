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
    listenerFn: listenerFn,
    last: initWatchVal
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
      watcher.listenerFn(newVal, oldVal === initWatchVal ? newVal : oldVal, self);
    }
  });
};

module.exports = Scope;