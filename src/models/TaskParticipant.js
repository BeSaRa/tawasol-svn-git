module.exports = function (app) {
    app.factory('TaskParticipant', function (CMSModelInterceptor) {
        'ngInject';
        return function TaskParticipant(model) {
            var self = this;
            self.id = null;
            self.userId = null;
            self.ouId = null;
            self.taskDetailsId = null;
            self.taskState = null;
            self.completionDate = null;
            self.dueDate = null;
            self.taskCreatorComment = null;
            self.participantReply = null;
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            TaskParticipant.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('TaskParticipant', 'init', this);
        }
    })
};
