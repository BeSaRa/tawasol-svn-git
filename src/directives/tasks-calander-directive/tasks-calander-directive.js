module.exports = function (app) {
    require('./calender-style.scss');
    app.directive('tasksCalenderDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            controller: 'tasksCalenderDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            scope: {},
            templateUrl: cmsTemplate.getDirective('tasks-calender-template')
        }
    })
};
