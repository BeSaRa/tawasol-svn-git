module.exports = function (app) {
    require('./barchart-directive/barchart-directive')(app);
    require('./piechart-directive/piechart-directive')(app);
};