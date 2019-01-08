module.exports = function (app) {
    require('./workflow-users-style.scss');
    app.directive('workflowUsersDirective', function ($timeout) {
        'ngInject';
        return {
            restrict: 'E',
            replace: true,
            controller: 'workflowUsersDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            template: require('./workflow-users-template.html'),
            scope: {
                allowFavorites: '=',
                gridItems: '=',
                gridName: '@',
                multiSelect: '=',
                grid: '=',
                excludeSelected: '=',
                callbackToggleBulkFavorites: '=',
                callbackAllInFavorites: '=',
                callbackUserNotExists: '=',
                callbackToggleFav: '=',
                callbackOpenWorkflowUserOutOfOffice: '=',
                callbackSetDefaultWorkflowItemsSettings: '=',
                callbackAddSelectedUsersToGrid: '=',
                callbackAddSelectedUsersWithIgnoreToGrid: '=',
                callbackSetSettingsToDistWorkflowItem: '=',
                callbackAddSelectedUserToGrid: '=',
                callbackAddSelectedUserWithIgnoreToGrid: '=',
                callbackDeleteFromSelected: '=',
                workflowActions: '=',
                workflowComments: '=',
                applyNotificationSettings: '='
            }
        }
    });
};
