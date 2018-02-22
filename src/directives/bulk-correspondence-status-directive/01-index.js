module.exports = function (app) {
    require('./bulk-correspondence-status-directive')(app);
    require('./bulkCorrespondenceStatusDirectiveCtrl')(app);
};