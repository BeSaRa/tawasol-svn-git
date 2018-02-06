module.exports = function (app) {
    require('./private-announcement-directive')(app);
    require('./privateAnnouncementDirectiveCtrl')(app);
};