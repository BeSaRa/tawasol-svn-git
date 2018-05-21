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
                searchType: '@',
                centralArchives: '=?',
                organizations: '=?',
                documentFiles: '=?',
                sourceForm: '=?',
                registryOrganizations: '=?',
                approvers: '=?'
            }
        }
    })
};