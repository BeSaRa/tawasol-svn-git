module.exports = function (app) {
    app.factory('MAIPLabel', function (CMSModelInterceptor,
                                       langService) {
        'ngInject';
        return function MAIPLabel(model) {
            var self = this;
            self.id = null;
            self.name = null;
            self.children = [];
            self.sensitivity = null;
            self.description = null;

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            MAIPLabel.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            /**
             * @description Get the name of Member.
             * @returns {string}
             */
            MAIPLabel.prototype.getTranslatedName = function (reverse) {
                return this.name;
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('Member', 'init', this);
        }
    })
};
