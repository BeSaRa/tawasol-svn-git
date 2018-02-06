module.exports = function (app) {
    app.directive('manageCorrespondenceSiteIncomingDirective', function () {
        'ngInject';
        return {
            restrict: 'E',
            template: require('./manage-correspondence-site-incoming-template.html'),
            controller: 'manageCorrespondenceSiteIncomingDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            scope: {
                vsId: '=',
                documentClass: '=',
                emptySubRecords: '=',
                site: '='
            }
        }
    });
};