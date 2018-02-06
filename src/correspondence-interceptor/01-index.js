module.exports = function (app) {
    require('./OutgoingInterceptor')(app);
    require('./IncomingInterceptor')(app);
    require('./InternalInterceptor')(app);
    require('./GeneralInterceptor')(app);
};