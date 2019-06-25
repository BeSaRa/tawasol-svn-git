module.exports = function (app) {
    app.controller('correspondenceSitePopCtrl', function (ouCorrespondenceSiteService,
                                                          correspondenceSiteTypeService,
                                                          $q,
                                                          _,
                                                          defaultOU,
                                                          $filter,
                                                          organizationService,
                                                          toast,
                                                          langService,
                                                          correspondenceSiteService,
                                                          generator,
                                                          validationService,
                                                          dialog,
                                                          CorrespondenceSite,
                                                          editMode,
                                                          correspondenceSite,
                                                          employeeService) {
        'ngInject';
        var self = this;
        self.controllerName = 'correspondenceSitePopCtrl';
        self.editMode = editMode;

        self.correspondenceSite = angular.copy(correspondenceSite);
        self.model = angular.copy(self.correspondenceSite);

        self.employeeService = employeeService;

        self.defaultOU = defaultOU;

        self.selectedTabIndex = 0;
        self.selectedTabName = "basic";
        self.tabsToShow = [
            'basic',
            'ou'
        ];

        self.showTab = function (tabName) {
            var canShow = true;
            if (tabName === 'ou')
                canShow = !self.defaultOU || (self.defaultOU && !self.editMode);
            return canShow && self.tabsToShow.indexOf(tabName) > -1;
        };
        self.setCurrentTab = function (tabName) {
            self.selectedTabName = tabName;
        };

        self.correspondenceTypes = correspondenceSiteTypeService.correspondenceSiteTypes;
        // get parent correspondenceSites and exclude the current from the result if in edit mode.
        self.parentCorrespondenceSites = correspondenceSiteService.getParentCorrespondenceSites(editMode ? self.correspondenceSite : false);
        if (!!defaultOU)
            self.parentCorrespondenceSites = _.filter(self.parentCorrespondenceSites, function (correspondenceSite) {
                return !correspondenceSite.isGlobal;
            });
        // self.organizations = organizationService.organizations;
        self.organizations = organizationService.getAllRegistryOrganizations();
        self.selectedOrganization = null;
        self.selectedOUCorrespondenceSites = [];

        /**
         * @description Checks the organization in dropdown. Skips it if its already added to related OUs
         * @param organization
         */
        self.excludeOrganizationIfExists = function (organization) {
            if (!self.editMode) {
                return _.find(self.correspondenceSite.relatedOus, function (ou) {
                    return ou.id === organization.id;
                });
            } else {
                return _.find(self.correspondenceSite.relatedOus, function (ou) {
                    return ou.ouid.id === organization.id;
                });
            }
        };

        /**
         * @description Set the global according to selected main classification
         * @param $event
         */
        self.onChangeParent = function($event){
            if (self.correspondenceSite.parent) {
                self.correspondenceSite.isGlobal = angular.copy(self.correspondenceSite.parent.isGlobal);
                if (self.correspondenceSite.isGlobal) {
                    self.correspondenceSite.relatedOus = [];
                }
            }
        };

        /**
         * @description Handles the change of global switch in popup
         * @param $event
         */
        self.onChangeGlobal = function ($event) {
            if (!employeeService.isSuperAdminUser()){
                self.correspondenceSite.isGlobal = !self.correspondenceSite.isGlobal;
                return false;
            }

            if (defaultOU) {
                self.correspondenceSite.isGlobal = false;
                return;
            }
            self.selectedOrganization = null;
            if (!self.editMode) {
                self.correspondenceSite.setRelatedOus([]);
            } else {
                // If correspondence site is already global when popup is opened and now changed to private, it can't be changed to private. Show alert to user
                if (self.model.isGlobal && !self.correspondenceSite.isGlobal) {
                    self.correspondenceSite.isGlobal = true;
                    dialog.alertMessage(langService.get('can_not_change_global_to_private').change({type: langService.get('correspondence_site')}));
                } else {
                    // if changing to global, show confirm box
                    if (self.correspondenceSite.isGlobal) {
                        // show confirm box
                        dialog.confirmMessage(langService.get('related_organization_confirm'), null, null, $event)
                            .then(function () {
                                self.correspondenceSite.setRelatedOus([]);
                            })
                            .catch(function () {
                                self.correspondenceSite.isGlobal = false;
                            })
                    }
                }
            }
        };

        /**
         * @description Saves the correspondence site
         */
        self.saveCorrespondenceSite = function () {
            validationService
                .createValidation('SAVE_CORRESPONDENCE_SITE_VALIDATION')
                .addStep('check_required', true, generator.checkRequiredFields, self.correspondenceSite, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_duplicate', true, correspondenceSiteService.checkDuplicateCorrespondenceSite, [self.correspondenceSite, self.editMode], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .addStep('check_numbers', true, generator.checkNameNumbers, [self.correspondenceSite, ['arName', 'enName', 'arDisplayName', 'enDisplayName']], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('arabic_english_cannot_be_just_numbers'));
                })
                .validate()
                .then(function () {
                    var relatedOus = angular.copy(self.correspondenceSite.relatedOus);
                    self.correspondenceSite.relatedOus = [];
                    self.correspondenceSite.save().then(function (correspondenceSite) {
                        self.correspondenceSite = correspondenceSite;
                        if (!self.editMode) {
                            if (!self.correspondenceSite.isGlobal && relatedOus.length) {
                                self.correspondenceSite
                                    .addBulkToOUCorrespondenceSites(relatedOus)
                                    .then(function (ouCorrespondenceSites) {
                                        self.selectedOrganization = null;
                                        self.correspondenceSite.relatedOus = ouCorrespondenceSites;
                                        self.model = angular.copy(self.correspondenceSite);
                                        self.editMode = true;
                                        toast.success(langService.get('add_success').change({name: self.correspondenceSite.getNames()}));
                                        // if request comes from Organization popup, close the popup after add and return current ouCorrespondenceSite
                                        if (defaultOU) {
                                            var currentOUCorrespondenceSite = _.find(ouCorrespondenceSites, function (ouCorrespondenceSite) {
                                                return ouCorrespondenceSite.ouid.id === defaultOU.id;
                                            });
                                            dialog.hide(currentOUCorrespondenceSite);
                                        }
                                    });
                            } else {
                                self.correspondenceSite.relatedOus = relatedOus;
                                self.model = angular.copy(self.correspondenceSite);
                                self.editMode = true;
                                if (self.correspondenceSite.parent)
                                    dialog.hide(self.correspondenceSite);
                                toast.success(langService.get('add_success').change({name: self.correspondenceSite.getNames()}));
                            }
                        } else {
                            self.correspondenceSite.relatedOus = relatedOus;
                            self.model = angular.copy(self.correspondenceSite);
                            dialog.hide(self.correspondenceSite);
                        }
                    })
                });
        };

        /**
         * @description Adds the ouCorrespondenceSite
         */
        self.addOrganizationToCorrespondenceSite = function () {
            if (!self.editMode) {
                self.correspondenceSite.relatedOus.push(self.selectedOrganization);
                self.selectedOrganization = null;
            } else {
                self.correspondenceSite
                    .addToOUCorrespondenceSites(self.selectedOrganization)
                    .then(function () {
                        toast.success(langService.get('add_success').change({name: self.selectedOrganization.getTranslatedName()}));
                        self.selectedOrganization = null;
                    });
            }
        };

        self.canDeleteOUCorrespondenceSite = function (ouCorrespondenceSite) {
            if (self.defaultOU) {
                var ouId = self.editMode ? ouCorrespondenceSite.ouid.id : ouCorrespondenceSite.id;
                return (ouId !== self.defaultOU.id)
            }
            else if(!employeeService.isSuperAdminUser() && self.correspondenceSite.relatedOus.length === 1) {
                return false;
            }
            return true;
        };

        /**
         * @description Deletes the relatedOU (OUCorrespondenceSite)
         * @param ouCorrespondenceSite
         * @returns {*}
         */
        self.deleteOUCorrespondenceSite = function (ouCorrespondenceSite) {
            if (!self.canDeleteOUCorrespondenceSite(ouCorrespondenceSite)) {
                toast.error(langService.get('can_not_delete_ou'));
                return;
            }
            if (self.editMode && self.correspondenceSite.relatedOus.length === 1) {
                if (!employeeService.isSuperAdminUser()) {
                    // this will change correspondenceSite to global and sub admin can't change private to global
                    dialog.errorMessage(langService.get('last_ou_can_not_be_removed'));
                    return false;
                }
                return dialog.errorMessage(langService.get('can_not_delete_all_ou'));
            }

            dialog.confirmMessage(langService.get('confirm_delete').change({name: (!self.editMode ? ouCorrespondenceSite.getNames() : ouCorrespondenceSite.ouid.getNames())}))
                .then(function () {
                    if (!self.editMode) {
                        var index = _.findIndex(self.correspondenceSite.relatedOus, function (ou) {
                            return ou.id === ouCorrespondenceSite.id;
                        });
                        if (index > -1)
                            self.correspondenceSite.relatedOus.splice(index, 1);
                    } else {
                        /*if (self.correspondenceSite.relatedOus.length === 1)
                            return dialog.errorMessage(langService.get('can_not_delete_all_ou'));*/

                        return ouCorrespondenceSiteService.deleteOUCorrespondenceSite(ouCorrespondenceSite).then(function () {
                            toast.success(langService.get('delete_success'));
                            var index = _.findIndex(self.correspondenceSite.relatedOus, function (ou) {
                                return ou.ouid.id === ouCorrespondenceSite.ouid.id;
                            });
                            self.correspondenceSite.relatedOus.splice(index, 1);
                        });
                    }
                })
        };

        /**
         * @description Delete the bulk relatedOUs (OUCorrespondenceSites)
         */
        self.deleteBulkOUCorrespondenceSites = function () {
            // if defaultOU is available, skip current OU to delete
            self.selectedOUCorrespondenceSites = _.filter(self.selectedOUCorrespondenceSites, function (selectedOUCorrespondenceSite) {
                return self.canDeleteOUCorrespondenceSite(selectedOUCorrespondenceSite);
            });

            if (!self.editMode) {
                // keep the select ouCorrespondenceSites as copy to loop on all selected records
                var ouCorrespondenceSite, index, selected = angular.copy(self.selectedOUCorrespondenceSites);
                for (var i = 0; i < selected.length; i++) {
                    ouCorrespondenceSite = selected[i];
                    index = _.findIndex(self.correspondenceSite.relatedOus, function (ou) {
                        return ou.id === ouCorrespondenceSite.id;
                    });
                    if (index > -1)
                        self.correspondenceSite.relatedOus.splice(index, 1);
                }
                self.selectedOUCorrespondenceSites = [];
            } else {
                if (self.selectedOUCorrespondenceSites.length === self.correspondenceSite.relatedOus.length)
                    dialog.errorMessage(langService.get('can_not_delete_all_ou'));

                else {
                    self.correspondenceSite
                        .deleteBulkFromOUCorrespondenceSites(self.selectedOUCorrespondenceSites)
                        .then(function () {
                            self.selectedOrganization = null;
                            self.selectedOUCorrespondenceSites = [];
                            toast.success(langService.get('related_organizations_deleted_success'));
                        });
                }
            }
        };

        /**
         * @description get related ous for the current correspondence site.
         * @return {*}
         */
        self.getOUCorrespondenceSites = function () {
            if (self.model.id && !self.correspondenceSite.isGlobal) {
                return ouCorrespondenceSiteService
                    .loadOUCorrespondenceSitesByCorrespondenceSiteId(self.correspondenceSite)
                    .then(function (result) {
                        self.correspondenceSite.relatedOus = result;
                    });
            }
        };

        self.grid = {
            progress: null,
            limit: 5,
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: [5, 10, 20, {
                label: langService.get('all'),
                value: function () {
                    return self.correspondenceSite.relatedOus.length + 21;
                }
            }]
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.correspondenceSite.relatedOus = $filter('orderBy')(self.correspondenceSite.relatedOus, self.grid.order);
        };

        /**
         * @description Reset the ouCorrespondenceSites if correspondence site is global
         */
        self.resetOUCorrespondenceSites = function () {
            if (self.correspondenceSite.isGlobal) {
                self.correspondenceSite.setRelatedOus([]);
            }
        };

        /**
         * @description Check if correspondence site is global or private with relatedOus
         */
        self.checkValidGlobal = function () {
            if (self.defaultOU) {
                if (self.editMode)
                    return true;
                else
                    return self.correspondenceSite.relatedOus.length > 0;
            }

            return (!self.correspondenceSite.isGlobal && self.correspondenceSite.relatedOus.length > 0)
                || self.correspondenceSite.isGlobal;
        };

        self.resetModel = function (form) {
            generator.resetFields(self.correspondenceSite, self.model);
            form.$setUntouched();
        };

        self.closeCorrespondenceSiteDialog = function () {
            dialog.cancel(self.model);
        };

    });
};
