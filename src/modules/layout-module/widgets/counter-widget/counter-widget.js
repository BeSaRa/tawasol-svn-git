module.exports = function (app) {
    require('./counter-style.scss');
    app.directive('counterWidget', function () {
        'ngInject';
        return {
            restrict: 'E',
            template: require('./counter-widget-template.html'),
            replace: true,
            controller: 'counterWidgetCtrl',
            controllerAs: 'ctrl',
            bindToController: true
        }
    })
};