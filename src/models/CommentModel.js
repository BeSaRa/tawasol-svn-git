module.exports = function (app) {
    app.factory('CommentModel', function (CMSModelInterceptor) {
        'ngInject';
        return function CommentModel(model) {
            var self = this;
            self.vsid = null;
            self.comments = null;
            self.wobNum = null;
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            CommentModel.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('CommentModel', 'init', this);
        }
    })
};