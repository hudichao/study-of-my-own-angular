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

  it("通过string filter", function() {
    var fn = parse('arr | filter: "a"');
    expect(fn({arr: ['a', 'b', 'a']})).toEqual(['a', 'a']);
  });

  it("只要包含string就filter", function() {
    var fn = parse('arr | filter: "o"');
    expect(fn({arr:  ['quick', 'brown', 'fox']})).toEqual(['brown', 'fox']);
  });

  it("case insensitive", function() {
    var fn = parse('arr | filter: "o"');
    expect(fn({arr: ['quick', 'BROWN', 'fox']})).toEqual(['BROWN', 'fox']);
  });

  it("filter an array of objects where any value matches", function() {
    var fn = parse('arr | filter: "o"');
    expect(fn({arr: [
      {firstName: 'John', lastName: 'Brown'},
      {firstName: 'Jane', lastName: 'Fox'},
      {firstName: 'Mary', lastName: 'Quick'}
    ]})).toEqual([
      {firstName: 'John', lastName: 'Brown'},
      {firstName: 'Jane', lastName: 'Fox'}
    ]);
  });

  it("nested object filter", function() {
    var fn = parse('arr | filter: "o"');
    expect(fn({arr: [
      {name: {first: 'John', last: 'Brown'}},
      {name: {first: 'Jane', last: 'Fox'}},
      {name: {fist: 'Mary', last: 'Quick'}}
    ]})).toEqual([
      {name: {first: 'John', last: 'Brown'}},
      {name: {first: 'Jane', last: 'Fox'}}
    ]);
  });

  it("nested array filter", function() {
    var fn = parse('arr | filter: "o"');
    expect(fn({arr: [[{name: "John"}, {name: "Mary"}], [{name: "Jane"}]]}))
    .toEqual([[{name: "John"}, {name: "Mary"}]]);
  });

  it("filter with number", function() {
    var fn = parse('arr | filter: 42');
    expect(fn({arr: [{name: "Mary", age: 42}, {name: "John", age: 43}, {name: "Jane", age: 44}]}))
    .toEqual([{name: "Mary", age: 42}]);
  });

  it("filter with boolean", function() {
    var fn = parse('arr | filter: true');
    expect(fn({arr: [{name: "Mary", admin: true}, {name: "John", admin: true}, {name: "Jane", admin: false}]}))
    .toEqual([{name: "Mary", admin: true}, {name: "John", admin: true}]);
  });

  it("filters with a substring numeric value", function() {
    var fn = parse('arr | filter: 42');
    expect(fn({arr: ['contains 42']})).toEqual(['contains 42']);
  });

  it("filters matching null", function() {
    var fn = parse("arr | filter: null");
    expect(fn({arr: [null, 'not null']})).toEqual([null]);
  });

  it("does not match null value with the string null", function() {
    var fn = parse('arr | filter: "null"');
    expect(fn({arr: [null, 'not null']})).toEqual(['not null']);
  });

  it("undefined字符串不会match undefined的值", function() {
    var fn = parse('arr | filter: "undefined"');
    expect(fn({arr: [undefined, 'undefined']})).toEqual(['undefined']);
  });

  it("取反filter", function() {
    var fn = parse('arr | filter: "!o"');
    expect(fn({arr: ['quick', 'brown', 'fox']})).toEqual(['quick']);
  });
});












