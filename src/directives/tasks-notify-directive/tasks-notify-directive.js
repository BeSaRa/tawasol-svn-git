module.exports = function (app) {
    app.directive('tasksNotifyDirective', function () {
        'ngInject';
        return {
            replace: true,
            restrict: 'E',
            template: require('./tasks-notify-template.html'),
            controller: 'tasksNotifyDirectiveCtrl',
            controllerAs: 'tasks'
        }
    });
};