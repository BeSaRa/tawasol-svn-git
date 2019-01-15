module.exports = function (app) {
    app.directive('manageCorrespondenceSiteIncomingDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            templateUrl: cmsTemplate.getDirective('manage-correspondence-site-incoming-template.html'),
            controller: 'manageCorrespondenceSiteIncomingDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            scope: {
                vsId: '=',
                documentClass: '=',
                emptySubRecords: '=',
                site: '=',
                disableCorrespondence: '='
            }
        }
    });
};
