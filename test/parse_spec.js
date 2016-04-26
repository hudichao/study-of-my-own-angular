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

  it("可以parse含单引号的", function() {
    var fn = parse("'a\\\'b'");
    expect(fn()).toEqual('a\'b');
  });

  it("可以parse含双引号的", function() {
    var fn = parse('"a\\\"b"');
    expect(fn()).toEqual('a\"b');
  });

  it("parse unicode string", function() {
    var fn = parse('"\\u00A0"');
    expect(fn()).toEqual('\u00A0');
  });
  it("对不正常的unicode，抛出异常", function() {
    expect(function() {parse('"\\u00T0"');}).toThrow();
  });

  it("parse null", function() {
    var fn = parse("null");
    expect(fn()).toBe(null);
  });

  it("parse true", function() {
    var fn = parse("true");
    expect(fn()).toBe(true);
  });

  it("parse false", function() {
    var fn = parse("false");
    expect(fn()).toBe(false);
  });

  it("忽略whitespace", function() {
    var fn = parse(' \n42 ');
    expect(fn()).toEqual(42);
  });

  it("parse空数组", function() {
    var fn = parse("[]");
    expect(fn()).toEqual([]);
  });
});















