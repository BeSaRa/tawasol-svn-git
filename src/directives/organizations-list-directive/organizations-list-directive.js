module.exports = function (app) {
    app.directive('organizationsListDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            templateUrl: cmsTemplate.getDirective('organizations-list-template.html'),
            controller: 'organizationsListDirectiveCtrl',
            controllerAs: 'ctrl',
            replace: true,
            bindToController: true,
            scope: {
                organizationsList: '=',
                resetView: '=',
                reloadCallback: '='
            },
            link: function ($scope, element, attrs) {
                $scope.$watch(function () {
                        return $scope.ctrl.resetView;
                    },
                    function (newValue, oldValue) {
                        if (newValue !==  oldValue) {
                            $scope.ctrl.resetViewGrid();
                        }
                    });
            }
        }
    });
};
