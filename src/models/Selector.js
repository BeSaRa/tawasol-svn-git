module.exports = function (app) {
    app.factory('Selector', function (CMSModelInterceptor) {
        'ngInject';
        return function Selector(element, property) {
            var self = this;
            self.element = element;
            self.property = property ? property : 'background-color';
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];


            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            Selector.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            Selector.prototype.setValue = function (value) {
                this.value = value;
                return this;
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('Selector', 'init', this);
        }
    })
};