module.exports = function (app) {
    app.factory('UserFilter', function (CMSModelInterceptor, toast, dialog, langService, _) {
        'ngInject';
        return function UserFilter(model) {
            var self = this, userFilterService;
            self.id = null;
            self.isDefault = true;
            self.userId = null;
            self.ouId = null;
            self.expression = null;
            self.parsedExpression = null;
            self.arName = null;
            self.enName = null;
            self.sortOptionId = null;
            self.status = true;
            self.filterCriteria = {};
            // not related to the model.
            self.ui = {
                key_2: {
                    value: null
                },
                key_3: {
                    value: null
                },
                key_4: {
                    value: null
                },
                key_5: {
                    value: null
                },
                key_6: {
                    value: null
                },
                key_7: {
                    value: null
                },
                key_8: {
                    value: null
                },
                key_9: {
                    value: null
                },
                key_10: {
                    value1: null,
                    value2: null
                },
                key_11: {
                    value1: null,
                    value2: null
                },
                key_12: {
                    value: null
                }
            };
            // this is available keys for the current ui model
            var availableKeys = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);


            /**
             * @description function to get the correct type for the given value.
             * @param value
             * @returns {Number|String}
             * @private
             */
            function _getCorrectValue(value) {
                return !value.length || isNaN(Number(value)) ? value : Number(value);
            }

            UserFilter.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            UserFilter.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            UserFilter.prototype.setUserFilterService = function (service) {
                userFilterService = service;
                return this;
            };
            UserFilter.prototype.saveUserFilter = function (ignoreMessage) {
                return this.id ? this.modelUpdateUserFilter(ignoreMessage) : this.modelCreateUserFilter(ignoreMessage);
            };
            UserFilter.prototype.modelUpdateUserFilter = function (ignoreMessage) {
                return userFilterService.updateUserFilter(this, ignoreMessage);
            };
            UserFilter.prototype.modelCreateUserFilter = function (ignoreMessage) {
                return userFilterService.addUserFilter(this, ignoreMessage);
            };
            UserFilter.prototype.prepareSendUserFilter = function () {
                var self = this;
                _.map(availableKeys, function (number) {
                    var two = Object.keys(self.ui['key_' + number]).length > 1;
                    self.filterCriteria[number] = two ? (self.ui['key_' + number]['value1'] + ',' + self.ui['key_' + number]['value2']) : self.ui['key_' + number].value;
                });
                delete this.ui;
                _.map(availableKeys, function (index) {
                    if (self.filterCriteria[index] === null || self.filterCriteria[index] === 'null,null' || self.filterCriteria[index] === 'null') {
                        delete self.filterCriteria[index];
                    }
                });
                return this;

            };


            UserFilter.prototype.prepareReceivedUserFilter = function () {
                var criteria = angular.fromJson(this.parsedExpression), self = this;
                _.map(criteria, function (value, key) {
                    var count = Object.keys(self.ui['key_' + key]); // to get field count
                    if (count > 1) {
                        self.ui['key_' + key].value1 = _getCorrectValue(value.split(',').shift());
                        self.ui['key_' + key].value2 = _getCorrectValue(value.split(',').pop());
                    } else {
                        self.ui['key_' + key].value = _getCorrectValue(value);
                    }
                });
            };

            UserFilter.prototype.getTranslatedName = function () {
                return langService.current === 'ar' ? this.arName : this.enName;
            };

            UserFilter.prototype.deleteFilter = function ($event, ignoreMessage) {
                var self = this;
                return dialog.confirmMessage(langService.get('confirm_remove').change({name: this.getTranslatedName()}), null, null, $event).then(function () {
                    return userFilterService.deleteUserFilter(self, ignoreMessage);
                });
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('UserFilter', 'init', this);
        }
    })
};