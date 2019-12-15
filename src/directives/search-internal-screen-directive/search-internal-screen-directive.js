module.exports = function (app) {
    app.directive('searchInternalScreenDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            replace: true,
            controller: 'searchInternalScreenDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            templateUrl: cmsTemplate.getDirective('search-internal-screen-directive-template.html'),
            scope: {
                labelCollapse: '=',
                registryOrganizations: '=',
                propertyConfigurations: '=',
                approvers: '=',
                controller: '='
            }
        }
    });
};