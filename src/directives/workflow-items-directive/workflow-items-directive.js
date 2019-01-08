module.exports = function (app) {
    require('./workflow-items-style.scss');
    app.directive('workflowItemsDirective', function () {
        return {
            restrict: 'E',
            replace: true,
            controller: 'workflowItemsDirectiveCtrl',
            template: require('./workflow-items-template.html'),
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
                toggleFav: '='
            }
        }
    })
};
