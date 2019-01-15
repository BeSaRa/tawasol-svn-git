module.exports = function (app) {
    app.directive('manageCorrespondenceSiteIncomingSimpleDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            // templateUrl: cmsTemplate.getDirective('manage-correspondence-site-incoming-simple-template.html'),
            templateUrl: cmsTemplate.getDirective('manage-correspondence-site-incoming-simple-add-template.html'),
            controller: 'manageCorrespondenceSiteIncomingSimpleDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            scope: {
                vsId: '=',
                documentClass: '=',
                emptySubRecords: '=',
                site: '=',
                disableCorrespondence: '=',
                correspondence: '='
            }
        }
    });
};
