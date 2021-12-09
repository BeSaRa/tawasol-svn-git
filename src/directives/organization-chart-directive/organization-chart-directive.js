module.exports = function (app) {
    app.directive('organizationChartDirective', function () {
        'ngInject';
        return {
            restrict: 'E',
            replace: true,
            controller: 'organizationChartDirectiveCtrl',
            controllerAs: 'orgCtrl',
            bindToController: true,
            scope: {
                organizations: '=',
                hasChanges: '=',
                reloadCallback: '&'
            }
        }
    })
};
