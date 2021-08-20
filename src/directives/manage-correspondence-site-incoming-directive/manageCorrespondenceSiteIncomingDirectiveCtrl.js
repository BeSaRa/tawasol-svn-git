module.exports = function (app) {
    app.controller('manageCorrespondenceSiteIncomingDirectiveCtrl', function (correspondenceViewService,
                                                                              langService,
                                                                              dialog,
                                                                              moment,
                                                                              $scope,
                                                                              configurationService,
                                                                              Site,
                                                                              lookupService,
                                                                              CorrespondenceSiteType,
                                                                              LangWatcher,
                                                                              $timeout,
                                                                              $q,
                                                                              _,
                                                                              generator,
                                                                              correspondenceService,
                                                                              toast,
                                                                              rootEntity,
                                                                              employeeService) {
        'ngInject';
        var self = this;
        self.controllerName = 'manageCorrespondenceSiteIncomingDirectiveCtrl';
        self.documentClass = 'incoming';

        self.correspondenceSiteTypes = angular.copy(correspondenceService.getLookup(self.documentClass, 'siteTypes'));
        self.correspondenceSiteTypesCopy = angular.copy(self.correspondenceSiteTypes);
        self.mainSites = [];
        self.mainSitesCopy = angular.copy(self.mainSites);

        self.isSimpleCorrespondenceSiteSearchType = rootEntity.getGlobalSettings().simpleCorsSiteSearch;

        self.siteTypeSimpleSearchText = '';
        self.siteTypeAdvancedSearchText = '';
        self.mainSiteSimpleSearchText = '';

        self.selectedSiteTypeSimple = null;
        self.selectedSiteTypeAdvanced = null;

        self.mainSiteAdvancedSearchText = '';
        self.simpleSubSiteResultSearchText = '';

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
        // followup statues
        self.followUpStatuses = lookupService.returnLookups(lookupService.followupStatus);
        // selected followup Status.
        self.followupStatus = null;
        // current for need replay
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

        self.selectedMainSiteSimple = null;

        self.isFollowupStatusMandatory = false;

        var followupStatusWithoutReply = _.find(self.followUpStatuses, function (status) {
                return status.lookupStrKey === 'WITHOUT_REPLY';
            }),
            followupStatusNeedReply = _.find(self.followUpStatuses, function (status) {
                return status.lookupStrKey === 'NEED_REPLY';
            }),
            properties = angular.copy(lookupService.getPropertyConfigurations('incoming')),
            defaultFollowupNumberOfDays = 3,
            defaultNeedReplyFollowupDate = generator.getFutureDate(defaultFollowupNumberOfDays),
            organizationForSLA = null,
            organizationForSLACentralArchive = null;

        function _isShowRegistryUnit() {
            return (employeeService.getEmployee().inCentralArchive() && self.correspondence.getInfo().isPaper);
        }

        var _resetDefaultNeedReplyFollowupDate = function () {
            $timeout(function (){
                if (self.correspondence) {
                    var priorityLevel = self.correspondence.getInfo().priorityLevel;
                    priorityLevel = priorityLevel.hasOwnProperty('lookupKey') ? priorityLevel.lookupKey : priorityLevel;

                    var slaOu = null;
                    // if paper outgoing or incoming and current ou is central archive, use selected registryOu as slaOu
                    if (_isShowRegistryUnit() && organizationForSLACentralArchive) {
                        slaOu = organizationForSLACentralArchive;
                    } else {
                        slaOu = organizationForSLA;
                    }
                    if (typeof priorityLevel !== 'undefined' && priorityLevel !== null) {
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


                // set followup date for all searched sites
                if (self.subSearchResultCopy && self.subSearchResultCopy.length) {
                    self.onFollowupStatusChange(self.followupStatus);
                }
                return defaultNeedReplyFollowupDate;
            })
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
                } else {
                    self.followupStatus = followupStatusWithoutReply;
                }
            } else {
                self.followupStatus = followupStatusWithoutReply;
            }
        }

        /**
         * concatenate main and sub correspondence sites.
         * @param timeout
         * @return {*}
         * @private
         */
        function _concatCorrespondenceSites(timeout) {
            if (!timeout) {
                self.subRecords = _.map([].concat([self.site]), 'subSiteId');
                return;
            }
            return $timeout(function () {
                return self.subRecords = _.map([].concat([self.site]), 'subSiteId');
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
                self.subSearchResult = [];
                self.mainSites = [];
                self.mainSitesCopy = angular.copy(self.mainSites);
                self.selectedMainSiteAdvanced = null;
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
        };
        /**
         * @description set all followupStatus for all subSearchResult.
         */
        self.onFollowupStatusChange = function (status) {
            self.followupStatus = status;
            _setSitesProperty(self.subSearchResult, 'followupStatus', status);

            if (self.needReply(status)) {
                self.followUpStatusDate = defaultNeedReplyFollowupDate;
                _setSitesProperty(self.subSearchResult, 'followupDate', defaultNeedReplyFollowupDate);
            } else {
                _setSitesProperty(self.subSearchResult, 'followupDate', null);
            }
        };
        /**
         * @description set all followupDate for all subSearchResult.
         */
        self.onFollowupDateChange = function () {
            _setSitesProperty(self.subSearchResult, 'followupDate', self.followUpStatusDate);
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
            }

        };

        self.onSiteFollowupStatusChange = function (status) {
            if (!self.needReply(status)) {
                self.site.followupDate = null;
            } else {
                if (self.site.followupStatus.lookupStrKey !== 'NEED_REPLY')
                    self.site.followupStatus = null;
            }
            self.site.followupStatus = status;
            if (self.needReply(status)) {
                self.site.followupDate = defaultNeedReplyFollowupDate;
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
                    _concatCorrespondenceSites(true).then(function () {
                        self.subSearchResult = _.filter(self.subSearchResultCopy, _filterSubSites);
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
                                    self.subSearchResult = [];
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

        /**
         * replace correspondence Site
         * @param site
         */
        self.replaceSite = function (site) {
            if (self.needReply(site.followupStatus) && !(site.followupDate))
                return toast.error(langService.get('sites_please_select_followup_date'));
            var promise;
            if (self.site && self.site.mainSiteId) {
                promise = dialog
                    .confirmMessage(langService.get('correspondence_site_will_change'))
                    .then(function () {
                        self.site = site;
                        if (self.notifyAfterChanges) {
                            self.notifyAfterChanges('add');
                        }
                        return true;
                    });
            } else {
                promise = $timeout(function () {
                    self.site = site;
                    self.notifyAfterChanges('add');
                });
            }
            promise.then(function () {
                _concatCorrespondenceSites(true).then(function () {
                    self.subSearchResult = _.filter(self.subSearchResultCopy, _filterSubSites);
                });
            });
        };

        self.deleteSite = function ($event) {
            dialog
                .confirmMessage(langService.get('confirm_delete_correspondence_site').change({name: self.site.getTranslatedName()}))
                .then(function () {
                    self.site = null;
                    if (self.notifyAfterChanges) {
                        self.notifyAfterChanges('delete');
                    }
                    _concatCorrespondenceSites(true).then(function () {
                        self.subSearchResult = _.filter(self.subSearchResultCopy, _filterSubSites);
                    });
                });
        };

        $scope.$watch(function () {
            return self.emptySubRecords;
        }, function (value) {
            if (value) {
                self.subRecords = _concatCorrespondenceSites(true);
                self.subSearchResult = [];
                self.emptySubRecords = false;
                self.selectedSiteTypeSimple = null;
                self.selectedMainSiteSimple = null;
                self.selectedMainSiteAdvanced = null;
                self.selectedSiteTypeAdvanced = null;
                self.mainSiteAdvancedSearchText = '';
                self.subSiteAdvancedSearchText = '';
                self.selectedSimpleSub = null;
                self.simpleSubSearchText = '';
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
         * @description drop down values for sub site search
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
         * @description Check if sub site search has text and is enabled
         * @returns {string|boolean}
         */
        self.isSubSiteSearchEnabled = function () {
            return self.simpleSubSiteResultSearchText;
        };

        function _setSLAOrganization() {
            return employeeService.getEmployee().getRegistryOrganization()
                .then(function (result) {
                    organizationForSLA = result;
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
        }

    });
};
