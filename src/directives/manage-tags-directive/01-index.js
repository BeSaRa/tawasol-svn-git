module.exports = function (app) {
    require('./manage-tags-directive')(app);
    require('./manageTagsDirectiveCtrl')(app);
};