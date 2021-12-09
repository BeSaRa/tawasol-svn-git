module.exports = function (app) {
    require('./LayoutInterceptor')(app);
    require('./WidgetInterceptor')(app);
    require('./LayoutWidgetInterceptor')(app);
    require('./LayoutWidgetOptionInterceptor')(app);
};