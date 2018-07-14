/**
 * Server related tasks
 * 
 */

//Dependencies

const http = require('http'),
    https = require('https'),
    url = require('url'),
    StringDecoder = require('string_decoder').StringDecoder,
    config = require('./config'),
    fs = require('fs'),
    handlers = require('./handlers'),
    helpers = require('./helpers'),
    path = require('path'),
    util = require('util'),
    debug = util.debuglog('server');

//Instantiate the server module object
var server = {};


//Instantiate the HTTP server
server.httpServer = http.createServer(function (req, res) {
    server.unifiedServer(req, res);
});



server.httpsServerOptions = {
    'key': fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
    'cert': fs.readFileSync(path.join(__dirname, '/../https/cert.pem'))
};

//Instantiate the HTTPS server
server.httpsServer = https.createServer(server.httpsServerOptions, function (req, res) {
    server.unifiedServer(req, res);
});

//All the server logic for http and https

server.unifiedServer = function (req, res) {

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
        var chosenHandler = typeof (server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;

        //If the request is in the public directory then use public handler instead
        chosenHandler = trimmedPath.indexOf('public/') > -1 ? handlers.public : chosenHandler;

        //Construct the data object to send to the handler
        var data = {
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method': method,
            'headers': headers,
            'payload': helpers.parsedJsonToObject(buffer)
        };

        //Route the request specified in the router
        chosenHandler(data, function (statusCode, payload, contentType) {
            // Determine the type of response (fallback to JSON)
            contentType = typeof (contentType) == 'string' ? contentType : 'json';

            //Use the status code called back by the handler, or default to 200
            statusCode = typeof (statusCode) === 'number' ? statusCode : 200;

            // Return the response parts that are content-type specific
            var payloadString = '';
            if (contentType == 'json') {
                res.setHeader('Content-Type', 'application/json');
                payload = typeof (payload) == 'object' ? payload : {};
                payloadString = JSON.stringify(payload);
            }

            if (contentType == 'html') {
                res.setHeader('Content-Type', 'text/html');
                payloadString = typeof (payload) == 'string' ? payload : '';
            }

            if (contentType == 'favicon') {
                res.setHeader('Content-Type', 'image/x-icon');
                payloadString = typeof (payload) !== 'undefined' ? payload : '';
            }

            if (contentType == 'plain') {
                res.setHeader('Content-Type', 'text/plain');
                payloadString = typeof (payload) !== 'undefined' ? payload : '';
            }

            if (contentType == 'css') {
                res.setHeader('Content-Type', 'text/css');
                payloadString = typeof (payload) !== 'undefined' ? payload : '';
            }

            if (contentType == 'png') {
                res.setHeader('Content-Type', 'image/png');
                payloadString = typeof (payload) !== 'undefined' ? payload : '';
            }

            if (contentType == 'jpg') {
                res.setHeader('Content-Type', 'image/jpeg');
                payloadString = typeof (payload) !== 'undefined' ? payload : '';
            }

            res.writeHead(statusCode);
            res.end(payloadString);

            // If the response is 200, print green, otherwise print red
            if (statusCode == 200) {
                debug('\x1b[32m%s\x1b[0m', method.toUpperCase() + ' /' + trimmedPath + ' ' + statusCode);
            } else {
                debug('\x1b[31m%s\x1b[0m', method.toUpperCase() + ' /' + trimmedPath + ' ' + statusCode);
            }

            //log the request path
            debug('Returning this response: ', statusCode, payloadString);

        });
    });
}

//Define a request router
server.router = {
    '': handlers.index,
    'account/create': handlers.accountCreate,
    'account/edit': handlers.accountEdit,
    'account/delete': handlers.accountDelete,
    'session/create': handlers.sessionCreate,
    'session/delete': handlers.sessionDelete,
    'checks/all': handlers.checksList,
    'checks/create': handlers.checksCreate,
    'checks/edit': handlers.checksEdit,
    'ping': handlers.ping,
    'api/users': handlers.users,
    'api/tokens': handlers.tokens,
    'api/checks': handlers.checks,
    'public': handlers.public,
    'favicon.ico': handlers.favicon
};


//Init script
server.init = function () {

    //start the HTTP server
    server.httpServer.listen(config.httpPort, function () {
        console.log('\x1b[36m%s\x1b[0m', 'HTTP server is listening at port ' + config.httpPort + " in " + config.envName + ' mode');
    });

    //start the HTTPS server
    server.httpsServer.listen(config.httpsPort, function () {
        console.log('\x1b[35m%s\x1b[0m', 'HTTPS server is listening at port ' + config.httpsPort + " in " + config.envName + ' mode');
    });
}

module.exports = server; 