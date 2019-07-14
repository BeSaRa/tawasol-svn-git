module.exports = function (app) {
    app.directive('manageCorrespondenceSitesFaxDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            templateUrl: cmsTemplate.getDirective('manage-correspondence-sites-fax-template.html'),
            controller: 'manageCorrespondenceSitesFaxDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            scope: {
                sitesInfoTo: '=',
                vsId: '=',
                documentClass: '=',
                emptySubRecords: '=',
                disableCorrespondence: '=',
                emptySiteSearch: '=',
                isCompositeDocument: '=?',
                faxExportOptions: '=?'
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
