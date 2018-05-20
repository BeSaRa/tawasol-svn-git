module.exports = function (app) {
    require('./manage-entities-search-style.scss');
    app.directive('manageEntitiesSearchDirective', function () {
        'ngInject';
        return {
            restrict: 'E',
            controller: 'manageEntitiesSearchDirectiveCtrl',
            controllerAs: 'ctrl',
            template: require('./manage-entities-search-template.html'),
            bindToController: true,
            scope: {
                linkedEntity: '=',
                documentClass: '=',
                selectedEntityType: '=?',
                formValid: '=?'
            },
            link: function ($scope, element, attrs) {
                $scope.$watch(function () {
                        //console.log($scope, $scope.ctrl.formValid);
                        return $scope.ctrl.submitEnabled($scope.entityForm);
                    },
                    function (newValue, oldValue) {
                        $scope.ctrl.formValid = newValue;
                    });
            }
        }
    })
};