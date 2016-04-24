'use strict';

function parse(expr) {
  var lexer = new Lexer();
  var parser = new Parser(lexer);
  return parser.parse(expr);
}

function Lexer() {

}

Lexer.prototype.lex = function(text) {
  // tokenization here
  this.text = text;
  this.index = 0;
  this.ch = undefined;
  this.tokens = [];

  while (this.index < this.text.length) {
    this.ch = this.text.charAt(this.index);
    if (this.isNumber(this.ch) || (this.ch === "." && this.isNumber(this.peek()))) {
      this.readNumber();
    } else {
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

Lexer.prototype.isNumber = function(ch) {
  return '0' <= ch && ch <= '9';
};
Lexer.prototype.readNumber = function() {
  var number = "";
  while (this.index < this.text.length) {
    var ch = this.text.charAt(this.index);
    if (ch === "." || this.isNumber(ch)) {
      number += ch;
    } else {
      break;
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
  return {type: AST.Program, body: this.constant()};
};
AST.prototype.constant = function() {
  return {type: AST.Literal, value: this.tokens[0].value};
};
AST.program = 'Program';
AST.Literal = 'Literal';

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
  switch(ast.type) {
    case AST.Program:
      this.state.body.push("return ", this.recurse(ast.body), ';');
      break;
    case AST.Literal:
      return ast.value;
  }
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