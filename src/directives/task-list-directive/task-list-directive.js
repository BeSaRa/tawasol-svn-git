module.exports = function (app) {
    app.directive('taskListDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            controller: 'taskListDirectiveCtrl',
            controllerAs: 'ctrl',
            replace: true,
            templateUrl: cmsTemplate.getDirective('task-list-directive-template')
        }
    })
};
