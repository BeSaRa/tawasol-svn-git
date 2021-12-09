module.exports = function (app) {
    app.factory('TaskCalenderItem', function (CMSModelInterceptor, moment, langService) {
        'ngInject';
        return function TaskCalenderItem(model) {
            var self = this;
            self.taskId = null;
            self.creatorInfo = null;
            self.ouInfo = null;
            self.taskParticipantId = null;
            self.isCreator = null;
            self.taskTitle = null;
            self.taskDescription = null;
            self.wobNum = null;
            self.documentVSID = null;
            self.docClassId = null;
            self.taskState = null;
            self.participantTaskState = null;
            self.participantInfo = null;
            self.participantOuInfo = null;
            self.categoryId = null;
            self.creationDate = null;
            self.participantDueDate = null;
            self.taskDueDate = null;
            self.taskCompletionDate = null;
            self.participantCompletionDate = null;
            self.allDay = null;
            self.taskStartDate = null;
            self.participantStartDate = null;
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            TaskCalenderItem.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            TaskCalenderItem.prototype.getHumanDueDate = function () {
                moment.locale(langService.current);
                var locale = moment(this.taskDueDate);
                moment.locale('en');
                return locale.from((new Date()));
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('TaskCalenderItem', 'init', this);
        }
    })
};
