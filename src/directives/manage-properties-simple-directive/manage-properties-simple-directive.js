module.exports = function (app) {
    app.directive('managePropertiesSimpleDirective', function () {
        'ngInject';
        return {
            restrict: 'E',
            controller: 'managePropertiesSimpleDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            template: require('./manage-properties-simple-template.html'),
            scope: {
                document: '=',
                organizations: '=?',
                sourceModel: '=?',
                documentFiles: '=?',
                sourceForm: '=?',
                fromDialog: '=',
                disableProperties: '=',
                centralArchives: '=',
                registryOrganizations: '=?'
            }
        }
    })
};