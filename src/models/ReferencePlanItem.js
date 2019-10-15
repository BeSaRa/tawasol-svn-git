module.exports = function (app) {
    app.factory('ReferencePlanItem', function (CMSModelInterceptor,
                                               lookupService,
                                               langService,
                                               Lookup,
                                               _) {
        'ngInject';
        return function ReferencePlanItem(model) {
            var self = this;
            self.id = null;
            self.refernceExpression = null;
            self.refernceFormat = '';
            self.perEntity = true;
            self.perOu = false;
            self.referncePlanId = null;
            self.components = [];
            self.expressionComponents = {
                classDescription: "",
                securityLevel: null,
                docType: null
            };

            self.referenceOptions = {};

            var strings = ['classDescription'];

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            ReferencePlanItem.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            ReferencePlanItem.prototype.fetchItemComponent = function () {
                var self = this;
                self.referenceOptions = JSON.parse(this.referenceOptions);

                this.components = _.map(this.refernceFormat.split('|'), function (item) {
                    var lookupKey = item.split(':').pop();
                    var separator = item.split(':').shift();
                    var lookup = angular.copy(lookupService.getLookupByLookupKey(lookupService.refrenceNumberPlanElement, lookupKey));

                    lookup && separator !== 'none' ? (function () {
                        lookup.required = self.referenceOptions && self.referenceOptions.hasOwnProperty(lookup.lookupKey) ? self.referenceOptions[lookup.lookupKey] : true;
                    })() : null;

                    return lookup && separator !== 'none' ? lookup : new Lookup({
                        lookupStrKey: lookupKey,
                        defaultArName: langService.getKey('static_text', 'ar'),
                        defaultEnName: langService.getKey('static_text', 'en'),
                        lookupKey: 'SEPARATOR'
                    });
                });

                var array = self.refernceExpression ? self.refernceExpression.split('&&') : [];
                var remaining = Object.keys(self.expressionComponents);

                _.map(array, function (item) {
                    var key = item.split('==')[0].trim();
                    var value = item.split('==')[1];
                    if (strings.indexOf(key) !== -1) {
                        value = value.replace(/'/g, '').trim();
                    } else {
                        value = Number(value);
                    }
                    if (key) {
                        self.expressionComponents[key] = value;
                        if (remaining.indexOf(key) !== -1) {
                            remaining.splice(remaining.indexOf(key), 1);
                        }
                    }
                });
                _.map(remaining, function (key) {
                    self.expressionComponents[key] = strings.indexOf(key) !== -1 ? "" : null;
                });
                return this;
            };

            ReferencePlanItem.prototype.retrieveItemComponent = function () {
                var self = this;
                self.referenceOptions = {};

                var ids = _.map(this.components, function (lookup) {
                    var item;
                    if (lookup.id) {
                        item = 'id:' + lookup.lookupKey;
                        lookup.required ? self.referenceOptions[lookup.lookupKey] = true : self.referenceOptions[lookup.lookupKey] = false;
                    } else {
                        item = 'none:' + lookup.lookupStrKey;
                    }
                    return item;
                });
                this.refernceFormat = ids.join('|');
                var array = [];
                _.map(self.expressionComponents, function (value, key) {
                    if (value) {
                        value = (strings.indexOf(key) !== -1) ? "'" + value + "'" : value;
                        array.push((key + ' == ' + value))
                    }
                });
                self.refernceExpression = array.join(" && ");
                self.referenceOptions = JSON.stringify(self.referenceOptions);
                return this;
            };
            /**
             * @description to check if has format
             * @returns {number|boolean}
             */
            ReferencePlanItem.prototype.hasFormat = function () {
                return this.components.length && _.some(this.components, function (item) {
                    return item.lookupKey !== 'SEPARATOR';
                });
            };
            /**
             * @description set per organization unit reverse to Per Entity.
             * @param perOu
             */
            ReferencePlanItem.prototype.setPerOU = function (perOu) {
                this.perOu = perOu;
                this.perEntity = !this.perOu;
            };

            ReferencePlanItem.prototype.getPerOUEntityTranslate = function () {
                return this.perOu ? langService.get('per_ou') : langService.get('per_entity');
            };

            ReferencePlanItem.prototype.getExpressionFormat = function () {
                return this.refernceExpression !== '' ? this.refernceExpression : langService.get('all');
            };

            ReferencePlanItem.prototype.isItemForAll = function () {
                return this.refernceExpression === '';
            };

            ReferencePlanItem.prototype.setComponents = function (components) {
                this.components = components;
                return this;
            };

            ReferencePlanItem.prototype.hasSerialComponent = function () {
                return _.some(this.components, function (item) {
                    return item.lookupStrKey && item.lookupStrKey === 'SERIAL';
                });
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('ReferencePlanItem', 'init', this);
        }
    })
};
