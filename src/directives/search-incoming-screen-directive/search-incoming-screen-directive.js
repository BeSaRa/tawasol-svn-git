module.exports = function (app) {
    app.directive('searchIncomingScreenDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            replace: true,
            controller: 'searchIncomingScreenDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            templateUrl: cmsTemplate.getDirective('search-incoming-screen-directive-template.html'),
            scope: {
                labelCollapse: '=',
                registryOrganizations: '=',
                propertyConfigurations: '=',
                controller: '='
            }
        }
    });
};