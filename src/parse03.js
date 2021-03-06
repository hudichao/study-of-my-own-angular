'use strict';

var _ = require("lodash");


var ESCAPES =  {'n': '\n', 'f': '\f', 'r': '\r', 't': '\t', 'v': '\v', '\'': '\'', '"': '"'};
var CALL = Function.prototype.call;
var APPLY = Function.prototype.apply;
var BIND = Function.prototype.bind;
//helper function
function ensureSafeMemberName(name) {
  if (name ===  "constructor"  || name ===  "__proto__"  ||
      name ===  "__defineGetter__"  || name ===  "__defineSetter__"  ||
      name ===  "__lookupGetter__"  || name ===  "__lookupSetter__" ) {
  throw  "Attempting to access a disallowed field in Angular expressions!";
  }
}
function ensureSafeObject(obj) {
  if (obj) {
    if (obj.window === obj) {
      throw "Referencing window in Angular expressions is disallowed!";
    } else if (obj.children && (obj.nodeName || (obj.prop && obj.attr && obj.find))) {
      throw "Referencing DOM nodes in Angular expressions is disallowed!";
    } else if (obj.constructor === obj) {
      throw "Referencing Function in Angular expressions is disallowed!";
    } else if (obj === Object) {
      throw "Referencing Object in Angular expressions is disallowed!";
    }
  }
  return obj;
}
function ensureSafeFunction(obj) {
  if (obj) {
    if (obj.constructor === obj) {
      throw "Referencing Function in Angular expressions is disallowed!";
    } else if (obj === CALL || obj === APPLY || obj === BIND) {
      throw "Referencing call, apply, or bind in Angular expressions is disallowed!";
    }
  }
  return obj;
}
function parse(expr) {
  var lexer = new Lexer();
  var parser = new Parser(lexer);
  return parser.parse(expr);
}
parse.enableLog = false;

function Lexer() {

}
Lexer.prototype.is = function(chs) {
  return chs.indexOf(this.ch) >= 0;
};
Lexer.prototype.lex = function(text) {
  // tokenization here
  this.text = text;
  this.index = 0;
  this.ch = undefined;
  this.tokens = [];

  while (this.index < this.text.length) {
    this.ch = this.text.charAt(this.index);
    if (this.isNumber(this.ch) || (this.is(".") && this.isNumber(this.peek()))) {
      this.readNumber();
    } 
    else if (this.is('\'"')) {
      this.readString(this.ch);
    }
    else if (this.is('[],{}:.()=')) {
      this.tokens.push({
        text: this.ch
      });
      this.index++;
    }
    else if (this.isIdent(this.ch)) {
      this.readIdent();
    }
    else if (this.isWhitespace(this.ch)) {
      this.index++;
    }
    else {
      throw "unexpected next character: " + this.ch;
    }
  }

  return this.tokens;
};
Lexer.prototype.peek = function() {
  var output;
  if (this.index < this.text.length) {
    output = this.text.charAt(this.index + 1);
  } else {
    output = false;
  }
  return output;
};
Lexer.prototype.isExpOperator = function(ch) {
  return ch === "-" || ch === "+" || this.isNumber(ch);
};
Lexer.prototype.isNumber = function(ch) {
  return '0' <= ch && ch <= '9';
};
Lexer.prototype.isIdent = function(ch) {
  var a = (ch >= "a" && ch <="z");
  var b = (ch >= "A" && ch <= "Z");
  var c = (ch === "_" || ch === "$");
  return a || b || c;
};
Lexer.prototype.isWhitespace = function(ch) {
  if ([' ', '\r', '\t', '\n', '\v', '\u00A0'].indexOf(ch) > -1) {
    return true;
  } else {
    return false;
  }
};
Lexer.prototype.readIdent = function() {
  var text = "";
  while (this.index < this.text.length) {
    var ch = this.text.charAt(this.index);
    if (this.isIdent(ch) || this.isNumber(ch)) {
      text += ch;
    } else {
      break;
    }
    this.index++;
  }
  var token = {
    text: text,
    identifier: true
  };

  this.tokens.push(token);
};
Lexer.prototype.readString = function(quote) {
  this.index++; // 忽略开头的引号
  var string = '';
  var escape = false;
  while (this.index < this.text.length) {
    var ch = this.text.charAt(this.index);

    if (escape) {
      if (ch === 'u') {
        var hex = this.text.substring(this.index + 1, this.index + 5);
        if (!hex.match(/[\da-f]{4}/i)) {
          throw "invalid unicode escape";
        }
        this.index += 4;
        string += String.fromCharCode(parseInt(hex, 16));
      } else {
        var replacement = ESCAPES[ch];
        if (replacement) {
          string += replacement;
        } else {
          string += ch;
        }
      }
      
      escape = false;
    }
    // 如果碰到最后的引号
    else if (ch === quote) {
      this.index++;
      this.tokens.push({
        text: string,
        value: string
      });
      return;
    }
    else if (ch === '\\') {
      escape = true;
    }
    else {
      string += ch;
    }
    this.index++;
  }

  // 如果到死没碰到结尾的引号
  throw "unmated quote";
};
Lexer.prototype.readNumber = function() {
  var number = "";
  while (this.index < this.text.length) {
    var ch = this.text.charAt(this.index).toLowerCase();
    if (ch === "." || this.isNumber(ch)) {
      number += ch;
    } else {
      var nextCh = this.peek();
      var prevCh = number.charAt(number.length - 1);

      if (ch === "e" && this.isExpOperator(nextCh)) {
        number += ch;
      }
      else if (this.isExpOperator(ch) && prevCh === 'e' && nextCh && this.isNumber(nextCh)) {
        number += ch;
      }
      else if (this.isExpOperator(ch) && prevCh === 'e' && !(nextCh && this.isNumber(nextCh))) {
        throw "invalid exponent";
      }
      else {
        break;
      }
    }
    this.index++;
  }
  this.tokens.push({
    text: number,
    value: Number(number)
  });
};

