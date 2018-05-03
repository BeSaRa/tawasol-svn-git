module.exports = function (app) {
    require('./manage-distribution-list-directive')(app);
    require('./manageDistributionListDirectiveCtrl')(app);
};