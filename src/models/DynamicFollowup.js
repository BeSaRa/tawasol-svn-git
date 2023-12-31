module.exports = function (app) {
    app.factory('DynamicFollowup', function (CMSModelInterceptor,
                                             langService,
                                             _,
                                             Site,
                                             Lookup,
                                             lookupService,
                                             generator) {
        'ngInject';
        return function DynamicFollowup(model) {
            var self = this, dynamicFollowupService;
            self.id = null;
            self.creatorId = null;
            self.ouId = null;
            self.arName = null;
            self.enName = null;
            self.itemOrder = null;
            self.status = true;
            self.filterCriteria = {};
            self.docClassId = null;
            self.slaDays = null;
            self.participantSet = [];
            self.securityLevel = null;
            // not related to the model.
            self.ui = {
                // DocType(document class) equals
                key_2: {
                    value: null
                },
                // DocSubject contains
                key_3: {
                    value: null
                },
                // ReceivedDate greater than
                key_4: {
                    value: null
                },
                // Site Info equals
                key_5: {
                    value: null
                },
                // ReceivedDate less than
                key_6: {
                    value: null
                },
                // Action equals
                key_7: {
                    value: null
                },
                // Due date exists
                key_8: {
                    value: null
                },
                // Sender equals
                key_9: {
                    value: null
                },
                // Due date between
                key_10: {
                    value1: null,
                    value2: null
                },
                // Received date between
                key_11: {
                    value1: null,
                    value2: null
                },
                // DocCategory(document type) equals
                key_12: {
                    value: null
                },
                // docFullSerial contains
                key_13: {
                    value: null
                },
                // securityLevel equals
                key_14: {
                    value: null
                },
                // priorityLevel equals
                key_15: {
                    value: null
                },
                // has linkedDocsNO
                key_16: {
                    value: null
                },
                // has linkedEntities
                key_17: {
                    value: null
                },
                // has no linkedDocs
                key_18: {
                    value: null
                },
                // has attachments
                key_19: {
                    value: null
                },
                // isOpen
                key_20: {
                    value: null
                },
                // has no attachments
                key_21: {
                    value: null
                },
                // has no linkedEntities
                key_22: {
                    value: null
                },
                // Main Classification
                key_23: {
                    value: null
                },
                // Sub Classification
                key_24: {
                    value: null
                },
                key_25: {
                    value: null
                },
                // multiple main sites and sub sites
                key_26: {
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
                key_siteType: {
                    value: null
                },
                key_mainSite: {
                    value: null
                },
                key_subSite: {
                    value: null
                },
                key_mainSubSites: {
                    value: null
                }
            };
            // this is available keys for the current ui model
            var availableKeys = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26];

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];
            var naValue = 'N/A';

            if (model)
                angular.extend(this, model);


            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            DynamicFollowup.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            DynamicFollowup.prototype.setDynamicFollowupService = function (service) {
                dynamicFollowupService = service;
                return this;
            };

            DynamicFollowup.prototype.getTranslatedYesNo = function (lookupKey, $event) {
                return this.ui[lookupKey].value ? langService.get('yes') : langService.get('no');
            };

            DynamicFollowup.prototype.getTranslatedName = function (reverse) {
                return langService.current === 'ar' ? (reverse ? this.enName : this.arName) : (reverse ? this.arName : this.enName);
            };

            DynamicFollowup.prototype.prepareSendDynamicFollowup = function () {
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

                //Doc category
                self.ui.key_12.value = self.ui.key_12.value ? self.ui.key_12.value : null;

                //Doc full serial
                self.ui.key_13.value = self.ui.key_13.value ? self.ui.key_13.value : null;

                // Security Level
                self.ui.key_14.value = self.ui.key_14.value ? self.ui.key_14.value : null;

                // Priority Level
                var priorityLevel = self.ui.key_15.value;
                if (typeof priorityLevel === 'undefined' || priorityLevel === null && priorityLevel === '')
                    self.ui.key_15.value = null;

                // Linked Docs
                if (self.ui.key_linkedDocs.value === 16) {
                    self.ui.key_16.value = 0;
                    self.ui.key_18.value = null;
                } else if (self.ui.key_linkedDocs.value === 18) {
                    self.ui.key_18.value = 0;
                    self.ui.key_16.value = null;
                } else {
                    self.ui.key_18.value = null;
                    self.ui.key_16.value = null;
                }

                // Attachments
                if (self.ui.key_linkedAttachments.value === 19) {
                    self.ui.key_19.value = 0;
                    self.ui.key_21.value = null;
                } else if (self.ui.key_linkedAttachments.value === 21) {
                    self.ui.key_21.value = 0;
                    self.ui.key_19.value = null;
                } else {
                    self.ui.key_21.value = null;
                    self.ui.key_19.value = null;
                }

                // Linked Entities
                if (self.ui.key_linkedEntities.value === 17) {
                    self.ui.key_17.value = 0;
                    self.ui.key_22.value = null;
                } else if (self.ui.key_linkedEntities.value === 22) {
                    self.ui.key_22.value = 0;
                    self.ui.key_17.value = null;
                } else {
                    self.ui.key_22.value = null;
                    self.ui.key_17.value = null;
                }

                // Is Open (check for null value, because true, false, null are three values and both true and false are accepted
                self.ui.key_20.value = (self.ui.key_20.value === null) ? null : self.ui.key_20.value;

                self.ui.key_5.value = null;
                // site type
                if (self.ui.key_siteType.value) {
                    self.ui.key_siteType.value = self.ui.key_siteType.value.hasOwnProperty('lookupKey') ? self.ui.key_siteType.value.lookupKey : self.ui.key_siteType.value;
                } else {
                    self.ui.key_siteType.value = null;
                    // if site type is null, set main site, sub site as null
                    self.ui.key_mainSite.value = null;
                    self.ui.key_subSite.value = null;
                    self.ui.key_26.value = null;
                }

                // main site
                if (self.ui.key_mainSite.value) {
                    self.ui.key_mainSite.value = self.ui.key_mainSite.value.hasOwnProperty('id') ? self.ui.key_mainSite.value.id : self.ui.key_mainSite.value;
                } else {
                    self.ui.key_mainSite.value = null;
                    // if main site is null, set sub site null
                    self.ui.key_subSite.value = null;
                }

                // sub site
                if (self.ui.key_subSite.value) {
                    self.ui.key_subSite.value = self.ui.key_subSite.value.hasOwnProperty('id') ? self.ui.key_subSite.value.id : self.ui.key_subSite.value;
                } else {
                    self.ui.key_subSite.value = null;
                }

                // correspondence sites
                if (self.ui.key_siteType.value != null || self.ui.key_mainSite.value != null || self.ui.key_subSite.value != null) {
                    self.ui.key_5.value = {};
                    if (self.ui.key_siteType.value) {
                        self.ui.key_5.value.siteType = angular.copy(self.ui.key_siteType.value);
                    }
                    if (self.ui.key_mainSite.value) {
                        self.ui.key_5.value.mainSiteId = angular.copy(self.ui.key_mainSite.value);
                    }
                    if (self.ui.key_subSite.value) {
                        self.ui.key_5.value.subSiteId = angular.copy(self.ui.key_subSite.value);
                    }
                    self.ui.key_5.value = JSON.stringify(self.ui.key_5.value);
                }
                self.ui.key_25.value = (self.ui.key_25.value === null) ? null : self.ui.key_25.value;

                var mainSubSitesCopy = null;
                if (self.ui.key_mainSubSites.value && self.ui.key_mainSubSites.value.length) {
                    self.ui.key_26.value = {};
                    mainSubSitesCopy = angular.copy(self.ui.key_mainSubSites.value);
                    mainSubSitesCopy = _.chain(mainSubSitesCopy).groupBy("mainSiteId")
                        .map((sites, key) => ({
                                mainSiteId: key,
                                subSiteList: _.filter(_.map(sites, 'subSiteId'), site => site !== null)
                            })
                        ).value()
                } else {
                    self.ui.key_26.value = null;
                }
                self.ui.key_26.value = (self.ui.key_26.value === null) ? null : JSON.stringify(mainSubSitesCopy);

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

            DynamicFollowup.prototype.prepareReceivedDynamicFollowup = function () {
                var criteria = angular.fromJson(this.parsedExpression),
                    self = this,
                    extraCriteria = angular.fromJson(this.extraCriteria);

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

                // correspondence sites (key 5 - use it from extraCriteria because parsed expression will not have full information for siteInfo)
                if (extraCriteria && extraCriteria.hasOwnProperty('5')) {
                    var siteInfo = extraCriteria[5];
                    //self.ui.key_5.value = JSON.parse(self.ui.key_5.value);
                    if (siteInfo.siteType) {
                        self.ui.key_siteType.value = siteInfo.siteType;
                    }
                    if (siteInfo.mainSiteId) {
                        self.ui.key_mainSite.value = siteInfo.mainSiteId;
                    }
                    if (siteInfo.subSiteId) {
                        self.ui.key_subSite.value = siteInfo.subSiteId;
                    }
                }

                if (extraCriteria && extraCriteria.hasOwnProperty('26')) {
                    // extraCriteria[26] => [{childSites:[],mainSite:{}}, ...]
                    var mainSubSites = extraCriteria[26], mappedSites = [];
                    mainSubSites.forEach(site => {
                        if (!site.childSites.length) {
                            mappedSites.push(generator.generateInstance(site.mainSite, Site).setParentSiteText());
                        } else {
                            // loop through sub sites
                            site.childSites.forEach(subSite => {
                                mappedSites.push(generator.generateInstance(subSite, Site).setParentSiteText().setSubSiteText())
                            })
                        }
                    })
                    self.ui.key_mainSubSites.value = mappedSites;
                }

                return this;
            };

            DynamicFollowup.prototype.getSelectedDateType = function (dateKeys) {
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

            DynamicFollowup.prototype.getNames = function (separator) {
                return this.arName + ' ' + (separator ? separator : '-') + ' ' + this.enName;
            };

            /**
             * @description Get the status of Ready To Export Outgoing as Active or Inactive instead of true or false.
             * @returns {string}
             */
            DynamicFollowup.prototype.getTranslatedStatus = function () {
                return this.status ? langService.get('active') : langService.get('inactive');
            };

            DynamicFollowup.prototype.getNameByLanguage = function (language) {
                return this[language + 'Name'];
            };

            /**
             * @description function to get the correct type for the given value.
             * @param value
             * @returns {Number|String}
             * @private
             */
            function _getCorrectValue(value) {
                return !value.length || isNaN(Number(value)) ? value : Number(value);
            }


            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('DynamicFollowup', 'init', this);
        }
    })
};
