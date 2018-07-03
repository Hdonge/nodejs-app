/**
 * Workers related tasks
 * 
 */

//Dependencies

const path = require('path'),
    fs = require('fs'),
    _data = require('./data'),
    http = require('http'),
    https = require('https'),
    helpers = require('./helpers'),
    _logs = require('./logs'),
    url = require('url');


//Instantiate the worker object
var workers = {};

//lookup all checks, get their data, send to validator 
workers.gatherAllChecks = function () {
    //Get all the checks
    _data.list('checks', function (err, checks) {
        if (!err && checks && checks.length > 0) {
            checks.forEach(function (check) {
                //Read in the check data
                _data.read('checks', check, function (err, originalCheckData) {
                    if (!err && originalCheckData) {
                        //Pass the data to check validator 
                        workers.validateCheckData(originalCheckData);
                    } else {
                        console.log('Error reading one of the checks data');
                    }
                });
            });
        } else {
            console.log('Error: Could not find any checks to process');
        }
    });
};

//Sanity-check the check data
workers.validateCheckData = function (originalCheckData) {

    workers.log(originalCheckData, '', '', '', '');

    originalCheckData = typeof (originalCheckData) == 'object' && originalCheckData !== null ? originalCheckData : {};
    originalCheckData.id = typeof (originalCheckData.id) == 'string' && originalCheckData.id.trim().length == 20 ? originalCheckData.id.trim() : false;
    originalCheckData.userPhone = typeof (originalCheckData.userPhone) == 'string' && originalCheckData.userPhone.trim().length == 10 ? originalCheckData.userPhone.trim() : false;
    originalCheckData.protocol = typeof (originalCheckData.protocol) == 'string' && ['https', 'http'].indexOf(originalCheckData.protocol) > -1 ? originalCheckData.protocol : false;
    originalCheckData.url = typeof (originalCheckData.url) == 'string' && originalCheckData.url.trim().length > 0 ? originalCheckData.url.trim() : false;
    originalCheckData.method = typeof (originalCheckData.method) == 'string' && ['get', 'post', 'put', 'delete'].indexOf(originalCheckData.method) > -1 ? originalCheckData.method : false;
    originalCheckData.successCodes = typeof (originalCheckData.successCodes) == 'object' && originalCheckData.successCodes instanceof Array && originalCheckData.successCodes.length > 0 ? originalCheckData.successCodes : false;
    originalCheckData.timeoutSeconds = typeof (originalCheckData.timeoutSeconds) == 'number' && originalCheckData.timeoutSeconds > 0 && originalCheckData.timeoutSeconds < 5 ? originalCheckData.timeoutSeconds : false;

    //Set the keys that may not be set (if the workers have never seen this before)
    originalCheckData.state = typeof (originalCheckData.state) == 'string' && ['up', 'down'].indexOf(originalCheckData.state) > -1 ? originalCheckData.state : 'down';
    originalCheckData.lastChecked = typeof (originalCheckData.lastChecked) == 'number' && originalCheckData.lastChecked > 0 ? originalCheckData.lastChecked : false;

    //If all the checks pass , pass the data along next step in the process
    if (originalCheckData.id &&
        originalCheckData.userPhone &&
        originalCheckData.userPhone &&
        originalCheckData.protocol &&
        originalCheckData.url &&
        originalCheckData.method &&
        originalCheckData.successCodes &&
        originalCheckData.timeoutSeconds) {
        workers.performCheck(originalCheckData);
    } else {
        console.log('Error one of the checks is not properly formatted. Skipping it');
    }
};

//Perform the check , send the original data and the outcome of the process in the next step in the process
workers.performCheck = function (originalCheckData) {
    //Prepare the initial check outcome
    var checkOutcome = {
        'error': false,
        'responseCode': false
    };

    //Mark that outcome has not been sent yet
    var outcomeSent = false;

    //parse the host name and path out of the original check data
    var parsedUrl = url.parse(originalCheckData.protocol + '://' + originalCheckData.url, true);
    var hostName = parsedUrl.hostname;
    var path = parsedUrl.path; //using path and not "pathname" bacuse we want the query string

    //Construct the request
    var requestDetails = {
        'protocol': originalCheckData.protocol + ':',
        'hostname': hostName,
        'method': originalCheckData.method.toUpperCase(),
        'path': path,
        'timeout': originalCheckData.timeoutSeconds * 1000
    };

    //Instantiate the request object using either the http or https module

    var _moduleToUse = originalCheckData.protocol == 'http' ? http : https;

    var req = _moduleToUse.request(requestDetails, function (res) {
        //Grab the status of the sent request
        var status = res.statusCode;

        //update the checkout come and pass data along
        checkOutcome.responseCode = status;
        if (!outcomeSent) {
            workers.processCheckOutcome(originalCheckData, checkOutcome);
            outcomeSent = true;
        }
    });

    //Bind to the error event so it doesn't get thrown
    req.on('error', function (e) {
        //Update the check out come and pass data along
        checkOutcome.error = {
            'error': true,
            'value': e
        };

        if (!outcomeSent) {
            workers.processCheckOutcome(originalCheckData, checkOutcome);
            outcomeSent = true;
        }
    });

    //Bind to the timeout event
    req.on('timeout', function (e) {
        //Update the check out come and pass data along
        checkOutcome.error = {
            'error': true,
            'value': 'timeout'
        };

        if (!outcomeSent) {
            workers.processCheckOutcome(originalCheckData, checkOutcome);
            outcomeSent = true;
        }
    });

    //End the req
    req.end();
};

