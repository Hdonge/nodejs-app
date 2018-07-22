/**
 * Test runner
 */

//Override NODE_ENV variable
process.env.NODE_ENV = 'testing'

//Application logic for test runner
var _app = {};

//Container for the tests
_app.tests = {};

//Add on the unit tests
_app.tests.unit = require('./unit');
_app.tests.api = require('./api');


_app.countTests = function () {
    var counter = 0;
    for (let test in _app.tests) {
        if (_app.tests.hasOwnProperty(test)) {
            var subTests = _app.tests[test];
            for (var testName in subTests) {
                if (subTests.hasOwnProperty(testName)) {
                    counter++;
                }
            }
        }
    }
    return counter;
};

_app.runTests = function () {
    var errors = [];
    var successes = 0;
    var limit = _app.countTests();
    var counter = 0;
    for (let test in _app.tests) {
        if (_app.tests.hasOwnProperty(test)) {
            var subTests = _app.tests[test];
            for (var testName in subTests) {
                if (subTests.hasOwnProperty(testName)) {
                    (function () {
                        var tempTestName = testName;
                        var testValue = subTests[testName];

                        //Call the test
                        try {
                            testValue(function () {
                                // If it calls back without throwing, then it succeeded, so log it in green
                                console.log('\x1b[32m%s\x1b[0m', tempTestName);
                                counter++;
                                successes++;
                                if (counter == limit) {
                                    _app.produceTestReport(limit, successes, errors);
                                }
                            });
                        } catch (e) {
                            // If it throws, then it failed, so capture the error thrown and log it in red
                            errors.push({
                                'name': testName,
                                'error': e
                            });
                            console.log('\x1b[31m%s\x1b[0m', tempTestName);
                            counter++;
                            if (counter == limit) {
                                _app.produceTestReport(limit, successes, errors);
                            }
                        }
                    })();
                }
            }
        }
    }
};

// Product a test outcome report
_app.produceTestReport = function (limit, successes, errors) {
    console.log("");
    console.log("--------BEGIN TEST REPORT--------");
    console.log("");
    console.log("Total Tests: ", limit);
    console.log("Pass: ", successes);
    console.log("Fail: ", errors.length);
    console.log("");

    // If there are errors, print them in detail
    if (errors.length > 0) {
        console.log("--------BEGIN ERROR DETAILS--------");
        console.log("");
        errors.forEach(function (testError) {
            console.log('\x1b[31m%s\x1b[0m', testError.name);
            console.log(testError.error);
            console.log("");
        });
        console.log("");
        console.log("--------END ERROR DETAILS--------");
    }


    console.log("");
    console.log("--------END TEST REPORT--------");

    process.exit(0);

};

_app.runTests();