function AST(lexer) {
  this.lexer = lexer;
}

AST.prototype.ast = function(text) {
  this.tokens = this.lexer.lex(text);
  //  ast building here
  return this.program();
};
AST.prototype.program = function() {
  return {type: AST.Program, body: this.assignment()};
};
AST.prototype.constant = function() {
  return {type: AST.Literal, value: this.consume().value};
};
AST.program = 'Program';
AST.Literal = 'Literal';
AST.ArrayExpression = 'ArrayExpression';
AST.ObjectExpression = 'ObjectExpression';
AST.Property = 'Property';
AST.Identifier = 'Identifier';
AST.ThisExpression = 'ThisExpression';
AST.MemberExpression = 'MemberExpression';
AST.CallExpression = "CallExpression";
AST.AssignmentExpression = "AssignmentExpression";

AST.prototype.assignment = function() {
  var left = this.primary();
  if (this.expect("=")) {
    var right = this.primary();
    return {type: AST.AssignmentExpression, left: left, right: right};
  }
  return left;
};
AST.prototype.primary = function() {
  var primary;
  if (this.expect('[')) {
    primary =  this.arrayDeclaration();
  }
  else if (this.expect('{')) {
    primary = this.object();
  }
  else if (this.constants.hasOwnProperty(this.tokens[0].text)) {
    primary = this.constants[this.consume().text]; 
  } 
  else if (this.peek().identifier) {
    primary = this.identifier();
  }
  else {
    primary = this.constant(); 
  }
  var next;
  while (next = this.expect('.', '[', '(')) {
    if (next.text === '[') {
      primary = {
        type: AST.MemberExpression,
        object: primary,
        property: this.primary(),
        computed: true
      };
      this.consume(']');
    } else if (next.text === '.') {
      primary = {
        type: AST.MemberExpression,
        object: primary,
        property: this.identifier(),
        computed: false
      };
    } else if (next.text === '(') {
      primary = {
        type: AST.CallExpression, 
        callee: primary,
        arguments: this.parseArguments()
      };
      this.consume(')');
    }
  }
  return primary;
};
AST.prototype.parseArguments = function() {
  var args = [];
  if (!this.peek(')')) {
    do {
      args.push(this.assignment());
    } while (this.expect(','));
  }
  return args;
};
AST.prototype.expect = function(e1, e2, e3, e4) {
  var token = this.peek(e1, e2, e3, e4);
  if (token) {
    return this.tokens.shift();
  }
};
AST.prototype.peek = function(e1, e2, e3, e4) {
  if (this.tokens.length > 0) {
    var text = this.tokens[0].text;
    if (text === e1 || text === e2 || text === e3 || text === e4 || 
      (!e1 && !e2 && !e3 && !e4)) {
      return this.tokens[0];
    }
  }
};
AST.prototype.consume = function(e) {
  var token = this.expect(e);
  if (!token) {
    throw "Unexpected. Expecting: " + e;
  }
  return token;
};
AST.prototype.identifier = function() {
  return {type: AST.Identifier, name: this.consume().text};
};
AST.prototype.object = function() {
  var properties = [];
  if (!this.peek("}")) {
    do {
      var property = {type: AST.Property};
      if (this.peek().identifier) {
        property.key = this.identifier();
      } else {
        property.key = this.constant();
      }
      this.consume(":");
      property.value = this.primary();
      properties.push(property);
    } while (this.expect(","));
  }

  this.consume("}");
  return {type: AST.ObjectExpression, properties: properties};
};
AST.prototype.arrayDeclaration = function() {
  var elements = [];
  if (!this.peek("]")) {
    do {
      elements.push(this.assignment());
    } while (this.expect(','));
  }
  this.consume("]");
  return {type: AST.ArrayExpression, elements: elements};
};
AST.prototype.constants = {
 null : {type: AST.Literal, value: null},  
 true : {type: AST.Literal, value: true},  
 false : {type: AST.Literal, value: false},
 this: {type: AST.ThisExpression}
};

