describe("Hello", function() {
  // it("says hello", function() {
  //   expect(sayHello()).toBe("hello fucking world");
  // });
  it("says hello to receiver", function() {
    expect(sayHello("Bill")).toBe("Hello, Bill");
  }); 
});