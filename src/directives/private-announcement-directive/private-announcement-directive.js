module.exports = function (app) {
    app.directive('privateAnnouncementDirective', function () {
        'ngInject';
        return {
            restrict: 'E',
            template: require('./private-announcement-template.html'),
            replace: true,
            bindToController: true,
            controller: 'privateAnnouncementDirectiveCtrl',
            controllerAs: 'ctrl',
            scope: true
        }
    })
};