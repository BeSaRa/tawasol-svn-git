module.exports = function (app) {
    require('./manage-comments-directive')(app);
    require('./manageCommentsDirectiveCtrl')(app);
};