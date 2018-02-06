module.exports = function (app) {
    app.controller('tasksNotifyDirectiveCtrl', function () {
        'ngInject';
        var self = this;
        self.controllerName = 'tasksNotifyDirectiveCtrl';
        // self.lang = langService;
        self.tasks = /*[];*/[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

        self.openTasksMenu = function ($mdMenu) {
            if (self.tasks.length)
                $mdMenu.open();
        };


    });
};