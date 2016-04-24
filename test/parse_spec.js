'use strict';

var parse = require("../src/parse");

describe("parse", function() {
  it("parse整数", function() {
    var fn = parse("42");

    expect(fn).toBeDefined();
    expect(fn()).toBe(42);
    console.log(fn.toString());
  });
});