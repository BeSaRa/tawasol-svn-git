module.exports = function (app) {
    app.directive('manageCorrespondenceSitesSearchDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            templateUrl: cmsTemplate.getDirective('manage-correspondence-sites-search-template.html'),
            controller: 'manageCorrespondenceSitesSearchDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            scope: {
                selectedSiteType: '=',
                sitesInfoTo: '=',
                sitesInfoCC: '=',
                sitesInfoIncoming: '=',
                documentClass: '=',
                emptySubRecords: '='
            }
        }
    });
};
