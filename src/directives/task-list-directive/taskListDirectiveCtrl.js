module.exports = function (app) {
    app.controller('taskListDirectiveCtrl', function (taskService, employeeService, $interval, $state) {
        'ngInject';
        var self = this;
        self.controllerName = 'taskListDirectiveCtrl';

        self.taskService = taskService;

        self.openTasksMenu = function ($mdMenu) {
            $mdMenu.open();
        };

        self.openTasksViewer = function (task, $event) {
            $event.preventDefault();
            taskService.viewCalenderTask(task, $event);
        };

        self.reloadReminders = function ($event, $mdMenu) {
            $event.stopPropagation();
            $event.preventDefault();
            self.taskService
                .loadReminders()
                .then(function () {
                    $mdMenu.open();
                });
        };

        self.redirectToTasks = function ($event) {
            $state.go('app.inbox.tasks');
        };


        var interval, stopLoadingReminders = false;

        self.taskService.loadReminders();
        interval = $interval(function () {
            if (stopLoadingReminders) {
                $interval.cancel(interval);
                return;
            }
            return self.taskService.loadReminders()
                .catch(function () {
                    $interval.cancel(interval);
                    stopLoadingReminders = true;
                });
        }, employeeService.getEmployee().getIntervalMin());


    });
};
