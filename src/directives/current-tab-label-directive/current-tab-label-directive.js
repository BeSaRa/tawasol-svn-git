module.exports = function (app) {
    app.directive('currentTabLabelDirective', function (cmsTemplate) {
        'ngInject';
        return {
            replace: true,
            restrict: 'E',
            templateUrl: cmsTemplate.getDirective('current-tab-label-template.html'),
            controller: 'currentTabLabelDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            scope: {
                selectedTab: '=',
                workflowTabs: '=',
                overrideTitle: '@',
                overrideIcon: '@'
            }
        }
    })
};
