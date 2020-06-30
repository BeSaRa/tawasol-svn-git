module.exports = function (app) {
    app.directive('searchOutgoingIncomingScreenDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            replace: true,
            controller: 'searchOutgoingIncomingScreenDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            templateUrl: cmsTemplate.getDirective('search-outgoing-incoming-screen-directive-template.html'),
            scope: {
                labelCollapse: '=',
                ous: '=',
                registryOrganizations: '=',
                propertyConfigurations: '=',
                controller: '=',
                availableRegistryOrganizations: '=',
                creators : '='
            }
        }
    })
};
