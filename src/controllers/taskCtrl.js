module.exports = function (app) {
    app.controller('taskCtrl', function (taskService, contextHelpService) {
        'ngInject';
        var self = this;
        self.controllerName = 'taskCtrl';

        contextHelpService.setHelpTo('tasks');

        self.openAddTaskDialog = function () {
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
