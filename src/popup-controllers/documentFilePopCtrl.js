module.exports = function (app) {
    app.controller('documentFilePopCtrl', function (lookupService,
                                                    documentFileService,
                                                    DocumentFile,
                                                    $q,
                                                    langService,
                                                    toast,
                                                    dialog,
                                                    editMode,
                                                    documentFile,
                                                    validationService,
                                                    generator,
                                                    organizationService,
                                                    RelatedOUDocumentFile,
                                                    relatedOUDocumentFileService,
                                                    parent,
                                                    sub) {
        'ngInject';
        var self = this;
        self.controllerName = 'documentFilePopCtrl';
        self.editMode = editMode;
        self.organization = [];
        self.documentFile = angular.copy(documentFile);
        self.model = angular.copy(self.documentFile);
        self.securityLevels = lookupService.returnLookups(lookupService.securityLevel);
        self.organizations = [];
        self.tabIndex = 0;
        self.relatedOUStatus = true;
        self.relatedOUItemOrder = self.documentFile.relatedOus.length ? self.documentFile.relatedOus.length + 1 : 1;
        self.relatedOUCode = '';
        self.selectedTabName = 'basic_info';
        self.disableParent = false;
        self.parentDocumentFiles = editMode ? documentFileService.getParentDocumentFilesExcludeCurrentChild(self.documentFile) : parent;
        self.enableAdd = false;
        self.showRelatedOUFrm = function () {
            self.enableAdd = true;
        };
        self.hideRelatedOUFrm = function () {
            self.enableAdd = false;
        };
        /*if (sub) {
        self.parentDocumentFiles.parent = parent;
        self.disableParent = true;
        }*/
        /**
         * Select Tab Name
         * @param tabName
         */
        self.changeTabName = function (tabName) {
            self.selectedTabName = tabName;
        };

        self.getOrganizations = function () {
            organizationService.loadOrganizations().then(function (result) {
                self.organizations = result;
            })
        };

        self.getOrganizations();

        /**
         *@description All s
         */
        self.documentFilePops = documentFile;
        self.validateLabels = {
            arName: 'arabic_name',
            enName: 'english_name'
        };
        self.promise = null;
        self.selecteds = [];
        self.addDocumentFileFromCtrl = function () {
            validationService
                .createValidation('ADD_DOCUMENT_TYPE')
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
                        //dialog.hide(self.documentFile);
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
         * @description edit document file
         */
        self.editDocumentFileFromCtrl = function () {
            validationService
                .createValidation('ADD_DOCUMENT_TYPE')
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
                    documentFileService.updateDocumentFile(self.documentFile).then(function (result) {
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
            dialog.cancel();
        };
        self.resetModel = function () {
            generator.resetFields(self.documentFile, self.model);
        };
        self.selectedOrganizationId = null;
        self.relatedOrganizations = [];
        /**
         * @description add and save the organization for document file
         */
        self.addSelectedOrganization = function () {
            var getOrganization = true;
            if (self.documentFile.relatedOus.length > 0) {
                self.documentFile.relatedOus.filter(function (organization) {
                    if (organization.id === self.selectedOrganizationId) {
                        getOrganization = false;
                    }
                });
            }
            //if org unit do not exist in grid then add
            if (getOrganization) {
                var relatedOU = new RelatedOUDocumentFile();
                relatedOU.ouid = self.selectedOrganizationId;
                relatedOU.file = self.documentFile.id;
                relatedOU.status = self.relatedOUStatus;
                relatedOU.code = self.relatedOUCode;
                relatedOU.itemOrder = self.relatedOUItemOrder;
                var allRelatedOUs = self.documentFile.relatedOus;
                relatedOUDocumentFileService.addRelatedOUDocumentFile(relatedOU).then(function (result) {

                    self.selectedOrganizationId = null;
                    if (result) {
                        organizationService.loadOrganizations().then(function (orResult) {
                            _.filter(_.map(orResult, function (data) {
                                if (data.id === result.ouid) {
                                    data['selectedOUId'] = result.id;
                                    return data;
                                }
                            }), function (combinedResult) {
                                if (combinedResult) {
                                    allRelatedOUs.push(combinedResult);
                                }
                            });
                        });
                        self.documentFile.relatedOus = allRelatedOUs;
                        relatedOUDocumentFileService.loadRelatedOUDocumentFiles().then(function () {
                            documentFileService.updateDocumentFile(self.documentFile).then(function () {
                                toast.success(langService.get('save_success'));
                                self.enableAdd = false;
                            });
                        });
                    }
                    self.documentFile.global = false;
                });
            }
        };
        /**
         * @description remove the related organization for document file
         * @param ouId
         */
        self.removeSelectedOrganization = function (ouId) {
            dialog.confirmMessage((langService.get('confirm_delete_msg'))).then(function () {
                relatedOUDocumentFileService.deleteRelatedOUDocumentFile(ouId).then(function () {
                    var index = -1;
                    var comArr = eval(self.documentFile.relatedOus);
                    for (var i = 0; i < comArr.length; i++) {
                        if (comArr[i].name === name) {
                            index = i;
                            break;
                        }
                    }
                    if (index === -1) {
                    }
                    self.documentFile.relatedOus.splice(index, 1);

                    self.documentFile.global = self.documentFile.relatedOus.length <= 0;

                    relatedOUDocumentFileService.loadRelatedOUDocumentFiles().then(function () {
                        documentFileService.updateDocumentFile(self.documentFile).then(function () {
                            toast.success(langService.get('delete_success'));
                        });
                    });

                });

            }, function () {

            });
        };
        /**
         * @description save related organization
         */
        self.saveRelatedOrganizationDocumentFileFromCtrl = function () {
            documentFileService.saveRelatedOrganizationDocumentFile(self.relatedOrganizations).then(function () {
                toast.success(langService.get('save_success'));
            });
        };

        self.getOrganizationARName = function (ouId) {
            var isExist = self.organizations.filter(function (organization) {
                return organization.id === ouId;
            })[0];
            return isExist ? isExist["arName"] : null;
        };
        self.getOrganizationENName = function (ouId) {
            var isExist = self.organizations.filter(function (organization) {
                return organization.id === ouId;
            })[0];
            return isExist ? isExist["enName"] : null;
        };
    });
};