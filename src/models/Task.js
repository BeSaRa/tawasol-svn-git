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

            Task.prototype.findParticipantIndex = function (taskParticipant) {
                return _.findIndex(this.taskParticipants, function (participant) {
                    return participant.participantId === taskParticipant.participantId;
                });
            };

            Task.prototype.deleteParticipant = function (participant) {
                var self = this;
                var index = self.findParticipantIndex(participant);
                if (!this.hasId()) {
                    return $timeout(function () {
                        self.taskParticipants.splice(index, 1);
                        return participant;
                    });
                } else {
                    return taskService
                        .deleteTaskParticipant(self, participant)
                        .then(function () {
                            self.taskParticipants.splice(index, 1);
                            return participant;
                        });
                }
            };

            var indicator = new Indicator();
            Task.prototype.getSecurityLevelIndicator = function (securityLevel) {
                return indicator.getSecurityLevelIndicator(securityLevel);
            };

            Task.prototype.getPriorityLevelIndicator = function (priorityLevel) {
                return indicator.getPriorityLevelIndicator(priorityLevel);
            };

            Task.prototype.getAttachmentsIndicator = function () {
                return indicator.getAttachmentsIndicator();
            };

            Task.prototype.getLinkedDocumentsIndicator = function () {
                return indicator.getLinkedDocumentsIndicator();
            };

            Task.prototype.getDocClassIndicator = function (docType) {
                return indicator.getDocClassIndicator(docType);
            };

            Task.prototype.getIsPaperIndicator = function (isPaper) {
                return indicator.getIsPaperIndicator(isPaper);
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('Task', 'init', this);
        }
    })
};
