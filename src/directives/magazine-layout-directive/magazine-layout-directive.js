module.exports = function (app) {
    require('./magazine-layout-style.scss');
    app.directive('magazineLayoutDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            controller: 'magazineLayoutDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            replace: true,
            templateUrl: cmsTemplate.getDirective('magazine-layout-template.html'),
            scope: {
                workItems: '=',
                selectedWorkItems: '=',
                allowSelection: '=',
                changeUserInboxStarBulk: '=',
                addToFolderUserInboxBulk: '=',
                terminateUserInboxBulk: '=',
                checkIfForwardBulkAvailable: '=',
                forwardBulk: '=',
                pageLimit: '=',
                page: '=',
                totalItems: '=',
                limitOptions: '=',
                contextMenuActions: '=',
                searchModel: '=',
                viewDocument: '=',
                markAsReadUnread: '=',
                changeUserInboxStar: '=',
                quickActions: '=',
                moveToFolderBulk: '=?',
                sortingCallback: '=',
                sortOrder: '='
            }
        }
    })
};
