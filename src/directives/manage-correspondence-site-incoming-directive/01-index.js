module.exports = function (app) {
    require('./manage-correspondence-site-incoming-directive')(app);
    require('./manageCorrespondenceSiteIncomingDirectiveCtrl')(app);
};