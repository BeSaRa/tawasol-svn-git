module.exports = function (app) {
    app.directive('selectedWorkflowItemsDirective', function ($timeout) {
        'ngInject';
        return {
            restrict: 'E',
            replace: true,
            controller: 'selectedWorkflowItemsDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            template: require('./selected-workflow-items-template.html'),
            scope: {
                workflowItems: '=',
                workflowActions: '=',
                workflowComments: '=',
                deleteCallback: '=',
                deleteBulkCallback: '='
            }
        }
    })
};