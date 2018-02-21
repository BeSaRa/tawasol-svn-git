module.exports = function (app) {
    require('./workflow-items-directive')(app);
    require('./workflowItemsDirectiveCtrl')(app);
};