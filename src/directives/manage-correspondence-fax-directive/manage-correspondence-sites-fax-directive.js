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
                emptySiteSearch: '=',
                faxExportOptions: '=?'
            }
        }
    });
};
