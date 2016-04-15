// function sayHello() {
//   return "hello fucking world";
// }

function sayHello(to) {
  return _.template("Hello, <%= name %>!")({name: to});
}