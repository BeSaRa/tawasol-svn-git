module.exports = function (app) {
    app.controller('userFilterPopCtrl', function (filter,
                                                  dialog,
                                                  actions,
                                                  senders,
                                                  $scope,
                                                  langService,
                                                  LangWatcher,
                                                  lookupService,
                                                  editMode,
                                                  toast,
                                                  rootEntity,
                                                  // generator,
                                                  // employeeService,
                                                  validationService,
                                                  userFilterService,
                                                  _,
                                                  Information,
                                                  mainClassifications,
                                                  $timeout,
                                                  correspondenceSiteTypes,
                                                  classificationService,
                                                  correspondenceViewService) {
        'ngInject';
        var self = this;
        self.controllerName = 'userFilterPopCtrl';
        LangWatcher($scope);
        self.editMode = editMode;
        self.model = angular.copy(filter);
        self.filter = angular.copy(filter);

        self.senders = senders;
        self.actions = actions;
        self.documentTypes = lookupService.returnLookups(lookupService.documentClass);
        // self.securityLevels = generator.getSelectedCollectionFromResult(lookupService.returnLookups(lookupService.securityLevel), employeeService.getEmployee().organization.securityLevels, 'lookupKey');

        self.securityLevels = rootEntity.getGlobalSettings().securityLevels;
        self.priorityLevels = lookupService.returnLookups(lookupService.priorityLevel);
        self.correspondenceSiteTypes = correspondenceSiteTypes;
        self.selectedSiteType = null;
        self.selectedMainSite = null;
        self.selectedSubSite = null;

        self.previousMainClassifications = [];
        self.previousSubClassifications = [];

        self.mainClassifications = mainClassifications;

        self.subClassifications = [];
        self.mainClassificationSearchText = '';
        self.subClassificationSearchText = '';


        self.lookupNames = {};
        _.map(lookupService.returnLookups(lookupService.inboxFilterKey), function (lookup) {
            self.lookupNames['key_' + lookup.lookupKey] = new Information({
                arName: lookup.defaultArName,
                enName: lookup.defaultEnName,
                id: lookup.lookupKey
            });
            self.lookupNames['key_siteType'] = new Information({
                arName: langService.getByLangKey('correspondence_site_type', 'ar'),
                enName: langService.getByLangKey('correspondence_site_type', 'en')
            });
            self.lookupNames['key_mainSite'] = new Information({
                arName: langService.getByLangKey('main_site', 'ar'),
                enName: langService.getByLangKey('main_site', 'en')
            });
            self.lookupNames['key_subSite'] = new Information({
                arName: langService.getByLangKey('sub_site', 'ar'),
                enName: langService.getByLangKey('sub_site', 'en')
            });
            return lookup;
        });

        /**
         * @description save user filter
         * @param $event
         */
        self.saveUserFilterFromCtrl = function ($event) {
            validationService
                .createValidation("Save_User_Filter")
                .addStep('check_duplicate', true, userFilterService.checkDuplicateUserFilter, [self.filter, self.editMode], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .validate()
                .then(function () {
                    self.filter.saveUserFilter().then(function (filter) {
                        filter.sortOptionId = Number(filter.sortOptionId);
                        dialog.hide(filter);
                        // self.filter = angular.copy(filter);
                    });
                });
        };

        var receivedDateKeys = [4, 6, 11],
            linkedDocsKeys = [16, 18],
            linkedAttachmentKeys = [19, 21],
            linkedEntitiesKeys = [17, 22];
        self.receivedDateFilterTypes = [];
        self.linkedDocsOptions = [];
        self.linkedAttachmentsOptions = [];
        self.linkedEntitiesOptions = [];

        for (var i = 0; i < receivedDateKeys.length; i++) {
            self.receivedDateFilterTypes.push(self.lookupNames['key_' + receivedDateKeys[i]]);
        }
        for (var i = 0; i < linkedDocsKeys.length; i++) {
            self.linkedDocsOptions.push(self.lookupNames['key_' + linkedDocsKeys[i]]);
        }
        for (var i = 0; i < linkedAttachmentKeys.length; i++) {
            self.linkedAttachmentsOptions.push(self.lookupNames['key_' + linkedAttachmentKeys[i]]);
        }
        for (var i = 0; i < linkedEntitiesKeys.length; i++) {
            self.linkedEntitiesOptions.push(self.lookupNames['key_' + linkedEntitiesKeys[i]]);
        }

        self.yesNoOptions = [
            {
                key: 'yes',
                value: true
            },
            {
                key: 'no',
                value: false
            }
        ];

        /**
         * @description Resets the received dates on changing the received date type
         * @param $event
         */
        self.resetReceivedDateType = function ($event) {
            self.filter.ui['key_4'].value = null;
            self.filter.ui['key_6'].value = null;
            self.filter.ui['key_11'].value1 = null;
            self.filter.ui['key_11'].value2 = null;
        };

        /**
         * @description Gets the maximum start date
         */
        self.getMaxReceivedStartDate = function () {
            var endDate = new Date(self.filter.ui.key_11.value2);
            self.calculatedMaxReceivedStartDate = endDate ? new Date(endDate.setDate(endDate.getDate() - 1)) : null;
        };
        self.calculatedMaxReceivedStartDate = self.filter.ui.key_11.value1 ? self.filter.ui.key_11.value1 : self.getMaxReceivedStartDate();

        /**
         * @description Gets the minimum end date
         */
        self.getMinReceivedEndDate = function () {
            var startDate = new Date(self.filter.ui.key_11.value1);
            self.calculatedMinReceivedEndDate = startDate ? new Date(startDate.setDate(startDate.getDate() + 1)) : null;
        };
        self.calculatedMinReceivedEndDate = self.filter.ui.key_11.value2 ? self.filter.ui.key_11.value2 : self.getMinReceivedEndDate();

        self.getMaxDueStartDate = function () {
            var endDate = new Date(self.filter.ui.key_10.value2);
            self.calculatedMaxDueStartDate = endDate ? new Date(endDate.setDate(endDate.getDate() - 1)) : null;
        };
        self.calculatedMaxDueStartDate = self.filter.ui.key_10.value1 ? self.filter.ui.key_10.value1 : self.getMaxDueStartDate();

        self.getMinDueEndDate = function () {
            var startDate = new Date(self.filter.ui.key_10.value1);
            self.calculatedMinDueEndDate = startDate ? new Date(startDate.setDate(startDate.getDate() + 1)) : null;
        };
        self.calculatedMinDueEndDate = self.filter.ui.key_10.value2 ? self.filter.ui.key_10.value2 : self.getMinDueEndDate();


        /**
         * @description Check the save button whether it will be enabled/disabled
         * @param form
         * @returns {boolean|*}
         */
        self.checkDisabled = function (form) {
            var hasCriteria = false, record, typeOfRecord = 'undefined', recordValue;
            for (var key in self.filter.ui) {
                if (!self.filter.ui.hasOwnProperty(key))
                    continue;

                record = self.filter.ui[key];
                // if single value key and key has value or key is for document type === 0 (outgoing, security level, priority level)
                // adding exceptions for false/0 values
                if (record && record.hasOwnProperty('value')
                    && (record.value
                        || (record.value === 0 && key === 'key_2') // doc type
                        || (record.value === 0 && key === 'key_14') // security level
                        || (record.value === 0 && key === 'key_15') // priority level
                        || (record.value === false && key === 'key_20') // is open
                    )
                ) {
                    typeOfRecord = typeof record.value;
                    recordValue = record.value;
                }
                // if double value key and has value
                else if (record.hasOwnProperty('value1') && record.value1) {
                    typeOfRecord = typeof record.value1;
                    recordValue = record.value1;
                }

                if (typeOfRecord === 'string')
                    recordValue = recordValue.trim();

                if (typeOfRecord !== 'undefined' && recordValue !== null) {
                    hasCriteria = true;
                    break;
                }
            }
            return form.$invalid || !hasCriteria;
        };

        /**
         * @description Reset the filter form
         * @param form
         * @param $event
         */
        self.resetFilterForm = function (form, $event) {
            self.filter = angular.copy(self.model);
            self.filter.ui['key_8'].value = (self.filter.ui['key_8'].value === '-2000000000000L');
            self.getMainSites(false);
            form.$setUntouched();
        };

        /**
         * @description Close the filter popup
         * @param $event
         */
        self.closeFilterForm = function ($event) {
            dialog.cancel();
        };

        self.siteTypeSearchText = '';
        self.mainSiteSearchText = '';
        self.subSiteSearchText = '';
        self.senderSearchText = '';
        self.actionSearchText = '';

        $timeout(function () {
            if (self.filter.ui.key_siteType.value) {
                self.getMainSites(false);
            }
        });

        self.onChangeDocumentType = function ($event) {
            if (self.filter.ui.key_2.value && self.filter.ui.key_2.value === 2) {
                self.filter.ui.key_siteType.value = null;
                self.filter.ui.key_mainSite.value = null;
                self.filter.ui.key_subSite.value = null;
                self.mainSites = [];
                self.subSites = [];
            }
        };

        /**
         * @description Get the main sites on change of site type
         * @param resetMainAndSub
         * @param $event
         */
        self.getMainSites = function (resetMainAndSub, $event) {
            if (self.filter.ui.key_siteType.value) {
                correspondenceViewService.correspondenceSiteSearch('main', {
                    type: self.filter.ui.key_siteType.value.hasOwnProperty('lookupKey') ? self.filter.ui.key_siteType.value.lookupKey : self.filter.ui.key_siteType.value,
                    criteria: null,
                    excludeOuSites: false
                }).then(function (result) {
                    self.mainSites = result;
                    self.mainSitesCopy = angular.copy(result);
                    self.subSites = [];
                    if (resetMainAndSub) {
                        self.filter.ui.key_mainSite.value = null;
                        self.filter.ui.key_subSite.value = null;
                    }
                    if (self.filter.ui.key_mainSite.value) {
                        self.getSubSites(false);
                    }
                });
            } else {
                self.mainSites = [];
                self.subSites = [];
                self.filter.ui.key_mainSite.value = null;
                self.filter.ui.key_subSite.value = null;
            }
        };

        /**
         * @description Get sub sites on change of main site
         * @param resetSub
         * @param $event
         */
        self.getSubSites = function (resetSub, $event) {
            var mainSite = self.filter.ui.key_mainSite.value && self.filter.ui.key_mainSite.value.hasOwnProperty('id') ? self.filter.ui.key_mainSite.value.id : self.filter.ui.key_mainSite.value;
            if (mainSite) {
                correspondenceViewService.correspondenceSiteSearch('sub', {
                    type: self.filter.ui.key_siteType.value.hasOwnProperty('lookupKey') ? self.filter.ui.key_siteType.value.lookupKey : self.filter.ui.key_siteType.value,
                    parent: mainSite,
                    criteria: null,
                    excludeOuSites: false,
                    includeDisabled: true // to include private regOu
                }).then(function (result) {
                    self.subSites = result;
                    self.subSitesCopy = angular.copy(result);
                    if (resetSub)
                        self.filter.ui.key_subSite.value = null;
                });
            } else {
                self.subSites = [];
                self.filter.ui.key_subSite.value = null;
            }
        };


        /**
         * @description Clears the searchText for the given field
         * @param fieldType
         */
        self.clearSearchText = function (fieldType) {
            self[fieldType + 'SearchText'] = '';
        };

        /**
         * @description Prevent the default dropdown behavior of keys inside the search box of dropdown
         * @param $event
         * @param fieldType
         */
        self.handleSearchKeyDown = function ($event, fieldType) {
            if ($event) {
                var code = $event.which || $event.keyCode;
                // if enter key pressed, load from server with search text
                if (code === 13) {
                    if (fieldType === 'mainSite') {
                        self.loadMainSitesRecords($event);
                    } else if (fieldType === 'subSite') {
                        self.loadSubSitesRecords($event);
                    }
                }
                // prevent keydown except arrow up and arrow down keys
                else if (code !== 38 && code !== 40) {
                    $event.stopPropagation();
                }
            }
        };

        /**
         * @description request service for loading dropdown records with searchText
         * @param $event
         */
        self.loadMainSitesRecords = function ($event) {
            if (self.filter.ui.key_siteType.value && self.mainSiteSearchText) {
                correspondenceViewService.correspondenceSiteSearch('main', {
                    type: self.filter.ui.key_siteType.value.hasOwnProperty('lookupKey') ? self.filter.ui.key_siteType.value.lookupKey : self.filter.ui.key_siteType.value,
                    criteria: self.mainSiteSearchText,
                    excludeOuSites: false
                }).then(function (result) {
                    if (result.length) {
                        var availableMainSitesIds = _.map(self.mainSitesCopy, 'id');
                        result = _.filter(result, function (corrSite) {
                            return availableMainSitesIds.indexOf(corrSite.id) === -1;
                        });
                        self.mainSites = self.mainSites.concat(result);
                        self.mainSitesCopy = angular.copy(self.mainSites);
                    } else {
                        self.mainSites = angular.copy(self.mainSitesCopy);
                    }
                }).catch(function (error) {
                    self.mainSites = angular.copy(self.mainSitesCopy);
                });
            }
        };

        /**
         * @description request service for loading sub site dropdown records with searchText
         * @param $event
         */
        self.loadSubSitesRecords = function ($event) {
            var mainSite = self.filter.ui.key_mainSite.value && self.filter.ui.key_mainSite.value.hasOwnProperty('id') ? self.filter.ui.key_mainSite.value.id : self.filter.ui.key_mainSite.value;
            correspondenceViewService.correspondenceSiteSearch('sub', {
                type: self.filter.ui.key_siteType.value.hasOwnProperty('lookupKey') ? self.filter.ui.key_siteType.value.lookupKey : self.filter.ui.key_siteType.value,
                parent: mainSite,
                criteria: self.subSiteSearchText,
                excludeOuSites: false,
                includeDisabled: true // to include private regOu
            }).then(function (result) {
                if (result.length) {
                    var availableSubSitesIds = _.map(self.subSitesCopy, 'id');
                    result = _.filter(result, function (corrSite) {
                        return availableSubSitesIds.indexOf(corrSite.id) === -1;
                    });

                    self.subSites = self.subSites.concat(result);
                    self.subSitesCopy = angular.copy(self.subSites);

                } else {
                    self.subSites = angular.copy(self.subSitesCopy);
                }
            }).catch(function (error) {
                return self.subSites = angular.copy(self.subSitesCopy);
            });
        };


        /**
         * @description fir the callback if the provider  text length equal = 0
         * @param $event
         * @param text
         * @param callback
         */
        self.setPropertiesSpaceBackIfNoLength = function ($event, text, callback) {
            var key = $event.keyCode || $event.which;
            if (!text.length && key === 8) {
                callback();
            }
        };

        /**
         * capture any event except arrows UP/DOWN allow those.
         * @param $event
         * @param enterCallback
         */
        self.allowPropagationUpDownArrows = function ($event, enterCallback) {
            var key = $event.keyCode || $event.which;
            if (key === 13 && enterCallback) {
                enterCallback($event);
                $event.stopPropagation();
            }
            var allowedKeys = [38 /* UP */, 40 /* DOWN */];
            allowedKeys.indexOf(key) === -1 ? $event.stopPropagation() : null;
        };


        /**
         * @description set previousMainClassifications in case if it has length
         */
        self.setOldMainClassification = function () {
            self.previousMainClassifications.length && !self.mainClassifications.length ? self.mainClassifications = self.previousMainClassifications : null;
            self.previousMainClassifications = [];
        };

        /**
         * @description set previousSubClassifications in case if it has length
         */
        self.setOldSubClassification = function () {
            self.previousSubClassifications.length && !self.subClassifications.length ? self.subClassifications = self.previousSubClassifications : null;
            self.previousSubClassifications = [];
        };

        /**
         * @description load Main depend on criteria ... used to load more if the current mainClassifications dose not have what the user searched for.
         * @param $event
         */
        self.loadMainClassificationByCriteria = function ($event) {
            if ($event) {
                $event.preventDefault();
                $event.stopPropagation();
            }

            // to reserve old sub sites
            if (self.mainClassifications.length)
                self.previousMainClassifications = angular.copy(self.mainClassifications);

            classificationService.classificationSearch(self.mainClassificationSearchText , undefined , true)
                .then(function (classifications) {
                    self.mainClassifications = classifications;
                });
        };
        /**
         * @description load Main depend on criteria ... used to load more if the current mainClassifications dose not have what the user searched for.
         * @param $event
         */
        self.loadSubClassificationByCriteria = function ($event) {
            if ($event) {
                $event.preventDefault();
                $event.stopPropagation();
            }

            // to reserve old sub sites
            if (self.subClassifications.length)
                self.previousSubClassifications = angular.copy(self.subClassifications);

            // self.filter.ui.key_23.value parent classification value.
            classificationService.classificationSearch(self.subClassificationSearchText, self.filter.ui.key_23.value , true)
                .then(function (classifications) {
                    self.subClassifications = classifications;
                });
        };

        self.onMainClassificationChanged = function () {
            self.loadSubClassificationByCriteria();
        };

        self.$onInit = function () {
            if (self.filter.ui.key_23.value) {
                self.onMainClassificationChanged();
            }
        }
    });
};
