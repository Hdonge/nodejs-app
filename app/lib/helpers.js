/**
 * Helpers for various tasks
 */

//Dependencies
const crypto = require('crypto'),
    config = require('./config'),
    queryString = require('querystring'),
    https = require('https'),
    path = require('path'),
    fs = require('fs');



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

//Send and SMS via Twilio
helpers.sendTwilioSms = function (phone, msg, callback) {
    phone = typeof (phone) == 'string' && phone.trim().length == 10 ? phone.trim() : false;
    msg = typeof (msg) == 'string' && msg.trim().length > 0 && msg.trim().length <= 1600 ? msg.trim() : false;

    if (phone && msg) {
        //Configure the request payload 
        var payload = {
            'From': config.twilio.fromPhone,
            'To': '+91' + phone,
            'Body': msg
        };

        //Stringify the payload
        var stringPayload = queryString.stringify(payload);

        //Configure the request details 
        var requestDetails = {
            'protocol': 'https:',
            'hostname': 'api.twilio.com',
            'method': 'POST',
            'path': '/2010-04-01/Accounts/' + config.twilio.accountsid + '/Messages.json',
            'auth': config.twilio.accountsid + ':' + config.twilio.authToken,
            'headers': {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(stringPayload)
            }
        };

        var req = https.request(requestDetails, function (res) {
            //Grab the status of sent request
            var status = res.statusCode;
            //callback successfully if the request went through
            if (status == 200 || status == 201) {
                callback(false);
            } else {
                callback('Status code return was ' + status);
            }
        });

        //Bind to the error event so it doesn't get thrown

        req.on('error', function (e) {
            callback(e);
        });

        //Add the payload
        req.write(stringPayload);

        //End the request
        req.end();

    } else {
        callback('Given parameters are missing or invalid');
    }
};

//Get the string content of a template
helpers.getTemplate = function (templateName, callback) {
    templateName = typeof (templateName) == 'string' && templateName.length > 0 ? templateName : false;
    if (templateName) {
        var templatesDir = path.join(__dirname, '/../templates/');
        fs.readFile(templatesDir + templateName + '.html', 'utf8', function (err, str) {
            if (!err && str && str.length) {
                callback(false, str);
            } else {
                callback('Not template could be found');
            }
        });
    } else {
        callback('A valid template name was not specified');
    }
};


module.exports = helpers;