module.exports = function (app) {
    app.service('taskService', function (urlService, $http , $q , generator, Task , _) {
        'ngInject';
        var self = this;
        self.serviceName = 'taskService';

        self.tasks = [];

        /**
         * @description load tasks from server.
         * @returns {Promise|tasks}
         */
        self.loadTasks = function () {
            return $http.get(urlService.tasks).then(function (result) {
                self.tasks = generator.generateCollection(result.data.rs, Task, self._sharedMethods);
                self.tasks = generator.interceptReceivedCollection('Task', self.tasks);
                return self.tasks;
            });
        };
        /**
         * @description get tasks from self.tasks if found and if not load it from server again.
         * @returns {Promise|tasks}
         */
        self.getTasks = function () {
            return self.tasks.length ? $q.when(self.tasks) : self.loadTasks();
        };
        /**
         * @description add new task to service
         * @param task
         * @return {Promise|Task}
         */
        self.addTask = function (task) {
            return $http
                .post(urlService.tasks,
                    generator.interceptSendInstance('Task', task))
                .then(function () {
                    return task;
                });
        };
        /**
         * @description make an update for given task.
         * @param task
         * @return {Promise|Task}
         */
        self.updateTask = function (task) {
            return $http
                .put(urlService.tasks,
                    generator.interceptSendInstance('Task', task))
                .then(function () {
                    return task;
                });
        };
        /**
         * @description delete given classification.
         * @param task
         * @return {Promise}
         */
        self.deleteTask = function (task) {
            var id = task.hasOwnProperty('id') ? task.id : task;
            return $http
                .delete((urlService.tasks + '/' + id));
        };
        /**
         * @description create the shred method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteTask, self.updateTask);

        /**
         * @description get task by taskId
         * @param taskId
         * @returns {Task|undefined} return Task Model or undefined if not found.
         */
        self.getTaskById = function (taskId) {
            taskId = taskId instanceof Task ? taskId.id : taskId;
            return _.find(self.tasks, function (task) {
                return Number(task.id) === Number(taskId);
            });
        };

    });
};
