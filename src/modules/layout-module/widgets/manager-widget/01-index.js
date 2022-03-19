module.exports = function (app) {
    require('./manager-widget')(app);
    require('./managerWidgetCtrl')(app);
};