function ASTCompiler(astBuilder) {
  this.astBuilder = astBuilder;
}

ASTCompiler.prototype.compile = function(text) {
  var ast = this.astBuilder.ast(text);

  //ast compilation here
  this.state = {body: [], nextId: 0, vars: []};
  this.recurse(ast);
  var fnString = 'var fn = function(s,l){' + 
    (this.state.vars.length ? 'var ' + this.state.vars.join(",") + ";" : "") + 
    this.state.body.join("") + "}; return fn;";
  /* jshint -W054 */
  var output = new Function(
    "ensureSafeMemberName",
    'ensureSafeObject', 
    'ensureSafeFunction', 
    fnString)(
      ensureSafeMemberName,
      ensureSafeObject,
      ensureSafeFunction);
  /* jshint +W054 */
  if (parse.enableLog) {
    console.log(output.toString());
  }
  return output;
};
ASTCompiler.prototype.nextId = function() {
  var id = 'v' + (this.state.nextId++);
  this.state.vars.push(id);
  return id;
};
ASTCompiler.prototype.recurse = function(ast, context, create) {
  var self = this;
  var intoId;
  switch(ast.type) {
    case AST.Program:
      this.state.body.push("return ", this.recurse(ast.body), ';');
      break;
    case AST.Literal:
      return this.escape(ast.value);
    case AST.ArrayExpression:

      // 被坑的不行
      // var elements = _.map(ast.elements, function(element) {
      //   return this.recurse(element);
      // }, this);
      var elements = _.map(ast.elements, function(element) {
        return self.recurse(element);
      });
      return '[' + elements.join(",") + ']';
    case AST.ObjectExpression: 
      var properties = _.map(ast.properties, function(property) {
        var key = property.key.type === AST.Identifier ? 
          property.key.name : 
          self.escape(property.key.value);
        var value = self.recurse(property.value);
        return key + ":" + value;
      });
      return '{' + properties.join(",") + '}';
    case AST.Identifier:
      ensureSafeMemberName(ast.name);
      intoId = this.nextId();
      this.if_(this.getHasOwnProperty("l", ast.name), this.assign(intoId, this.nonComputedMember('l', ast.name)));
      if (create) {
        this.if_(this.not(this.getHasOwnProperty('l', ast.name)) + ' && s && ' +
          this.not(this.getHasOwnProperty('s', ast.name)),
          this.assign(this.nonComputedMember('s', ast.name), '{}'));
      }
      this.if_(this.not(this.getHasOwnProperty("l", ast.name)) + ' && s', this.assign(intoId, this.nonComputedMember('s', ast.name)));
      if (context) {
        context.context = this.getHasOwnProperty("l", ast.name) + "?l:s";
        context.name = ast.name;
        context.computed = false;
      }
      this.addEnsureSafeObject(intoId);
      return intoId;
    case AST.ThisExpression:
      return 's';
    case AST.MemberExpression:
      intoId = this.nextId();
      var left = this.recurse(ast.object, undefined, create);
      if (context) {
        context.context = left;
      }
      if (ast.computed) {
        var right = this.recurse(ast.property);
        this.addEnsureSafeMemberName(right);
        if (create) {
          this.if_(this.not(this.computedMember(left, right)), 
            this.assign(this.computedMember(left, right), '{}'));
        }
        this.if_(left,
          this.assign(intoId, 'ensureSafeObject(' + this.computedMember(left, right) + ')'));
        if (context) {
          context.name = right;
          context.computed = true;
        }
      } else {
        ensureSafeMemberName(ast.property.name);
        if (create) {
          this.if_(this.not(this.nonComputedMember(left, ast.property.name)), 
            this.assign(this.nonComputedMember(left, ast.property.name), '{}'));
        }
        this.if_(left,
          this.assign(intoId, 
            'ensureSafeObject(' + this.nonComputedMember(left, ast.property.name) + ')'));
        if (context) {
          context.name = ast.property.name;
          context.computed = false;
        }
      }
      return intoId;
    case AST.CallExpression: 
      var callContext = {};
      var callee = this.recurse(ast.callee, callContext);
      var args = _.map(ast.arguments, function(arg) {
        return 'ensureSafeObject(' + self.recurse(arg) + ')';
      });
      if (callContext.name) {
        this.addEnsureSafeObject(callContext.context);
        if (callContext.computed) {
          callee = this.computedMember(callContext.context, callContext.name);
        } else {
          callee = this.nonComputedMember(callContext.context, callContext.name);
        }
      }
      this.addEnsureSafeFunction(callee);
      return callee + "&&ensureSafeObject(" + callee + "(" + args.join(",") + "))";
    case AST.AssignmentExpression:
      var leftContext = {};
      this.recurse(ast.left, leftContext, true);
      var leftExpr;
      if (leftContext.computed) {
        leftExpr = this.computedMember(leftContext.context, leftContext.name);
      } else {
        leftExpr = this.nonComputedMember(leftContext.context, leftContext.name);
      }
      return this.assign(leftExpr, 'ensureSafeObject(' + this.recurse(ast.right) + ')');
  }
};
ASTCompiler.prototype.addEnsureSafeFunction = function(expr) {
  this.state.body.push("ensureSafeFunction(" + expr + ');');
};
ASTCompiler.prototype.addEnsureSafeObject = function(expr) {
  this.state.body.push('ensureSafeObject(' + expr + ');');
};
ASTCompiler.prototype.addEnsureSafeMemberName = function(expr) {
  this.state.body.push('ensureSafeMemberName(' + expr + ');');
};
ASTCompiler.prototype.getHasOwnProperty = function(object, property) {
  return object + '&&(' + this.escape(property) + ' in ' + object + ')';
};
ASTCompiler.prototype.computedMember = function(left, right) {
  return '(' + left + ')[' + right + ']';
};
ASTCompiler.prototype.nonComputedMember = function(left, right) {
  return '(' + left + ').' + right;
};
//当是字符串时，两侧加引号
ASTCompiler.prototype.escape = function(value) {
  if (_.isString(value)) {
    return '\'' + value.replace(this.stringEscapeRegex, this.stringEscapeFn) + '\'';
  } 
  else if (_.isNull(value)) {
    return 'null';
  }
  else {
    return value;
  }
};
ASTCompiler.prototype.stringEscapeRegex = /[^ a-zA-Z0-9]/g;
ASTCompiler.prototype.stringEscapeFn = function(c) {
  return '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4);
};
ASTCompiler.prototype.not = function(e) {
  return '!(' + e + ')';
};
ASTCompiler.prototype.if_ = function(test, consequent) {
  this.state.body.push('if(', test, '){', consequent, '}');
};
ASTCompiler.prototype.assign = function(id, value) {
  return id + "="  + value + ";";
};
function Parser(lexer) {
  this.lexer = lexer;
  this.ast = new AST(this.lexer);
  if (parse.enableLog) {
    console.log(this.lexer);
  }
  this.astCompiler = new ASTCompiler(this.ast);
}

Parser.prototype.parse = function(text) {
  return this.astCompiler.compile(text);
};

module.exports = parse;