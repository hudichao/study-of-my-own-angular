'use strict';

var Scope = require("../src/scope");
var _ = require("lodash");

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
      );

      scope.$digest();
      expect(oldValueGiven).toBe(123);
    });

    it("可以有没有监听函数的watcher", function() {
      var watchFn = jasmine.createSpy().and.returnValue("something");
      scope.$watch(watchFn);

      scope.$digest();

      expect(watchFn).toHaveBeenCalled();
    });

    it("在一个digest中触发联动了的watcher", function() {
      scope.name = 'Jane';

      scope.$watch(
        function(scope) {return scope.nameUpper;},
        function(newVal, oldVal, scope) {
          if (newVal) {
            scope.initial = newVal.substring(0, 1) + ".";
          }
        }
      );

      scope.$watch(
        function(scope) {return scope.name;},
        function(newVal, oldVal, scope) {
          if (newVal) {
            scope.nameUpper = newVal.toUpperCase();
          }
        }
      );



      scope.$digest();
      expect(scope.initial).toBe("J.");

      scope.name = "Bob";
      scope.$digest();
      expect(scope.initial).toBe("B.");
    });

    it("超过10次遍历后放弃watch", function() {
      scope.counterA = 0;
      scope.counterB = 0;

      scope.$watch(
        function(scope) {return scope.counterA;},
        function(newVal, oldVal, scope) {
          scope.counterB++;
        }
      );

      scope.$watch(
        function(scope) {return scope.counterB;},
        function(newVal, oldVal, scope) {
          scope.counterA++;
        }
      );

      expect((function() {scope.$digest();})).toThrow();
    });

    it("当最后一个watch clean时结束digest", function() {
      scope.array = _.range(100);
      var watchExecutions = 0;

      _.times(100, function(i) {
        scope.$watch(
          function(scope) {
            watchExecutions++;
            return scope.array[i];
          },
          function(newVal, oldVal, scope) {

          }
        );
      });
      expect(watchExecutions).toBe(0);
      scope.$digest();
      expect(watchExecutions).toBe(200);

      scope.array[0] = 420;
      scope.$digest();
      expect(watchExecutions).toBe(301);

    });

    it("新wathcer会正常被digest", function() {
      scope.aValue = "abc";
      scope.counter = 0;

      scope.$watch(
        function(scope) {return scope.aValue;},
        function(newVal, oldVal, scope) {
          scope.$watch(
            function(scope) {return scope.aValue;},
            function(newVal, oldVal, scope) {
              scope.counter++;
            }
          );
        }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);
    });

    it("比较值", function() {
      scope.aValue = [1,2,3];
      scope.counter = 0;

      scope.$watch(
        function(scope) {return scope.aValue;},
        function(newVal, oldVal, scope) {
          scope.counter++;
        },
        true
      );

      scope.$digest();
      expect(scope.counter).toBe(1);

      scope.aValue.push(4);
      scope.$digest();
      expect(scope.counter).toBe(2);
    });

    it("处理NaN", function() {
      scope.number = 0 / 0; //NaN
      scope.counter = 0; 

      scope.$watch(
        function(scope) {return scope.number;},
        function(newVal, oldVal, scope) {
          scope.counter++;
        }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);

      scope.$digest();
      expect(scope.counter).toBe(1);

    });

    it("处理$eval了的函数并返回值", function() {
      scope.aValue = 42;

      var result = scope.$eval(function(scope) {
        return scope.aValue;
      });

      expect(result).toBe(42);
    });

    it("处理$eval的第二个参数", function() {
      scope.aValue = 42;

      var result = scope.$eval(function(scope, arg) {
        return scope.aValue + arg;
      }, 2);

      expect(result).toBe(44);
    });

    it("$apply了的函数触发digest", function() {
      scope.aValue = "someValue";
      scope.counter = 0;

      scope.$watch(
        function(scope) {
          return scope.aValue;
        },
        function(newVal, oldVal, scope) {
          scope.counter++;
        }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);

      scope.$apply(function(scope) {
        scope.aValue = "someOtherValue";
      });

      expect(scope.counter).toBe(2);

    });

    it("被evalAsync的函数会在同一个cyle中被执行", function() {
      scope.aValue = [1, 2, 3];
      scope.asyncEvaluated = false;
      scope.asyncEvaluatedImmediately = false;

      scope.$watch(
        function(scope) {return scope.aValue;},
        function(newVal, oldVal, scope) {
          scope.$evalAsync(function(scope) {
            scope.asyncEvaluated = true;
          });
          scope.asyncEvaluatedImmediately = scope.asyncEvaluated;
        }
      );

      scope.$digest();
      expect(scope.asyncEvaluated).toBe(true);
      expect(scope.asyncEvaluatedImmediately).toBe(false);
    });

    it("执行watch函数中加的$evalAsync了的函数", function() {
      scope.aValue = [1, 2, 3];
      scope.asyncEvaluated = false;

      scope.$watch(
        function(scope) {
          if (!scope.asyncEvaluated) {
            scope.$evalAsync(function(scope) {
              scope.asyncEvaluated = true;
            });
          }
          return scope.aValue;
        },
        function(newVal, oldVal, scope) {}
      );

      scope.$digest();
      expect(scope.asyncEvaluated).toBe(true);

    });

    it("执行watch函数中加的$evalAsync了的函数, 哪怕不dirty", function() {
      scope.aValue = [1, 2, 3];
      scope.asyncEvaluatedTimes = 0;

      scope.$watch(
        function(scope) {
          if (scope.asyncEvaluatedTimes < 2) {
            scope.$evalAsync(function(scope) {
              scope.asyncEvaluatedTimes++;
            });
          }
          return scope.aValue;
        },
        function(newVal, oldVal, scope) {}
      );

      scope.$digest();

     expect(scope.asyncEvaluatedTimes).toBe(2);

    });


    it("最终终止$evalAsync", function() {
      scope.aValue = [1, 2, 3];

      scope.$watch(
        function(scope) {
          scope.$evalAsync(function(scope) {});
          return scope.aValue;
        },
        function(newVal, oldVal, scope) {}
      );

      expect(function() {scope.$digest();}).toThrow();

    });

    it("scope有$$phase", function() { 
      scope.aValue = [1, 2, 3];
      scope.phaseInWatchFunction = undefined;
      scope.phaseInListenerFunction = undefined;
      scope.phaseInApplyFunction = undefined;
      scope.$watch( 
        function(scope) {
          scope.phaseInWatchFunction = scope.$$phase;
          return scope.aValue; 
        },
        function(newValue, oldValue, scope) { 
          scope.phaseInListenerFunction = scope.$$phase;
      });
      scope.$apply(function(scope) { 
        scope.phaseInApplyFunction = scope.$$phase;
      });
      expect(scope.phaseInWatchFunction).toBe('$digest');
      expect(scope.phaseInListenerFunction).toBe('$digest');
      expect(scope.phaseInApplyFunction).toBe('$apply');
    });

    it("$evalAsync会安排一个digest", function(done) {
      scope.aValue = "abc";
      scope.counter = 0;

      scope.$watch(
        function(scope) {return scope.aValue;},
        function(newVal, oldVal, scope) {
          scope.counter++;
        }
      );

      scope.$evalAsync(function(scope) {

      });

      expect(scope.counter).toBe(0);

      setTimeout(function() {
        expect(scope.counter).toBe(1);
        done();
      }, 50);
    });

    it("使用$applyAsync来异步apply", function(done) {
      scope.counter = 0;

      scope.$watch(
        function(scope) {return scope.aValue;},
        function(newVal, oldVal, scope) {
          scope.counter++;
        }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);

      scope.$applyAsync(function(scope) {
        scope.aValue = 'abc';
      });
      expect(scope.counter).toBe(1);


      setTimeout(function() {
        expect(scope.counter).toBe(2);
        done();
      }, 50);

    });

    it("$applyAsync了的函数永远不会在同一个cycle中运行", function(done) {
      scope.aValue = [1, 2, 3];
      scope.asyncApplied = false;

      scope.$watch(
        function(scope) {return scope.aValue;},
        function(newVal, oldVal, scope) {
          scope.$applyAsync(function(scope) {
            scope.asyncApplied = true;
          });
        }
      );

      scope.$digest();
      expect(scope.asyncApplied).toBe(false);
      setTimeout(function() {
        expect(scope.asyncApplied).toBe(true);
        done();
      }, 50);
    });

    it("合并$applyAsync的很多call", function(done) {
      scope.counter = 0;

      scope.$watch(
        function(scope) {
          scope.counter++;
          return scope.aValue;
        },
        function(newVal, oldVal, scope) {}
      );

      scope.$applyAsync(function(scope) {
        scope.aValue = "abc";
      });

      scope.$applyAsync(function(scope) {
        scope.aValue = "def";
      });

      setTimeout(function() {
        expect(scope.counter).toBe(2);
        done();
      }, 50);

    });

    it("如果已经有digest执行，取消$applyAsync", function(done) {
      scope.counter = 0;

      scope.$watch(
        function(scope) {
          scope.counter++;
          return scope.aValue;
        },
        function(newVal, oldVal, scope) {}
      );

      scope.$applyAsync(function(scope) {
        scope.aValue = "abc";
      });

      scope.$applyAsync(function(scope) {
        scope.aValue = "def";
      });

      scope.$digest();

      expect(scope.counter).toBe(2);
      expect(scope.aValue).toEqual("def");

      setTimeout(function() {
        expect(scope.counter).toBe(2);
        done();
      }, 50);

    });

    it("在每个digest后执行$$postDigest函数", function() {
      scope.counter = 0;

      scope.$$postDigest(function() {
        scope.counter++;
      });

      expect(scope.counter).toBe(0);

      scope.$digest();

      expect(scope.counter).toBe(1);

      scope.$digest();

      expect(scope.counter).toBe(1);
    });

    it("digest不包括$$postDigest", function() {
      scope.aValue = "原始值";

      scope.$$postDigest(function() {
        scope.aValue = "改变值";
      });

      scope.$watch(
        function(scope) {
          return scope.aValue;
        },
        function(newVal, oldVal, scope) {
          scope.watchedValue = newVal;
        }
      );

      scope.$digest();

      expect(scope.watchedValue).toBe("原始值");

      scope.$digest();

      expect(scope.watchedValue).toBe("改变值");
    });
  });

  

});