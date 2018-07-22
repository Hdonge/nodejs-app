/**
 * API tests- Integration tests
 */

//Dependencies
const app = require('./../index');
const assert = require('assert');
const http = require('http');
const config = require('./../lib/config');

//Holder for the tests
var api = {};

//Helpers
var helpers = {};

helpers.makeGetRequest = function (path, callback) {
    //Configuare the request details
    var requestDetails = {
        'protocol': 'http:',
        'hostname': 'localhost',
        'port': config.httpPort,
        'method': 'GET',
        'path': path,
        'headers': {
            'Content-Type': 'application/json'
        }
    };

    //Send the request
    var req = http.request(requestDetails, function (res) {
        callback(res);
    });
    req.end();
};

//The main init() function should be able to run without throwing
api['app.init should start without throwing'] = function (done) {
    assert.doesNotThrow(function () {
        app.init(function (error) {
            done();
        });
    }, TypeError);
};

//Make request to /ping
api['/ping should responde to GET with 200'] = function (done) {
    //Make a get request to API users
    helpers.makeGetRequest('/ping', function (res) {
        assert.equal(res.statusCode, 200);
        done();
    });
};

//Make request to /api/users
api['/api/users should responde to GET with 400'] = function (done) {
    //Make a get request to API users
    helpers.makeGetRequest('/api/users', function (res) {
        assert.equal(res.statusCode, 400);
        done();
    });
};

//Make request to /randomPath
api['/randomPath should responde to GET with 404'] = function (done) {
    //Make a get request to API users
    helpers.makeGetRequest('/randomPath', function (res) {
        assert.equal(res.statusCode, 404);
        done();
    });
};

module.exports = api;