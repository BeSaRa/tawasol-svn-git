module.exports = function (app) {
    app.factory('WorkItemType', function (CMSModelInterceptor,
                                          langService) {
        'ngInject';
        return function WorkItemType(model) {
            var self = this;
            self.id = null;
            self.orginality = null;

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            WorkItemType.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the translated arabic or english name according to current language for workitem type. If reverse is passed, it will return the name in language other than current language
             * @returns {string}
             */
            WorkItemType.prototype.getTranslatedName = function () {
                return this.orginality === 0 ? langService.get('copied') : langService.get('main');
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('WorkItemType', 'init', this);
        }
    })
};