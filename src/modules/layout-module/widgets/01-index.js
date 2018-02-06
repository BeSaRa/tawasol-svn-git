module.exports = function (app) {
    require('./counter-widget/01-index')(app);
    require('./bar-chart-widget/01-index')(app);
    require('./pie-chart-widget/01-index')(app);
};