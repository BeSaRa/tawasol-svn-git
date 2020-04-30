module.exports = function (app) {
    app.factory('ReferencePlanItemResult', function (CMSModelInterceptor,
                                                     lookupService,
                                                     langService,
                                                     Lookup,
                                                     _) {
        'ngInject';
        return function ReferencePlanItemResult(model) {
            var self = this,
                exportedData = {
                    organization: function () {
                        return this.getTranslatedOUName();
                    },
                    reference_number_plan: function () {
                        return this.getTranslatedName();
                    },
                    max_serial_number: 'maxSerial',
                    reference_plan_element_expression: 'refernceItemExpression',
                    description: 'referncePlanItemDescription',
                    type: function () {
                        return this.getPerOUEntityTranslate();
                    }
                };
            self.referncePlanId = null;
            self.referencePlanArName = null;
            self.referencePlanEnName = null;
            self.referncePlanItemId = null;
            self.referncePlanItemFormat = null;
            self.refernceItemExpression = null;
            self.perEntity = null;
            self.perOU = null;
            self.referncePlanItemDescription = null;
            self.maxSerial = null;
            self.serialYear = null;
            self.ouId = null;
            self.ouArName = null;
            self.ouEnName = null;

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);
            /**
             * @description Get the translated arabic or english name according to current language for application user. If reverse is passed, it will return the name in language other than current language
             * @param reverse
             * @returns {string}
             */
            ReferencePlanItemResult.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.refPlanInfo.enName : this.refPlanInfo.arName) : (reverse ? this.refPlanInfo.arName : this.refPlanInfo.enName);
            };
            /**
             * @description Get the translated arabic or english name according to current language for application user. If reverse is passed, it will return the name in language other than current language
             * @param reverse
             * @returns {string}
             */
            ReferencePlanItemResult.prototype.getTranslatedOUName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.ouInfo.enName : this.ouInfo.arName) : (reverse ? this.ouInfo.arName : this.ouInfo.enName);
            };

            ReferencePlanItemResult.prototype.getPerOUEntityTranslate = function () {
                return this.perOU ? langService.get('per_ou') : langService.get('per_entity');
            };

            ReferencePlanItemResult.prototype.getExportedData = function () {
                return exportedData;
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('ReferencePlanItemResult', 'init', this);
        }
    })
};
