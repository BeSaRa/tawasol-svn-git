module.exports = function (app) {
    app.directive('workItemInboxDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            controller: 'workItemInboxDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            templateUrl: cmsTemplate.getDirective('work-item-inbox-template.html'),
            scope: {
                selectedWorkItems: '=',
                workItems: '=',
                changeUserInboxStarBulk: '=',
                addToFolderUserInboxBulk: '=',
                terminateUserInboxBulk: '=',
                checkIfForwardBulkAvailable: '=',
                forwardBulk: '=',
                changeUserInboxStar: '=',
                viewDocument: '=',
                contextMenuActions: '=',
                shortcutActions: '=',
                markAsReadUnread: '=',
                grid: '=',
                searchModel: '=',
                sortingCallback: '=',
                printUserInboxBulk: '=?',
                totalItems: '=?',
                serverPagination: '=?',
                tableName: '=?',
                viewTrackingSheetCallback: '=?'
            }
        }
    })
};
