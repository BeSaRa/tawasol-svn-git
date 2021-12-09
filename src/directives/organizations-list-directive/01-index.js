module.exports = function (app) {
    require('./organizations-list-directive')(app);
    require('./organizationsListDirectiveCtrl')(app);
};
