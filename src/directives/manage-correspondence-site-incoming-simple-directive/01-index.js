module.exports = function (app) {
    require('./manage-correspondence-site-incoming-simple-directive')(app);
    require('./manageCorrespondenceSiteIncomingSimpleDirectiveCtrl')(app);
};