module.exports = function (app) {
    app.directive('manageCorrespondenceSitesFilterDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            templateUrl: cmsTemplate.getDirective('manage-correspondence-sites-filter-template.html'),
            controller: 'manageCorrespondenceSitesFilterDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            scope: {
                mainSubSites: '=',
                emptyMainSubSites: '=',
                lookupNames: '=?'
            }
        }
    });
};
