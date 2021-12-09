module.exports = function (app) {
    require('./manage-entities-directive')(app);
    require('./manageEntitiesDirectiveCtrl')(app);
};