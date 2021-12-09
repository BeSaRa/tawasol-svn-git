module.exports = function (app) {
    require('./body-directive')(app);
    require('./bodyDirectiveCtrl')(app);
};