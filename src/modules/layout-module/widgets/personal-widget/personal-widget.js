module.exports = function (app) {
    app.directive('personalWidget', function () {
        'ngInject';
        return {
            restrict: 'E',
            template: require('./personal-widget-template.html'),
            replace: true,
            controller: 'personalWidgetCtrl',
            controllerAs: 'ctrl'
        }
    })
};
