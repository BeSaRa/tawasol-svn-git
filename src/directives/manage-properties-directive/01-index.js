module.exports = function (app) {
    require('./manage-properties-directive')(app);
    require('./managePropertiesDirectiveCtrl')(app);
};