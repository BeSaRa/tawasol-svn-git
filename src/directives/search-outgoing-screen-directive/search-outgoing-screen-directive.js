module.exports = function (app) {
    app.directive('searchOutgoingScreenDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            replace: true,
            controller: 'searchOutgoingScreenDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            templateUrl: cmsTemplate.getDirective('search-outgoing-screen-directive-template.html'),
            scope: {
                labelCollapse: '=',
                registryOrganizations: '=',
                ous: '=',
                propertyConfigurations: '=',
                approvers: '=',
                controller: '=',
                availableRegistryOrganizations: '=',
                creators : '='
            }
        }
    })
};
