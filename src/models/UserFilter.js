module.exports = function (app) {
    app.factory('UserFilter', function (CMSModelInterceptor, toast, dialog, langService, _, generator) {
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
                },
                key_13: {
                    value: null
                },
                key_14: {
                    value: null
                },
                key_15: {
                    value: null
                },
                key_16: {
                    value: null
                },
                key_17: {
                    value: null
                },
                key_18: {
                    value: null
                },
                key_19: {
                    value: null
                },
                key_20: {
                    value: null
                },
                key_21: {
                    value: null
                },
                key_22: {
                    value: null
                },
                // anonymous properties - to be removed when sending
                key_linkedAttachments: {
                    value: null
                },
                key_linkedDocs: {
                    value: null
                },
                key_linkedEntities: {
                    value: null
                },
            };
            // this is available keys for the current ui model
            var availableKeys = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            var naValue = 'N/A';

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
            /*UserFilter.prototype.getTranslatedDueDate = function ($event) {
                return this.ui.key_8.value ? langService.get('yes') : langService.get('no');
            };*/
            UserFilter.prototype.getTranslatedYesNo = function (lookupKey, $event) {
                return this.ui[lookupKey].value ? langService.get('yes') : langService.get('no');
            };
            UserFilter.prototype.saveUserFilter = function (ignoreMessage) {
                return this.id ? this.modelUpdateUserFilter(ignoreMessage) : this.modelCreateUserFilter(ignoreMessage);
            };
            UserFilter.prototype.modelUpdateUserFilter = function (ignoreMessage) {
                var self = this;
                return userFilterService.updateUserFilter(this, ignoreMessage).then(function (filter) {
                    return self.prepareReceivedUserFilter();
                });
            };
            UserFilter.prototype.modelCreateUserFilter = function (ignoreMessage) {
                return userFilterService.addUserFilter(this, ignoreMessage);
            };
            UserFilter.prototype.prepareSendUserFilter = function () {
                var self = this;
                self.arName = self.arName ? self.arName : naValue;
                self.enName = self.enName ? self.enName : naValue;
                // Received date greater than
                if (self.ui.key_4.value) {
                    var key_4 = new Date(self.ui.key_4.value);
                    self.ui.key_4.value = generator.getTimeStampFromDate(new Date(key_4.getFullYear(), key_4.getMonth(), key_4.getDate(), 23, 59, 59, 999), true);
                }
                // Received date less than
                else if (self.ui.key_6.value) {
                    self.ui.key_6.value = generator.getTimeStampFromDate(self.ui.key_6.value, true);
                }
                // Received date between
                else if (self.ui.key_11.value1 && self.ui.key_11.value2) {
                    self.ui.key_11.value1 = generator.getTimeStampFromDate(self.ui.key_11.value1, true);
                    var dateTo = new Date(self.ui.key_11.value2);
                    self.ui.key_11.value2 = generator.getTimeStampFromDate(new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate(), 23, 59, 59, 999), true);
                }
                // Due date between
                if (self.ui.key_10.value1 && self.ui.key_10.value2) {
                    self.ui.key_10.value1 = generator.getTimeStampFromDate(self.ui.key_10.value1, true);
                    var dateTo = new Date(self.ui.key_10.value2);
                    self.ui.key_10.value2 = generator.getTimeStampFromDate(new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate(), 23, 59, 59, 999), true);
                }
                // Due date exists
                self.ui.key_8.value = self.ui.key_8.value ? '-2000000000000L' : null;

                //Doc full serial
                self.ui.key_13.value = self.ui.key_13.value ? self.ui.key_13.value : null;

                // Security Level
                self.ui.key_14.value = self.ui.key_14.value ? self.ui.key_14.value : null;

                // Priority Level
                var priorityLevel = self.ui.key_15.value;
                if (typeof  priorityLevel === 'undefined' || priorityLevel === null && priorityLevel === '')
                    self.ui.key_15.value = null;

                // Linked Docs
                if (self.ui.key_linkedDocs.value === 16) {
                    self.ui.key_16.value = 0;
                    self.ui.key_18.value = null;
                }
                else if (self.ui.key_linkedDocs.value === 18) {
                    self.ui.key_18.value = 0;
                    self.ui.key_16.value = null;
                }
                else {
                    self.ui.key_18.value = null;
                    self.ui.key_16.value = null;
                }

                // Attachments
                if (self.ui.key_linkedAttachments.value === 19) {
                    self.ui.key_19.value = 0;
                    self.ui.key_21.value = null;
                }
                else if (self.ui.key_linkedAttachments.value === 21) {
                    self.ui.key_21.value = 0;
                    self.ui.key_19.value = null;
                }
                else {
                    self.ui.key_21.value = null;
                    self.ui.key_19.value = null;
                }

                // Linked Entities
                if (self.ui.key_linkedEntities.value === 17) {
                    self.ui.key_17.value = 0;
                    self.ui.key_22.value = null;
                }
                else if (self.ui.key_linkedEntities.value === 22) {
                    self.ui.key_22.value = 0;
                    self.ui.key_17.value = null;
                }
                else {
                    self.ui.key_22.value = null;
                    self.ui.key_17.value = null;
                }

                // Is Open (check for null value, because true, false, null are three values and both true and false are accepted
                self.ui.key_20.value = (self.ui.key_20.value === null) ? null : self.ui.key_20.value;

                self.filterCriteria = self.filterCriteria || {};
                _.map(availableKeys, function (number) {
                    var two = Object.keys(self.ui['key_' + number]).length > 1;
                    self.filterCriteria[number] = two ? (self.ui['key_' + number]['value1'] + ',' + self.ui['key_' + number]['value2']) : self.ui['key_' + number].value;
                });
                delete this.ui;
                _.map(availableKeys, function (index) {
                    if (self.filterCriteria[index] === null || self.filterCriteria[index] === 'null' || self.filterCriteria[index] === "" || self.filterCriteria[index] === 'null,null') {
                        delete self.filterCriteria[index];
                    }
                });
                return this;
            };

            UserFilter.prototype.prepareReceivedUserFilter = function () {
                var criteria = angular.fromJson(this.parsedExpression),
                    self = this;

                self.arName = (self.arName !== naValue) ? self.arName : null;
                self.enName = (self.enName !== naValue) ? self.enName : null;

                _.map(criteria, function (value, key) {
                    var count = Object.keys(self.ui['key_' + key]).length; // to get field count
                    if (count > 1) {
                        self.ui['key_' + key].value1 = _getCorrectValue(value.split(',').shift());
                        self.ui['key_' + key].value2 = _getCorrectValue(value.split(',').pop());
                    } else {
                        self.ui['key_' + key].value = _getCorrectValue(value);
                    }
                });

                // Received date greater than
                self.ui.key_4.value = generator.getDateFromTimeStamp(self.ui.key_4.value);
                // Received date less than
                self.ui.key_6.value = generator.getDateFromTimeStamp(self.ui.key_6.value);
                // Received date between
                self.ui.key_11.value1 = generator.getDateFromTimeStamp(self.ui.key_11.value1);
                self.ui.key_11.value2 = generator.getDateFromTimeStamp(self.ui.key_11.value2);

                self.selectedReceivedDateFilterType = self.getSelectedDateType(['key_4', 'key_6', 'key_11']);

                // Due date between
                self.ui.key_10.value1 = generator.getDateFromTimeStamp(self.ui.key_10.value1);
                self.ui.key_10.value2 = generator.getDateFromTimeStamp(self.ui.key_10.value2);

                // Due date exists
                self.ui.key_8.value = (self.ui.key_8.value === '-2000000000000L');

                // linked docs
                if (self.ui.key_16.value !== null)
                    self.ui.key_linkedDocs.value = 16;
                else if (self.ui.key_18.value !== null)
                    self.ui.key_linkedDocs.value = 18;

                // linked attachments
                if (self.ui.key_19.value !== null)
                    self.ui.key_linkedAttachments.value = 19;
                else if (self.ui.key_21.value !== null)
                    self.ui.key_linkedAttachments.value = 21;

                // linked entities
                if (self.ui.key_17.value !== null)
                    self.ui.key_linkedEntities.value = 17;
                else if (self.ui.key_22.value !== null)
                    self.ui.key_linkedEntities.value = 22;

                return this;
            };

            UserFilter.prototype.getTranslatedName = function () {
                if (langService.current === 'ar')
                    return this.arName ? this.arName : this.enName;
                else if (langService.current === 'en')
                    return this.enName ? this.enName : this.arName;
                else
                    return langService.current === 'ar' ? this.arName : this.enName;
            };

            UserFilter.prototype.getNames = function (separator) {
                if (this.arName && this.enName)
                    return this.arName + ' ' + (separator ? separator : '-') + ' ' + this.enName;
                else if (this.arName && !this.enName)
                    return this.arName;
                else if (!this.arName && this.enName)
                    return this.enName;
            };

            UserFilter.prototype.deleteFilter = function ($event, ignoreMessage) {
                var self = this;
                return dialog.confirmMessage(langService.get('confirm_remove').change({name: this.getTranslatedName()}), null, null, $event).then(function () {
                    return userFilterService.deleteUserFilter(self, ignoreMessage);
                });
            };

            UserFilter.prototype.getSelectedDateType = function (dateKeys) {
                var value, keyNo, selected, self = this;
                for (var key in self.ui) {
                    value = self.ui[key].hasOwnProperty('value') ? self.ui[key].value
                        : (self.ui[key].hasOwnProperty('value1') ? self.ui[key].value1 : null);

                    keyNo = Number(key.substr(key.indexOf('_') + 1));

                    if (dateKeys.indexOf(key) > -1 && value) {
                        selected = keyNo;
                        break;
                    }
                }
                return selected || null;
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('UserFilter', 'init', this);
        }
    })
};