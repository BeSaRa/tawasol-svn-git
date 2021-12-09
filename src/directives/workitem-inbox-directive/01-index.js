module.exports = function (app) {
    require('./workitem-inbox-directive')(app);
    require('./workItemInboxDirectiveCtrl')(app);
};