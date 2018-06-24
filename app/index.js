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

        //send the response
    res.end('Hello world');

    //log the request path
    console.log('Request received with this payload: ', headers);
    console.log('Request received on path: ' + trimmedPath + ' with http method: ' + method + ' with these query string params', queryStringObject);
        
    });
});

//start the server and listen it on port 3000

server.listen(3000, function () {
    console.log('server is listening at port 3000');
});