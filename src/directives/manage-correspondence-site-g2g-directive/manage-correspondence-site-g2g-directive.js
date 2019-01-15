module.exports = function (app) {
    app.directive('manageCorrespondenceSiteG2gDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            templateUrl: cmsTemplate.getDirective('manage-correspondence-site-g2g-template.html'),
            controller: 'manageCorrespondenceSiteG2GDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            scope: {
                //vsId: '=',
                //documentClass: '=',
                //emptySubRecords: '=',
                site: '=',
                //disableCorrespondence: '=?'
            }
        }
    });
};
