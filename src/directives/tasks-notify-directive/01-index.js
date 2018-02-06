module.exports = function (app) {
    require('./tasks-notify-style.scss');
    require('./tasks-notify-directive')(app);
    require('./tasksNotifyDirectiveCtrl')(app);
};