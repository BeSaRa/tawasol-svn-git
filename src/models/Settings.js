module.exports = function (app) {
    app.factory('Settings', function (CMSModelInterceptor,
                                      generator,
                                      Theme) {
        'ngInject';
        return function Settings(model) {
            var self = this;
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model) {
                if (model.theme)
                    model.theme = generator.interceptReceivedInstance('Theme', new Theme(model.theme));
                angular.extend(this, model);
            }


            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            Settings.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            /**
             * @description check if one of export options enabled.
             * @returns {boolean}
             */
            Settings.prototype.hasExportOptions = function () {
                return (this.exportAttachment || this.exportLinkedDoc || this.exportLinkedObj);
            };

            Settings.prototype.canExport = function (property) {
                return !!this['export' + property];
            };
            Settings.prototype.getAvailableTypes = function () {
                return this.fileTypesMap;
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('Settings', 'init', this);
        }
    })
};