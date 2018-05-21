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
            },
            link: function (scope, element, attrs) {
                scope.$watch(function () {
                        return scope.ctrl.document.securityLevel
                    },
                    function (newValue, oldValue) {
                        if (!newValue) {
                            scope.ctrl.classifications = [];
                            scope.ctrl.documentFiles = [];
                        }
                    });
            }
        }
    })
};