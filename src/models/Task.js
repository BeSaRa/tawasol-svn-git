module.exports = function (app) {
    app.factory('Task', function (CMSModelInterceptor, _, $timeout, configurationService, Indicator) {
        'ngInject';
        return function Task(model) {
            var self = this, taskService;
            self.id = null;
            self.taskTitle = null;
            self.taskDescription = null;
            self.userId = null;
            self.ouId = null;
            self.category = 1;
            self.taskState = null;
            self.creationDate = null;
            self.dueDate = null;
            self.completionDate = null;
            self.wobNum = null;
            self.documentVSID = null;
            self.docClassId = null;
            self.taskParticipants = [];
            self.priorityLevel = null;
            self.startDate = null;
            self.allDay = false;
            self.withoutParticipant = false;

            self.startTime = configurationService.DEFAULT_START_TASK_TIME;
            self.endTime = null;
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [
                'taskTitle',
                'userId',
                'ouId',
                'taskState',
                'priorityLevel',
                'dueDate'
            ];

            if (model)
                angular.extend(this, model);

            Task.prototype.addTaskService = function (service) {
                taskService = service;
                return this;
            };
            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            Task.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            Task.prototype.hasId = function () {
                return !!this.id;
            };

            Task.prototype.addParticipant = function (taskParticipant) {
                taskParticipant.taskDetailsId = this.id;
                var self = this;
                if (!this.hasId()) {
                    return $timeout(function () {
                        self.taskParticipants.push(taskParticipant);
                        return taskParticipant;
                    });
                } else {
                    return taskService
                        .saveTaskParticipant(this, taskParticipant)
                        .then(function (result) {
                            self.taskParticipants.push(result);
                            return result;
                        });
                }
            };
            Task.prototype.editTaskParticipant = function (taskParticipant) {
                var self = this;
                taskParticipant.taskDetailsId = self.id;
                var index = this.findParticipantIndex(taskParticipant);
                if (!this.hasId()) {
                    return $timeout(function () {
                        self.taskParticipants.splice(index, 1, taskParticipant);
                        return taskParticipant;
                    })
                } else {
                    return taskService
                        .updateTaskParticipant(this, taskParticipant)
                        .then(function () {
                            self.taskParticipants.splice(index, 1, taskParticipant);
                            return taskParticipant;
                        });
                }
            };

            Task.prototype.deleteParticipant = function (taskParticipant) {
                var self = this;
                var index = self.findParticipantIndex(taskParticipant);
                if (!this.hasId()) {
                    return $timeout(function () {
                        self.taskParticipants.splice(index, 1);
                        return taskParticipant;
                    });
                } else {
                    if (taskParticipant.id) {
                        return taskService.deleteTaskParticipant(self, taskParticipant)
                            .then(function () {
                                self.taskParticipants.splice(index, 1);
                                return taskParticipant;
                            });
                    } else {
                        return $timeout(function () {
                            self.taskParticipants.splice(index, 1);
                            return taskParticipant;
                        });
                    }
                }
            };

            Task.prototype.findParticipantIndex = function (taskParticipant) {
                return _.findIndex(this.taskParticipants, function (participant) {
                    return participant.participantId === taskParticipant.participantId;
                });
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('Task', 'init', this);
        }
    })
};
