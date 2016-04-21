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
}

function AST(lexer) {
  this.lexer = lexer;
}

AST.prototype.ast = function(text) {
  this.tokens = this.lexer.lex(text);
  //  ast building here
}

function ASTCompiler(astBuilder) {
  this.astBuilder = astBuilder;
}

ASTCompiler.prototype.compile = function(text) {
  var ast = this.astBilder.ast(text);

  //ast compilation here
}

function Parser(lexer) {
  this.lexer = lexer;
  this.ast = new AST(this.lexer);
  this.astCompiler = new ASTCompiler(this.ast);
}

Parser.prototype.parse = function(text) {
  return this.astCompiler.compile(text);
}
module.exports = parse;