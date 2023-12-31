module.exports = function (app) {
    app.factory('SmsTemplate', function (CMSModelInterceptor,
                                         langService) {
        'ngInject';
        return function SmsTemplate(model) {
            var self = this;
            self.id = null;
            self.arName = null;
            self.enName = null;
            self.status = true;
            self.isGlobal = true;
            self.arMessage = null;
            self.enMessage = null;
            self.smstemplateSubscribers = [];

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [
                'arName',
                'enName',
                'status',
                'isGlobal',
                'arMessage',
                'enMessage',
                //'smstemplateSubscribers'
            ];


            if (model)
                angular.extend(this, model);

            /**
             * @description Get all required fields
             * @return {Array|requiredFields}
             */
            SmsTemplate.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            /**
             * @description Get the concatenated arabic name and english name with separator passed for sms template. If no separator is passed, it will take hyphen(-)
             * @param separator
             * @returns {string}
             */
            SmsTemplate.prototype.getNames = function (separator) {
                return this.arName + ' ' + (separator ? separator : '-') + ' ' + this.enName;
            };

            /**
             * @description Get the translated arabic or english name according to current language for sms template. If reverse is passed, it will return the name in language other than current language
             * @param reverse
             * @returns {string}
             */
            SmsTemplate.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.enName : this.arName ) : (reverse ? this.arName : this.enName);
            };

            SmsTemplate.prototype.getMessageTranslatedName = function () {
                return this[langService.current + 'Message'];
            }

            /**
             * @description Get the status of sms template as Active or Inactive instead of true or false.
             * @returns {string}
             */
            SmsTemplate.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };

            /**
             * @description Get the globalization of sms template as Yes or No instead of true or false.
             * @returns {string}
             */
            SmsTemplate.prototype.getTranslatedGlobal = function () {
                return this.isGlobal ? langService.get('yes') : langService.get('no');
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('SmsTemplate', 'init', this);
        }
    })
};