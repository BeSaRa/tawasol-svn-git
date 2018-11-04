module.exports = function (app) {
    require('./folders-tree-structure-directive-style.scss');
    app.directive('foldersTreeStructureDirective', function () {
        'ngInject';
        return {
            restrict: 'E',
            controller: 'foldersTreeStructureDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            replace: true,
            template: require('./folders-tree-structure-template.html'),
            scope: {
                folders: '=',
                clickCallback: '=',
                disableSelected: '=',
                highlightSelected: '=',
                icon: '@?',
                allowControl: '=?',
                addCallback: '=?',
                deleteCallback: '=?',
                editCallback: '=?',
                count: '='
            }
        }
    })
};