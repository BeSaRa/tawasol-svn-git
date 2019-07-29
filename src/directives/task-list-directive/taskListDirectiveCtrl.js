module.exports = function (app) {
    app.controller('taskListDirectiveCtrl', function (taskService, employeeService, $interval) {
        'ngInject';
        var self = this;
        self.controllerName = 'taskListDirectiveCtrl';

        self.taskService = taskService;

        self.openTasksMenu = function ($mdMenu) {
            $mdMenu.open();
        };

        self.openTasksViewer = function (task, $event) {

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
