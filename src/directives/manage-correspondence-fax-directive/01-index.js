module.exports = function (app) {
    require('./manage-correspondence-sites-fax-directive')(app);
    require('./manageCorrespondenceSitesFaxDirectiveCtrl')(app);
};