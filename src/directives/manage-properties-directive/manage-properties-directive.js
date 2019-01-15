module.exports = function (app) {
    app.directive('managePropertiesDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            controller: 'managePropertiesDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            templateUrl: cmsTemplate.getDirective('manage-properties-template.html'),
            scope: {
                document: '=',
                organizations: '=?',
                sourceModel: '=?',
                documentFiles: '=?',
                sourceForm: '=?',
                fromDialog: '=',
                disableProperties: '=',
                centralArchives: '=',
                registryOrganizations: '=?',
                receiveG2g: '=?'
            }
        }
    })
};
