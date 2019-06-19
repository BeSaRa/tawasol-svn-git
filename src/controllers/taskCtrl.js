module.exports = function (app) {
    app.controller('taskCtrl', function (taskService, generator, Task) {
        'ngInject';
        var self = this;
        self.controllerName = 'taskCtrl';

        self.openAddTaskDialog = function ($event) {
            taskService
                .controllerMethod
                .taskAdd()
                .then(function () {
                    self.reloadTasks();
                });
        };

        self.reloadTasks = function () {
            taskService
                .reloadCalender();
        }

    });
};
