module.exports = function (app) {
    require('./select-application-users-directive')(app);
    require('./selectApplicationUsersDirectiveCtrl')(app);
};