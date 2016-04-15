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

    it("watchFun的传参为scope", function() {
      var watchFn = jasmine.createSpy();
      var listenerFn = function() {}
      scope.$watch(watchFn, listenerFn);

      scope.$digest();
      expect(watchFn).toHaveBeenCalledWith(scope);
    });

    it("当watch的值变化时，执行listener函数", function() {
      scope.someValue = "a";
      scope.counter = 0;

      scope.$watch(
        function(scope) {return scope.someValue;},
        function(newValue, oldValue, scope) {scope.counter++;}
      );

      expect(scope.counter).toBe(0);

      scope.$digest();
      expect(scope.counter).toBe(1);

      scope.$digest();
      expect(scope.counter).toBe(1);

      scope.someValue = 'b';
      expect(scope.counter).toBe(1);

      scope.$digest();
      expect(scope.counter).toBe(2);

    })

  });
});