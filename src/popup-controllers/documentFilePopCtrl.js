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
                                                    documentClassFromUser) {
        'ngInject';
        var self = this;
        self.controllerName = 'documentFilePopCtrl';
        self.editMode = editMode;
        //documentFile.relatedOus = [];

        self.documentFile = angular.copy(documentFile);
        self.model = angular.copy(documentFile);

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
            var defer = $q.defer();
            if (tabName === 'security') {
                self.toggleRelatedOuForm();
                organizationService.getOrganizations().then(function (organizations) {
                    self.organizations = organizations;

                    ouDocumentFileService.loadOUDocumentFilesByDocumentFileId(self.documentFile)
                        .then(function (ouDocumentFiles) {
                            self.documentFile.relatedOus = ouDocumentFiles;
                            defer.resolve(true)
                        })
                })
            } else {
                defer.resolve(true);
            }
            return defer.promise.then(function () {
                self.selectedTab = tabName;
            });
        };


        self.securityLevels = rootEntity.getGlobalSettings().getSecurityLevels();
        if (documentClassFromUser) {
            self.securityLevels = correspondenceService.getLookup(documentClassFromUser, 'securityLevels');
        }
        self.parentDocumentFiles = _.filter(documentFileService.documentFiles, function (documentFile) {
            return !documentFile.parent;
        });

        self.selectedOrganizationId = null;
        self.relatedOUStatus = true;
        self.relatedOUItemOrder = self.documentFile.relatedOus && self.documentFile.relatedOus.length ? self.documentFile.relatedOus.length + 1 : 1;
        self.relatedOUCode = '';
        self.disableParent = false;

        self.ouDocumentFilesProgress = null;

        self.validateLabels = {
            arName: 'arabic_name',
            enName: 'english_name',
            securityLevels: 'security_level'
        };

        /**
         * @description add document file
         */
        self.addDocumentFileFromCtrl = function ($event) {
            validationService
                .createValidation('ADD_DOCUMENT_FILE')
                .addStep('check_required', true, generator.checkRequiredFields, self.documentFile, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_duplicate', true, documentFileService.checkDuplicateDocumentFile, [self.documentFile, false], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .validate()
                .then(function () {
                    documentFileService.addDocumentFile(self.documentFile).then(function (result) {
                        self.editMode = true;
                        self.documentFile = angular.copy(result);
                        self.model = angular.copy(self.documentFile);
                        toast.success(langService.get('add_success').change({name: result.getTranslatedName()}));
                    });
                })
                .catch(function () {

                })
        };

        /**
         * @description update document file
         */
        self.updateDocumentFileFromCtrl = function ($event) {
            validationService
                .createValidation('EDIT_DOCUMENT_FILE')
                .addStep('check_required', true, generator.checkRequiredFields, self.documentFile, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_duplicate', true, documentFileService.checkDuplicateDocumentFile, [self.documentFile, true], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .validate()
                .then(function () {
                    documentFileService
                        .updateDocumentFile(self.documentFile)
                        .then(function (result) {
                            toast.success(langService.get('edit_success').change({name: result.getTranslatedName()}));
                            dialog.hide(self.documentFile);
                        });
                })
                .catch(function () {

                })
        };

        /**
         * @description close the popup
         */
        self.closeDocumentFilePopupFromCtrl = function () {
            dialog.cancel(self.model);
        };

        self.resetModel = function () {
            generator.resetFields(self.documentFile, self.model);
        };

        self.toggleRelatedOuForm = function (show) {
            self.showRelatedOUForm = !!show;
            if (show) {
                self.ouDocumentFile = new OUDocumentFile({
                    itemOrder: generator.createNewID(self.documentFile.relatedOus, 'itemOrder'),
                    file: self.documentFile.id
                });
            }
        };

        /**
         * @description add and save the organization for document file
         */
        self.addOuDocumentFile = function ($event) {
            ouDocumentFileService.addOUDocumentFile(self.ouDocumentFile)
                .then(function (result) {
                    self.documentFile.relatedOus.push(result);
                    // if originally, document file was global, update it to make it private
                    if (self.model.global) {
                        documentFileService
                            .updateDocumentFile(self.documentFile)
                            .then(function () {
                                self.model = angular.copy(self.documentFile);
                                toast.success(langService.get('save_success'));
                                self.toggleRelatedOuForm();
                            })
                    } else {
                        self.model = angular.copy(self.documentFile);
                        toast.success(langService.get('save_success'));
                        self.toggleRelatedOuForm();
                    }
                });

        };
        /**
         * @description remove the related organization for document file
         * @param ouDocumentFile
         */
        self.removeOuDocumentFile = function (ouDocumentFile) {
            dialog.confirmMessage((langService.get('confirm_delete_msg'))).then(function () {
                ouDocumentFileService.deleteOUDocumentFile(ouDocumentFile).then(function () {
                    // remove the file from file list
                    self.documentFile.relatedOus = _.filter(self.documentFile.relatedOus, function (relatedOU) {
                        return relatedOU.id !== ouDocumentFile.id;
                    });
                    self.documentFile.global = (self.documentFile.relatedOus.length === 0);
                    // if last file is removed, change the document file to global
                    if (self.documentFile.global) {
                        documentFileService.updateDocumentFile(self.documentFile).then(function () {
                            // update the model so that the reset will work on latest values
                            self.model = angular.copy(self.documentFile);
                            toast.success(langService.get('delete_success'));
                        });
                    } else {
                        // update the model so that the reset will work on latest values
                        self.model = angular.copy(self.documentFile);
                        toast.success(langService.get('delete_success'));
                    }
                });

            });
        };

        self.isOrganizationAvailable = function (organization) {
            organization = organization.hasOwnProperty('id') ? organization.id : organization;
            return !(_.find(self.documentFile.relatedOus, function (relatedOU) {
                relatedOU = relatedOU.ouid.hasOwnProperty('id') ? relatedOU.ouid.id : relatedOU.ouid;
                return relatedOU === organization;
            }));
        };

        self.isRelatedOuFormValid = function () {
            return self.ouDocumentFile.ouid
                && self.ouDocumentFile.itemOrder;
        };

    });
};
