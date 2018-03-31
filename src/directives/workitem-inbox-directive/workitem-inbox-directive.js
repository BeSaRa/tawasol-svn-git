module.exports = function (app) {
    app.directive('workItemInboxDirective', function () {
        'ngInject';
        return {
            restrict: 'E',
            controller: 'workItemInboxDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            replace: true,
            template: require('./work-item-inbox-template.html'),
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
                gridActions: '=',
                markAsReadUnread: '=',
                grid: '='
            }
        }
    })
};