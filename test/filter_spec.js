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
  it("用object形式来注册多个filter", function() {
    var myFilter = function() {};
    var myOtherFilter = function() {};
    register({
      my: function() {
        return myFilter;
      },
      myOther: function() {
        return myOtherFilter;
      }
    });

    expect(filter("my")).toBe(myFilter);
    expect(filter("myOther")).toBe(myOtherFilter);
  });
});