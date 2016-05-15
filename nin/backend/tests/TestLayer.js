function TestLayer(config) {
/* everything up until the first method is considered
 * as the body of the constructor. */

this.someMemberVariable = "hello world"
}

TestLayer.prototype.someMethod = function(a, b, c) {
 var scopedVariable = "someMethod was called"
 console.log(scopedVariable, a, b, c)
}

TestLayer.prototype.someMethodThatReturnsSomething = function(a, b) {
 return a * b
}
