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
                disableCorrespondence: '='
            }
        }
    });
};