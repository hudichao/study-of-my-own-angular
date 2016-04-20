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

    it("捕捉watch函数中的exception", function() {
      scope.aValue = "abc";
      scope.counter = 0;

      scope.$watch(
        function(scope) {
          throw "error";
        },
        function(newVal, oldVal, scope) {}
      );

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
    });

    it("捕捉listener函数中的exception", function() {
      scope.aValue = "abc";
      scope.counter = 0;

      scope.$watch(
        function(scope) {
          return scope.aValue;
        },
        function(newVal, oldVal, scope) {
          throw "Error";
        }
      );

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
    });

    it("捕捉$evalAsync中的exception", function(done) {
      scope.aValue = "abc";
      scope.counter = 0;

      scope.$watch(
        function(scope) {
          return scope.aValue;
        },
        function(newVal, oldVal, scope) {
          scope.counter++;
        }
      );

      scope.$evalAsync(function(scope) {
        throw "Error";
      });

      setTimeout(function() {
        expect(scope.counter).toBe(1);
        done();
      }, 50);
    });

    it("捕捉$applyAsync中的exception", function(done) {
      scope.$applyAsync(function(scope) {
        throw "Error";
      });

      scope.$applyAsync(function(scope) {
        throw "Error";
      });

      scope.$applyAsync(function(scope) {
        scope.applied = true;
      });

      setTimeout(function() {
        expect(scope.applied).toBe(true);
        done();
      }, 50);
    });

    it("捕捉$$postDigest中的exception", function() {
      var didRun = false;

      scope.$$postDigest(function() {
        throw "Error";
      });

      scope.$$postDigest(function() {
        didRun = true;
      });

      scope.$digest();

      expect(didRun).toBe(true);

    });

    it("允许删除$destroy", function() {
      scope.aValue = "abc";
      scope.counter = 0;

      var destroyWatch = scope.$watch(
        function(scope) {
          return scope.aValue;
        },
        function(newVal, oldVal, scope) {
          scope.counter++;
        }
      );

      scope.$digest();

      expect(scope.counter).toBe(1);

      scope.aValue = "def";

      scope.$digest();

      expect(scope.counter).toBe(2);

      scope.aValue = "ghi";

      destroyWatch();

      scope.$digest();

      expect(scope.counter).toBe(2);
    });

    it("允许在digest中destroy wqtch", function() {
      scope.aValue = "abc";

      var watchCalls = [];

      scope.$watch(
        function(scope) {
          watchCalls.push("first");
          return scope.aValue;
        }
      );

      var destroyWatch = scope.$watch(
        function(scope) {
          watchCalls.push("second");
          destroyWatch();
        }
      );

      scope.$watch(
        function(scope) {
          watchCalls.push("third");
          return scope.aValue;
        }
      );

      scope.$digest();
      expect(watchCalls).toEqual(["first", "second", "third", "first", "third"]);

    });

    it("允许在digest中destroy其他watch", function() {
      scope.aValue = "abc";
      scope.counter = 0;

      scope.$watch(
        function(scope) {
          return scope.aValue;
        },
        function(newVal, oldVal, scope) {
          destroyWatch();
        }
      );

      var destroyWatch = scope.$watch(
        function(scope) {},
        function(newVale, oldVal, scope) {}
      );

      scope.$watch(
        function(scope) {return scope.aValue;},
        function(newVal, oldVal, scope) {
          scope.counter++;
        }
      );

      scope.$digest();

      expect(scope.counter).toBe(1);
    });

    it("允许destroy多个watch", function() {
      scope.aValue = "abc";
      scope.counter = 0;

      var destroyWatch1 = scope.$watch(
        function(scope) {
          destroyWatch1();
          destroyWatch2();
        }
      );

      var destroyWatch2 = scope.$watch(
        function(scope) {
          return scope.aValue;
        },
        function(newVal, oldVal, scope) {
          scope.counter++;
        }
      );

      scope.$digest();

      expect(scope.counter).toBe(0);

    }); 
  });

  describe("$watchGroup", function() {
    var scope;
    beforeEach(function() {
      scope = new Scope();
    });

    it("watch是个数组", function() {
      var gotNewValues, gotOldValues;

      scope.aValue = 1;

      scope.anotherValue = 2;

      scope.$watchGroup([
        function(scope) {return scope.aValue;},
        function(scope) {return scope.anotherValue;}
      ], function(newVals, oldVals, scope) {
        gotNewValues = newVals;
        gotOldValues = oldVals;
      });

      scope.$digest();

      expect(gotNewValues).toEqual([1, 2]);
      expect(gotOldValues).toEqual([1, 2]);

    });

    it("在digest中只执行listener一次", function() {
      var counter = 0;

      scope.aValue = 1;
      scope.anotherValue = 2;

      scope.$watchGroup([
        function(scope) {return scope.aValue;},
        function(scope) {return scope.anotherValue;}
      ], function(newVals, oldVals, scope) {
        counter++;
      });

      scope.$digest();

      expect(counter).toEqual(1);
    });

    it("第一次运行时oldValues和newValues完全相等", function() {
      var gotNewValues, gotOldValues;

      scope.aValue = 1;

      scope.anotherValue = 2;

      scope.$watchGroup([
        function(scope) {return scope.aValue;},
        function(scope) {return scope.anotherValue;}
      ], function(newVals, oldVals, scope) {
        gotNewValues = newVals;
        gotOldValues = oldVals;
      });

      scope.$digest();

      expect(gotNewValues).toBe(gotOldValues);
    });

    it("对于后续的运行，oldValues和newValues保持不同", function() {
      var gotNewValues, gotOldValues;

      scope.aValue = 1;

      scope.anotherValue = 2;

      scope.$watchGroup([
        function(scope) {return scope.aValue;},
        function(scope) {return scope.anotherValue;}
      ], function(newVals, oldVals, scope) {
        gotNewValues = newVals;
        gotOldValues = oldVals;
      });

      scope.$digest();

      scope.anotherValue = 3;
      scope.$digest();

      expect(gotNewValues).toEqual([1, 3]);
      expect(gotOldValues).toEqual([1, 2]);
    });

    it("当watch array是空时，执行listener一次", function() {
      var gotNewValues, gotOldValues;

      scope.$watchGroup([], function(newValues, oldValues, scope) {
        gotNewValues = newValues;
        gotOldValues = oldValues;
      });

      scope.$digest();
      expect(gotNewValues).toEqual([]);
      expect(gotOldValues).toEqual([]);
    });


    it("能被移除", function() {
      var counter = 0;

      scope.aValue = 1;
      scope.anotherValue = 2;

      var destroyGroup = scope.$watchGroup([
        function(scope) {return scope.aValue;},
        function(scope) {return scope.anotherValue;}
      ], function(newValues, oldValues, scope) {
        counter++;
      });

      scope.$digest();

      scope.anotherValue = 3;
      destroyGroup();
      scope.$digest();

      expect(counter).toEqual(1);
    });

    it("当已经deregister时，不执行没有watch的listener", function() {
      var counter = 0;
      var destroyGroup = scope.$watchGroup([], 
        function(newValues, oldValues, scope) { counter++;
      });
      destroyGroup();
      scope.$digest();
      expect(counter).toEqual(0);
    });
  }); 

  describe("inheritance", function() {
    it("继承", function() {
      var parent = new Scope();
      parent.aValue = [1, 2, 3];

      var child = parent.$new();

      expect(child.aValue).toEqual([1, 2, 3]);

    });

    it("反向不影响", function() {
      var parent = new Scope();

      var child = parent.$new();

      child.aValue = [1, 2, 3];

      expect(parent.aValue).toBeUndefined();

    });

    it("父赋值会传给子", function() {
      var parent = new Scope();
      var child = parent.$new();

      parent.aValue = [1, 2, 3];

      expect(child.aValue).toEqual([1, 2, 3]);
    });

    it("儿子的变化会传回爸爸，因为其实两者指着同一个值", function() {
      var parent = new Scope();
      var child = parent.$new();
      parent.aValue = [1, 2, 3];

      child.aValue.push(4);

      expect(child.aValue).toEqual([1, 2, 3, 4]);
      expect(parent.aValue).toEqual([1, 2, 3, 4]);
    });

    it("儿子能watch爸爸的property", function() {
      var parent = new Scope();
      var child = parent.$new();
      parent.aValue = [1, 2, 3];
      child.counter = 0;

      child.$watch(
        function(scope) {return scope.aValue;},
        function(newVal, oldVal, scope) {
          scope.counter++;
        },
        true
      );

      child.$digest();
      expect(child.counter).toBe(1);

      parent.aValue.push(4);
      child.$digest();
      expect(child.counter).toBe(2);
    });

    it("继承无限深度", function() {
      var a = new Scope();
      var aa = a.$new();
      var aaa = aa.$new();
      var aab = aa.$new();
      var ab = a.$new();
      var abb = ab.$new();

      a.value = 1;

      expect(aa.value).toBe(1);
      expect(aaa.value).toBe(1);
      expect(aab.value).toBe(1);
      expect(ab.value).toBe(1);
      expect(abb.value).toBe(1);

      ab.anotherValue = 2;

      expect(abb.anotherValue).toBe(2);
      expect(aa.anotherValue).toBeUndefined();
      expect(aaa.anotherValue).toBeUndefined();
    });

    it("遮蔽爸爸的同名property", function() {
      var parent = new Scope();
      var child = parent.$new();

      parent.name = "Joe";
      child.name = "Jill";

      expect(child.name).toBe("Jill");
      expect(parent.name).toBe("Joe");
    });
    
    it("不遮蔽爸爸(爸爸跟着儿子变)", function() {
      var parent = new Scope();
      var child = parent.$new();

      parent.user = {name: "Joe"};
      child.user.name = "Jill";

      expect(child.user.name).toBe("Jill");
      expect(parent.user.name).toBe("Jill");

    });

    it("不digest爸爸", function() {
      var parent = new Scope();
      var child = parent.$new();

      parent.aValue = "abc";
      parent.$watch(
        function(scope) {
          return scope.aValue;
        },
        function(newVal, oldVal, scope) {
          scope.aValueWas = newVal;
        }
      );

      child.$digest();
      expect(child.aValueWas).toBeUndefined();
    });

    it("存儿子们(不存孙子)", function() {
      var parent = new Scope();
      var child1 = parent.$new();
      var child2 = parent.$new();
      var child2_1 = child2.$new();

      expect(parent.$$children.length).toBe(2);
      expect(parent.$$children[0]).toBe(child1);
      expect(parent.$$children[1]).toBe(child2);

      expect(child1.$$children.length).toBe(0);
      expect(child2.$$children.length).toBe(1);
      expect(child2.$$children[0]).toBe(child2_1);

    });

    it("digeset儿子", function() {
      var parent = new Scope();
      var child = parent.$new();
      var child2 = child.$new();

      parent.aValue = "abc";

      child2.$watch(
        function(scope) {return scope.aValue;},
        function(newVal, oldVal, scope) {
          scope.aValueWas = newVal;
        }
      );

      parent.$digest();

      expect(child2.aValueWas).toBe("abc");

    });

    it("$apply从顶层开始digest", function() {
      var parent = new Scope();
      var child = parent.$new();
      var child2 = child.$new();

      parent.aValue = "abc";
      parent.counter = 0;

      parent.$watch(
        function(scope) {return scope.aValue;},
        function(newVal, oldVal, scope) {
          scope.counter++;
        }
      );

      child2.$apply(function(scope) {});

      expect(parent.counter).toBe(1);

    });

    it("从顶层触发$evalAsync", function(done) {
      var parent = new Scope();
      var child = parent.$new();
      var child2 = child.$new();

      parent.aValue = "abc";
      parent.counter = 0;

      parent.$watch(
        function(scope) {return scope.aValue;},
        function(newVal, oldVal, scope) {
          scope.counter++;
        }
      );

      child2.$evalAsync(function(scope) {

      });

      setTimeout(function() {
        expect(parent.counter).toBe(1);
        done();
      }, 50);
    });

    it("当是isolated scope时，不能访问爸爸的属性", function() {
      var parent = new Scope();
      var child = parent.$new(true);

      parent.aValue = "abc";

      expect(child.aValue).toBeUndefined();
    });

    it("当是isolated scope时不能watch爸爸的属性", function() {
      var parent = new Scope();
      var child = parent.$new(true);

      parent.aValue = "abc";

      child.$watch(
        function(scope) {return scope.aValue;},
        function(newVal, oldVal, scope) {
          scope.aValueWas = newVal;
        }
      );

      child.$digest(); 
      expect(child.aValueWas).toBeUndefined();

    });

    it("digest isolated的儿子们", function() {
      var parent = new Scope();
      var child = parent.$new(true);

      child.aValue = "abc";
      child.$watch(
        function(scope) {return scope.aValue;},
        function(newVal, oldVal, scope) {
          scope.aValueWas = newVal;
        }
      );
      parent.$digest();
      expect(child.aValueWas).toBe("abc");
    });

    it("isolated scope的apply从顶部开始digest", function() {
      var parent = new Scope();
      var child = parent.$new(true);
      var child2 = child.$new();

      parent.aValue = "abc";
      parent.counter = 0;
      parent.$watch(
        function(scope) {return scope.aValue;},
        function(newVal, oldVal, scope) {
          scope.counter++;
        }
      );

      child2.$apply(function(scope) {});

      expect(parent.counter).toBe(1);

    });

    it("isolated scope的evalAsync从顶部开始digest", function(done) {
      var parent = new Scope();
      var child = parent.$new(true);
      var child2 = child.$new();

      parent.aValue = "abc";
      parent.counter = 0;
      parent.$watch(
        function(scope) {return scope.aValue;},
        function(newVal, oldVal, scope) {
          scope.counter++;
        }
      );

      child2.$evalAsync(function(scope) {});

      setTimeout(function() {
        expect(parent.counter).toBe(1);
        done();
      }, 50);
    });

    it("在isolated scope上执行$evalAsync函数", function(done) {
      var parent = new Scope();
      var child = parent.$new(true);

      child.$evalAsync(function(scope) {
        scope.didEvalAsync = true;
      });

      setTimeout(function() {
        expect(child.didEvalAsync).toBe(true);
        done();
      }, 50); 
    });

    it("在isolated scope上执行$$postDigest", function() {
      var parent = new Scope();
      var child = parent.$new(true);

      child.$$postDigest(function() {
        child.didPostDigest = true;
      });

      parent.$digest();

      expect(child.didPostDigest).toBe(true);

    });

    it("创建scope可以传值作为爸爸", function() {
      var prototypeParent = new Scope();
      var hierarchyParent = new Scope();
      var child = prototypeParent.$new(false, hierarchyParent);

      prototypeParent.a = 42;
      expect(child.a).toBe(42);

      child.counter = 0;
      child.$watch(function(scope) {
        scope.counter++;
      });

      prototypeParent.$digest();
      expect(child.counter).toBe(0);

      hierarchyParent.$digest();
      expect(child.counter).toBe(2);

    });

    it("$destroy后不能再被digest", function() {
      var parent = new Scope();
      var child = parent.$new();

      child.aValue = [1, 2, 3];
      child.counter = 0;

      child.$watch(
        function(scope) {return scope.aValue;},
        function(newVal, oldVal, scope) {
          scope.counter++;
        },
        true
      );

      parent.$digest();
      expect(child.counter).toBe(1);

      child.aValue.push(4);
      parent.$digest();
      expect(child.counter).toBe(2);

      child.$destroy();
      child.aValue.push(5);

      parent.$digest();
      expect(child.counter).toBe(2);
    });
  });

  describe("$watchCollection", function() {
    var scope;
    beforeEach(function() {
      scope = new Scope();
    });

    it("对于非collection，工作和一般watch一样", function() {
      var valueProvided;

      scope.aValue = 42;
      scope.counter = 0;

      scope.$watchCollection(
        function(scope) {return scope.aValue;},
        function(newVal, oldVal, scope) {
          valueProvided = newVal;
          scope.counter++;
        }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);
      expect(valueProvided).toBe(scope.aValue);

      scope.aValue = 43;
      scope.$digest();
      expect(scope.counter).toBe(2);

      scope.$digest();
      expect(scope.counter).toBe(2);
    });

    it("在NaN时不会挂", function() {
      scope.aValue = 0/0;
      scope.counter = 0;

      scope.$watchCollection(
        function(scope) {return scope.aValue;},
        function(newVal, oldVal, scope) {
          scope.counter++;
        }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);

      scope.$digest();
      expect(scope.counter).toBe(1);

    });

    it("检测到变成array时", function() {
      scope.counter = 0;

      scope.$watchCollection(
        function(scope) {return scope.arr;},
        function(newVal, oldVal, scope) {
          scope.counter++;
        }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);

      scope.arr = [1, 2, 3];
      scope.$digest();
      expect(scope.counter).toBe(2);

      scope.$digest();
      expect(scope.counter).toBe(2);
    });

    it("检测到数组的item的增加", function() {
      scope.arr = [1, 2, 3];
      scope.counter = 0;

      scope.$watchCollection(
        function(scope) {return scope.arr;},
        function(newVal, oldVal, scope) {
          scope.counter++;
        }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);

      scope.arr.push(4);
      scope.$digest();
      expect(scope.counter).toBe(2);

      scope.$digest();
      expect(scope.counter).toBe(2);
    });

    it("检测到数组的item的减少", function() {
      scope.arr = [1, 2, 3];
      scope.counter = 0;

      scope.$watchCollection(
        function(scope) {return scope.arr;},
        function(newVal, oldVal, scope) {
          scope.counter++;
        }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);

      scope.arr.shift();
      scope.$digest();
      expect(scope.counter).toBe(2);

      scope.$digest();
      expect(scope.counter).toBe(2);
    });

    it("检测到数组的item的replace", function() {
      scope.arr = [1, 2, 3];
      scope.counter = 0;

      scope.$watchCollection(
        function(scope) {return scope.arr;},
        function(newVal, oldVal, scope) {
          scope.counter++;
        }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);

      scope.arr[1] = 42;
      scope.$digest();
      expect(scope.counter).toBe(2);

      scope.$digest();
      expect(scope.counter).toBe(2);
    });

    it("检测到数组的item的reorder", function() {
      scope.arr = [2, 1, 3];
      scope.counter = 0;

      scope.$watchCollection(
        function(scope) {return scope.arr;},
        function(newVal, oldVal, scope) {
          scope.counter++;
        }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);

      scope.arr.sort();
      scope.$digest();
      expect(scope.counter).toBe(2);

      scope.$digest();
      expect(scope.counter).toBe(2);
    });

    it("处理array中的NaN", function() {
      scope.arr = [2, NaN, 3];
      scope.counter = 0;

      scope.$watchCollection(
        function(scope) {return scope.arr;},
        function(newVal, oldVal, scope) {
          scope.counter++;
        }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);
    });

    it("检测到arguments object中的item replace", function() {
      (function() {
        scope.arrayLike = arguments;
      })(1, 2, 3);

      scope.counter = 0;

      scope.$watchCollection(
        function(scope) {return scope.arrayLike;},
        function(newVal, oldVal, scope) {
          scope.counter++;
        }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);

      scope.arrayLike[1] = 42;
      scope.$digest();
      expect(scope.counter).toBe(2);

      scope.$digest();
      expect(scope.counter).toBe(2);
    });

    it("检测到NodeList object中的item replace", function() {
      document.documentElement.appendChild(document.createElement("div"));
      scope.arrayLike = document.getElementsByTagName("div");

      scope.counter = 0;

      scope.$watchCollection(
        function(scope) {return scope.arrayLike;},
        function(newVal, oldVal, scope) {
          scope.counter++;
        }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);

      document.documentElement.appendChild(document.createElement("div"));
      scope.$digest();
      expect(scope.counter).toBe(2);

      scope.$digest();
      expect(scope.counter).toBe(2);
    });

    it("检测到当变成object时", function() {
      scope.counter = 0;

      scope.$watchCollection(
        function(scope) {return scope.obj;},
        function(newVal, oldVal, scope) {
          scope.counter++;
        }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);

      scope.obj = {a: 1};
      scope.$digest();
      expect(scope.counter).toBe(2);

      scope.$digest();
      expect(scope.counter).toBe(2);
    });

    it("检测到当object新增属性时", function() {
      scope.counter = 0;
      scope.obj = {a: 1};

      scope.$watchCollection(
        function(scope) {return scope.obj;},
        function(newVal, oldVal, scope) {
          scope.counter++;
        }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);

      scope.obj.b = 2;
      scope.$digest();
      expect(scope.counter).toBe(2);

      scope.$digest();
      expect(scope.counter).toBe(2);
    });

    it("检测到当object属性的value值改变时", function() {
      scope.counter = 0;
      scope.obj = {a: 1};

      scope.$watchCollection(
        function(scope) {return scope.obj;},
        function(newVal, oldVal, scope) {
          scope.counter++;
        }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);

      scope.obj.a = 2;
      scope.$digest();
      expect(scope.counter).toBe(2);

      scope.$digest();
      expect(scope.counter).toBe(2);
    });

    it("NaN不会挂", function() {
      scope.counter = 0;
      scope.obj = {a: NaN};

      scope.$watchCollection(
        function(scope) {
          return scope.obj;
        },
        function(newVal, oldVal, scope) {
          scope.counter++;
        }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);
    });

    it("检测到当object属性的remove", function() {
      scope.counter = 0;
      scope.obj = {a: 1};

      scope.$watchCollection(
        function(scope) {return scope.obj;},
        function(newVal, oldVal, scope) {
          scope.counter++;
        }
      );

      scope.$digest();
      expect(scope.counter).toBe(1);

      delete scope.obj.a;
      scope.$digest();
      expect(scope.counter).toBe(2);

      scope.$digest();
      expect(scope.counter).toBe(2);
    });
  });
});