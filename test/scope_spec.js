'use strict';

var Scope = require("../src/scope");

describe("Scope", function() {
  it("一个对象", function() {
    var scope = new Scope();
    scope.aProperty = 1;

    expect(scope.aProperty).toBe(1);
  });

  describe("digest", function() {
    var scope;

    beforeEach(function() {
      scope = new Scope();
    });

    it("第一个$digest时，执行watch的listener函数", function() {
      var watchFn = function() {return 'wat';};
      var listenerFn = jasmine.createSpy();
      scope.$watch(watchFn, listenerFn);

      scope.$digest();
      expect(listenerFn).toHaveBeenCalled();
    });
  });
});