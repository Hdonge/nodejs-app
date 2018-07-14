/**
 * Request handlers
 */

//Dependecies
const _data = require('./data'),
    helpers = require('./helpers'),
    config = require('./config');

//define the handlers
var handlers = {};

/**
 * HTML handlers
 */

handlers.index = function (data, callback) {

    //Reject any request that is not GET
    if (data.method == 'get') {

        //Prepare data interpolation 
        var templateData = {
            'head.title': 'This is the title',
            'head.description': 'This is the meta description',
            'body.title': 'Hello templated world!',
            'body.class': 'index'
        };

        //Read in a template as a string
        helpers.getTemplate('index', templateData, function (err, str) {
            if (!err && str) {
                //Add the universal header and footer
                helpers.addUniversalTemplates(str, templateData, function (err, str) {
                    if (!err && str) {
                        //Return the page as HTML
                        callback(200, str, 'html');
                    } else {
                        callback(500, undefined, 'html');
                    }
                });
            } else {
                callback(500, undefined, 'html');
            }
        });
    } else {
        callback(405, undefined, 'html');
    }
};

/**
 * favicon handler
 */

handlers.favicon = function (data, callback) {
    //reject any request that is not GET
    if (data.method === 'get') {
        //Read in the favicon's data
        helpers.getStaticAsset('favicon.ico', function (err, data) {
            if (!err && data) {
                //callback the result
                callback(200, data, 'favicon');
            } else {
                callback(500);
            }

        });
    } else {
        callback(405);
    }
};

//public assets 
handlers.public = function (data, callback) {
    //reject any request that is not GET
    if (data.method === 'get') {
        //Read in the favicon's data
        var trimmedAssetName = data.trimmedPath.replace('public/', '').trim();
        if (trimmedAssetName.length > 0) {
            //read the asset data
            helpers.getStaticAsset(trimmedAssetName, function (err, data) {
                if (!err && data) {
                    //Determine the contentType (Default it to plain text)
                    var contentType = 'plain';
                    if (trimmedAssetName.indexOf('.css') > -1) {
                        contentType = 'css';
                    }

                    if (trimmedAssetName.indexOf('.png') > -1) {
                        contentType = 'png';
                    }

                    if (trimmedAssetName.indexOf('.jpg') > -1) {
                        contentType = 'jpg';
                    }

                    if (trimmedAssetName.indexOf('.ico') > -1) {
                        contentType = 'favicon';
                    }

                    //callback the result
                    callback(200, data, contentType);
                } else {
                    callback(404);
                }
            });
        } else {
            callback(404);
        }
    } else {
        callback(405);
    }
};

/***
 * JSON API handlers
 */

//Ping handler
handlers.ping = function (data, callback) {
    callback(200);
};


//Containers for user sub methods
handlers._users = {};

