/**
 * Helpers for various tasks
 */

//Dependencies
const crypto = require('crypto'),
    config = require('../config');



//Container for all the helpers
var helpers = {};

//Create a SHA256 hash
helpers.hash = function (str) {
    if (typeof (str) == 'string' && str.length > 0) {
        var hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
        return hash;
    } else {
        return false;
    }
};

// Parse a JSON string to an object in all cases, without throwing
helpers.parsedJsonToObject = function (str) {
    try {
        var obj = JSON.parse(str);
        return obj;
    } catch (e) {
        console.log('Error occurred while parsing', e);
        return {};
    }
};


module.exports = helpers;