module.exports = function (app) {
    app.directive('manageCorrespondenceSiteG2gMessagingHistoryDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            templateUrl: cmsTemplate.getDirective('manage-correspondence-site-g2g-messaging-history-template.html'),
            controller: 'manageCorrespondenceSiteG2GMessagingHistoryDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            scope: {
                record: '='
            }
        }
    });
};
