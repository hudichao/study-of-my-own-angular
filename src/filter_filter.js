'use strict';

var _ = require("lodash");

//factory function of filter
function filterFilter() {
  return function(array, filterExpr) {
    return _.filter(array, filterExpr);
  };
}

module.exports = filterFilter;

