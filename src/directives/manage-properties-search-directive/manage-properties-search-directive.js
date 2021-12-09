module.exports = function (app) {
    app.directive('managePropertiesSearchDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            controller: 'managePropertiesSearchDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            templateUrl: cmsTemplate.getDirective('manage-properties-search-template.html'),
            scope: {
                document: '=',
                searchType: '@',
                centralArchives: '=?',
                organizations: '=?',
                documentFiles: '=?',
                sourceForm: '=?',
                registryOrganizations: '=?',
                approvers: '=?',
                emptyResults: '=',
                loadSubOrganizations: '=?'
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
