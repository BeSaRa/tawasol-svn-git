module.exports = function (app) {
    app.directive('workflowSelectedUsersDirective', function () {
        'ngInject';
        return {
            restrict: 'E',
            replace: true,
            controller: 'workflowSelectedUsersDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            template: require('./workflow-selected-users-template.html'),
            scope: {
                gridName: '@',
                selectedGrids: '=',
                gridSelected: '=',
                deleteFromSelected: '=',
                setDefaultWorkflowItemsSettings: '=',
                setSettingsToDistWorkflowItem: '=',
                openWorkflowUserOutOfOffice: '=',
                deleteBulkSelected: '=',
                hasSelection: '=',
                callbackAllComplete: '='
            }
        }
    })
};