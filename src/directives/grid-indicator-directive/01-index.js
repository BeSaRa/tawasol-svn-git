module.exports = function (app) {
    require('./grid-indicator-directive')(app);
    require('./gridIndicatorDirectiveCtrl')(app);
    // require('./gridIndicatorDirectiveService')(app);
};