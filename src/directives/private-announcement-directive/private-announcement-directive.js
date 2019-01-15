module.exports = function (app) {
    app.directive('privateAnnouncementDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            templateUrl: cmsTemplate.getDirective('private-announcement-template.html'),
            replace: true,
            bindToController: true,
            controller: 'privateAnnouncementDirectiveCtrl',
            controllerAs: 'ctrl',
            scope: true
        }
    })
};
