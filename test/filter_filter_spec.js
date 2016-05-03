'use strict';

var filter = require('../src/filter').filter;
var parse = require("../src/parse");

describe("filter filter", function() {
  it ("is available", function() {
    expect(filter('filter')).toBeDefined();
  });

  it("可以通过function filter", function() {
    var fn = parse('[1, 2, 3, 4] | filter: isOdd');
    var scope = {
      isOdd: function(n) {
        return n % 2 !== 0;
      }
    };
    expect(fn(scope)).toEqual([1, 3]);
  });
});