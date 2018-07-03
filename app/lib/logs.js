/**
 * Library for storing and rotating logs
 * 
 */

//Dependencies
const fs = require('fs'),
    path = require('path'),
    zlib = require('zlib');

//Container for the module 
var lib = {};

//Base diractory of the logs folder
lib.baseDir = path.join(__dirname, '/../.logs');

//Appned the string to the file and create the file if it does not exist
lib.append = function (file, str, callback) {
    //Open the file for appending 
    fs.open(lib.baseDir + file + '.log', 'a', function (err, fileDescriptor) {
        if (!err && fileDescriptor) {
            //Append the file and close it
            fs.appendFile(fileDescriptor, str + '\n', function (err) {
                if (!err) {
                    fs.close(fileDescriptor, function (err) {
                        if (!err) {
                            callback(false);
                        } else {
                            callback('Error closing file that was being appended');
                        }
                    });
                } else {
                    callback('Error appending the file', err);
                }
            });
        } else {
            callback('Could not open the file for appending');
        }
    });
};

//List all the logs and optionally include the compress logs
lib.list = function (includeCompressLogs, callback) {
    fs.readdir(lib.baseDir, function (err, files) {
        if (!err && files && files.length > 0) {
            var trimmedFileNames = [];
            files.forEach(fileName => {
                //Add the .log files
                if (fileName.indexOf('.log') > -1) {
                    trimmedFileNames.push(fileName.replace('.log', ''));
                }

                //Add on the .gz files 
                if (fileName.indexOf('.gz.b64') > -1 && includeCompressLogs) {
                    trimmedFileNames.push(fileName.replace('.gz.b64', ''));
                }

                callback(false, trimmedFileNames);
            });
        } else {
            callback(err, files);
        }
    });
};

//Compress the content of .one log file into a .gz.b64 file within the same directory
lib.compress = function (logId, newFileId, callback) {
    var sourceFile = logId + '.log';
    var destFile = newFileId + '.gz.b64';

    //Read the source file
    fs.readFile(lib.baseDir + sourceFile, 'utf8', function (err, inputString) {
        if (!err && inputString) {
            //Compress the data using gzip
            zlib.gzip(inputString, function (err, buffer) {
                if (!err && buffer) {
                    //Send the data to the destinition file
                    fs.open(lib.baseDir + destFile, 'wx', function (err, fileDescriptor) {
                        if (!err && fileDescriptor) {
                            //Write to destination file 
                            fs.writeFile(fileDescriptor, buffer.toString('base64'), function (err) {
                                if (!err) {
                                    //Close the destination file 
                                    if (!err) {
                                        callback(false);
                                    } else {
                                        callback(err);
                                    }
                                } else {
                                    callback(err);
                                }
                            });
                        } else {
                            callback(err);
                        }
                    });
                }
            });
        } else {
            callback(err);
        }
    });
};

//Decompress the contents of a .gz.b64 file into string variable 
lib.decompress = function (fileId, callback) {
    var fileName = fileId + '.gz.b64';
    fs.readFile(lib.baseDir + fileName, 'utf8', function (err, str) {
        if (!err && str) {
            //Decompress the data
            var inputBuffer = Buffer.from(str, 'base64');
            zlib.unzip(inputBuffer);
            if (!err && outputBuffer) {
                //Callback
                var str = outputBuffer.toString();
                callback(false, str);
            } else {
                callback(err);
            }
        } else {
            callback(err);
        }
    });
};

//Truncate the log file
lib.truncate = function (logId, callback) {
    fs.truncate(lib.baseDir + logId + '.log', 0, function (err) {
        if (!err) {
            callback(false);
        } else {
            callback(err);
        }
    });
};

module.exports = lib;
