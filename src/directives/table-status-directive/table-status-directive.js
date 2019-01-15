module.exports = function (app) {
    app.directive('tableStatusDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            templateUrl: cmsTemplate.getDirective('table-status-template.html'),
            controller: 'tableStatusDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            scope: {
                whenClose: '='
            }
        }
    })
};
