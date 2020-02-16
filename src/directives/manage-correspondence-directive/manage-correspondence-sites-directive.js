module.exports = function (app) {
    app.directive('manageCorrespondenceSitesDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            templateUrl: cmsTemplate.getDirective('manage-correspondence-sites-template.html'),
            controller: 'manageCorrespondenceSitesDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            scope: {
                sitesInfoTo: '=',
                sitesInfoCC: '=',
                vsId: '=',
                documentClass: '=',
                emptySubRecords: '=',
                disableCorrespondence: '=',
                emptySiteSearch: '=',
                isCompositeDocument: '=?',
                distListId: '=',
                notifyAfterChanges : '=?'
            },
            link: function ($scope, element, attrs) {
                $scope.$watch(function () {
                        return $scope.ctrl.sitesInfoTo.length;
                    },
                    function (newValue, oldValue) {
                        if (newValue < 2) {
                            $scope.ctrl.isCompositeDocument = false;
                        }
                    });
            }
        }
    });
};
