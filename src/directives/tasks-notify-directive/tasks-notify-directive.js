module.exports = function (app) {
    app.directive('tasksNotifyDirective', function (cmsTemplate) {
        'ngInject';
        return {
            replace: true,
            restrict: 'E',
            templateUrl: cmsTemplate.getDirective('tasks-notify-template.html'),
            controller: 'tasksNotifyDirectiveCtrl',
            controllerAs: 'tasks'
        }
    });
};
