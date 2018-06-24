module.exports = function (app) {
    require('./toolbar.scss');
    app.directive('toolbarDirective', function () {
        'ngInject';
        return {
            restrict: 'E',
            template: require('./toolbar-template.html'),
            controller: 'toolbarDirectiveCtrl',
            controllerAs: 'toolbar',
            replace: true
        }
    });
};