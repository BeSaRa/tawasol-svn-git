module.exports = function (app) {
    app.directive('managePropertiesSimpleDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            controller: 'managePropertiesSimpleDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            templateUrl: cmsTemplate.getDirective('manage-properties-simple-template.html'),
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
                isNewDocument: '=?'
            }
        }
    })
};
