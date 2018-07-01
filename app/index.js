const server = require('./lib/server'),
    workers = require('./lib/workers');

//Declare the app

var app = {};

//Init function
app.init = function () {
    //start the server
    server.init();

    //start the worker 
    workers.init();
};


app.init();

//Execute the app
module.exports = app;