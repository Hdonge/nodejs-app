/**
 * This module is created to demonstrate something is throwing when init is called
 */

var example = {};

example.init = function () {
    //Create error condition when function will be called it will throw an error
    //Hence kept bar undefined
    var foo = bar;
};

module.exports = example;
