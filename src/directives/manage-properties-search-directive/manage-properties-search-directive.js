module.exports = function (app) {
    app.directive('managePropertiesSearchDirective', function () {
        'ngInject';
        return {
            restrict: 'E',
            controller: 'managePropertiesSearchDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            template: require('./manage-properties-search-template.html'),
            scope: {
                document: '=',
                organizations: '=?',
                documentFiles: '=?',
                sourceForm: '=?',
                centralArchives: '=',
                registryOrganizations: '=?',
                searchType: '@'
            }
        }
    })
};