module.exports = function (app) {
    app.factory('FollowupBookCriteria', function (CMSModelInterceptor,
                                                  FollowupBook) {
        'ngInject';
        return function FollowupBookCriteria(model) {
            var self = this;
            FollowupBook.call(this);
            self.siteCriteria = null;
            self.fromFollowupDate = null;
            self.toFollowupDate = null;
            self.fromDocDate = null;
            self.toDocDate = null;
            self.forPrinting = false;

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            FollowupBookCriteria.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('FollowupBookCriteria', 'init', this);
        }
    });
};
