module.exports = function (app) {
    require('./magazine-layout-style.scss');
    app.directive('magazineLayoutDirective', function () {
        'ngInject';
        return {
            restrict: 'E',
            controller: 'magazineLayoutDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            replace: true,
            template: require('./magazine-layout-template.html'),
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
                gridActions: '=',
                searchModel: '=',
                viewDocument: '=',
                markAsReadUnread: '='
            }
        }
    })
};