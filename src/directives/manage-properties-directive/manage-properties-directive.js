module.exports = function (app) {
    app.directive('managePropertiesDirective', function () {
        'ngInject';
        return {
            restrict: 'E',
            controller: 'managePropertiesDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            template: require('./manage-properties-template.html'),
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