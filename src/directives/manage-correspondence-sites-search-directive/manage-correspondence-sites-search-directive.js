module.exports = function (app) {
    app.directive('manageCorrespondenceSitesSearchDirective', function () {
        'ngInject';
        return {
            restrict: 'E',
            template: require('./manage-correspondence-sites-search-template.html'),
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