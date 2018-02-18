module.exports = function (app) {
    require('./workflow-selected-users-directive')(app);
    require('./workflowSelectedUsersDirectiveCtrl')(app);
};