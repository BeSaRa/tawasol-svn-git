module.exports = function (app) {
    require('./manage-entities-search-style.scss');
    app.directive('manageEntitiesSearchDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            controller: 'manageEntitiesSearchDirectiveCtrl',
            controllerAs: 'ctrl',
            templateUrl: cmsTemplate.getDirective('manage-entities-search-template.html'),
            bindToController: true,
            scope: {
                linkedEntity: '=',
                documentClass: '=',
                selectedEntityType: '=?',
                formValid: '=?'
            },
            link: function ($scope, element, attrs) {
                $scope.$watch(function () {
                        return $scope.ctrl.submitEnabled($scope.entityForm);
                    },
                    function (newValue, oldValue) {
                        $scope.ctrl.formValid = newValue;
                    });
            }
        }
    })
};
