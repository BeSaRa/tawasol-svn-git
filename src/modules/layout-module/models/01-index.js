module.exports = function (app) {
    require('./Layout')(app);
    require('./Widget')(app);
    require('./LayoutWidget')(app);
    require('./LayoutWidgetOption')(app);
};