module.exports = function (app) {
    require('./sequential-workflow-steps-directive')(app);
    require('./sequentialWorkflowStepsDirectiveCtrl')(app);
    require('./seq-step-sort-drag-drop-directive')(app);
};
