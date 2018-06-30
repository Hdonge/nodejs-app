/**
 * Primary file for the API
 * 
 */

//Dependencies

const http = require('http'),
    https = require('https'),
    url = require('url'),
    StringDecoder = require('string_decoder').StringDecoder,
    config = require('./config'),
    fs = require('fs'),
    handlers = require('./lib/handlers'),
    helpers = require('./lib/helpers');

//Instantiate the HTTP server
var httpServer = http.createServer(function (req, res) {
    unifiedServer(req, res);
});

//start the HTTP server
httpServer.listen(config.httpPort, function () {
    console.log('HTTP server is listening at port ' + config.httpPort + " in " + config.envName + ' mode');
});

var httpsServerOptions = {
    'key': fs.readFileSync('./https/key.pem'),
    'cert': fs.readFileSync('./https/cert.pem')
};

//Instantiate the HTTPS server
var httpsServer = https.createServer(httpsServerOptions, function (req, res) {
    unifiedServer(req, res);
});

//start the HTTPS server
httpsServer.listen(config.httpsPort, function () {
    console.log('HTTPS server is listening at port ' + config.httpsPort + " in " + config.envName + ' mode');
});


//All the server logic for http and https

var unifiedServer = function (req, res) {

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
            'payload': helpers.parsedJsonToObject(buffer)
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
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);

            //log the request path
            console.log('Returning this response: ', statusCode, payloadString);

        });
    });
}

//Define a request router
var router = {
    'ping': handlers.ping,
    'users': handlers.users
};