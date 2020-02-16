module.exports = function (app) {
    require('./selected-workflow-items-style.scss');
    app.directive('selectedWorkflowItemsDirective', function ($timeout,cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            replace: true,
            controller: 'selectedWorkflowItemsDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            templateUrl: cmsTemplate.getDirective('selected-workflow-items-template.html'),
            scope: {
                workflowItems: '=',
                workflowActions: '=',
                workflowComments: '=',
                deleteCallback: '=',
                deleteBulkCallback: '=',
                organizationGroups : '='
            }
        }
    })
};
