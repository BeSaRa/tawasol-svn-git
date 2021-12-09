module.exports = function (app) {
    app.controller('manageCorrespondenceSitesDirectiveCtrl', function (correspondenceViewService,
                                                                       langService,
                                                                       dialog,
                                                                       moment,
                                                                       $scope,
                                                                       Site,
                                                                       lookupService,
                                                                       CorrespondenceSiteType,
                                                                       $interval,
                                                                       LangWatcher,
                                                                       configurationService,
                                                                       $timeout,
                                                                       $q,
                                                                       _,
                                                                       correspondenceService,
                                                                       generator,
                                                                       SiteView,
                                                                       rootEntity,
                                                                       toast,
                                                                       employeeService) {
        'ngInject';
        var self = this;
        self.controllerName = 'manageCorrespondenceSitesDirectiveCtrl';

        self.tabsToShow = [
            'correspondenceSites',
            'distributionLists'
        ];
        self.showTab = function (tabName) {
            return self.tabsToShow.indexOf(tabName) > -1;
        };
        self.currentTab = 'correspondenceSites';
        self.setCurrentTab = function (tabName) {
            self.currentTab = tabName;
        };
        self.isSimpleCorrespondenceSiteSearchType = rootEntity.getGlobalSettings().simpleCorsSiteSearch;

        self.siteTypeSimpleSearchText = '';
        self.siteTypeAdvancedSearchText = '';
        self.mainSiteSimpleSearchText = '';
        self.mainSiteAdvancedSearchText = '';
        self.simpleSubSiteResultSearchText = '';

        self.documentClass = null;
        // followup statuses
        self.followUpStatuses = lookupService.returnLookups(lookupService.followupStatus);
        // selected followup Status.
        self.followupStatus = null;
        self.isFollowupStatusMandatory = false;

        var followupStatusWithoutReply = _.find(self.followUpStatuses, function (status) {
                return status.lookupStrKey === 'WITHOUT_REPLY';
            }),
            followupStatusNeedReply = _.find(self.followUpStatuses, function (status) {
                return status.lookupStrKey === 'NEED_REPLY';
            }),
            properties = angular.copy(lookupService.getPropertyConfigurations('outgoing')),
            defaultFollowupNumberOfDays = 3,
            defaultNeedReplyFollowupDate = generator.getFutureDate(defaultFollowupNumberOfDays),
            organizationForSLA = null,
            organizationForSLACentralArchive = null;

        function _isShowRegistryUnit() {
            return (employeeService.getEmployee().inCentralArchive() && self.correspondence.getInfo().isPaper);
        }

        var _resetDefaultNeedReplyFollowupDate = function () {
            if (self.correspondence) {
                var priorityLevel = self.correspondence.getInfo().priorityLevel;
                priorityLevel = (priorityLevel.hasOwnProperty('lookupKey') ? priorityLevel.lookupKey : priorityLevel);

                var slaOu = null;
                // if paper outgoing or incoming and current ou is central archive, use selected registryOu as slaOu
                if (_isShowRegistryUnit() && organizationForSLACentralArchive) {
                    slaOu = organizationForSLACentralArchive;
                } else {
                    slaOu = organizationForSLA;
                }
                if (slaOu && typeof priorityLevel !== 'undefined' && priorityLevel !== null) {
                    var slaDays = null;
                    // organization has sla property and sla has property as same as document priority level
                    if (slaOu.hasOwnProperty('sla') && slaOu.sla && slaOu.sla.hasOwnProperty(priorityLevel)) {
                        slaDays = slaOu.sla[priorityLevel];
                    }
                    // if no SLA days or its less than 1, use default number of days to followup date to be today
                    if (!slaDays || slaDays < 1) {
                        slaDays = angular.copy(defaultFollowupNumberOfDays);
                    }
                    defaultNeedReplyFollowupDate = generator.getFutureDate(slaDays);
                }
            }


            self.followUpStatusDate = defaultNeedReplyFollowupDate;
            self.followUpStatusDate_DL = defaultNeedReplyFollowupDate;

            // set followup date for all searched sites
            if (self.subSearchResultCopy && self.subSearchResultCopy.length) {
                self.onFollowupStatusChange(self.followupStatus, true);
            }
            if (self.subSearchResult_DL_Copy && self.subSearchResult_DL_Copy.length) {
                self.onFollowupStatusChange_DL(self.followupStatus_DL, true);
            }
            return defaultNeedReplyFollowupDate;
        };

        /**
         * @description Finds the property configuration by symbolic name
         * @param symbolicName
         * @returns {*|null}
         * @private
         */
        function _findPropertyConfiguration(symbolicName) {
            if (!symbolicName) {
                return null;
            }
            return _.find(properties, function (item) {
                return item.symbolicName.toLowerCase() === symbolicName.toLowerCase();
            }) || null;
        }

        function _checkFollowupStatusMandatory() {
            var property = _findPropertyConfiguration('FollowupStatus');
            if (property) {
                self.isFollowupStatusMandatory = property.isMandatory;
                if (property.isMandatory) {
                    self.followupStatus = followupStatusNeedReply;
                    self.followUpStatusDate = defaultNeedReplyFollowupDate;
                    self.followupStatus_DL = followupStatusNeedReply;
                    self.followUpStatusDate_DL = defaultNeedReplyFollowupDate;
                }
            }
        }

        $timeout(function () {
            self.correspondenceSiteTypes = angular.copy(correspondenceService.getLookup(self.documentClass, 'siteTypes'));
            self.correspondenceSiteTypesCopy = angular.copy(self.correspondenceSiteTypes);

            self.distributionLists = angular.copy(correspondenceService.getLookup(self.documentClass, 'distributionList'));

            self.mainSites = [];
            self.mainSitesCopy = angular.copy(self.mainSites);
        });

        self.selectedSiteTypeSimple = null;
        self.selectedSiteTypeAdvanced = null;

        // selected mainCorrespondence sites
        self.selectedMainSiteAdvanced = null;
        // selected subCorrespondence sites from internal search box
        self.selectedSimpleSub = null;
        // model for search on sub correspondence sites
        self.subSiteAdvancedSearchText = '';
        // sub Search result
        self.subSearchResult = [];
        // sub correspondence selected from result
        self.subSearchSelected = [];
        // sites info cc
        self.sitesInfoCC = [];
        // sites info to
        self.sitesInfoTo = [];
        // book vsId
        self.vsId = null;
        // current for need reply
        self.minDate = generator.getFutureDate(1);
        // all sub correspondence sites
        self.subRecords = _concatCorrespondenceSites(true);
        // default followupStatusDate
        self.followUpStatusDate = null;
        // selected siteInfoTo
        self.sitesInfoToSelected = [];
        // selected siteInfoCC
        self.sitesInfoCCSelected = [];
        // default sites info to followupStatus
        self.sitesInfoToFollowupStatus = null;
        // default sites info CC followupStatus
        self.sitesInfoCCFollowupStatus = null;
        // default sites info to followupStatusDate
        self.sitesInfoToFollowupStatusDate = null;
        // default sites info to followupStatusDate
        self.sitesInfoCCFollowupStatusDate = null;

        // sub Search result for distribution list
        self.subSearchResult_DL = [];
        // sub correspondence selected from result for distribution list
        self.subSearchSelected_DL = [];
        // selected followup Status for distribution list
        self.followupStatus_DL = null;
        // get the main sites for selected correspondence site type
        self.selectedDistributionList = null;

        self.selectedMainSiteSimple = null;

        self.isSearchByDLSiteType = false;
        self.selectedSiteType_DL = null;
        self.siteType_DLSearchText = '';

        /**
         * concatenate main and sub correspondence sites.
         * @param timeout
         * @return {*}
         * @private
         */
        function _concatCorrespondenceSites(timeout) {
            if (!timeout) {
                self.subRecords = _.map([].concat(self.sitesInfoTo, self.sitesInfoCC), 'subSiteId');
                return;
            }
            return $timeout(function () {
                return self.subRecords = _.map([].concat(self.sitesInfoTo, self.sitesInfoCC), 'subSiteId');
            });
        }

        // reversed map for sites.
        self.reversedMap = {
            CC: 'To',
            To: 'CC'
        };
        // watch the language for any changes from current user.
        LangWatcher($scope);

        self.grid = {
            subSearchResult: {
                limit: 5, // default limit
                page: 1, // first page
                order: 'arName', // default sorting order
                limitOptions: [5, 10, 20, // limit options
                    {
                        label: langService.get('all'),
                        value: function () {
                            return (self.subSearchResult.length + 21);
                        }
                    }
                ]
            },
            sitesInfoTo: {
                limit: 5, // default limit
                page: 1, // first page
                order: 'mainArSiteText', // default sorting order
                limitOptions: [5, 10, 20, // limit options
                    {
                        label: langService.get('all'),
                        value: function () {
                            return (self.sitesInfoTo.length + 21);
                        }
                    }
                ]
            },
            sitesInfoCC: {
                limit: 5, // default limit
                page: 1, // first page
                order: 'mainArSiteText', // default sorting order
                limitOptions: [5, 10, 20, // limit options
                    {
                        label: langService.get('all'),
                        value: function () {
                            return (self.sitesInfoCC.length + 21);
                        }
                    }
                ]
            },
            subSearchResult_DL: {
                limit: 5, // default limit
                page: 1, // first page
                order: 'arName', // default sorting order
                limitOptions: [5, 10, 20, // limit options
                    {
                        label: langService.get('all'),
                        value: function () {
                            return (self.subSearchResult_DL.length + 21);
                        }
                    }
                ]
            }
        };

        // private variables to debounce the request.
        var pendingSearch, cancelSearch = angular.noop, lastSearch;

        /**
         * to refresh debounce (reset).
         */
        function refreshDebounce() {
            lastSearch = 0;
            pendingSearch = null;
            cancelSearch = angular.noop;
        }

        /**
         * Debounce if querying faster than 300ms
         */
        function debounceSearch() {
            var now = new Date().getMilliseconds();
            lastSearch = lastSearch || now;

            return ((now - lastSearch) < 300);
        }

        /**
         * map the type when get result.
         * @param type
         * @return {*}
         * @private
         */
        function _mapTypes(type) {
            type.display = type[langService.current + 'Name'];
            return type;
        }

        /**
         * map current name when get result.
         * @param site
         * @return {*}
         * @private
         */
        function _mapSite(site) {
            site.display = site[langService.current + 'Name'];
            return site;
        }

        /**
         * @description get selected type by typeId
         * @param typeId
         * @private
         */
        function _getTypeByLookupKey(typeId) {
            typeId = typeId.hasOwnProperty('id') ? typeId.lookupKey : typeId;
            return _.find(self.correspondenceSiteTypes, function (type) {
                return typeId === type.lookupKey;
            });
        }

        /**
         * map sub Sites.
         * @param siteView
         * @private
         */
        function _mapSubSites(siteView) {
            return (new Site())
                .mapFromSiteView(siteView)
                .setFaxNumber(siteView.faxNumber)
                .setFollowupStatus(self.isFollowupStatusMandatory ? followupStatusNeedReply : followupStatusWithoutReply)
                .setFollowupDate(self.isFollowupStatusMandatory ? defaultNeedReplyFollowupDate : null)
                .setCorrespondenceSiteType(_getTypeByLookupKey(siteView.correspondenceSiteTypeId));
        }

        /**
         * filter subSites.
         * @param site
         * @return {boolean}
         * @private
         */
        function _filterSubSites(site) {
            return self.subRecords.indexOf(site.subSiteId) === -1;
        }

        /**
         * set property for selected sub Sites.
         * @param selected
         * @param property
         * @param value
         * @private
         */
        function _setSitesProperty(selected, property, value) {
            _.map(selected, function (val, key) {
                selected[key][property] = value;
            });
        }

        /**
         * @description add given site to (CC|TO)
         * @param to
         * @param site
         * @return {*}
         * @private
         */
        function _addSite(to, site) {
            return $timeout(function () {
                self['sitesInfo' + to].push(site);
                if (self.notifyAfterChanges) {
                    self.notifyAfterChanges('add');
                }
                return true;
            });
        }

        /**
         * @description add single site to To.
         * @param site
         * @param isDistributionListRecord
         */
        self.addSiteTo = function (site, isDistributionListRecord) {
            if (self.needReply(site.followupStatus) && !(site.followupDate)) {
                return toast.error(langService.get('sites_please_select_followup_date'));
            }
            //TODO: add distListId to outgoing document in case of add document only but need refactor later
            if (isDistributionListRecord) {// && !self.vsId
                self.distListId = (self.selectedDistributionList && self.selectedDistributionList.hasOwnProperty('id')) ? self.selectedDistributionList.id : null;
            }

            _addSite('To', site)
                .then(function () {
                    self.subSearchSelected = [];
                    self.simpleSubSiteResultSearchText = '';
                    self.resetToStatusAndDate();
                    _concatCorrespondenceSites(true).then(function () {
                        self.subSearchResult = _.filter(self.subSearchResultCopy, _filterSubSites);
                        self.subSearchResult_DL = _.filter(self.subSearchResult_DL_Copy, _filterSubSites);
                        self.simpleSubSiteSearchCopy = angular.copy(self.subSearchResult);
                    });
                })
        };
        /**
         * @description add single site to CC.
         * @param site
         * @param isDistributionListRecord
         */
        self.addSiteCC = function (site, isDistributionListRecord) {
            if (self.needReply(site.followupStatus) && !(site.followupDate)) {
                return toast.error(langService.get('sites_please_select_followup_date'));
            }
            //TODO: add distListId to outgoing document in case of add document only but need refactor later
            if (isDistributionListRecord) {// && !self.vsId
                self.distListId = (self.selectedDistributionList && self.selectedDistributionList.hasOwnProperty('id')) ? self.selectedDistributionList.id : null;
            }
            _addSite('CC', site)
                .then(function () {
                    self.subSearchSelected = [];
                    self.simpleSubSiteResultSearchText = '';
                    self.resetCCStatusAndDate();
                    _concatCorrespondenceSites(true).then(function () {
                        self.subSearchResult = _.filter(self.subSearchResultCopy, _filterSubSites);
                        self.subSearchResult_DL = _.filter(self.subSearchResult_DL_Copy, _filterSubSites);
                        self.simpleSubSiteSearchCopy = angular.copy(self.subSearchResult);
                    });
                });
        };

        var _resetSelectedData = function (isDistributionListRecord) {
            if (isDistributionListRecord) {
                self.followUpStatusDate_DL = null;
                self.followupStatus_DL = null;
                self.subSearchSelected_DL = [];
            } else {
                self.followUpStatusDate = null;
                self.followupStatus = null;
                self.subSearchSelected = [];
            }
        };

        /**
         * @description add all selected sites to To.
         * @param sites
         * @param $event
         * @param isDistributionListRecord
         */
        self.addSitesTo = function (sites, $event, isDistributionListRecord) {
            var sitesWithNeedReplyAndNoDate = _.filter(sites, function (site) {
                    return self.needReply(site.followupStatus) && !site.followupDate;
                }),
                sitesWithoutNeedReply = _.filter(sites, function (site) {
                    return !self.needReply(site.followupStatus);
                });

            if (sitesWithNeedReplyAndNoDate.length === sites.length) {
                dialog.errorMessage(langService.get('sites_please_select_followup_date'), null, null, $event);
            } else if (sitesWithNeedReplyAndNoDate.length && (sitesWithNeedReplyAndNoDate.length < sites.length) && sitesWithoutNeedReply.length) {
                dialog.confirmMessage(langService.get('sites_with_need_reply_missing_date_confirm_skip'))
                    .then(function () {
                        _.map(sitesWithoutNeedReply, function (site) {
                            self.addSiteTo(site, isDistributionListRecord);
                        });
                        _resetSelectedData(isDistributionListRecord);
                    });
            } else {
                _.map(sites, function (site) {
                    self.addSiteTo(site, isDistributionListRecord);
                });
                _resetSelectedData(isDistributionListRecord);
            }


            /*sitesWithoutNeedReply = _.filter(sites, function (site) {
                return !self.needReply(site.followupStatus);
            });
             /!*sitesWithoutNeedReply = [] means all sites need reply
             * if followupStatus is needReply and no date selected and all sites need reply, show alert
             * otherwise add sites without need reply
             * *!/
             if (self.needReply(self.followupStatus) && !self.followUpStatusDate) {
                 if (sitesWithoutNeedReply.length === 0) {
                     dialog.errorMessage(langService.get('sites_please_select_followup_date'), null, null, $event);
                 } else {
                     dialog.confirmMessage(langService.get('sites_with_need_reply_missing_date_confirm_skip'))
                         .then(function () {
                             _.map(sitesWithoutNeedReply, function (site) {
                                 self.addSiteTo(site);
                             });
                             _resetSelectedData(isDistributionListRecord);
                         });
                 }
             } else {
                 _.map(sites, function (site) {
                     self.addSiteTo(site);
                 });
                 _resetSelectedData(isDistributionListRecord);
             }*/
        };

        /**
         * @description add all sites to To with followup status = without reply.
         * @param $event
         * @param isDistributionListRecord
         */
        self.addAllSitesTo = function ($event, isDistributionListRecord) {
            var sites = isDistributionListRecord ? angular.copy(self.subSearchResult_DL) : angular.copy(self.subSearchResult);
            var sitesWithNeedReplyAndNoDate = _.filter(sites, function (site) {
                    return self.needReply(site.followupStatus) && !site.followupDate;
                }),
                sitesWithoutNeedReply = _.filter(sites, function (site) {
                    return !self.needReply(site.followupStatus);
                });

            if (sitesWithNeedReplyAndNoDate.length === sites.length) {
                dialog.errorMessage(langService.get('sites_please_select_followup_date'), null, null, $event);
            } else if (sitesWithNeedReplyAndNoDate.length && (sitesWithNeedReplyAndNoDate.length < sites.length) && sitesWithoutNeedReply.length) {
                dialog.confirmMessage(langService.get('sites_with_need_reply_missing_date_confirm_skip'))
                    .then(function () {
                        _.map(sitesWithoutNeedReply, function (site) {
                            self.addSiteTo(site, isDistributionListRecord);
                        });
                        _resetSelectedData(isDistributionListRecord);
                    });
            } else {
                _.map(sites, function (site) {
                    self.addSiteTo(site, isDistributionListRecord);
                });
                _resetSelectedData(isDistributionListRecord);
            }
        };

        /**
         * @description add all selected sites to CC.
         * @param sites
         * @param $event
         * @param isDistributionListRecord
         */
        self.addSitesCC = function (sites, $event, isDistributionListRecord) {
            var sitesWithNeedReplyAndNoDate = _.filter(sites, function (site) {
                    return self.needReply(site.followupStatus) && !site.followupDate;
                }),
                sitesWithoutNeedReply = _.filter(sites, function (site) {
                    return !self.needReply(site.followupStatus);
                });

            if (sitesWithNeedReplyAndNoDate.length === sites.length) {
                dialog.errorMessage(langService.get('sites_please_select_followup_date'), null, null, $event);
            } else if (sitesWithNeedReplyAndNoDate.length && (sitesWithNeedReplyAndNoDate.length < sites.length) && sitesWithoutNeedReply.length) {
                dialog.confirmMessage(langService.get('sites_with_need_reply_missing_date_confirm_skip'))
                    .then(function () {
                        _.map(sitesWithoutNeedReply, function (site) {
                            self.addSiteCC(site, isDistributionListRecord);
                        });
                        _resetSelectedData(isDistributionListRecord);
                    });
            } else {
                _.map(sites, function (site) {
                    self.addSiteCC(site, isDistributionListRecord);
                });
                _resetSelectedData(isDistributionListRecord);
            }

            /*var sitesWithoutNeedReply = _.filter(sites, function (site) {
                return !self.needReply(site.followupStatus);
            });
            /!*sitesWithoutNeedReply = [] means all sites need reply
            * if followupStatus is needReply and no date selected and all sites need reply, show alert
            * otherwise add sites without need reply
            * *!/
            if (self.needReply(self.followupStatus) && !self.followUpStatusDate) {
                if (sitesWithoutNeedReply.length === 0) {
                    dialog.errorMessage(langService.get('sites_please_select_followup_date'), null, null, $event);
                    return;
                } else {
                    dialog.confirmMessage(langService.get('sites_with_need_reply_missing_date_confirm_skip'))
                        .then(function () {
                            _.map(sitesWithoutNeedReply, function (site) {
                                self.addSiteCC(site);
                            });
                            _resetSelectedData(isDistributionListRecord);
                        });
                }
            } else {
                _.map(sites, function (site) {
                    self.addSiteCC(site);
                });
                _resetSelectedData(isDistributionListRecord);
            }*/
        };

        /**
         * @description add all sites to CC.
         * @param $event
         * @param isDistributionListRecord
         */
        self.addAllSitesCC = function ($event, isDistributionListRecord) {
            var sites = isDistributionListRecord ? angular.copy(self.subSearchResult_DL) : angular.copy(self.subSearchResult);
            var sitesWithNeedReplyAndNoDate = _.filter(sites, function (site) {
                    return self.needReply(site.followupStatus) && !site.followupDate;
                }),
                sitesWithoutNeedReply = _.filter(sites, function (site) {
                    return !self.needReply(site.followupStatus);
                });

            if (sitesWithNeedReplyAndNoDate.length === sites.length) {
                dialog.errorMessage(langService.get('sites_please_select_followup_date'), null, null, $event);
            } else if (sitesWithNeedReplyAndNoDate.length && (sitesWithNeedReplyAndNoDate.length < sites.length) && sitesWithoutNeedReply.length) {
                dialog.confirmMessage(langService.get('sites_with_need_reply_missing_date_confirm_skip'))
                    .then(function () {
                        _.map(sitesWithoutNeedReply, function (site) {
                            self.addSiteCC(site, isDistributionListRecord);
                        });
                        _resetSelectedData(isDistributionListRecord);
                    });
            } else {
                _.map(sites, function (site) {
                    self.addSiteCC(site, isDistributionListRecord);
                });
                _resetSelectedData(isDistributionListRecord);
            }
        };

        /**
         * @description change site from CC to To and else.
         * @param type
         * @param site
         * @param index
         */
        self.changeSiteTo = function (type, site, index) {
            self['sitesInfo' + type] = self['sitesInfo' + type].concat(self['sitesInfo' + self.reversedMap[type]].splice(_findSiteIndex(self['sitesInfo' + self.reversedMap[type]], site), 1));
        };

        function _findSiteIndex(list, site) {
            return _.findIndex(list, function (item) {
                return item.subSiteId === site.subSiteId;
            });
        }

        /**
         * @description Get main correspondence sites on change of correspondence site type in simple search.
         * @param $event
         */
        self.onSiteTypeSimpleChange = function ($event) {
            if (self.selectedSiteTypeSimple) {
                correspondenceViewService.correspondenceSiteSearch('main', {
                    type: self.selectedSiteTypeSimple ? self.selectedSiteTypeSimple.lookupKey : null,
                    criteria: null,
                    excludeOuSites: false
                }).then(function (result) {
                    self.subSearchResult = [];
                    self.mainSites = result;
                    self.mainSitesCopy = angular.copy(self.mainSites);
                    self.selectedMainSiteSimple = null;
                    _selectDefaultMainSiteAndGetSubSites();
                });
            } else {
                self.mainSites = [];
                self.mainSitesCopy = angular.copy(self.mainSites);
                self.subSearchResult = [];
                self.subSearchResultCopy = angular.copy(self.subSearchResult);
                self.selectedMainSiteSimple = null;
            }
        };

        /**
         * @description Get main correspondence sites on change of correspondence site type in advanced search.
         * @param $event
         */
        self.onSiteTypeChangeAdvanced = function ($event) {
            var siteType = self.selectedSiteTypeAdvanced && self.selectedSiteTypeAdvanced.hasOwnProperty('lookupKey')
                ? self.selectedSiteTypeAdvanced.lookupKey
                : self.selectedSiteTypeAdvanced;
            if (siteType) {
                correspondenceViewService.correspondenceSiteSearch('main', {
                    type: siteType,
                    criteria: null,
                    excludeOuSites: false
                }).then(function (result) {
                    self.mainSites = result;
                    self.mainSitesCopy = angular.copy(self.mainSites);
                    self.selectedMainSiteAdvanced = null;
                    self.subSearchResult = [];
                    self.subSearchResultCopy = angular.copy(self.subSearchResult);
                    _selectDefaultMainSiteAndGetSubSitesAdvanced();
                });
            } else {
                self.mainSites = [];
                self.mainSitesCopy = angular.copy(self.mainSites);
                self.selectedMainSiteAdvanced = null;
                self.subSearchResult = [];
                self.subSearchResultCopy = angular.copy(self.subSearchResult);
            }
        };

        /**
         * @description Get sub sites on change of main site
         * @param $event
         */
        self.onMainSiteChangeSimple = function ($event) {
            correspondenceViewService.correspondenceSiteSearch('sub', {
                type: self.selectedSiteTypeSimple ? self.selectedSiteTypeSimple.lookupKey : null,
                parent: self.selectedMainSiteSimple ? self.selectedMainSiteSimple.id : null,
                criteria: null,
                excludeOuSites: false
            }).then(function (result) {
                self.subSearchResultCopy = angular.copy(_.map(result, _mapSubSites));
                self.subSearchResult = _.filter(_.map(result, _mapSubSites), _filterSubSites);

                self.subSearchSelected = [];
                if (self.subSearchResult.length === 1) {
                    self.subSearchSelected.push(self.subSearchResult[0]);
                }

                // bind sub site search
                if (self.isSimpleCorrespondenceSiteSearchType) {
                    self.simpleSubSiteResultSearchText = '';
                    self.simpleSubSiteSearchCopy = angular.copy(self.subSearchResult);
                }
            });
        };

        /**
         * @description set selected type when not selected after select main site.
         */
        self.onMainSiteChangeAdvanced = function () {
            if (!!self.selectedMainSiteAdvanced) {
                if (!self.selectedSiteTypeAdvanced) {
                    self.selectedSiteTypeAdvanced = _mapTypes(_getTypeByLookupKey(self.selectedMainSiteAdvanced.correspondenceSiteTypeId));
                }
                self.onSubSiteSearchAdvanced(true);
            }
        };

        /**
         * @description drop down values for sub site result search
         * @param searchText
         * @returns {Array}
         */
        self.getSimpleSubSearchOptions = function (searchText) {
            if (searchText) {
                return _.filter(self.simpleSubSiteSearchCopy, function (simpleSearchSite) {
                    return simpleSearchSite.getTranslatedName().toLowerCase().indexOf(searchText.toLowerCase()) !== -1;
                });
            }
            return self.simpleSubSiteSearchCopy;
        };

        self.onSimpleSubSiteSelectedChange = function (subSite) {
            if (subSite) {
                self.subSearchResult = _.filter(self.subSearchResultCopy, function (resultCopy) {
                    return resultCopy.subSiteId === subSite.subSiteId;
                });
            } else
                self.subSearchResult = _.filter(self.subSearchResultCopy, _filterSubSites);
        };

        /**
         * check if need replay
         * @return {boolean}
         */
        self.needReply = function (status) {
            return (status && status.lookupStrKey === 'NEED_REPLY');
        };
        /**
         * @description empty the subSearch result and selected to hide the search result grid.
         */
        self.onCloseSearch = function () {
            self.subSearchResult = [];
            self.subSearchSelected = [];
            self.subSiteAdvancedSearchText = '';
            self.selectedMainSiteSimple = null;
            self.resetSearchStatusAndDate();
        };

        /**
         * @description set all followupStatus for all subSearchResult.
         * @param status
         * @param isAddAllStatusChange
         * True, if status is changed for all records, not selected records
         */
        self.onFollowupStatusChange = function (status, isAddAllStatusChange) {
            self.followupStatus = status;
            var sitesToSetFollowupStatus = [];
            if (isAddAllStatusChange) {
                sitesToSetFollowupStatus = self.subSearchResult;
            } else {
                sitesToSetFollowupStatus = self.subSearchSelected;
            }
            _setSitesProperty(sitesToSetFollowupStatus, 'followupStatus', status);

            if (self.needReply(status)) {
                self.followUpStatusDate = defaultNeedReplyFollowupDate;
                _setSitesProperty(sitesToSetFollowupStatus, 'followupDate', defaultNeedReplyFollowupDate);
            } else {
                _setSitesProperty(sitesToSetFollowupStatus, 'followupDate', null);
            }
        };
        /**
         * @description set all followupDate for all subSearchResult.
         */
        self.onFollowupDateChange = function (isAddAllDateChange) {
            var sitesToSetFollowupDate = isAddAllDateChange ? self.subSearchResult : self.subSearchSelected;
            sitesToSetFollowupDate = _.filter(sitesToSetFollowupDate, function (site) {
                return self.needReply(site.followupStatus);
            });
            _setSitesProperty(sitesToSetFollowupDate, 'followupDate', self.followUpStatusDate);
        };

        /**
         * @description set all followupStatus for all subSearchResult.
         * @param status
         * @param isAddAllStatusChange
         * True, if status is changed for all records, not selected records
         */
        self.onFollowupStatusChange_DL = function (status, isAddAllStatusChange) {
            self.followupStatus_DL = status;
            var sitesToSetFollowupStatus = [];
            if (isAddAllStatusChange) {
                sitesToSetFollowupStatus = self.subSearchResult_DL;
            } else {
                sitesToSetFollowupStatus = self.subSearchSelected_DL;
            }
            _setSitesProperty(sitesToSetFollowupStatus, 'followupStatus', status);

            if (self.needReply(status)) {
                if (isAddAllStatusChange) {
                    self.followUpStatusDate_DL = defaultNeedReplyFollowupDate;
                }
                _setSitesProperty(sitesToSetFollowupStatus, 'followupDate', defaultNeedReplyFollowupDate);
            } else {
                _setSitesProperty(sitesToSetFollowupStatus, 'followupDate', null);
            }
        };
        /**
         * @description set all followupDate for all subSearchResult.
         */
        self.onFollowupDateChange_DL = function (isAddAllDateChange) {
            var sitesToSetFollowupDate = isAddAllDateChange ? self.subSearchResult_DL : self.subSearchSelected_DL;
            sitesToSetFollowupDate = _.filter(sitesToSetFollowupDate, function (site) {
                return self.needReply(site.followupStatus);
            });
            _setSitesProperty(sitesToSetFollowupDate, 'followupDate', self.followUpStatusDate_DL);
        };


        /**
         * single select to set follow up status for selected row.
         * @param site
         * @param status
         */
        self.setCurrentFollowUpStatus = function (site, status) {
            site.followupStatus = status;
            if (!self.needReply(site.followupStatus)) {
                site.followupDate = null;
            } else {
                site.followupDate = defaultNeedReplyFollowupDate;
            }
        };

        /**
         * @description change date for selected sitesInfo.
         */
        self.onSitesInfoFollowupDateChange = function (type) {
            _setSitesProperty(self['sitesInfo' + type + 'Selected'], 'followupDate', self['sitesInfo' + type + 'FollowupStatusDate']);
        };
        /**
         * @description change followupStatus for selected sitesInfo.
         * @param type
         * @param status
         */
        self.onSitesFollowupStatusChange = function (type, status) {
            self['sitesInfo' + type + 'FollowupStatus'] = status;
            _setSitesProperty(self['sitesInfo' + type + 'Selected'], 'followupStatus', status);
            if (!self.needReply(status)) {
                _setSitesProperty(self['sitesInfo' + type + 'Selected'], 'followupDate', null);
                self['sitesInfo' + type + 'Selected'] = [];
                self['sitesInfo' + type + 'FollowupStatus'] = null;
            } else {
                self['sitesInfo' + type + 'FollowupStatusDate'] = defaultNeedReplyFollowupDate;
                _setSitesProperty(self['sitesInfo' + type + 'Selected'], 'followupDate', defaultNeedReplyFollowupDate);
            }

        };
        /**
         * @description delete bulk sites
         * @param type
         * @param $event
         */
        self.onSitesInfoDeleteBulk = function (type, $event) {
            dialog.confirmMessage(langService.get('confirm_delete_selected_multiple'), null, null, $event)
                .then(function () {
                    // TODO: need to refactor .
                    var ids = _.map(self['sitesInfo' + type + 'Selected'], 'subSiteId');
                    self['sitesInfo' + type] = _.filter(self['sitesInfo' + type], function (site) {
                        return ids.indexOf(site.subSiteId) === -1;
                    });
                    self['sitesInfo' + type + 'Selected'] = [];

                    var method = type.toLowerCase() === 'to' ? 'resetToStatusAndDate' : 'resetCCStatusAndDate';
                    self[method]();
                    if (self.notifyAfterChanges) {
                        self.notifyAfterChanges('delete');
                    }

                    _concatCorrespondenceSites(true).then(function () {
                        if (self.selectedMainSiteSimple || self.selectedMainSiteAdvanced) {
                            self.subSearchResult = _.filter(self.subSearchResultCopy, _filterSubSites);
                        }
                        self.subSearchResult_DL = _.filter(self.subSearchResult_DL_Copy, _filterSubSites);
                        self.simpleSubSiteSearchCopy = angular.copy(self.subSearchResult);
                    });
                });
        };
        /**
         * search in sub correspondence sites related to mainSites.
         * @return {*}
         */
        self.onSubSiteSearchAdvanced = function (skipSubSiteText) {
            if (!skipSubSiteText) {
                if (!self.subSiteAdvancedSearchText.length) {
                    refreshDebounce();
                } else if (self.subSiteAdvancedSearchText.length < 3) {
                    //self.subSearchResult = [];
                    return;
                }
            } else {
                refreshDebounce();
            }
            if (!pendingSearch || !debounceSearch()) {
                cancelSearch();

                return pendingSearch = $q(function (resolve, reject) {
                    cancelSearch = reject;

                    $timeout(function () {
                        refreshDebounce();
                        correspondenceViewService.correspondenceSiteSearch('sub', {
                            type: self.selectedSiteTypeAdvanced ? self.selectedSiteTypeAdvanced.lookupKey : null,
                            parent: self.selectedMainSiteAdvanced ? self.selectedMainSiteAdvanced.id : null,
                            criteria: self.subSiteAdvancedSearchText
                        }).then(function (result) {
                            /*if (!skipSubSiteText) {
                                if (self.subSiteAdvancedSearchText.length < 3) {
                                    //self.subSearchResult = [];
                                    return;
                                }
                            }*/
                            self.subSearchResultCopy = angular.copy(_.map(result, _mapSubSites));
                            self.subSearchResult = _.filter(_.map(result, _mapSubSites), _filterSubSites);
                            resolve(self.subSearchResult);
                        });
                    }, 500);
                });
            }
            return pendingSearch;
        };

        self.getCorrespondenceSites_DL = function ($event) {
            /*return correspondenceViewService.getCorrespondenceSitesByDistributionListId(self.selectedDistributionList)
                .then(function (result) {
                    self.subSearchResult_DL = _.filter(_.map(result, _mapSubSites), _filterSubSites);
                });*/
            var sites = _.map(self.selectedDistributionList.distributionListMembers, function (member) {
                return member.site;
            });
            var siteViews = generator.generateCollection(sites, SiteView, self._sharedMethods);
            siteViews = generator.interceptReceivedCollection('SiteView', siteViews);

            self.subSearchResult_DL_Copy = angular.copy(_.map(siteViews, _mapSubSites));
            self.subSearchResult_DL = _.filter(_.map(siteViews, _mapSubSites), _filterSubSites);

        };

        /**
         * @description empty the subSearch result and selected to hide the search result grid.
         */
        self.onCloseSearch_DL = function () {
            self.subSearchResult_DL = [];
            self.subSearchSelected_DL = [];
            self.selectedDistributionList = null;
            self.resetSearchStatusAndDate_DL();
        };

        self.resetSearchStatusAndDate = function () {
            self['followupStatus'] = null;
            self['followUpStatusDate'] = null;
        };

        self.resetToStatusAndDate = function () {
            self['sitesInfoToFollowupStatus'] = null;
            self['sitesInfoToFollowupStatusDate'] = null;
        };

        self.resetCCStatusAndDate = function () {
            self['sitesInfoCCFollowupStatus'] = null;
            self['sitesInfoCCFollowupStatusDate'] = null;
        };

        self.resetSearchStatusAndDate_DL = function () {
            self['followupStatus_DL'] = null;
            self['followUpStatusDate_DL'] = null;
        };

        /**
         * @description to check if the given site valid or not based on needReply Status and date.
         * @param site
         * @return {boolean}
         */
        self.isValidSite = function (site) {
            var date;
            try {
                date = moment(site.followupDate);
            } catch (e) {

            }
            return self.needReply(site.followupStatus) && date.isValid();
        };

        $scope.$watch(function () {
            return self.emptySubRecords;
        }, function (value) {
            if (value) {
                self.subRecords = _concatCorrespondenceSites(true);
                self.emptySubRecords = false;
            }
        });

        $scope.$watch(function () {
            return self.emptySiteSearch;
        }, function (value) {
            if (value) {
                self.subSearchResult = [];
                self.emptySiteSearch = false;
                self.selectedSiteTypeSimple = null;
                self.selectedMainSiteAdvanced = null;
                self.selectedMainSiteSimple = null;
                self.selectedSiteTypeAdvanced = null;
                self.mainSiteAdvancedSearchText = '';
                self.subSiteAdvancedSearchText = '';
                self.selectedDistributionList = null;
                self.subSearchResult_DL = [];
                self.selectedSimpleSub = null;
                self.simpleSubSiteResultSearchText = '';
            }
        });

        function _initPriorityLevelWatch() {
            $scope.$watch(function () {
                return self.correspondence.getInfo().priorityLevel;
            }, function (value) {
                _resetDefaultNeedReplyFollowupDate();
            });
        }

        self.getSortingKey = function (property, modelType) {
            generator.getColumnSortingKey(property, modelType);
        };

        /**
         * @description Clears the searchText for the given field
         * @param fieldType
         */
        self.clearSearchText = function (fieldType) {
            self[fieldType + 'SearchText'] = '';
            $timeout(function () {
                if (fieldType === 'mainSiteSimple' || fieldType === 'mainSiteAdvanced') {
                    self.mainSites = angular.copy(self.mainSitesCopy);
                }
            })
        };

        /**
         * @description Prevent the default dropdown behavior of keys inside the search box of dropdown
         * @param $event
         * @param fieldType
         */
        self.preventSearchKeyDown = function ($event, fieldType) {
            if ($event) {
                var code = $event.which || $event.keyCode;
                // if enter key pressed, load from server with search text
                if (code === 13) {
                    if (fieldType === 'mainSiteSimple' || fieldType === 'mainSiteAdvanced') {
                        self.loadMainSitesRecords($event);
                    } else if (fieldType === 'subSiteSimple') {
                        self.loadSubSitesRecords($event).then(function () {
                            angular.element($event.target).focus();
                        });
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
            var searchText = self.isSimpleCorrespondenceSiteSearchType ? self.mainSiteSimpleSearchText : self.mainSiteAdvancedSearchText,
                siteType = self.isSimpleCorrespondenceSiteSearchType ? self.selectedSiteTypeSimple : self.selectedSiteTypeAdvanced,
                excludeOUSites = false;

            if (searchText) {
                siteType = siteType ? (siteType.hasOwnProperty('lookupKey') ? siteType.lookupKey : siteType) : null;
                correspondenceViewService.correspondenceSiteSearch('main', {
                    type: siteType,
                    criteria: searchText,
                    excludeOuSites: excludeOUSites
                }).then(function (result) {
                    if (result.length) {
                        self.subSearchResult = [];
                        var availableMainSitesIds = _.map(self.mainSitesCopy, 'id');
                        result = _.filter(result, function (corrSite) {
                            return availableMainSitesIds.indexOf(corrSite.id) === -1;
                        });
                        self.mainSites = self.mainSites.concat(result);
                        self.mainSitesCopy = angular.copy(self.mainSites);
                        // _selectDefaultMainSiteAndGetSubSites();
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
            return correspondenceViewService.correspondenceSiteSearch('sub', {
                type: self.selectedSiteTypeSimple ? self.selectedSiteTypeSimple.lookupKey : null,
                parent: self.selectedMainSiteSimple ? self.selectedMainSiteSimple.id : null,
                criteria: self.simpleSubSiteResultSearchText,
                excludeOuSites: false
            }).then(function (result) {
                if (result.length) {
                    var availableSubSitesIds = _.map(self.subSearchResultCopy, 'subSiteId');
                    result = _.filter(result, function (corrSite) {
                        return availableSubSitesIds.indexOf(corrSite.id) === -1;
                    });
                    result = _.filter(_.map(result, _mapSubSites), _filterSubSites);

                    self.subSearchResult = self.subSearchResult.concat(result);
                    self.subSearchResultCopy = angular.copy(self.subSearchResult);

                    self.simpleSubSiteSearchCopy = angular.copy(self.subSearchResult);
                } else {
                    self.subSearchResult = angular.copy(self.subSearchResultCopy);
                }
                return self.subSearchResult;
            }).catch(function (error) {
                return self.subSearchResult = angular.copy(self.subSearchResultCopy);
            });
        };


        var _selectDefaultMainSiteAndGetSubSites = function () {
            if (self.selectedSiteTypeSimple && self.mainSites && self.mainSites.length > 0) {
                if (configurationService.SELECT_MAIN_SITE_IF_ONLY_ONE && self.mainSites.length === 1){
                    self.selectedMainSiteSimple = self.mainSites[0];
                } else if (self.selectedSiteTypeSimple.lookupKey === 1) {
                    self.selectedMainSiteSimple = _.find(self.mainSites, function (site) {
                        return site.id === 10000000;
                    });
                }
                self.selectedMainSiteSimple ? self.onMainSiteChangeSimple() : null;
            }
        };

        var _selectDefaultMainSiteAndGetSubSitesAdvanced = function () {
            if (self.selectedSiteTypeAdvanced && self.mainSites && self.mainSites.length > 0) {
                if (configurationService.SELECT_MAIN_SITE_IF_ONLY_ONE && self.mainSites.length === 1){
                    self.selectedMainSiteAdvanced = self.mainSites[0];
                } else if (self.selectedSiteTypeAdvanced.lookupKey === 1) {
                    self.selectedMainSiteAdvanced = _.find(self.mainSites, function (site) {
                        return site.id === 10000000;
                    });
                }
                self.selectedMainSiteAdvanced ? self.onMainSiteChangeAdvanced() : null;
            }
        };


        /**
         * @description Handles the change of distribution list/correspondence site type switch in distribution list tab
         */
        self.onChangeIsSearchByDLSiteType = function () {
            self.selectedSiteType_DL = null;
            self.selectedDistributionList = null;
            self.subSearchResult_DL = [];
            self.subSearchResult_DL_Copy = [];
        };


        /**
         * @description Handles on change of correspondence site type dropdown(switch enabled) in distribution list tab
         */
        self.onSiteTypeDistributionListChange = function () {
            if (self.selectedSiteType_DL) {
                correspondenceViewService.correspondenceSiteSearch('sub', {
                    type: self.selectedSiteType_DL.lookupKey,
                    criteria: null,
                    excludeOuSites: false
                }).then(function (result) {
                    self.subSearchResult_DL_Copy = angular.copy(_.map(result, _mapSubSites));
                    self.subSearchResult_DL = _.filter(_.map(result, _mapSubSites), _filterSubSites);

                });
            } else {
                self.subSearchResult_DL_Copy = [];
                self.subSearchResult_DL = [];
            }
        };

        /**
         * @description Check if sub site search has text and is enabled
         * @returns {string|boolean}
         */
        self.isSubSiteSearchEnabled = function () {
            return self.simpleSubSiteResultSearchText;
        };

        function _setSLAOrganization() {
            return employeeService.getEmployee().getRegistryOrganization()
                .then(function (result) {
                    return organizationForSLA = result;
                });
        }

        $scope.$on('$RegistryOuChanged', function ($event, selectedRegOu) {
            organizationForSLACentralArchive = selectedRegOu;
            _resetDefaultNeedReplyFollowupDate();
        });

        /**
         * @description Request the selected registry ou
         * @private
         */
        function _requestSelectedRegistryOu() {
            $scope.$emit('$RequestSelectedRegistryOu');
        }

        self.$onInit = function () {
            _setSLAOrganization()
                .then(function () {
                    _requestSelectedRegistryOu();
                    // just in case document is not passed to directive, avoid check for priority level
                    if (self.correspondence) {
                        _initPriorityLevelWatch();
                    }
                    _checkFollowupStatusMandatory();
                });
        };

    });
};
