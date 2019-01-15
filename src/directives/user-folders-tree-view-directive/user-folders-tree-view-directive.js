module.exports = function (app) {
    require('./user-folders-tree-view-style.css');
    app.directive('userFoldersTreeViewDirective', function ($compile,cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            controller: 'userFoldersTreeViewDirectiveCtrl',
            controllerAs: 'ctrl',
            templateUrl: cmsTemplate.getDirective('user-folders-tree-view-directive.html'),
            bindToController: true,
            scope:{
                folders : '=',
                currentNode : '=',
                allowActions: '@',
                addRootFolder: '@'
            }
        };
    });
};
