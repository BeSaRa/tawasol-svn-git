module.exports = function (app) {
    app.controller('classificationPopCtrl', function (lookupService,
                                                      ouClassificationService,
                                                      $q,
                                                      $filter,
                                                      organizationService,
                                                      toast,
                                                      _,
                                                      defaultOU,
                                                      langService,
                                                      classificationService,
                                                      generator,
                                                      validationService,
                                                      dialog,
                                                      Classification,
                                                      editMode,
                                                      classification,
                                                      rootEntity,
                                                      employeeService) {
        'ngInject';
        var self = this;
        self.controllerName = 'classificationPopCtrl';
        self.editMode = editMode;
        self.defaultOU = angular.copy(defaultOU);

        self.classification = angular.copy(classification);

        self.model = angular.copy(self.classification);

        self.employeeService = employeeService;
        self.ouSearchText = '';

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

        // get parents classifications and exclude the current from the result if in edit mode.
        self.parentClassifications = classificationService.getParentClassifications(editMode ? self.classification : false);
        if (!!defaultOU)
            self.parentClassifications = _.filter(self.parentClassifications, function (classification) {
                return !classification.isGlobal;
            });

        // self.organizations = organizationService.organizations;
        self.organizations = organizationService.getAllRegistryOrganizations();
        self.securityLevels = rootEntity.getGlobalSettings().getSecurityLevels();

        self.selectedOrganization = null;
        self.selectedOUClassifications = [];

        self.statusServices = {
            'activate': classificationService.activateBulkClassifications,
            'deactivate': classificationService.deactivateBulkClassifications,
            'true': classificationService.activateClassification,
            'false': classificationService.deactivateClassification
        };

        /**
         * @description Set the security level, global according to selected main site
         * @param $event
         */
        self.onChangeParent = function ($event) {
            if (self.classification.parent) {
                self.classification.securityLevels = self.classification.parent.securityLevels;
                self.classification.isGlobal = angular.copy(self.classification.parent.isGlobal);
                if (self.classification.isGlobal) {
                    self.classification.relatedOus = [];
                }
            } else {
                if (!self.editMode) {
                    self.classification.securityLevels = null;
                }
            }
        };

        /**
         * @description Checks the organization in dropdown. Skips it if its already added to related OUs
         * @param organization
         */
        self.excludeOrganizationIfExists = function (organization) {
            if (!self.editMode) {
                return _.find(self.classification.relatedOus, function (ou) {
                    return ou.id === organization.id;
                });
            } else {
                return _.find(self.classification.relatedOus, function (ou) {
                    return ou.ouid.id === organization.id;
                });
            }
        };

        /**
         * @description Saves the classification
         */
        self.saveClassification = function () {
            validationService
                .createValidation('CLASSIFICATION_VALIDATION')
                .addStep('check_required', true, generator.checkRequiredFields, self.classification, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_duplicate', true, classificationService.checkDuplicateClassification, [self.classification, self.editMode], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .validate()
                .then(function () {
                    var relatedOus = angular.copy(self.classification.relatedOus);
                    self.classification.relatedOus = [];
                    self.classification.save().then(function (classification) {
                        self.classification = classification;
                        if (!self.editMode) {
                            if (!self.classification.isGlobal && relatedOus.length) {
                                self.classification
                                    .addBulkToOUClassifications(relatedOus)
                                    .then(function (ouClassifications) {
                                        self.selectedOrganization = null;
                                        self.classification.relatedOus = ouClassifications;
                                        self.model = angular.copy(self.classification);
                                        self.editMode = true;
                                        toast.success(langService.get('add_success').change({name: self.classification.getNames()}));
                                        // if request comes from Organization popup, close the popup after add and return current ouClassification
                                        if (defaultOU) {
                                            var currentOUClassification = _.find(ouClassifications, function (ouClassification) {
                                                return ouClassification.ouid.id === defaultOU.id;
                                            });
                                            dialog.hide(currentOUClassification);
                                        }
                                    });
                            } else {
                                self.classification.relatedOus = relatedOus;
                                self.model = angular.copy(self.classification);
                                self.editMode = true;
                                toast.success(langService.get('add_success').change({name: self.classification.getNames()}));
                            }
                        } else {
                            self.classification.relatedOus = relatedOus;
                            self.model = angular.copy(self.classification);
                            dialog.hide(self.classification);
                        }
                    })
                });
        };

        /**
         * @description Handles the change of global switch in popup
         * @param $event
         */
        self.onChangeGlobal = function ($event) {
            if (!employeeService.isSuperAdminUser()) {
                self.classification.isGlobal = !self.classification.isGlobal;
                return false;
            }

            if (defaultOU) {
                self.classification.isGlobal = false;
                return;
            }
            self.selectedOrganization = null;
            if (!self.editMode) {
                self.classification.setRelatedOus([]);
                return;
            }
            if (self.classification.isGlobal) {
                dialog.confirmMessage(langService.get('related_organization_confirm'), null, null, $event)
                    .then(function () {
                        self.classification.setRelatedOus([]);
                    })
                    .catch(function () {
                        self.classification.isGlobal = false;
                    })
            }
        };

        /**
         * @description Adds the ouClassification
         */
        self.addOrganizationToClassification = function ($event) {
            if (!self.editMode) {
                self.classification.relatedOus.push(self.selectedOrganization);
                self.selectedOrganization = null;
            } else {
                self.classification
                    .addToOUClassifications(self.selectedOrganization)
                    .then(function () {
                        var relatedOus = angular.copy(self.classification.relatedOus);
                        if (self.classification.relatedOus.length === 1) {
                            self.classification.setRelatedOus([]);
                            self.classification.setIsGlobal(false).update()
                                .then(function () {
                                    self.classification.relatedOus = relatedOus;
                                    self.model = angular.copy(self.classification);
                                    toast.success(langService.get('add_success').change({name: self.selectedOrganization.getTranslatedName()}));
                                    self.selectedOrganization = null;
                                })
                        } else {
                            self.classification.setRelatedOus(relatedOus);
                            self.model = angular.copy(self.classification);
                            toast.success(langService.get('add_success').change({name: self.selectedOrganization.getTranslatedName()}));
                            self.selectedOrganization = null;
                        }
                    });
            }
        };

        self.canDeleteOUClassification = function (ouClassification) {
            if (self.defaultOU) {
                var ouId = self.editMode ? ouClassification.ouid.id : ouClassification.id;
                return (ouId !== self.defaultOU.id)
            }
            else if(!employeeService.isSuperAdminUser() && self.classification.relatedOus.length === 1) {
                return false;
            }
            return true;
        };

        /**
         * @description Delete the related OU(OUClassification)
         * @param ouClassification
         * @returns {*}
         */
        self.deleteOUClassification = function (ouClassification) {
            if (!self.canDeleteOUClassification(ouClassification)) {
                toast.error(langService.get('can_not_delete_ou'));
                return;
            }

            var ouName = (!self.editMode ? ouClassification.getNames() : ouClassification.ouid.getNames()),
                message = langService.get('confirm_delete').change({name: ouName});
            if (self.editMode && self.classification.relatedOus.length === 1) {
                if (!employeeService.isSuperAdminUser()) {
                    // this will change correspondenceSite to global and sub admin can't change private to global
                    dialog.errorMessage(langService.get('last_ou_can_not_be_removed'));
                    return false;
                }
                message = langService.get('last_organization_delete').change({name: ouClassification.classification.getTranslatedName()});
            }
            dialog.confirmMessage(message)
                .then(function () {
                    _deleteOUClassificationConfirmed(ouClassification);
                });
        };

        /**
         * @description Delete OUClassification confirmed
         * @param ouClassification
         * @private
         */
        var _deleteOUClassificationConfirmed = function (ouClassification) {
            if (!self.editMode) {
                var index = _.findIndex(self.classification.relatedOus, function (ou) {
                    return ou.id === ouClassification.id;
                });
                if (index > -1)
                    self.classification.relatedOus.splice(index, 1);

                self.selectedOrganization = null;
                self.selectedOUClassifications = [];
            } else {
                ouClassificationService.deleteOUClassification(ouClassification).then(function () {
                    self.selectedOrganization = null;
                    self.selectedOUClassifications = [];

                    var index = _.findIndex(self.classification.relatedOus, function (ou) {
                        return ou.ouid.id === ouClassification.ouid.id;
                    });
                    self.classification.relatedOus.splice(index, 1);
                    // if all related OUs(ouClassifications) are removed, change the classification to global
                    if (!self.classification.relatedOus.length) {
                        self.classification.setIsGlobal(true).update()
                            .then(function () {
                                self.model = angular.copy(self.classification);
                                toast.success(langService.get('delete_success'));
                                self.selectedTabIndex = 0;
                            });
                    } else {
                        toast.success(langService.get('delete_success'));
                    }
                });
            }
        };

        /**
         * @description Delete the bulk relatedOUs (OUClassifications)
         */
        self.deleteBulkOUClassifications = function () {
            var message = langService.get('confirm_delete_selected_multiple');
            if (self.editMode) {
                if (self.selectedOUClassifications.length === self.classification.relatedOus.length) {
                    message = langService.get('last_organization_delete').change({name: self.classification.getTranslatedName()});
                }
            }
            return dialog
                .confirmMessage(message)
                .then(function () {
                    return _removeBulkOUClassificationsConfirmed().then(function () {
                        self.selectedOrganization = null;
                        self.selectedOUClassifications = [];
                    });
                });
        };

        var _removeBulkOUClassificationsConfirmed = function () {
            // if defaultOU is available, skip current OU to delete
            self.selectedOUClassifications = _.filter(self.selectedOUClassifications, function (selectedOUClassification) {
                return self.canDeleteOUClassification(selectedOUClassification);
            });

            if (!self.editMode) {
                // keep the select ouClassifications as copy to loop on all selected records
                var ouClassification, index, selected = angular.copy(self.selectedOUClassifications);
                for (var i = 0; i < selected.length; i++) {
                    ouClassification = selected[i];
                    index = _.findIndex(self.classification.relatedOus, function (ou) {
                        return ou.id === ouClassification.id;
                    });
                    if (index > -1)
                        self.classification.relatedOus.splice(index, 1);
                }
                return $q.resolve(true);
            } else {
                return self.classification
                    .deleteBulkFromOUClassifications(self.selectedOUClassifications)
                    .then(function (result) {
                        // if all related OUs(ouClassifications) are removed, change the classification to global
                        if (!result.length) {
                            return self.classification.setIsGlobal(true).update()
                                .then(function () {
                                    self.model = angular.copy(self.classification);
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
         * @description load organization for the current classification.
         * @return {*}
         */
        self.getOUClassifications = function () {
            if (self.classification.id && !self.classification.isGlobal) {
                return ouClassificationService
                    .loadOUClassificationsByClassificationId(self.classification)
                    .then(function (result) {
                        self.classification.relatedOus = result;
                    });
            }
        };
        self.getOUClassifications();

        self.grid = {
            progress: null,
            limit: 5,
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: [5, 10, 20, {
                label: langService.get('all'),
                value: function () {
                    return self.classification.relatedOus.length + 21;
                }
            }]
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.classification.relatedOus = $filter('orderBy')(self.classification.relatedOus, self.grid.order);
        };

        /**
         * @description Reset the ouClassifications if classification is global
         */
        self.resetOUClassifications = function () {
            if (self.classification.isGlobal) {
                self.classification.setRelatedOus([]);
            }
        };

        /**
         * @description Check if classification is global or private with relatedOus
         */
        self.checkValidGlobal = function () {
            if (self.defaultOU) {
                if (self.editMode)
                    return true;
                else
                    return self.classification.relatedOus.length > 0;
            }
            return (!self.classification.isGlobal && self.classification.relatedOus.length > 0)
                || self.classification.isGlobal;
        };

        self.resetModel = function () {
            generator.resetFields(self.classification, self.model);
        };

        /**
         * @description Clears the searchText for the given field
         * @param fieldType
         */
        self.clearSearchText = function (fieldType) {
            self[fieldType + 'SearchText'] = '';
        };

        /**
         * @description Prevent the default dropdown behavior of keys inside the search box of workflow action dropdown
         * @param $event
         */
        self.preventSearchKeyDown = function ($event) {
            if ($event) {
                var code = $event.which || $event.keyCode;
                if (code !== 38 && code !== 40)
                    $event.stopPropagation();
            }
        };

        self.closeClassificationDialog = function () {
            dialog.cancel(self.model);
        };
    });
};
