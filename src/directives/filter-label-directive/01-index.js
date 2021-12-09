module.exports = function (app) {
    require('./filter-label-directive')(app);
    require('./filterLabelDirectiveCtrl')(app);
};