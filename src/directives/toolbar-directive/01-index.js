module.exports = function (app) {
    require('./toolbar-directive')(app);
    require('./toolbarDirectiveCtrl')(app);
}