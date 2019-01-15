module.exports = function (app) {
    app.directive('manageCorrespondenceSitesSimpleDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            // templateUrl: cmsTemplate.getDirective('manage-correspondence-sites-simple-template.html'),
            templateUrl: cmsTemplate.getDirective('manage-correspondence-sites-simple-add-template.html'),
            controller: 'manageCorrespondenceSitesSimpleDirectiveCtrl',
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
                correspondence: '='
            }
        }
    });
};
