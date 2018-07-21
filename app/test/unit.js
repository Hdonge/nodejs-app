/**
 * Unit Tests
 */

const helpers = require('./../lib/helpers');
const assert = require('assert');

//Holder for unit tests
var unit = {};

unit['helpers.parsedJsonToObject should return parsed object when provided stringified object'] = function (done) {
    let result = helpers.parsedJsonToObject('{"abc":"wxy"}');
    assert.deepEqual(result, { abc: 'wxy' });
    done();
};

unit['helpers.parsedJsonToObject should return empty object when provided corrupted stringified object or bad JSON'] = function (done) {
    let result = helpers.parsedJsonToObject('{"abc":"wxy');
    assert.deepEqual(result, {});
    done();
};

unit['helpers.parsedJsonToObject should return empty object when provided undefined'] = function (done) {
    let result = helpers.parsedJsonToObject(undefined);
    assert.deepEqual(result, {});
    done();
};

//export the tests to the runner 
module.exports = unit;