//process the check outcome , update the check data needed, trigger and alert if needed
//Special logic here accomodating a check that has never been tested before (Don't alert on that one)
workers.processCheckOutcome = function (originalCheckData, checkOutcome) {
    //Decide if the check is considered up or down
    var state = !checkOutcome.error && checkOutcome.responseCode && originalCheckData.successCodes.indexOf(checkOutcome.responseCode) > -1 ? 'up' : 'down';

    //Decide if alert is warranted
    var alertWarranted = originalCheckData.lastChecked && originalCheckData.state !== state ? true : false;
    //Log the outcome
    var timeOfCheck = Date.now();
    workers.log(originalCheckData, checkOutcome, state, alertWarranted, timeOfCheck);

    //Update the check data
    var newCheckData = originalCheckData;
    newCheckData.state = state;
    newCheckData.lastChecked = timeOfCheck;

    //Save the updates
    _data.update('checks', newCheckData.id, newCheckData, function (err) {
        if (!err) {
            //Send the check data to next step in the process if neeeded
            if (alertWarranted) {
                workers.alertUserToStatusChange(newCheckData);

            } else {
                console.log('Check outcome has not changed, no alert needed');
            }
        } else {
            console.log('Error trying to save update to one of the checks');
        }
    });
};

//Alert user to change in their check status
workers.alertUserToStatusChange = function (newCheckData) {
    var msg = 'Alert: Your check for ' + newCheckData.method.toUpperCase() + ' ' + newCheckData.protocol + '://' + newCheckData.url + ' is currently ' + newCheckData.state;
    helpers.sendTwilioSms(newCheckData.userPhone, msg, function (err) {
        if (!err) {
            console.log('Success: User was alerted to status change in their check via sms: ', msg);
        } else {
            console.log('Error: Could not send sms alert to user who had a state change in their check: ', msg);
        }
    });
};

workers.log = function (originalCheckData, checkOutcome, state, alertWarranted, timeOfCheck) {
    //Form the log data
    var logData = {
        'check': originalCheckData,
        'outcome': checkOutcome,
        'state': state,
        'alert': alert,
        'time': timeOfCheck
    };

    //Convert data to a string 
    var logString = JSON.stringify(logData);

    //Determine the name of the log file

    var logFileName = originalCheckData.id;

    //Appned the log string to the file
    _logs.append(logFileName, logString, function (err) {
        if (!err) {
            console.log('File logging succeeded');
        } else {
            console.log('Error logging file', err);
        }
    });
};
//Timer to execute worker process once per minute
workers.loop = function () {
    setInterval(function () {
        workers.gatherAllChecks();
    }, 1000 * 5);
};

//Rotate (compress) the logs file
workers.rotateLogs = function () {
    //List all the (non compressed) log files
    _logs.list(false, function (err, logs) {
        if (!err && logs && logs.length > 0) {
            logs.forEach(function (logName) {
                //Compress the data to a different file
                var logId = logName.replace('.log', '');
                var newFileId = logId + '-' + Date.now();
                _logs.compress(logId, newFileId, function (err) {
                    if (!err) {
                        //Truncate the log
                        _logs.truncate(logId, function (err) {
                            if (!err) {
                                console.log("Success truncating logFile");
                            } else {
                                console.log("Error truncating log file");
                            }
                        });
                    } else {
                        console.log("Error compressing one of the log files", err);
                    }
                });
            });
        } else {
            console.log("Error : Could not find any logs to rotate");
        }
    });
};

//Timer to execute the log rotation process once per day
workers.logRotationLoop = function () {
    setInterval(function () {
        workers.rotateLogs();
    }, 1000 * 60 * 60 * 24);
};

//Init script
workers.init = function () {
    //Execute all the checks immediately 
    workers.gatherAllChecks();
    //call the loop so the checks will execute later on
    workers.loop();

    //Compress all the logs immediately
    workers.rotateLogs();

    //Call the compression loop so the logs would be compressed later on 
    workers.logRotationLoop();

};
//Export the module
module.exports = workers;
