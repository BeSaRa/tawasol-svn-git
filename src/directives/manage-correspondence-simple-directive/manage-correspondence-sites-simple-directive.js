module.exports = function (app) {
    app.directive('manageCorrespondenceSitesSimpleDirective', function () {
        'ngInject';
        return {
            restrict: 'E',
            // template: require('./manage-correspondence-sites-simple-template.html'),
            template: require('./manage-correspondence-sites-simple-add-template.html'),
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