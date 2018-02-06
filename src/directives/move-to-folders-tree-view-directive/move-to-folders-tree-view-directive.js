module.exports = function (app) {
    require('./move-to-folders-tree-view-style.scss');
    app.directive('moveToFoldersTreeViewDirective', function ($compile) {
        'ngInject';
        return {
            restrict: 'E',
            controller: 'moveToFoldersTreeViewDirectiveCtrl',
            controllerAs: 'ctrl',
            template: require('./move-to-folders-tree-view-directive.html'),
            bindToController: true,
            scope: {
                folders: '='
            }
        };
    });
};