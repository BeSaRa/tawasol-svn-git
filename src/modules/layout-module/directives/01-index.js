module.exports = function (app) {
    require('./barchart-directive/barchart-directive')(app);
    require('./piechart-directive/piechart-directive')(app);
    require('./personal-directive/personal-directive')(app);
    require('./manager-directive/manager-directive')(app);
};
