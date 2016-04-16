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
      var listenerFn = function() {};
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

    });

    it("即使初始值为undefined，也能执行监听函数", function() {
      scope.counter = 0;

      scope.$watch(
        function(scope) {return scope.someValue;},
        function(newVal, oldVal, scope) {scope.counter++;}
      );

      scope.$digest();
      expect(scope.counter).toBe(1);
    });


    it("第一次oldVal就是newVal", function() {
      scope.someValue = 123;
      var oldValueGiven;

      scope.$watch(
        function(scope) {return scope.someValue;},
        function(newVal, oldVal, scope) {oldValueGiven = oldVal;}
      )

      scope.$digest();
      expect(oldValueGiven).toBe(123);
    });

    it("可以有没有监听函数的watcher", function() {
      var watchFn = jasmine.createSpy().and.returnValue("something");
      scope.$watch(watchFn);

      scope.$digest();

      expect(watchFn).toHaveBeenCalled();
    });
  });
});