module.exports = function (app) {
    app.factory('Task', function (CMSModelInterceptor) {
        'ngInject';
        return function Task(model) {
            var self = this;
            self.id = null;
            self.taskTitle = null;
            self.taskDescription = null;
            self.userId = null;
            self.ouId = null;
            self.category = null;
            self.taskState = null;
            self.creationDate = null;
            self.dueDate = null;
            self.completionDate = null;
            self.weobNum = null;
            self.documentVsId = null;
            self.docClassName = null;
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            Task.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('Task', 'init', this);
        }
    })
};
