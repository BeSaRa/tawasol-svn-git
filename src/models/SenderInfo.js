module.exports = function (app) {
    app.factory('SenderInfo', function (CMSModelInterceptor,
                                        langService) {
        'ngInject';
        return function SenderInfo(model) {
            var self = this;
            self.id = null;
            self.arName = null;
            self.enName = null;
            self.parent = true;

            //The properties below are for user purpose only. Don't send if we need to send the sender object
            self.ouId = null;
            self.domainName = null;
            self.ouArName = null;
            self.ouEnName = null;
            self.msTeamsChatURL = null;

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            SenderInfo.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the concatenated arabic name and english name with separator passed for entity name. If no separator is passed, it will take hyphen(-)
             * @param separator
             * @returns {string}
             */
            SenderInfo.prototype.getNames = function (separator) {
                return this.arName + ' ' + (separator ? separator : '-') + ' ' + this.enName;
            };

            /**
             * @description Get the translated arabic or english name according to current language for entity name. If reverse is passed, it will return the name in language other than current language
             * @param reverse
             * @returns {string}
             */
            SenderInfo.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.enName : this.arName) : (reverse ? this.arName : this.enName);
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('SenderInfo', 'init', this);
        }
    })
};
