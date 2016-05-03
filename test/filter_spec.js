'use strict';

var register = require("../src/filter").register;
var filter = require("../src/filter").filter;

describe("filter", function() {
  it("可注册和获得", function() {
    var myFilter = function() {};
    var myFilterFactory = function() {
      return myFilter;
    };
    register("my", myFilterFactory);
    expect(filter("my")).toBe(myFilter);
  });
});