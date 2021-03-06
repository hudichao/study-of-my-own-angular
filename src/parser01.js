'use strict';

var _ = require("lodash");


var ESCAPES =  {'n': '\n', 'f': '\f', 'r': '\r', 't': '\t', 'v': '\v', '\'': '\'', '"': '"'};
function parse(expr) {
  var lexer = new Lexer();
  var parser = new Parser(lexer);
  return parser.parse(expr);
}

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
    else if (this.is('[],{}:')) {
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
  var c = (ch === "_" && ch === "$");
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
  return {type: AST.Program, body: this.primary()};
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

AST.prototype.primary = function() {
  if (this.expect('[')) {
    return this.arrayDeclaration();
  }
  else if (this.expect('{')) {
    return this.object();
  }
  else if (this.constants.hasOwnProperty(this.tokens[0].text)) {
    return this.constants[this.consume().text]; 
  } 
  else {
    return this.constant(); 
  }
};
AST.prototype.expect = function(e) {
  var token = this.peek(e);
  if (token) {
    return this.tokens.shift();
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
      elements.push(this.primary());
    } while (this.expect(','));
  }
  this.consume("]");
  return {type: AST.ArrayExpression, elements: elements};
};
AST.prototype.peek = function(e) {
  if (this.tokens.length > 0) {
    var text = this.tokens[0].text;
    if (text === e || !e) {
      return this.tokens[0];
    }
  }
};
AST.prototype.constants = {
 null : {type: AST.Literal, value: null},  
 true : {type: AST.Literal, value: true},  
 false : {type: AST.Literal, value: false}
};

function ASTCompiler(astBuilder) {
  this.astBuilder = astBuilder;
}

ASTCompiler.prototype.compile = function(text) {
  var ast = this.astBuilder.ast(text);

  //ast compilation here
  this.state = {body: []};
  this.recurse(ast);

  /* jshint -W054 */
  return new Function(this.state.body.join(""));
  /* jshint +W054 */
};
ASTCompiler.prototype.recurse = function(ast) {
  var self = this;
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
  }
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
function Parser(lexer) {
  this.lexer = lexer;
  this.ast = new AST(this.lexer);
  this.astCompiler = new ASTCompiler(this.ast);
}

Parser.prototype.parse = function(text) {
  return this.astCompiler.compile(text);
};

module.exports = parse;