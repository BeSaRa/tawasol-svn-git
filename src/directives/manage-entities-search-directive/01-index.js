module.exports = function (app) {
    require('./manage-entities-search-directive')(app);
    require('./manageEntitiesSearchDirectiveCtrl')(app);
};