/**
 * Frontend logic for the Application
 * 
 */

var app = {};

console.log("Hello world");

//Config 
app.config = {
    'sessionToken': false
};

//AJAX client for the Restful API
app.client = {};

//Interface for making API calls 
app.client.request = function (headers, path, method, queryStringObjet, payload, callback) {
    // Set defaults
    headers = typeof (headers) == 'object' && headers !== null ? headers : {};
    path = typeof (path) == 'string' ? path : '/';
    method = typeof (method) == 'string' && ['POST', 'GET', 'PUT', 'DELETE'].indexOf(method.toUpperCase()) > -1 ? method.toUpperCase() : 'GET';
    queryStringObject = typeof (queryStringObject) == 'object' && queryStringObject !== null ? queryStringObject : {};
    payload = typeof (payload) == 'object' && payload !== null ? payload : {};
    callback = typeof (callback) == 'function' ? callback : false;
    // check the current session token set, add that in header
    if (app.config.sessionToken) {
        xhr.setRequestHeader("token", app.config.sessionToken.id);
    }
    // handle the response with appropriate states
    xhr.onreadystatechange = function () {
        if (xhr.readyState == XMLHttpRequest.DONE) {
            var statusCode = xhr.status;
            var response = xhr.responseText;
            // Callback if requested
            if (callback) {
                try {
                    var parsedResponse = JSON.parse(response);
                    callback(statusCode, parsedResponse);
                } catch (e) {
                    callback(statusCode, false);
                }
            }
        }
    }
    // Send the payload as JSON
    var payloadString = JSON.stringify(payload);
    xhr.send(payloadString);
};
