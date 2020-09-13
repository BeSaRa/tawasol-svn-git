module.exports = function (app) {
    app.directive('viewerSidebarDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            replace: true,
            controller: 'viewerSidebarDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            templateUrl: cmsTemplate.getDirective('viewer-sidebar-directive-template.html'),
            scope: {
                correspondence: '=',
                workItem: '=',
                actions: '=',
                g2gItemCopy: '=?'
            }
        }
    })
};
