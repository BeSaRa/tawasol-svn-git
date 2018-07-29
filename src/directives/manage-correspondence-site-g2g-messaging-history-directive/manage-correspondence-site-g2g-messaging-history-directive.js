module.exports = function (app) {
    app.directive('manageCorrespondenceSiteG2gMessagingHistoryDirective', function () {
        'ngInject';
        return {
            restrict: 'E',
            template: require('./manage-correspondence-site-g2g-messaging-history-template.html'),
            controller: 'manageCorrespondenceSiteG2GMessagingHistoryDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            scope: {
                record: '='
            }
        }
    });
};