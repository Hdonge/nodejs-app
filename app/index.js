const server = require('./lib/server'),
    workers = require('./lib/workers');

//Declare the app

var app = {};

//Init function
app.init = function (callback) {
    //start the server
    server.init();

    //start the worker 
    workers.init();

    callback();
};

//Self invoking only if required directly
if (require.main === module) {
    app.init(function () { });
}

//Execute the app
module.exports = app;