/**
 * Request handlers
 */

//Dependecies
const _data = require('./data'),
    helpers = require('./helpers');

//define the handlers
var handlers = {};

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
//@TODO - Only let authenticated users access their data. Don't let other users access anyone else's data.
handlers._users.get = function (data, callback) {
    // Check that phone number in querystring is valid 
    var phone = typeof (data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length === 10 ? data.queryStringObject.phone : false;
    if (phone) {
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
        callback(400, { 'Error': 'Missing required field' });
    }
};

//Users- put 
//Required data -phone
//Optional data - firstname , lastname , password (atleast one must be specified)
//@TODO - Only let authenticated users update their data. Don't let other users update anyone else's data.
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
            callback(400, { 'Error': 'Missing fields to update' });
        }
    } else {
        callback(400, { 'Error': 'Missing required field' });
    }
};

//Users- delete
//Required field- phone
//@TODO - Only let authenticated users update their data. Don't let other users update anyone else's data.
//@TODO- Delete any other data files associated with this user
handlers._users.delete = function (data, callback) {
    // Check that phone number in querystring is valid 
    var phone = typeof (data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length === 10 ? data.queryStringObject.phone : false;
    if (phone) {
        //Looking up the user
        _data.read('users', phone, function (err, data) {
            if (!err && data) {
                _data.delete('users', phone, function (err) {
                    if (!err) {
                        callback(200);
                    } else {
                        callback(500, { 'Error': 'Could not delete the specified user' });
                    }
                });
            } else {
                callback(400, { 'Error': 'Could not find the specified user' });
            }
        });

    } else {
        callback(400, { 'Error': 'Missing required field' });
    }
};

handlers.users = function (data, callback) {
    var acceptableMethods = ['post', 'put', 'get', 'delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._users[data.method](data, callback);
    } else {
        callback(405);
    }
};

//Not found handler
handlers.notFound = function (data, callback) {
    callback(404);
};

module.exports = handlers;