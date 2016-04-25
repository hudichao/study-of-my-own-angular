'use strict';

var parse = require("../src/parse");

describe("parse", function() {
  it("parse整数", function() {
    var fn = parse("42");

    expect(fn).toBeDefined();
    expect(fn()).toBe(42);
  });

  it("parse float", function() {
    var fn = parse("4.2");
    expect(fn()).toBe(4.2);
  });

  it("parse没有整数的小数", function() {
    var fn = parse(".42");
    expect(fn()).toBe(0.42);
  });

  it("parse科学计数法数字", function() {
    var fn = parse("42e3");
    expect(fn()).toBe(42000);
  });
  it("parse科学计数法数字2", function() {
    var fn = parse(".42e2");
    expect(fn()).toBe(42);
  });
  it("parse科学计数法3", function() {
    var fn = parse("4200e-2");
    expect(fn()).toBe(42);
  });
  it("parse科学计数法4", function() {
    var fn = parse(".42e+2");
    expect(fn()).toBe(42);
  });
  it("parse科学计数法5", function() {
    var fn = parse(".42E2");
    expect(fn()).toBe(42);
  });
  it("parse科学计数法6,不能parse下面这种", function() {
    expect(function() {parse("42e-");}).toThrow();
    expect(function() {parse("42e-a");}).toThrow();
  });

  it("parse双引号内的string", function() {
    var fn = parse('"fuck"');
    expect(fn()).toBe("fuck");
  });

  it("parse单引号内的string", function() {
    var fn = parse("'fuck'");
    expect(fn()).toBe('fuck');
  });

  it("不会parse mismatched quotes", function() {
    expect(function() {parse('"abc\'');}).toThrow();
  });
});