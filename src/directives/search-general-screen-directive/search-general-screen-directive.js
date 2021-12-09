module.exports = function (app) {
    app.directive('searchGeneralScreenDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            replace: true,
            controller: 'searchGeneralScreenDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            templateUrl: cmsTemplate.getDirective('search-general-screen-directive-template.html'),
            scope: {
                labelCollapse: '=',
                ous: '=',
                registryOrganizations: '=',
                propertyConfigurations: '=',
                controller: '=',
                creators: '='
            }
        }
    })
};
