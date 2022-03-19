module.exports = function (app) {
    app.directive('managerWidget', function () {
        'ngInject';
        return {
            restrict: 'E',
            template: require('./manager-widget-template.html'),
            replace: true,
            controller: 'managerWidgetCtrl',
            controllerAs: 'ctrl'
        }
    })
};
