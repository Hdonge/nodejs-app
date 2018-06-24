/**
 * Primary file for the API
 * 
 */

//Dependencies

const http = require('http'),
    url = require('url'),
    StringDecoder = require('string_decoder').StringDecoder;

//Server should response all the requests with a string

var server = http.createServer(function (req, res) {

    //Get the URL and parse it. 

    var parsedUrl = url.parse(req.url, true);

    //Get the path

    var path = parsedUrl.pathname;

    var trimmedPath = path.replace(/^\/+|\/+$/g, '');

    //Get the query string as an object
    var queryStringObject = parsedUrl.query;

    //Get the HTTP method
    var method = req.method.toLowerCase();

    //Get the headers as an object
    var headers = req.headers;

    //Get the payload, if any 
    var decoder = new StringDecoder('utf-8');
    var buffer = '';

    req.on('data', function (data) {
        buffer += decoder.write(data);
    });

    req.on('end', function () {
        buffer += decoder.end();

        //Choose the handler this request should go to. If one is not found the should go notfound handler.
        var chosenHandler = typeof (router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

        //Construct the data object to send to the handler
        var data = {
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method': method,
            'headers': headers,
            'payloads': buffer
        };

        //Route the request specified in the router
        chosenHandler(data, function (statusCode, payload) {
            //Use the status code called back by the handler, or default to 200
            statusCode = typeof (statusCode) === 'number' ? statusCode : 200;

            //Use the payload called back by the handler , or default to an empty object
            payload = typeof (payload) === 'object' ? payload : {};

            //Convert payload to string
            var payloadString = JSON.stringify(payload);

            //Return the response
            res.writeHead(statusCode);
            res.end(payloadString);

            //log the request path
            console.log('Returning this response: ', statusCode, payloadString);

        });
    });
});

//start the server and listen it on port 3000

server.listen(3000, function () {
    console.log('server is listening at port 3000');
});

//define the handlers
var handlers = {};

//Sample handler
handlers.sample = function (data, callback) {
    //callback a http status code and payload object
    callback(406, { 'name': 'sample handler' });
}

//Not found handler
handlers.notFound = function (data, callback) {
    callback(404);
}


//Define a request router
var router = {
    'sample': handlers.sample
};