//Users - post
// Required data: firstName, lastName, phone , password, tosAgreement
//Optional data: none
handlers._users.post = function (data, callback) {
    //check that all the requied fields are filtered out
    var firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    var tosAgreement = typeof (data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

    if (firstName && lastName && phone && password && tosAgreement) {
        //Make sure that use doesnt already exist
        _data.read('users', phone, function (err, data) {
            if (err) {
                //Hash the password
                var hashedPassword = helpers.hash(password);

                if (hashedPassword) {

                    //Create User Object
                    var userObject = {
                        'firstName': firstName,
                        'lastName': lastName,
                        'phone': phone,
                        'hashedPassword': hashedPassword,
                        'tosAgreement': true
                    };

                    _data.create('users', phone, userObject, function (err) {
                        if (!err) {
                            callback(200);
                        } else {
                            console.log(err);
                            callback(500, { 'Error': 'Could not create the new user' });
                        }
                    });
                } else {
                    console.log('Could not hash user\'s passowrd');
                    callback(500, { 'Error': 'set the different password' });
                }
            } else {
                //User already exists'
                callback(400, { 'Error': 'A user with that phone number already exists' });
            }
        });


    } else {
        callback(400, { 'Error': 'Missing required fields' });
    }
};

//Users -get 
//Required data - phone 
//Optional data - none
handlers._users.get = function (data, callback) {
    // Check that phone number in querystring is valid 
    var phone = typeof (data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length === 10 ? data.queryStringObject.phone : false;
    if (phone) {
        //Get the token from headers 
        var token = typeof (data.headers.token) == 'string' && data.headers.token === 20 ? data.headers.token : false;
        //Verify that given token is valida for the phone number
        handlers._tokens.verifyToken(token, phone, function (isValidToken) {
            if (isValidToken) {
                //Looking up the user
                _data.read('users', phone, function (err, data) {
                    if (!err && data) {
                        //Remove the hashed password
                        delete data.hashedPassword;

                        callback(200, data);
                    } else {
                        callback(404);
                    }
                });
            } else {
                callback(403, { 'Error': 'Missing required token in header or token is invalid' });
            }
        });

    } else {
        callback(400, { 'Error': 'Missing required field' });
    }
};

//Users- put 
//Required data -phone
//Optional data - firstname , lastname , password (atleast one must be specified)
handlers._users.put = function (data, callback) {
    // check for required field
    var phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : false;

    // check for optional fields
    var firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    if (phone) {
        //check if anything is sent to update
        if (firstName || lastName || password) {

            //Get the token from headers 
            var token = typeof (data.headers.token) == 'string' && data.headers.token === 20 ? data.headers.token : false;
            //Verify that given token is valida for the phone number
            handlers._tokens.verifyToken(token, phone, function (isValidToken) {
                if (isValidToken) {
                    //Lookup the user
                    _data.read('users', phone, function (err, data) {
                        if (!err && data) {
                            //update the user data
                            if (firstName) {
                                data.firstName = firstName;
                            }

                            if (lastName) {
                                data.lastName = lastName;
                            }

                            if (password) {
                                data.hashedPassword = helpers.hash(password);
                            }
                            //Store the new updates
                            _data.update('users', phone, data, function (err) {
                                if (!err) {
                                    callback(200);
                                } else {
                                    console.log(err);
                                    callback(500, { 'Error': 'Could not update the user' });
                                }
                            });

                        } else {
                            callback(400, { 'Error': 'The specified user does not exist' }); // We can also use 404. But some ppl does not prefer 404 in put. It totally depends on choice
                        }
                    });
                } else {
                    callback(403, { 'Error': 'Missing required token in header or token is invalid' });
                }
            });
        } else {
            callback(400, { 'Error': 'Missing fields to update' });
        }
    } else {
        callback(400, { 'Error': 'Missing required field' });
    }
};

//Users- delete
//Required field- phone
handlers._users.delete = function (data, callback) {
    // Check that phone number in querystring is valid 
    var phone = typeof (data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length === 10 ? data.queryStringObject.phone : false;
    if (phone) {
        //Get the token from headers 
        var token = typeof (data.headers.token) == 'string' && data.headers.token.trim().length === 20 ? data.headers.token : false;
        //Verify that given token is valida for the phone number
        console.log(token);
        handlers._tokens.verifyToken(token, phone, function (isValidToken) {
            if (isValidToken) {
                //Looking up the user
                _data.read('users', phone, function (err, userData) {
                    if (!err && userData) {
                        _data.delete('users', phone, function (err) {
                            if (!err) {
                                //Delete each of the checks associated with user
                                var userChecks = typeof (userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
                                var checksToDelete = userChecks.length;
                                if (checksToDelete > 0) {
                                    var checksDeleted = 0;
                                    var deletionErrors = false;

                                    //Loop through the checks

                                    userChecks.forEach(function (checkId) {
                                        //Delete the check
                                        _data.delete('checks', checkId, function (err) {
                                            if (err) {
                                                deletionErrors = true;
                                            }
                                            checksDeleted++;
                                            if (checksDeleted == checksToDelete) {
                                                if (!deletionErrors) {
                                                    callback(200);
                                                } else {
                                                    callback(500, { 'Error': 'Error encountered while deleting user\'s all checks. All checks may not have deleted from the system' });
                                                }
                                            }
                                        });
                                    });
                                } else {
                                    callback(200);
                                }

                            } else {
                                callback(500, { 'Error': 'Could not delete the specified user' });
                            }
                        });
                    } else {
                        callback(400, { 'Error': 'Could not find the specified user' });
                    }
                });
            } else {
                callback(403, { 'Error': 'Missing required token in header or token is invalid' });
            }
        });
    } else {
        callback(400, { 'Error': 'Missing required field' });
    }
};

//Users
handlers.users = function (data, callback) {
    var acceptableMethods = ['post', 'put', 'get', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._users[data.method](data, callback);
    } else {
        callback(405);
    }
};

//Tokens
handlers.tokens = function (data, callback) {
    var acceptableMethods = ['post', 'put', 'get', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._tokens[data.method](data, callback);
    } else {
        callback(405);
    }
};

//Container for all the tokens methods
handlers._tokens = {};

//Tokens - post
//Required data - phone , password
//Optional data - none
handlers._tokens.post = function (data, callback) {
    var phone = typeof (data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    var password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    if (phone && password) {
        //Lookup the user who matches that phone number
        _data.read('users', phone, function (err, data) {
            if (!err && data) {
                //Hash the sent password and compare it with the password stored in user's details 
                var hashedPassword = helpers.hash(password);
                if (hashedPassword === data.hashedPassword) {
                    //If valid, create a new token with a random name. Set expiration date in 1 hr 
                    var tokenId = helpers.createRandomString(20);
                    var expires = Date.now() + 1000 * 60 * 60;
                    var tokenObject = {
                        'phone': phone,
                        'id': tokenId,
                        'expires': expires
                    };

                    //Store the token 
                    _data.create('tokens', tokenId, tokenObject, function (err) {
                        if (!err) {
                            callback(200, tokenObject);
                        } else {
                            callback(500, { 'Error': 'Could not create the new token' });
                        }
                    });
                } else {
                    callback(400, { 'Error': 'Password did not match the specified user\'s password' });
                }

            } else {
                callback(400, { 'Error': 'Could not find specified user' });
            }
        });
    } else {
        callback(400, { 'Error': 'Missing required fields' });
    }
};

//Tokens - get
//Required data- id
//Optional data- none
handlers._tokens.get = function (data, callback) {
    //check that id in queryStringObject is valid
    var id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length === 20 ? data.queryStringObject.id : false;
    if (id) {
        //Looking up the user
        _data.read('tokens', id, function (err, token) {
            if (!err && token) {
                callback(200, token);
            } else {
                callback(404);
            }
        });
    } else {
        callback(400, { 'Error': 'Missing required field' });
    }

};

//Tokens - put
//Required data - id , extend
//Optional data - none
handlers._tokens.put = function (data, callback) {
    var id = typeof (data.payload.id) == 'string' && data.payload.id.trim().length === 20 ? data.payload.id : false;
    var extend = typeof (data.payload.extend) == 'boolean' && data.payload.extend === true ? true : false;
    if (id && extend) {
        //Lookup the token
        _data.read('tokens', id, function (err, token) {
            if (!err && token) {
                //Check to make sure that token is not already expired 
                if (token.expires > Date.now()) {
                    //Set the expiration an hour from now
                    token.expires = Date.now() + 1000 * 60 * 60;

                    //Store the new updated token 
                    _data.update('tokens', id, token, function (err) {
                        if (!err) {
                            callback(200);
                        } else {
                            callback(500, { 'Error': 'Could not update the token' });
                        }
                    });

                } else {
                    callback(400, { 'Error': 'the token has already expired and can not be extended' });
                }
            } else {
                callback(400, { 'Error': 'Specified token does not exist' });
            }
        });
    } else {
        callback(400, { 'Error': 'Missing required fields' });
    }
};

//Tokens - delete
//Required data - id
//Optional data - none
handlers._tokens.delete = function (data, callback) {
    // Check that id in querystring is valid 
    var id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length === 20 ? data.queryStringObject.id : false;
    if (id) {
        //Looking up the user
        _data.read('tokens', id, function (err, data) {
            if (!err && data) {
                _data.delete('tokens', id, function (err) {
                    if (!err) {
                        callback(200);
                    } else {
                        callback(500, { 'Error': 'Could not delete the specified token' });
                    }
                });
            } else {
                callback(400, { 'Error': 'Could not find the specified token' });
            }
        });

    } else {
        callback(400, { 'Error': 'Missing required field' });
    }
};

//Verify if given token id is currently valid for a given user
handlers._tokens.verifyToken = function (id, phone, callback) {
    //Lookup the token
    _data.read('tokens', id, function (err, tokenData) {
        //check that the token is for the given user and has not expired
        if (!err && tokenData) {
            if (tokenData.phone = phone && tokenData.expires > Date.now()) {
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    });
};

//Checks
handlers.checks = function (data, callback) {
    var acceptableMethods = ['post', 'put', 'get', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._checks[data.method](data, callback);
    } else {
        callback(405);
    }
};

//Container for all checks methods 
handlers._checks = {};

//Checks - post
//Required data - protocol , url , method, successCodes, timeoutSeconds
handlers._checks.post = function (data, callback) {
    var protocol = typeof (data.payload.protocol) == 'string' && ['https', 'http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    var url = typeof (data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    var method = typeof (data.payload.method) == 'string' && ['get', 'post', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    var successCodes = typeof (data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
    var timeoutSeconds = typeof (data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds > 0 && data.payload.timeoutSeconds < 5 ? data.payload.timeoutSeconds : false;
    if (protocol && url && method && successCodes && timeoutSeconds) {
        //Get the token from headers 
        var token = typeof (data.headers.token) == 'string' && data.headers.token.trim().length === 20 ? data.headers.token : false;
        //Lookup the user by reading token
        _data.read('tokens', token, function (err, tokenData) {
            if (!err && tokenData) {
                var userPhone = tokenData.phone;
                //Lookup the user data
                _data.read('users', userPhone, function (err, userData) {
                    if (!err && userData) {
                        var userChecks = typeof (userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
                        //Verify that the user has less than the number of max checks per user
                        if (userChecks.length < config.maxChecks) {
                            //Create the random id for check
                            var checkId = helpers.createRandomString(20);

                            //create the check object and include the user's phone
                            var checkObject = {
                                'id': checkId,
                                'userPhone': userPhone,
                                'protocol': protocol,
                                'url': url,
                                'method': method,
                                'successCodes': successCodes,
                                'timeoutSeconds': timeoutSeconds
                            };

                            //Save the object
                            _data.create('checks', checkId, checkObject, function (err) {
                                if (!err) {
                                    //Add the check id to the user object
                                    userData.checks = userChecks;
                                    userData.checks.push(checkId);

                                    //Save the new user data
                                    _data.update('users', userPhone, userData, function (err) {
                                        if (!err) {
                                            //Return the data about the new check
                                            callback(200, checkObject);
                                        } else {
                                            callback(500, { 'Error': 'Could not update the user with new check' });
                                        }
                                    });
                                } else {
                                    callback(500, { 'Error': 'Could not create the new check' });
                                }
                            });
                        } else {
                            callback(400, { 'Error': 'The user already has maximum number of checks (' + config.maxChecks + ')' });
                        }
                    } else {
                        callback(403);
                    }
                });
            } else {
                callback(403);
            }
        });
    } else {
        callback(400, { 'Error': 'Missing required inputs or inputs are invalid' });
    }
}

//Checks -get 
//Required fields - get
//Optional data - none
handlers._checks.get = function (data, callback) {
    // Check that check id r in querystring is valid 
    var id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length === 20 ? data.queryStringObject.id : false;
    if (id) {

        //Lookup the check
        _data.read('checks', id, function (err, checkData) {
            if (!err, checkData) {
                //Get the token from headers 
                var token = typeof (data.headers.token) == 'string' && data.headers.token === 20 ? data.headers.token : false;
                //Verify that given token is valida for the phone number
                handlers._tokens.verifyToken(token, checkData.userPhone, function (isValidToken) {
                    if (isValidToken) {
                        //If token is valid then return the check data
                        callback(200, checkData);
                    } else {
                        callback(403);
                    }
                });
            } else {
                callback(404);
            }
        });
    } else {
        callback(400, { 'Error': 'Missing required field' });
    }
};


//Checks -put 
//Required fields - id
//Optional data- protocol , url , method, successCodes, timeoutSeconds (one must be specified)
handlers._checks.put = function () {

    //Check for the required field that id is valid
    var id = typeof (data.payload.id) == 'object' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;

    //Check for the optional fields
    var protocol = typeof (data.payload.protocol) == 'string' && ['https', 'http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    var url = typeof (data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    var method = typeof (data.payload.method) == 'string' && ['get', 'post', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    var successCodes = typeof (data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
    var timeoutSeconds = typeof (data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds > 0 && data.payload.timeoutSeconds < 5 ? data.payload.timeoutSeconds : false;
    if (id) {
        //Check to make sure that one or more optional field has been sent
        if (protocol || url || method || successCodes || timeoutSeconds) {
            //Lookup the check
            _data.read('checks', id, function (err, checkData) {
                if (!err && checkData) {
                    //Get the token from headers 
                    var token = typeof (data.headers.token) == 'string' && data.headers.token === 20 ? data.headers.token : false;
                    //Verify that given token is valida for the phone number
                    handlers._tokens.verifyToken(token, checkData.userPhone, function (isValidToken) {
                        if (isValidToken) {
                            //If token is valid then update the check wherever necessary

                            if (protocol) {
                                checkData.protocol = protocol;
                            }

                            if (url) {
                                checkData.url = url;
                            }

                            if (method) {
                                checkData.method = method;
                            }

                            if (successCodes) {
                                checkData.successCodes = successCodes;
                            }

                            if (timeoutSeconds) {
                                checkData.timeoutSeconds = timeoutSeconds;
                            }

                            _data.update('checks', id, checkData, function (err) {
                                if (!err) {
                                    callback(200);
                                } else {
                                    callback(500, { 'Error': 'Could not update the check' });
                                }
                            });

                        } else {
                            callback(403);
                        }
                    });
                } else {
                    callback(400, { 'Error': 'Could not find specified check' });
                }
            });
        } else {
            callback(400, { 'Error': 'Missing fields to update' });
        }
    } else {
        callback(400, { 'Error': 'Missing required field or id is invalid' });
    }
};

//Checks -Delete
//Required data - id
//Optional data - none
handlers._checks.delete = function (data, callback) {
    // Check that id in querystring is valid 
    var id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length === 20 ? data.queryStringObject.id : false;
    if (id) {

        //Lookup the check
        _data.read('checks', id, function (err, checkData) {
            if (!err && checkData) {
                //Get the token from headers 
                var token = typeof (data.headers.token) == 'string' && data.headers.token === 20 ? data.headers.token : false;
                //Verify that given token is valida for the phone number
                handlers._tokens.verifyToken(token, checkData.userPhone, function (isValidToken) {
                    if (isValidToken) {

                        //Delete the check data
                        _data.delete('checks', id, function (err) {
                            if (!err) {
                                //Looking up the user
                                _data.read('users', checkData.userPhone, function (err, userData) {
                                    if (!err && userData) {

                                        var userChecks = typeof (userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];

                                        //Remove the deleted check from their list of checks 
                                        var checkPosition = userChecks.indexOf(id);
                                        if (checkPosition > -1) {
                                            userChecks.splice(checkPosition, 1);

                                            //Re-save the user's data
                                            _data.update('users', checkData.userPhone, userData, function (err) {
                                                if (!err) {
                                                    callback(200);
                                                } else {
                                                    callback(500, { 'Error': 'Could not update the user' });
                                                }
                                            });
                                        } else {
                                            callback(500, { 'Error': 'Could not find the check in user object , so could not remove it' });
                                        }
                                    } else {
                                        callback(500, { 'Error': 'Could not find the user who created the check hence could not remove the check from checklist from user data' });
                                    }
                                });
                            } else {
                                callback(500, { 'Error': 'Could not delete the check data' });
                            }
                        });
                    } else {
                        callback(403, { 'Error': 'Missing required token in header or token is invalid' });
                    }
                });
            } else {
                callback(400, { 'Error': 'Could not find specified check' });
            }
        });
    } else {
        callback(400, { 'Error': 'Missing required field' });
    }
};

//Not found handler
handlers.notFound = function (data, callback) {
    callback(404);
};

module.exports = handlers;