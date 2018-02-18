module.exports = function (app) {
    app.directive('currentTabLabelDirective', function () {
        'ngInject';
        return {
            replace: true,
            restrict: 'E',
            template: require('./current-tab-label-template.html'),
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