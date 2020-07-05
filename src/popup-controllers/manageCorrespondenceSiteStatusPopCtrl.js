module.exports = function (app) {
    app.controller('manageCorrespondenceSiteStatusPopCtrl', function (_,
                                                                      toast,
                                                                      $scope,
                                                                      generator,
                                                                      dialog,
                                                                      langService,
                                                                      correspondence,
                                                                      sites,
                                                                      lookupService,
                                                                      Information) {
        'ngInject';
        var self = this;
        self.controllerName = 'manageCorrespondenceSiteStatusPopCtrl';

        self.correspondence = angular.copy(correspondence);
        self.model = angular.copy(correspondence);

        if (self.correspondence.getInfo().documentClass === 'outgoing') {
            if (self.correspondence.hasVsId()) {
                self.correspondence.sitesInfoCC = sites.second;
                self.correspondence.sitesInfoTo = sites.first;
            }
        } else {
            if (self.correspondence.site.followupDate && angular.isNumber(self.correspondence.site.followupDate)) {
                self.correspondence.site.followupDate = generator.getDateFromTimeStamp(self.correspondence.site.followupDate);
            }
        }

        self.needReply = function (status) {
            if (typeof status === 'undefined' || status === null) {
                return false;
            }
            if (status instanceof Information) {
                return generator.getNormalizedValue(status, 'id') === 0;
            }
            return (generator.getNormalizedValue(status, 'lookupStrKey') === 'NEED_REPLY');
        };

        self.sitesInfoToSelected = [];
        self.sitesInfoToFollowupStatus = null;
        self.sitesInfoToFollowupStatusDate = null;
        self.sitesInfoCCSelected = [];
        self.sitesInfoCCFollowupStatus = null;
        self.sitesInfoCCFollowupStatusDate = null;

        self.minDate = generator.getFutureDate(1);

        self.followUpStatuses = lookupService.returnLookups(lookupService.followupStatus);

        var defaultFollowupNumberOfDays = 3,
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

            return defaultNeedReplyFollowupDate;
        };

        self.grid = {
            sitesInfoTo: {
                progress: null,
                limit: 5, // default limit
                page: 1, // first page
                order: 'mainArSiteText', // default sorting order
                limitOptions: [5, 10, 20, // limit options
                    {
                        label: langService.get('all'),
                        value: function () {
                            return (self.correspondence.sitesInfoTo.length + 21);
                        }
                    }
                ]
            },
            sitesInfoCC: {
                progress: null,
                limit: 5, // default limit
                page: 1, // first page
                order: 'mainArSiteText', // default sorting order
                limitOptions: [5, 10, 20, // limit options
                    {
                        label: langService.get('all'),
                        value: function () {
                            return (self.correspondence.sitesInfoCC.length + 21);
                        }
                    }
                ]
            }
        };

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

        self.resetToStatusAndDate = function () {
            self['sitesInfoToFollowupStatus'] = null;
            self['sitesInfoToFollowupStatusDate'] = null;
        };

        self.resetCCStatusAndDate = function () {
            self['sitesInfoCCFollowupStatus'] = null;
            self['sitesInfoCCFollowupStatusDate'] = null;
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
         * @description change date for selected sitesInfo.
         */
        self.onSitesInfoFollowupDateChange = function (type) {
            _setSitesProperty(self['sitesInfo' + type + 'Selected'], 'followupDate', self['sitesInfo' + type + 'FollowupStatusDate']);
        };

        /**
         * @description Checks if added correspondence sites are valid.
         * If followup status = Need reply, it should have followup date too.
         * In case of outgoing, at least one original site should added.
         * @returns {boolean}
         * If true, the correspondence sites is invalid and disable the save button
         */
        self.checkDisabled = function () {
            var i, record;
            if (self.documentClass.toLowerCase() === 'outgoing') {
                if (self.correspondence.hasSiteTO()) {
                    var inValidSitesCount = 0;
                    for (i = 0; i < self.correspondence.sitesInfoTo.length; i++) {
                        record = self.correspondence.sitesInfoTo[i];
                        if (self.needReply(record.followupStatus) && !record.followupDate) {
                            inValidSitesCount++;
                        }
                    }
                    for (i = 0; i < self.correspondence.sitesInfoCC.length; i++) {
                        record = self.correspondence.sitesInfoCC[i];
                        if (self.needReply(record.followupStatus) && !record.followupDate) {
                            inValidSitesCount++;
                        }
                    }
                    return !!inValidSitesCount;
                }
                return true;
            } else {
                if (self.correspondence.site) {
                    record = self.correspondence.site;
                    return !!(self.needReply(record.followupStatus) && !record.followupDate);
                }
                return true;
            }
        };

        /**
         * @description Saves correspondence sites
         */
        self.saveCorrespondenceSites = function () {
            if (self.documentClass.toLowerCase() === 'outgoing') {
                self.correspondence
                    .updateSites()
                    .then(function () {
                        toast.success(langService.get('correspondence_sites_save_success'));
                        dialog.hide();
                    });
            } else {
                self.correspondence
                    .saveIncomingSite()
                    .then(function () {
                        toast.success(langService.get('correspondence_sites_save_success'));
                        dialog.hide();
                    });
            }
        };

        /**
         * @description Close the popup
         */
        self.closePopup = function () {
            dialog.cancel();
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

        function _initPriorityLevelWatch() {
            $scope.$watch(function () {
                return self.correspondence.getInfo().priorityLevel;
            }, function (value) {
                _resetDefaultNeedReplyFollowupDate();
            });
        }

        self.$onInit = function () {
            _setSLAOrganization()
                .then(function () {
                    //_requestSelectedRegistryOu();
                    if (self.correspondence) {
                        _initPriorityLevelWatch();
                    }
                });
        };
    });
};
