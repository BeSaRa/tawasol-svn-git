module.exports = function (app) {
    require('./personal-widget')(app);
    require('./personalWidgetCtrl')(app);
};
