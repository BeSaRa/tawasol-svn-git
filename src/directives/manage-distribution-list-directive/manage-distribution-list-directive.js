module.exports = function (app) {
    app.directive('manageDistributionListDirective', function () {
        'ngInject';
        return {
            restrict: 'E',
            template: require('./manage-distribution-list-template.html'),
            controller: 'manageDistributionListDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            scope: {
                distributionListMembers: '=',
                selectedSiteType: '=?',
                selectedMainSite: '=?',
                subSiteSearchText: '=?'
            },
            link: function ($scope, $element, attrs) {
                $scope.$watch(function () {
                        return $scope.ctrl.subSiteSearchText
                    },
                    function (newValue, oldValue) {
                        if (!newValue) {
                            $scope.ctrl.onCloseSearch()
                        }
                    });
            }
        }
    });
};