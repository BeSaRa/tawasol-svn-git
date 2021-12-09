module.exports = function (app) {
    app.factory('TaskParticipant', function (CMSModelInterceptor, configurationService, Information) {
        'ngInject';
        return function TaskParticipant(model) {
            var self = this;
            self.id = null;
            self.userId = new Information();
            self.ouId = new Information();
            self.taskDetailsId = null;
            self.taskState = null;
            self.completionDate = null;
            self.startDate = null;
            self.dueDate = null;
            self.taskCreatorComment = null;
            self.participantReply = null;
            self.allDay = false;
            self.addtoUserFollowup = false;

            self.startTime = configurationService.DEFAULT_START_TASK_TIME;
            self.endTime = null;
            self.participantId = null;
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            TaskParticipant.prototype.generateFromOUApplicationUser = function (model) {
                var self = this;
                self.userId.arName = model.applicationUser.arFullName;
                self.userId.enName = model.applicationUser.enFullName;
                self.userId.id = model.applicationUser.id;
                self.ouId = new Information(model.ouInfo);
                self.participantId = Number(self.userId.id + '' + self.ouId.id);
                return self;
            };

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            TaskParticipant.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            TaskParticipant.prototype.setId = function (id) {
                this.id = id;
                return this;
            };
            TaskParticipant.prototype.setUserId = function (userId) {
                this.userId = userId;
                return this;
            };
            TaskParticipant.prototype.setOuId = function (ouId) {
                this.ouId = ouId;
                return this;
            };
            TaskParticipant.prototype.setTaskDetailsId = function (taskDetailsId) {
                this.taskDetailsId = taskDetailsId;
                return this;
            };
            TaskParticipant.prototype.setTaskState = function (taskState) {
                this.taskState = taskState;
                return this;
            };
            TaskParticipant.prototype.setCompletionDate = function (completionDate) {
                this.completionDate = completionDate;
                return this;
            };
            TaskParticipant.prototype.setStartDate = function (startDate) {
                this.startDate = startDate;
                return this;
            };
            TaskParticipant.prototype.setDueDate = function (dueDate) {
                this.dueDate = dueDate;
                return this;
            };
            TaskParticipant.prototype.setTaskCreatorComment = function (taskCreatorComment) {
                this.taskCreatorComment = taskCreatorComment;
                return this;
            };
            TaskParticipant.prototype.setParticipantReply = function (participantReply) {
                this.participantReply = participantReply;
                return this;
            };
            TaskParticipant.prototype.setAllDay = function (allDay) {
                this.allDay = allDay;
                return this;
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('TaskParticipant', 'init', this);
        }
    })
};
