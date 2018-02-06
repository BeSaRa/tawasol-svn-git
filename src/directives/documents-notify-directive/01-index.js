module.exports = function (app) {
    require('./documents-notify-directive')(app);
    require('./documentsNotifyDirectiveCtrl')(app);
};