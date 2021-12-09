module.exports = function (app) {
    require('./task-list-directive')(app);
    require('./taskListDirectiveCtrl')(app);
};
