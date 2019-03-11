module.exports = function (app) {
    require('./folders-tree-structure-directive-style.scss');
    app.directive('foldersTreeStructureDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            controller: 'foldersTreeStructureDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            replace: true,
            templateUrl: cmsTemplate.getDirective('folders-tree-structure-template.html'),
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
                count: '=',
                displayMenu:'=?'
            }
        }
    })
};
