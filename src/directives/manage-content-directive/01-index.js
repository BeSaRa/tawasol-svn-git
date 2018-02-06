module.exports = function (app) {
    require('./manage-content-directive')(app);
    require('./manageContentDirectiveCtrl')(app);
};