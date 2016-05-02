'use strict';

var parse = require("../src/parse");
var _ = require("lodash");
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

  it("parse非空数组", function() {
    var fn = parse('[1, "two", [3], true]');
    expect(fn()).toEqual([1, 'two', [3], true]);
  });

  it("parse空object", function() {
    var fn = parse("{}");
    expect(fn()).toEqual({});
  });

  it("parse非空object", function() {
    var fn = parse('{"a key": 1, \'another-key\': 2}');
    expect(fn()).toEqual({'a key': 1, 'another-key': 2});
  });

  it("key没有引号的情况", function() {
    var fn = parse('{a: 1, b: [2, 3], c: {d: 4}}');
    expect(fn()).toEqual({a: 1, b: [2, 3], c: {d: 4}});
  });

  it("从scope获取属性", function() {
    var fn = parse('aKey');
    expect(fn({aKey: 42})).toBe(42);
    expect(fn({})).toBeUndefined();
  });

  it("查找undefined的属性返回undefined,而不是报错", function() {
    var fn = parse("aKey");
    expect(fn()).toBeUndefined();
  });

  it("parse this", function() {
    var fn = parse("this");
    var scope = {};
    expect(fn(scope)).toBe(scope);
    expect(fn()).toBeUndefined();
  });

  it("双层nested look up", function() {
    var fn = parse("aKey.anotherKey");
    expect(fn({aKey: {anotherKey: 42}})).toBe(42);
    expect(fn({aKey: {}})).toBeUndefined();
    expect(fn({})).toBeUndefined();
  });

  it("从一个object返回member", function() {
    var fn = parse('{aKey: 42}.aKey');
    expect(fn()).toBe(42);
  });

  it("多层", function() {
    var fn = parse('aKey.secondKey.thirdKey.fourthKey');
    expect(fn({aKey: {secondKey: {thirdKey: {fourthKey: 42}}}})).toBe(42); 
    expect(fn({aKey: {secondKey: {thirdKey: {}}}})).toBeUndefined(); 
    expect(fn({aKey: {}})).toBeUndefined();
    expect(fn()).toBeUndefined();
  });

  it("当有matching key时使用locals", function() {
    var fn = parse("aKey");
    var scope = {aKey: 42};
    var locals = {aKey: 43};
    expect(fn(scope, locals)).toBe(43);
  });

  it("当没有matching key时不使用locals", function() {
    var fn = parse("aKey");
    var scope = {aKey: 42};
    var locals = {otherKey: 43};
    expect(fn(scope, locals)).toBe(42);
  });

  it("只要第一个部分match就用locals", function() {
    var fn = parse("aKey.anotherKey");
    var scope = {aKey: {anotherKey: 42}};
    var locals = {aKey: {}};
    expect(fn(scope, locals)).toBeUndefined();
  });

  it("parse 简单的computed property", function() {
    var fn = parse('aKey["anotherKey"]');
    expect(fn({aKey: {anotherKey: 42}}));
  });

  it("parse computed array", function() {
    var fn = parse("anArray[1]");
    expect(fn({anArray: [1, 2, 3]})).toBe(2);
  });

  it("parse computed property", function() {
    var fn = parse('lock[key]');
    expect(fn({key: 'theKey', lock: {theKey: 42}})).toBe(42);
  });

  it("parse computed property2", function() {
    var fn = parse('lock[keys["aKey"]]');
    expect(fn({keys: {aKey: 'theKey'}, lock: {theKey: 42}})).toBe(42);
  });

  it("parse function", function() {
    var fn = parse("aFunction()");
    expect(fn({aFunction: function() {return 42;}})).toBe(42);
  });

  it("parse带一个数字传参函数", function() {
    var fn = parse("aFunction(42)");
    expect(fn({aFunction: function(n) {return n;}})).toBe(42);
  });

  it("parse带一个identifer参数的函数", function() {
    var fn = parse("aFunction(n)");
    expect(fn({n: 42, aFunction: function(arg) {return arg;}})).toBe(42);
  });

  it("parse传参为函数结果的函数", function() {
    var fn = parse("aFunction(argFn())");
    expect(fn({
      argFn: _.constant(42),
      aFunction: function(arg) {return arg;}
    })).toBe(42);
  });

  it("有多个参数的function call", function() {
    var fn = parse("aFunction(37, n, argFn())");
    expect(fn({
      n: 3,
      argFn: _.constant(2),
      aFunction: function(a1, a2, a3) {return a1 + a2 + a3;}
    })).toBe(42);
  });

  it("作为method被执行的函数", function() {
    var scope = {
      anObject: {
        aMember: 42,
        aFunction: function() {
          return this.aMember;
        }
      }
    };
    var fn = parse('anObject["aFunction"]()');
    expect(fn(scope)).toBe(42);
  }); 

  it(".属性", function() {
    var scope = {
      anObject: {
        aMember: 42,
        aFunction: function() {
          return this.aMember;
        }
      }
    };
    var fn = parse('anObject.aFunction()');
    expect(fn(scope)).toBe(42);
  });

  it("一般函数bind this to scope", function() {
    var scope = {
      aFunction: function() {
        return this;
      }
    };
    // parse.enableLog = true;
    var fn = parse("aFunction()");
    expect(fn(scope)).toBe(scope);
  });

  it("bind this to local", function() {
    var scope = {};
    var locals = {
      aFunction: function() {
        return this;
      }
    };
    var fn = parse("aFunction()");
    expect(fn(scope, locals)).toBe(locals);
  });

  it("赋值", function() {
    var fn = parse("anAttribute = 42");
    var scope = {};
    fn(scope);
    expect(scope.anAttribute).toBe(42);
  });

  it("赋值2", function() {
    var fn = parse("anAttribute = aFunction()");
    var scope = {aFunction: _.constant(42)};
    fn(scope);
    expect(scope.anAttribute).toBe(42);
  });

  it("赋值3 computed property", function() {
    var fn = parse('anObject["anAttribute"] = 42');
    var scope = {anObject: {}};
    fn(scope);
    expect(scope.anObject.anAttribute).toBe(42);
  });

  it("赋值4 non-computed property", function() {
    var fn = parse('anObject.anAttribute = 42');
    var scope = {anObject: {}};
    fn(scope);
    expect(scope.anObject.anAttribute).toBe(42);
  });

  it("赋值5", function() {
    var fn = parse('anArray[0].anAttribute = 42');
    var scope = {anArray: [{}]};
    fn(scope);
    expect(scope.anArray[0].anAttribute).toBe(42);
  });

  it("属性不存在时自动生成属性", function() {
    parse.enableLog = true;
    var fn = parse('some["nested"].property.path = 42');
    var scope = {};
    fn(scope);
    expect(scope.some.nested.property.path).toBe(42);
  });

  it("不允许function constructor", function() {
    // parse.enableLog = true;
    // var fn = parse('aFunction.constructor("return 43;")()');
    // var scope = {aFunction: function() {return 42}};
    // expect(fn(scope)).toBe(42);
    expect(function() {
      var fn = parse('aFunction.constructor("return window;")()');
      fn({aFunction: function() {}});
    }).toThrow();
  });

  it("不允许访问__proto__", function() {
    expect(function() {
      var fn = parse('obj.__proto__');
      fn({obj: {}});
    }).toThrow();
  });
  it("不允许执行__defineGetter__", function() {
    expect(function() {
      var fn = parse('obj.__defineGetter__("evil", fn)');
      fn({obj: {}, fn: function() {}});
    }).toThrow();
  });
  it("不允许执行__defineSetter__", function() {
    expect(function() {
      var fn = parse('obj.__defineSetter__("evil", fn)');
      fn({obj: {}, fn: function() {}});
    }).toThrow();
  });
  it("不允许执行__lookupGetter__", function() {
    expect(function() {
      var fn = parse('obj.__lookupGetter__("evil")');
      fn({obj: {}});
    }).toThrow();
  });
  it("不允许执行__lookupSetter__", function() {
    expect(function() {
      var fn = parse('obj.__lookupSetter__("evil")');
      fn({obj: {}});
    }).toThrow();
  });

  it("不允许以computed property来access window", function() {
    var fn = parse('anObject["wnd"]');
    expect(function() {fn({anObject: {wnd: window}});}).toThrow();
  });

  it("不允许以non-computed property来access window", function() {
    var fn = parse('anObject.wnd');
    expect(function() {fn({anObject: {wnd: window}});}).toThrow();
  });

  it("不允许传入window", function() {
    var fn = parse('aFunction(wnd)');
    expect(function() {
      fn({aFunction: function() {}, wnd: window});
    }).toThrow();
  });

  it("不能在window上call method", function() {
    var fn = parse('wnd.scrollTo(0)');
    expect(function() {
      fn({wnd: window});
    }).toThrow();
  });

  it("不能call返回window的function", function() {
    var fn = parse("getWnd()");
    expect(function() {fn({getWnd: _.constant(window)});}).toThrow();
  });

  it("不允许赋值window", function() {
    var fn = parse('wnd = anObject');
    expect(function() {
      fn({anObject: window});
    }).toThrow();
  });

  it("不能参照window", function() {
    var fn = parse('wnd');
    expect(function() {
      fn({wnd: window});
    }).toThrow();
  });

  it("不能从DOM元素上调用函数", function() {
    var fn = parse('el.setAttribute("evil", "true")');
    expect(function() {
      fn({el: document.documentElement});
    }).toThrow();
  });

  it("不能调用function constructor", function() {
    var fn = parse('fnConstructor("return window;")');
    expect(function() {
      fn({fnConstructor: (function() {}).constructor});
    }).toThrow();
  });

  it("不允许在object上调用函数", function() {
    var fn = parse('obj.create({})');
    expect(function() {
      fn({obj: Object});
    }).toThrow();
  });

  it("不能调用call", function() {
    var fn = parse("fn.call(obj)");
    expect(function() {
      fn({fun: function() {}, obj: {}});
    }).toThrow();
  });

  it("不能调用apply", function() {
    var fn = parse("fn.apply(obj)");
    expect(function() {
      fn({fun: function() {}, obj: {}});
    }).toThrow();
  });


  // operator
  it("parse 一个unary +", function() {
    expect(parse('+42')()).toBe(42);
    expect(parse('+a')({a: 42})).toBe(42);
  });

  it("+undfeind 返回0，而不是NaN", function() {
    expect(parse('+a')({})).toBe(0);
  });

  it("parse a unary !", function() {
    expect(parse('!true')()).toBe(false);
    expect(parse('!42')()).toBe(false);
    expect(parse('!a')({a: false})).toBe(true);
    expect(parse('!!a')({a: false})).toBe(false);
  });

  it('parse a unary -', function() {
    expect(parse('-42')()).toBe(-42);
    expect(parse('-a')({a: -42})).toBe(42);
    expect(parse('--a')({a: -42})).toBe(-42);
    expect(parse('-a')({})).toBe(0);
  });

  it("parse string 中的 !", function() {
    expect(parse('"!"')()).toBe('!');
  });

  it("parse乘法", function() {
    expect(parse('21 * 2')()).toBe(42);
  });

  it("parse除法", function() {
    expect(parse('84 / 2')()).toBe(42);
  });

  it("parse余数", function() {
    expect(parse('85 % 43')()).toBe(42);
  });

  it("parse多个乘除", function() {
    expect(parse('36 * 2 % 5')()).toBe(2);
  });

  it("parse加法", function() {
    expect(parse('20 + 22')()).toBe(42);
  });

  it("prase减法", function() {
    expect(parse('42 - 20')()).toBe(22);
  });

  it("加减乘除的顺序", function() {
    expect(parse('2 + 3 * 5')()).toBe(17);
    expect(parse('2 + 3 * 2 + 3')()).toBe(11);
  });

  it("加法中代替undefined为0", function() {
    expect(parse('a + 22')()).toBe(22);
    expect(parse('22 + a')()).toBe(22);
  });

  it("减法中代替undefined为0", function() {
    expect(parse('a - 22')()).toBe(-22);
    expect(parse('22 - a')()).toBe(22);
  });

  it("parse大小比较符", function() {
    expect(parse('1 < 2')()).toBe(true);
    expect(parse('1 > 2')()).toBe(false);
    expect(parse('1 <= 2')()).toBe(true);
    expect(parse('2 >= 2')()).toBe(true);
    expect(parse('1 >= 2')()).toBe(false);
    expect(parse('2 >= 2')()).toBe(true);
  });

  it("parse相等比较", function() {
    expect(parse('42 == 42')()).toBe(true);
    expect(parse('42 == "42"')()).toBe(true);
    expect(parse('42 != 42')()).toBe(false);
    expect(parse('42 === 42')()).toBe(true);
    expect(parse('42 === "42"')()).toBe(false);
    expect(parse('42 !== 42')()).toBe(false);
  });

  it("大小比较优先", function() {
    expect(parse('2 == "2" > 2 === "2"')()).toBe(false);
  });

  it("比加法低", function() {
    expect(parse('2 + 3 < 6 - 2')()).toBe(false);
  });
});















