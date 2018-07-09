module.exports = function (app) {
    app.directive('manageCorrespondenceSiteIncomingSimpleDirective', function () {
        'ngInject';
        return {
            restrict: 'E',
            template: require('./manage-correspondence-site-incoming-simple-template.html'),
            controller: 'manageCorrespondenceSiteIncomingSimpleDirectiveCtrl',
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