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

  it("filter with an object", function() {
    var fn = parse('arr | filter: {name: "o"}');
    expect(fn({arr: [{name: 'Joe', role: 'admin'}, {name: 'Jane', role: 'moderator'}]}))
    .toEqual([{name: 'Joe', role: 'admin'}]);
  });

  it("必须满足object中所有条件", function() {
    var fn = parse('arr | filter: {name: "o", role: "m"}');
    expect(fn({arr: [{name: 'Joe', role: 'admin'}, {name: 'Jane', role: 'moderator'}]}))
    .toEqual([{name: 'Joe', role: 'admin'}]);
  });

  it("如果object是空，全部通过", function() {
    var fn = parse('arr | filter: {}');
    expect(fn({arr: [{name: 'Joe', role: 'admin'}, {name: 'Jane', role: 'moderator'}]}))
    .toEqual([{name: 'Joe', role: 'admin'}, {name: 'Jane', role: 'moderator'}]);
  });

  it("neste object 标准", function() {
    var fn = parse('arr | filter: {name: {first: "o"}}');
    expect(fn({arr: [{name: {first: 'Joe'}, role: 'admin'}, {name: {first: 'Jane'}, role: 'moderator'}]}))
    .toEqual([{name: {first: 'Joe'}, role: 'admin'}]);
  });

  it("可以取反object", function() {
    var fn = parse('arr | filter: {name: {first: "!o"}}');
    expect(fn({arr: [{name: {first: 'Joe'}, role: 'admin'}, {name: {first: 'Jane'}, role: 'moderator'}]}))
    .toEqual([{name: {first: 'Jane'}, role: 'moderator'}]);
  });

  it("忽略expectation object中的未定义值", function() {
    var fn = parse('arr | filter:{name:thisIsUndefined}');
    expect(fn({arr: [{name: {first: 'Joe'}, role: 'admin'}, {name: {first: 'Jane'}, role: 'moderator'}]}))
    .toEqual([{name: {first: 'Joe'}, role: 'admin'}, {name: {first: 'Jane'}, role: 'moderator'}]);
  });

  it("在object中有nested array", function() {
    var items = [
      {users: [{name: {first: 'Joe'}, role: 'admin'}, {name: {first: 'Jane'}, role: 'moderator'}]},
      {users: [{name: {first: 'Mary'}, role: 'admin'}]}
    ];
    var fn = parse('arr | filter: {users: {name: {first: "o"}}}');
    expect(fn({arr:items})).toEqual([{users: [{name: {first: 'Joe'}, role: 'admin'}, {name: {first: 'Jane'}, role: 'moderator'}]}]);
  });

  it("对neseted object 只filter同级", function() {
    var items = [
      {user: "Bob"},
      {user: {name: "Bob"}},
      {user: {name: {first: "Bob", last: "Fox"}}}
    ];

    var fn = parse('arr | filter: {user: {name: "Bob"}}');
    expect(fn({arr: items}))
    .toEqual([{user: {name: "Bob"}}]);
  });
});











