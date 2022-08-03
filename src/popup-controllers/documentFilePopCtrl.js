module.exports = function (app) {
    app.controller('documentFilePopCtrl', function (lookupService,
                                                    documentFileService,
                                                    DocumentFile,
                                                    $q,
                                                    _,
                                                    langService,
                                                    toast,
                                                    dialog,
                                                    editMode,
                                                    documentFile,
                                                    validationService,
                                                    generator,
                                                    organizationService,
                                                    OUDocumentFile,
                                                    rootEntity,
                                                    ouDocumentFileService,
                                                    correspondenceService,
                                                    documentClassFromUser,
                                                    employeeService) {
        'ngInject';
        var self = this;
        self.controllerName = 'documentFilePopCtrl';
        self.editMode = editMode;
        self.editModeRelatedOu = false;
        self.employeeService = employeeService;
        self.ouSearchText = '';

        self.documentFile = angular.copy(documentFile);
        self.documentClassFromUser = documentClassFromUser;

        self.organizations = organizationService.getAllRegistryOrganizations();
        self.securityLevels = rootEntity.getGlobalSettings().getSecurityLevels();

        if (documentClassFromUser) {
            self.securityLevels = correspondenceService.getLookup(documentClassFromUser, 'securityLevels');
            var ouId = employeeService.getEmployee().getRegistryOUID(),
                organization = _.find(self.organizations, function (ou) {
                    return ou.id === ouId;
                });
            var ouDocumentFile = new OUDocumentFile({
                itemOrder: generator.createNewID(self.documentFile.relatedOus, 'itemOrder'),
                file: self.documentFile.id,
                ouid: organization
            });
            self.documentFile.relatedOus.push(ouDocumentFile);
        }
        self.model = angular.copy(self.documentFile);


        self.selectedTabIndex = 0;
        self.selectedTab = "basic";
        self.tabsToShow = [
            'basic',
            'security'
        ];

        self.showTab = function (tabName) {
            return self.tabsToShow.indexOf(tabName) > -1;
        };
        self.setCurrentTab = function (tabName) {
            self.selectedTab = tabName;
        };

        self.parentDocumentFiles = _.filter(documentFileService.documentFiles, function (documentFile) {
            return !documentFile.parent;
        });

        self.ouDocumentFilesProgress = null;

        self.validateLabels = {
            arName: 'arabic_name',
            enName: 'english_name',
            securityLevels: 'security_level'
        };

        self.saveDocumentFile = function($event){
            validationService
                .createValidation('DOCUMENT_FILE_VALIDATION')
                .addStep('check_required', true, generator.checkRequiredFields, self.documentFile, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_duplicate', true, documentFileService.checkDuplicateClassification, [self.documentFile, self.editMode], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .validate()
                .then(function () {
                    var relatedOus = angular.copy(self.documentFile.relatedOus);
                    self.documentFile.relatedOus = [];
                    self.documentFile.save().then(function (documentFile) {
                        self.documentFile = documentFile;
                        if (!self.editMode) {
                            if (!self.documentFile.global && relatedOus.length) {
                                self.documentFile
                                    .addBulkToDocumentFiles(relatedOus)
                                    .then(function (ouDocumentFiles) {
                                        self.toggleRelatedOuForm();
                                        self.documentFile.relatedOus = ouDocumentFiles;
                                        self.model = angular.copy(self.documentFile);
                                        self.editMode = true;
                                        toast.success(langService.get('add_success').change({name: documentFile.getTranslatedName()}));
                                        // if request comes from Add page, close the popup after add and return current documentFile
                                        if (documentClassFromUser) {
                                            dialog.hide(self.model);
                                        }
                                    });
                            } else {
                                self.documentFile.relatedOus = relatedOus;
                                self.model = angular.copy(self.documentFile);
                                self.editMode = true;
                                toast.success(langService.get('add_success').change({name: documentFile.getTranslatedName()}));
                            }
                        } else {
                            self.documentFile.relatedOus = relatedOus;
                            self.model = angular.copy(self.documentFile);
                            dialog.hide(self.documentFile);
                        }
                    })
                });
        };


        /**
         * @description Check if documentFile is global or private with relatedOus
         */
        self.checkValidGlobal = function () {
            if (documentClassFromUser) {
                if (self.editMode)
                    return true;
                else
                    return self.documentFile.relatedOus.length > 0;
            }
            return (!self.documentFile.global && self.documentFile.relatedOus.length > 0)
                || self.documentFile.global;
        };

        /**
         * @description close the popup
         */
        self.closePopup = function () {
            dialog.cancel(self.model);
        };

        self.resetModel = function () {
            generator.resetFields(self.documentFile, self.model);
        };

        self.toggleRelatedOuForm = function (show) {
            self.showRelatedOUForm = !!show;
            self.editModeRelatedOu = false;
            if (show) {
                self.ouDocumentFile = new OUDocumentFile({
                    itemOrder: generator.createNewID(self.documentFile.relatedOus, 'itemOrder'),
                    file: self.documentFile.id
                });
            }
        };
        /**
         * @description Set the security level, global according to selected main site
         * @param $event
         */
        self.onChangeParent = function ($event) {
            if (self.documentFile.parent) {
                self.documentFile.securityLevels = self.documentFile.parent.securityLevels;
                self.documentFile.global = angular.copy(self.documentFile.parent.global);
                if (self.documentFile.global) {
                    self.documentFile.relatedOus = [];
                }
            } else {
                if (!self.editMode) {
                    self.documentFile.securityLevels = null;
                }
            }
        };

        /**
         * @description add and save the organization for document file
         */
        self.addOuDocumentFile = function ($event) {
            validationService
                .createValidation('OU_DOCUMENT_FILE_VALIDATION')
                .addStep('check_duplicate', true, ouDocumentFileService.checkDuplicateOuDocumentFile, [self.ouDocumentFile, self.documentFile.relatedOus, self.editModeRelatedOu], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .validate()
                .then(function () {
                    if (!self.editMode) {
                        self.documentFile.relatedOus.push(self.ouDocumentFile);
                        self.toggleRelatedOuForm();
                    } else {
                        self.documentFile.addToOUDocumentFile(self.ouDocumentFile)
                            .then(function () {
                                _finishSaveOuDocumentFile();
                            });
                    }
                });
        };

        /**
         * @description update the organization for document file
         */
        self.updateOuDocumentFile = function ($event) {
            validationService
                .createValidation('OU_DOCUMENT_FILE_VALIDATION')
                .addStep('check_duplicate', true, ouDocumentFileService.checkDuplicateOuDocumentFile, [self.ouDocumentFile, self.documentFile.relatedOus, self.editModeRelatedOu], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .validate()
                .then(function () {
                    if (!self.editMode) {
                        var index = _.findIndex(self.documentFile.relatedOus, function (ou) {
                            return ou.ouid.id === self.ouDocumentFile.ouid.id
                        });
                        self.documentFile.relatedOus.splice(index, 1, self.ouDocumentFile);
                        self.showRelatedOUForm = false;
                        self.editModeRelatedOu = false;
                    } else {
                        self.documentFile.updateOfOUDocumentFile(self.ouDocumentFile)
                            .then(function () {
                                _finishSaveOuDocumentFile();
                            });
                    }
                });
        };

        function _finishSaveOuDocumentFile() {
            var relatedOus = angular.copy(self.documentFile.relatedOus);
            if (self.documentFile.relatedOus.length === 1) {
                self.documentFile.setRelatedOus([]);
                self.documentFile.setIsGlobal(false).update()
                    .then(function () {
                        self.documentFile.relatedOus = relatedOus;
                        self.model = angular.copy(self.documentFile);
                        toast.success(langService.get('save_success'));
                        self.toggleRelatedOuForm();
                    })
            } else {
                self.documentFile.setRelatedOus(relatedOus);
                self.model = angular.copy(self.documentFile);
                toast.success(langService.get('save_success'));
                self.toggleRelatedOuForm();
            }
        }

        self.canDeleteOUDocumentFile = function (ouDocumentFile) {
            if (documentClassFromUser) {
                var ouId = ouDocumentFile.ouid.id;
                return (ouId !== employeeService.getEmployee().getRegistryOUID());
            } else if (!employeeService.isSuperAdminUser() && self.documentFile.relatedOus.length === 1) {
                return false;
            }
            return true;
        };

        self.canEditOUDocumentFile = function (ouDocumentFile) {
            if (documentClassFromUser) {
                var ouId = ouDocumentFile.ouid.id;
                return (ouId !== employeeService.getEmployee().getRegistryOUID());
            } else if (!employeeService.isSuperAdminUser()) {
                return false;
            }
            return true;
        }

        self.editOuDocumentFile = function (ouDocumentFile) {
            self.showRelatedOUForm = true;
            self.editModeRelatedOu = true;

            self.ouDocumentFile = ouDocumentFile;
        }

        /**
         * @description remove the related organization for document file
         * @param ouDocumentFile
         */
        self.removeOuDocumentFile = function (ouDocumentFile) {
            if (!self.canDeleteOUDocumentFile(ouDocumentFile)) {
                toast.error(langService.get('can_not_delete_ou'));
                return;
            }

            var message = langService.get('confirm_delete').change({name: ouDocumentFile.ouid.getNames()});
            if (self.editMode && self.documentFile.relatedOus.length === 1) {
                if (!employeeService.isSuperAdminUser()) {
                    // this will change correspondenceSite to global and sub admin can't change private to global
                    dialog.errorMessage(langService.get('last_ou_can_not_be_removed'));
                    return false;
                }
                message = langService.get('last_organization_delete').change({name: ouDocumentFile.file.getTranslatedName()});
            }
            dialog.confirmMessage(message)
                .then(function () {
                    _deleteOUDocumentFileConfirmed(ouDocumentFile);
                });
        };

        /**
         * @description Delete OUDocumentFile confirmed
         * @param ouDocumentFile
         * @private
         */
        var _deleteOUDocumentFileConfirmed = function (ouDocumentFile) {
            if (!self.editMode) {
                ouDocumentFile = ouDocumentFile.ouid.hasOwnProperty('id') ? ouDocumentFile.ouid.id : ouDocumentFile.ouid;
                self.documentFile.relatedOus = _.filter(self.documentFile.relatedOus, function (relatedOU) {
                    relatedOU = relatedOU.ouid.hasOwnProperty('id') ? relatedOU.ouid.id : relatedOU.ouid;
                    return ouDocumentFile !== relatedOU;
                });
                self.toggleRelatedOuForm();
            } else {
                ouDocumentFileService.deleteOUDocumentFile(ouDocumentFile).then(function () {
                    // remove the file from file list
                    self.documentFile.relatedOus = _.filter(self.documentFile.relatedOus, function (relatedOU) {
                        return relatedOU.id !== ouDocumentFile.id;
                    });
                    // if all related OUs(ouDocumentFiles) are removed, change the documentFile to global
                    if (!self.documentFile.relatedOus.length) {
                        self.documentFile.setIsGlobal(true).update()
                            .then(function () {
                                self.toggleRelatedOuForm();
                                // update the model so that the reset will work on latest values
                                self.model = angular.copy(self.documentFile);
                                toast.success(langService.get('delete_success'));
                            });
                    } else {
                        self.toggleRelatedOuForm();
                        // update the model so that the reset will work on latest values
                        self.model = angular.copy(self.documentFile);
                        toast.success(langService.get('delete_success'));
                    }
                });
            }
        };


        /**
         * @description Check if the organization is already added to OUDocumentFile
         * @param organization
         */
        self.excludeOrganizationIfExists = function (organization) {
            if (self.editModeRelatedOu) {
                return false;
            }
            organization = organization.hasOwnProperty('id') ? organization.id : organization;
            if (!self.editMode) {
                return _.find(self.documentFile.relatedOus, function (relatedOU) {
                    relatedOU = relatedOU.ouid.hasOwnProperty('id') ? relatedOU.ouid.id : relatedOU.ouid;
                    return relatedOU === organization;
                });
            } else {
                return _.find(self.documentFile.relatedOus, function (relatedOU) {
                    relatedOU = relatedOU.ouid.hasOwnProperty('id') ? relatedOU.ouid.id : relatedOU.ouid;
                    return relatedOU === organization;
                });
            }
        };

        /**
         * @description Validates the ouDocumentFile form
         * @returns {*}
         */
        self.isRelatedOuFormValid = function (documentFileForm) {
            return self.ouDocumentFile.ouid
                && self.ouDocumentFile.itemOrder &&
                documentFileForm.code.$valid &&
                documentFileForm.serial.$valid;
        };


        /**
         * @description Handles the change of global switch in popup
         * @param $event
         */
        self.onChangeGlobal = function ($event) {
            if (!employeeService.isSuperAdminUser()) {
                self.documentFile.global = !self.documentFile.global;
                return false;
            }
        };

        /**
         * @description load organization for the current document file.
         * @return {*}
         */
        self.getOUDocumentFiles = function () {
            if (self.documentFile.id && !self.documentFile.global) {
                return ouDocumentFileService.loadOUDocumentFilesByDocumentFileId(self.documentFile)
                    .then(function (result) {
                        self.documentFile.relatedOus = result;
                    })
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
    });
};
