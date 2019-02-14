module.exports = function (app) {
    app.controller('distributionListPopCtrl', function (distributionListService,
                                                        _,
                                                        $q,
                                                        editMode,
                                                        toast,
                                                        DistributionList,
                                                        validationService,
                                                        generator,
                                                        dialog,
                                                        langService,
                                                        distributionList,
                                                        organizations,
                                                        OUDistributionList,
                                                        ouDistributionListService) {
        'ngInject';
        var self = this;
        self.controllerName = 'distributionListPopCtrl';
        self.editMode = editMode;
        self.distributionList = angular.copy(distributionList);
        self.model = angular.copy(distributionList);

        self.organizations = organizations;
        self.validateLabels = {
            arName: 'arabic_name',
            enName: 'english_name'
        };

        self.selectedSiteType = null;
        self.selectedMainSite = null;
        self.subSiteSearchText = null;

        self.selectedTabIndex = 0;
        self.selectedTabName = "basic";
        self.tabsToShow = [
            'basic',
            'members',
            'ou'
        ];

        self.showTab = function (tabName) {
            return self.tabsToShow.indexOf(tabName) > -1;
        };
        self.setCurrentTab = function (tabName) {
            self.selectedTabName = tabName;
        };

        self.resetModel = function () {
            generator.resetFields(self.distributionList, self.model);
            self.selectedSiteType = null;
            self.selectedMainSite = null;
            self.subSiteSearchText = null;
        };

        /**
         * @description Save the distribution List
         */
        self.saveDistributionList = function () {
            validationService
                .createValidation('DISTRIBUTION_LIST_VALIDATION')
                .addStep('check_required', true, generator.checkRequiredFields, self.distributionList, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_duplicate', true, distributionListService.checkDuplicateDistributionList, [self.distributionList, self.editMode], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .validate()
                .then(function () {
                    var relatedOus = angular.copy(self.distributionList.relatedOus);
                    self.distributionList.relatedOus = [];
                    self.distributionList.save().then(function (distributionList) {
                        self.distributionList = distributionList;
                        if (!self.editMode) {
                            if (!self.distributionList.global && relatedOus.length) {
                                self.distributionList
                                    .addBulkToOUDistributionLists(relatedOus)
                                    .then(function (ouDistributionLists) {
                                        self.selectedOrganization = null;
                                        self.distributionList.relatedOus = ouDistributionLists;
                                        self.model = angular.copy(self.distributionList);
                                        self.editMode = true;
                                        toast.success(langService.get('add_success').change({name: self.distributionList.getNames()}));

                                    });
                            } else {
                                self.distributionList.relatedOus = relatedOus;
                                self.model = angular.copy(self.distributionList);
                                self.editMode = true;
                                toast.success(langService.get('add_success').change({name: self.distributionList.getNames()}));
                            }
                        } else {
                            self.distributionList.relatedOus = relatedOus;
                            self.model = angular.copy(self.distributionList);
                            dialog.hide(self.distributionList);
                        }
                    })

                });
        };

        /**
         * @description Handles the change of global switch in popup
         * @param $event
         */
        self.onChangeGlobal = function ($event) {
            self.selectedOrganization = null;
            if (!self.editMode) {
                self.distributionList.setRelatedOus([]);
                return;
            }
            if (self.distributionList.global) {
                dialog.confirmMessage(langService.get('related_organization_confirm'), null, null, $event)
                    .then(function () {
                        self.distributionList.setRelatedOus([]);
                    })
                    .catch(function () {
                        self.distributionList.global = false;
                    })
            }
        };

        /**
         * @description Close the popup
         */
        self.closeDistributionListPopup = function () {
            dialog.cancel(self.distributionList);
        };

        self.selectedOrganization = null;
        self.selectedOUDistributionLists = [];

        /**
         * @description Adds the ouDistributionList
         */
        self.addOrganizationToDistributionList = function () {
            if (!self.editMode) {
                self.distributionList.relatedOus.push(self.selectedOrganization);
                self.selectedOrganization = null;
            } else {
                self.distributionList
                    .addToOUDistributionLists(self.selectedOrganization)
                    .then(function () {
                        var relatedOus = angular.copy(self.distributionList.relatedOus);
                        if (self.distributionList.relatedOus.length === 1) {
                            self.distributionList.setRelatedOus([]);
                            self.distributionList.setIsGlobal(false).update()
                                .then(function () {
                                    self.distributionList.relatedOus = relatedOus;
                                    self.model = angular.copy(self.distributionList);
                                    toast.success(langService.get('add_success').change({name: self.selectedOrganization.getTranslatedName()}));
                                    self.selectedOrganization = null;
                                })
                        } else {
                            self.distributionList.setRelatedOus(relatedOus);
                            self.model = angular.copy(self.distributionList);
                            toast.success(langService.get('add_success').change({name: self.selectedOrganization.getTranslatedName()}));
                            self.selectedOrganization = null;
                        }
                    });
            }
        };

        /**
         * @description Checks the organization in dropdown. Skips it if its already added to related OUs
         * @param organization
         */
        self.excludeOrganizationIfExists = function (organization) {
            if (!self.editMode) {
                return _.find(self.distributionList.relatedOus, function (ou) {
                    return ou.id === organization.id;
                });
            } else {
                return _.find(self.distributionList.relatedOus, function (ou) {
                    return ou.ouid.id === organization.id;
                });
            }
        };

        /**
         * @description Delete the bulk relatedOUs (OUDistributionLists)
         */
        self.removeBulkOUDistributionLists = function () {
            var message = langService.get('confirm_delete_selected_multiple');
            if (self.editMode) {
                if (self.selectedOUDistributionLists.length === self.distributionList.relatedOus.length) {
                    message = langService.get('last_organization_delete').change({name: self.distributionList.getTranslatedName()});
                }
            }
            return dialog
                .confirmMessage(message)
                .then(function () {
                    return _removeBulkOUDistributionConfirmed().then(function () {
                        self.selectedOrganization = null;
                        self.selectedOUDistributionLists = [];
                    });
                });
        };

        var _removeBulkOUDistributionConfirmed = function () {
            if (!self.editMode) {
                // keep the select ouDistributionLists as copy to loop on all selected records
                var ouDistributionList, index, selected = angular.copy(self.selectedOUDistributionLists);
                for (var i = 0; i < selected.length; i++) {
                    ouDistributionList = selected[i];
                    index = _.findIndex(self.distributionList.relatedOus, function (ou) {
                        return ou.id === ouDistributionList.id;
                    });
                    if (index > -1)
                        self.distributionList.relatedOus.splice(index, 1);
                }
                self.selectedOUDistributionLists = [];
                return $q.resolve(true);
            } else {
                return self.distributionList
                    .deleteBulkFromOUDistributionLists(self.selectedOUDistributionLists)
                    .then(function (result) {
                        // if all related OUs(ouDistributionList) are removed, change the distributionList to global
                        if (!result.length) {
                            return self.distributionList.setIsGlobal(true).update()
                                .then(function () {
                                    self.model = angular.copy(self.distributionList);
                                    toast.success(langService.get('related_organizations_deleted_success'));
                                    self.selectedTabIndex = 0;
                                    return true;
                                });
                        } else {
                            toast.success(langService.get('related_organizations_deleted_success'));
                            return $q.resolve(true);
                        }
                    });
            }
        };

        /**
         * @description Delete the related OU(ouDistributionList)
         * @param ouDistributionList
         * @returns {*}
         */
        self.deleteOUDistributionList = function (ouDistributionList) {
            var ouName = (!self.editMode ? ouDistributionList.getNames() : ouDistributionList.ouid.getNames()),
                message = langService.get('confirm_delete').change({name: ouName});
            if (self.editMode && self.distributionList.relatedOus.length === 1) {
                message = langService.get('last_organization_delete').change({name: self.distributionList.getTranslatedName()});
            }
            dialog.confirmMessage(message)
                .then(function () {
                    _deleteOUDistributionListConfirmed(ouDistributionList);
                });
        };

        /**
         * @description Delete ouDistributionList confirmed
         * @param ouDistributionList
         * @private
         */
        var _deleteOUDistributionListConfirmed = function (ouDistributionList) {
            if (!self.editMode) {
                var index = _.findIndex(self.distributionList.relatedOus, function (ou) {
                    return ou.id === ouDistributionList.id;
                });
                if (index > -1)
                    self.distributionList.relatedOus.splice(index, 1);
                self.selectedOrganization = null;
                self.selectedOUDistributionLists = [];
            } else {
                ouDistributionListService.deleteOUDistributionList(ouDistributionList).then(function () {
                    self.selectedOrganization = null;
                    self.selectedOUDistributionLists = [];

                    var index = _.findIndex(self.distributionList.relatedOus, function (ou) {
                        return ou.ouid.id === ouDistributionList.ouid.id;
                    });
                    self.distributionList.relatedOus.splice(index, 1);
                    // if all related OUs(ouDistributionList) are removed, change the distributionList to global
                    if (!self.distributionList.relatedOus.length) {
                        self.distributionList.setIsGlobal(true).update()
                            .then(function () {
                                self.model = angular.copy(self.distributionList);
                                toast.success(langService.get('delete_success'));
                                self.selectedTabIndex = 0;
                            });
                    } else {
                        toast.success(langService.get('delete_success'));
                    }
                });
            }
        };


        self.selectMembersDistributionLists = null;
        self.selectedMembersDistributionLists = [];
        self.addDistributionListMemberToList = function () {
            self.distributionList.distributionListMembers.push(self.selectMembersDistributionLists);
            self.selectMembersDistributionLists = null;
        };

        self.deleteMemberDistributionListFromCtrl = function (correspondenceSite) {
            var index = self.distributionList.distributionListMembers.indexOf(correspondenceSite);
            self.distributionList.distributionListMembers.splice(index, 1);
            self.distributionListMembers = self.distributionList.distributionListMembers;
        };

        /**
         * @description Reset the ouDistributionList if distributionList is global
         */
        self.resetOUDistributionLists = function () {
            if (self.distributionList.global) {
                self.distributionList.setRelatedOus([]);
            }
        }

        /**
         * @description Check if distributionList is global or private with relatedOus
         * True if valid
         */
        self.checkValidGlobal = function () {
            return (self.distributionList.distributionListMembers.length > 0) && ((!self.distributionList.global && self.distributionList.relatedOus.length > 0) || self.distributionList.global);
        };
    });
};