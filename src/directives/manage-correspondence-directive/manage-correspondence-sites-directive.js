module.exports = function (app) {
    app.directive('manageCorrespondenceSitesDirective', function () {
        'ngInject';
        return {
            restrict: 'E',
            template: require('./manage-correspondence-sites-template.html'),
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
                isCompositeDocument: '=?'
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