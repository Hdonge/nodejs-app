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

helpers.createRandomString = function (strLength) {
    strLength = typeof (strLength) == 'number' && strLength > 0 ? strLength : false;
    if (strLength) {
        //Defind all the possible chars that could go into a string
        var possibleCharacters = 'abcefghijklmnopqrstuvwxyzABCDEFGHIJKMNOPQRSTUVWXYZ0123456789';

        //Start the final string 
        var str = '';
        for (i = 1; i <= strLength; i++) {
            //Get the random character from possioble characters string
            var randomcharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
            //append to the final string
            str += randomcharacter;
        }

        //Return the final string 
        return str;
    } else {
        return false;
    }
};


module.exports = helpers;