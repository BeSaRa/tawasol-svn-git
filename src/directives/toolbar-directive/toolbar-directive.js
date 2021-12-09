module.exports = function (app) {
    require('./toolbar.scss');
    app.directive('toolbarDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            templateUrl: cmsTemplate.getDirective('toolbar-template.html'),
            controller: 'toolbarDirectiveCtrl',
            controllerAs: 'toolbar',
            replace: true
        }
    });
};
