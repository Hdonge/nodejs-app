/**
 * Create and export configuration variables
 */

//Container for all the environments
var environments = {};

//staging (default) environment
environments.staging = {
    'httpPort': 3000,
    'httpsPort': 3001,
    'envName': 'staging',
    'hashingSecret': 'thisIsASecret'
};

//Production environment
environments.production = {
    'httpPort': 5000,
    'httpsPort': 5001,
    'envName': 'production',
    'hashingSecret': 'thisIsAlsoASecret'
};

//Determine which environement passed as a command line argument
var currentEnviroment = typeof (process.env.NODE_ENV) === 'string' ? process.env.NODE_ENV.toLowerCase() : '';

//Check that current environment is one of the environments above. If not then default it to staging
var environementToExport = typeof (environments[currentEnviroment]) === 'object' ? environments[currentEnviroment] : environments.staging;

module.exports = environementToExport;
