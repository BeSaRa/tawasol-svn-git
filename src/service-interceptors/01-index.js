module.exports = function (app) {
    require('./employeeServiceInterceptor')(app);
    require('./correspondenceServiceInterceptor')(app);
};
