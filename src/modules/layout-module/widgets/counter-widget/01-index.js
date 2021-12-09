module.exports = function (app) {
    require('./counter-widget')(app);
    require('./counterWidgetCtrl')(app);
};