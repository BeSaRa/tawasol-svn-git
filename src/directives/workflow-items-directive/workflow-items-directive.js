module.exports = function (app) {
    require('./workflow-items-style.scss');
    app.directive('workflowItemsDirective', function (cmsTemplate) {
        return {
            restrict: 'E',
            replace: true,
            controller: 'workflowItemsDirectiveCtrl',
            templateUrl: cmsTemplate.getDirective('workflow-items-template.html'),
            controllerAs: 'ctrl',
            bindToController: true,
            scope: {
                excludeSelected: '=',
                workflowItems: '=',
                workflowActions: '=',
                workflowComments: '=',
                itemNotExistsCallback: '=',
                allowFavorites: '=',
                callbackToggleBulkFavorites: '=',
                gridType: '@',
                callbackAllInFavorites: '=',
                selected: '=',
                multiSelect: '=',
                toggleFav: '=',
                gridName: '@',
            }
        }
    })
};
