const server = require('./lib/server'),
    workers = require('./lib/workers'),
    example = require('./lib/example');

//Declare the app

var app = {};

//Init function
app.init = function () {
    debugger;
    //start the server
    server.init();

    //start the worker 
    workers.init();

    //Call init function of example module
    debugger;
    example.init();
    debugger;
};


app.init();

//Execute the app
module.exports = app;