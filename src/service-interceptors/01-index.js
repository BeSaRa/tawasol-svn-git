module.exports = function (app) {
    require('./employeeServiceInterceptor')(app);
    require('./correspondenceServiceInterceptor')(app);
    require('./viewDocumentServiceInterceptor')(app);
    require('./langServiceInterceptor')(app);
    require('./downloadServiceInterceptor')(app);
};
