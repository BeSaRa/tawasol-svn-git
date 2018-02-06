module.exports = function (app) {
    require('./table-status-directive')(app);
    require('./tableStatusDirectiveCtrl')(app);
};