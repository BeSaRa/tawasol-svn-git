module.exports = function (app) {
    app.controller('distributionListPopCtrl', function (distributionListService,
                                                        _,
                                                        editMode,
                                                        toast,
                                                        DistributionList,
                                                        validationService,
                                                        generator,
                                                        dialog,
                                                        langService,
                                                        distributionList,
                                                        mainCorrespondenceSites,
                                                        organizations,
                                                        OUDistributionList,
                                                        ouDistributionListService) {
        'ngInject';
        var self = this;
        self.controllerName = 'distributionListPopCtrl';
        self.editMode = editMode;
        self.distributionList = angular.copy(distributionList);
        self.model = angular.copy(distributionList);
        self.mainCorrespondenceSites = mainCorrespondenceSites;
        self.organizations = organizations;
        self.validateLabels = {
            arName: 'arabic_name',
            enName: 'english_name'
        };

        self.resetModel = function () {
            generator.resetFields(self.distributionList, self.model);
        };

        /**
         * @description Add new distribution List
         */
        self.addDistributionListFromCtrl = function () {
            validationService
                .createValidation('ADD_DISTRIBUTION_LIST')
                .addStep('check_required', true, generator.checkRequiredFields, self.distributionList, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_duplicate', true, distributionListService.checkDuplicateDistributionList, [self.distributionList, false], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .validate()
                .then(function () {
                    distributionListService.addDistributionList(self.distributionList).then(function (result) {
                        toast.success(langService.get('add_success').change({name: self.distributionList.getNames()}));
                        //dialog.hide();
                        self.editMode = true;
                        self.distributionList = angular.copy(result);
                        self.model = angular.copy(self.distributionList);
                    });
                })
                .catch(function () {

                });
        };

        /**
         * @description Edit distribution List
         */
        self.editDistributionListFromCtrl = function () {
            validationService
                .createValidation('EDIT_DISTRIBUTION_LIST')
                .addStep('check_required', true, generator.checkRequiredFields, self.distributionList, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_duplicate', true, distributionListService.checkDuplicateDistributionList, [self.distributionList, true], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .validate()
                .then(function () {
                    distributionListService.updateDistributionList(self.distributionList).then(function () {
                        dialog.hide(self.distributionList);
                    });
                })
                .catch(function () {

                });
        };

        self.changeGlobalFromEdit = function () {
            if (!self.editMode)
                return;
            self.changeGlobalFromFromGrid(self.distributionList);
        };

        /**
         * check global status
         * @param distributionList
         */
        self.changeGlobalFromFromGrid = function (distributionList) {
            // if distributionList global and has organizations.
            if (distributionList.global && distributionList.hasOrganizations()) {
                dialog.confirmMessage(langService.get('related_organization_confirm'))
                    .then(function () {
                        distributionList
                            .deleteAllOUDistributionLists()
                            .then(function () {
                                distributionList.global = true;
                                distributionList.update().then(self.displayDistributionListGlobalMessage);
                            });
                    })
                    .catch(function () {
                        distributionList.global = false;
                    })
            }
            // if distributionList global and has not organizations.
            if (distributionList.global && !distributionList.hasOrganizations()) {
                distributionList.update().then(self.displayDistributionListGlobalMessage);
            }
            // if distributionList not global and no organizations.
            if (!distributionList.global && !distributionList.hasOrganizations()) {
                self.openSelectOUDistributionListDialog(distributionList)
                    .then(function (distributionList) {
                        distributionList.update().then(self.displayDistributionListGlobalMessage);
                    })
                    .catch(function () {
                        distributionList.setIsGlobal(true).update();
                    });
            }
        };

        self.openSelectOUDistributionListDialog = function (distributionList) {
            return distributionList
                .opendDialogToSelectOrganizations()
                .then(function () {
                    return distributionList;
                });
        };

        /**
         * @description Close the popup
         */
        self.closeDistributionListPopupFromCtrl = function () {
            dialog.cancel(self.distributionList);
        };

        self.selectedOrganization = null;
        self.selectedOUDistributionLists = [];

        self.addOrganizationToDistributionList = function () {
            self.distributionList
                .addToOUDistributionLists(self.selectedOrganization)
                .then(function (relatedOus) {
                    self.distributionList.relatedOus = relatedOus;
                    toast.success(langService.get('add_success').change({name: self.selectedOrganization.getTranslatedName()}));
                    self.selectedOrganization = null;
                });
        };

        self.ouExists = function (ou) {
            return _.find(self.distributionList.relatedOus, function (item) {
                return Number(item.ouid.id) === Number(ou.id)
            });
        };

        self.excludeOrganizationIfExists = function (organization) {
            return _.find(self.distributionList.relatedOus, function (ouDistributionList) {
                return ouDistributionList.ouid.id === organization.id;
            });
        };

        self.removeBulkOUDistributionLists = function () {
            self.distributionList
                .deleteBulkFromOUDistributionLists(self.selectedOUDistributionLists)
                .then(function () {
                    self.selectedOUDistributionLists = [];
                    toast.success(langService.get('related_organizations_deleted_success'));
                });
        };

        self.deleteOUDistributionListFromCtrl = function (ouDistributionList) {
            return ouDistributionListService.deleteOUDistributionList(ouDistributionList).then(function () {
                toast.success(langService.get('delete_success'));
                var index = self.distributionList.relatedOus.indexOf(ouDistributionList);
                self.distributionList.relatedOus.splice(index, 1);
                self.relatedOus = self.distributionList.relatedOus;
            });
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

        /*self.excludeSubCorrespondenceSiteIfExists = function (organization) {
         return _.find(self.distributionList.distributionListMembers, function (distributionList) {
         return distributionList.distributionListMembers.site.id === organization.id;
         });
         };*/


    });
};