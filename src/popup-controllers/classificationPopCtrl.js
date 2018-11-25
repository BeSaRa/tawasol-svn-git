module.exports = function (app) {
    app.controller('classificationPopCtrl', function (parent,
                                                      sub,
                                                      lookupService,
                                                      ouClassificationService,
                                                      $q,
                                                      $filter,
                                                      organizationService,
                                                      toast,
                                                      _,
                                                      langService,
                                                      classificationService,
                                                      generator,
                                                      validationService,
                                                      dialog,
                                                      Classification,
                                                      editMode,
                                                      classification,
                                                      rootEntity) {
        'ngInject';
        var self = this;
        self.controllerName = 'classificationPopCtrl';
        self.editMode = editMode;
        self.classification = new Classification(classification);
        self.organizations = organizationService.organizations;
        //self.securityLevels = lookupService.returnLookups(lookupService.securityLevel);
        self.securityLevels = rootEntity.getGlobalSettings().getSecurityLevels();
        self.selectedSubClassifications = [];
        self.selectedOrganization = null;
        self.selectedOUClassifications = [];
        self.disableParent = false;
        // get parents classifications and exclude the current from the result if in edit mode.
        self.parentClassifications = classificationService.getParentClassifications(editMode ? self.classification : false);

        if (sub) {
            self.classification.parent = parent;
            self.disableParent = true;
        }
        self.model = new Classification(self.classification);

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.classification.children = $filter('orderBy')(self.classification.children, self.grid.order);
        };


        /**
         * @description Contains the list of tabs that can be shown
         * @type {string[]}
         */
        self.tabsToShow = [
            'basic',
            'ou',
            'sub'
        ];

        self.showTab = function (tabName) {
            return self.tabsToShow.indexOf(tabName) > -1;
        };

        /**
         * @description Contains the selected tab name
         * @type {string}
         */
        self.selectedTabName = "basic";

        /**
         * @description Set the current tab name
         * @param tabName
         */
        self.setCurrentTab = function (tabName) {
            self.selectedTabName = tabName;
        };

        self.grid = {
            limit: 5, // default limit
            page: 1, // first page
            //order: 'arName', // default sorting order
            order: '', // default sorting order
            limitOptions: [5, 10, 20, {
                label: langService.get('all'),
                value: function () {
                    return (self.classification.children.length + 21);
                }
            }]
        };

        self.statusServices = {
            'activate': classificationService.activateBulkClassifications,
            'deactivate': classificationService.deactivateBulkClassifications,
            'true': classificationService.activateClassification,
            'false': classificationService.deactivateClassification
        };

        self.closeClassificationDialog = function () {
            dialog.cancel(self.model);
        };

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
                    self.classification.save().then(function (classification) {
                        self.classification = classification;
                        self.model = angular.copy(self.classification);
                        self.disableParent = false;
                        if (self.editMode) {
                            dialog.hide(self.classification);

                        } else {
                            self.editMode = true;
                            toast.success(langService.get('add_success').change({name: self.classification.getNames()}));
                        }
                    })
                });
        };

        self.changeClassificationStatus = function (classification) {
            classification
                .updateStatus()
                .then(function () {
                    toast.success(langService.get('status_success'));
                })
                .catch(function () {
                    classification.status = !classification.status;
                    dialog.errorMessage(langService.get('something_happened_when_update_status'));
                });
        };

        self.openSelectOUClassificationDialog = function (classification) {
            return classification
                .openDialogToSelectOrganizations()
                .then(function () {
                    return classification;
                });
        };
        self.changeGlobalFromEdit = function () {
            if (!self.editMode)
                return;
            self.changeGlobalFromFromGrid(self.classification);
        };
        /**
         * check global status
         * @param classification
         */
        self.changeGlobalFromFromGrid = function (classification) {
            // if classification global and has organizations.
            if (classification.isGlobal && classification.hasOrganizations()) {
                dialog.confirmMessage(langService.get('related_organization_confirm'))
                    .then(function () {
                        classification
                            .deleteAllOUClassifications()
                            .then(function () {
                                classification.isGlobal = true;
                                classification.update().then(self.displayClassificationGlobalMessage);
                            });
                    })
                    .catch(function () {
                        classification.isGlobal = false;
                    })
            }
            // if classification global and has not organizations.
            if (classification.isGlobal && !classification.hasOrganizations()) {
                classification.update().then(self.displayClassificationGlobalMessage);
            }
            // if classification not global and no organizations.
            if (!classification.isGlobal && !classification.hasOrganizations()) {
                self.openSelectOUClassificationDialog(classification)
                    .then(function (classification) {
                        classification.update().then(self.displayClassificationGlobalMessage);
                    })
                    .catch(function () {
                        classification.setIsGlobal(true).update();
                    });
            }
        };
        /**
         * display for the global messages.
         * @param classification
         */
        self.displayClassificationGlobalMessage = function (classification) {
            self.model = angular.copy(classification);
            toast.success(langService.get('change_global_success')
                .change({
                    name: classification.getTranslatedName(),
                    global: classification.getTranslatedGlobal()
                }));
        };

        /**
         * @description Opens dialog for edit classification
         * @param classification
         * @param $event
         */
        self.editSubClassification = function (classification, $event) {
            classificationService
                .controllerMethod
                .subClassificationEdit(classification, $event)
                .then(function (classification) {
                    self.behindScene(classification)
                        .then(function (classification) {
                            toast.success(langService.get('edit_success').change({name: classification.getTranslatedName()}));
                            // self.reloadClassifications(self.grid.page).then(function () {
                            //
                            // });
                        });
                })
                .catch(function (classification) {
                    // self.behindScene(classification)
                    //     .then(function () {
                    //         self.reloadClassifications(self.grid.page);
                    //     });
                    self.replaceRecordFromGrid(classification);
                });
        };

        self.replaceRecordFromGrid = function (classification) {
            self.classification.children.splice(_.findIndex(self.classification.children, function (item) {
                return item.id === classification.id;
            }), 1, classification);
        };

        self.reloadClassifications = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;
            // return ouClassificationService
            //     .loadOUClassifications()
            //     .then(function () {
            return classificationService
                .loadClassificationsWithLimit()
                .then(function (result) {
                    self.parentClassifications = classificationService.getMainClassifications(result);
                    self.classification = self.model = classificationService.getClassificationById(self.classification);
                    self.selectedSubClassifications = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    return result;
                });
            // });
        };

        self.addOrganizationToClassification = function () {
            self.classification
                .addToOUClassifications(self.selectedOrganization)
                .then(function () {
                    toast.success(langService.get('add_success').change({name: self.selectedOrganization.getTranslatedName()}));
                    self.selectedOrganization = null;
                });

        };
        self.deleteOUClassificationFromCtrl = function (ouClassification) {
            if (self.classification.relatedOus.length === 1) {
                return dialog
                    .confirmMessage(langService.get('last_organization_delete').change({name: self.classification.getTranslatedName()}))
                    .then(function () {
                        return self
                            .deleteOUClassificationSiteConfirmed(ouClassification).then(function () {
                                return self.classification
                                    .setIsGlobal(true)
                                    .update()
                                    .then(function () {
                                        self.model = angular.copy(self.classification);
                                    });
                            });
                    })
            }

            return self.deleteOUClassificationSiteConfirmed(ouClassification);
        };

        self.deleteOUClassificationSiteConfirmed = function (ouClassification) {
            return ouClassificationService.deleteOUClassification(ouClassification).then(function () {
                toast.success(langService.get('delete_success'));
                var index = self.classification.relatedOus.indexOf(ouClassification);
                self.classification.relatedOus.splice(index, 1);
            });
        };

        self.removeBulkOUClassificationsFromCtrl = function () {
            if (self.selectedOUClassifications.length === self.classification.relatedOus.length) {
                return dialog
                    .confirmMessage(langService.get('last_organization_delete').change({name: self.classification.getTranslatedName()}))
                    .then(function () {
                        return self.removeBulkOUClassificationsConfirmed().then(function () {
                            return self.classification
                                .setIsGlobal(true)
                                .update()
                                .then(function () {
                                    self.model = angular.copy(self.classification);
                                });
                        });
                    });
            }
            return self.removeBulkOUClassificationsConfirmed();
        };

        self.removeBulkOUClassificationsConfirmed = function () {
            return self.classification
                .deleteBulkFromOUClassifications(self.selectedOUClassifications)
                .then(function () {
                    self.selectedOUClassifications = [];
                    toast.success(langService.get('related_organizations_deleted_success'));
                });
        };

        self.excludeOrganizationIfExists = function (organization) {
            return _.find(self.classification.relatedOus, function (ou) {
                return ou.ouid.id === organization.id;
            });
        };
        /**
         * @description load organization for the current classification.
         * @return {*}
         */
        self.getOrganizationForClassification = function () {
            return ouClassificationService
                .loadOUClassificationsByClassificationId(self.classification)
                .then(function (result) {
                    self.classification.relatedOus = result;
                });
        };
        /**
         * @description load sub classifications for the current classification.
         * @return {*}
         */
        self.getSubClassification = function (tabName) {
            if (tabName) 
            self.setCurrentTab(tabName);
            return classificationService
                .loadSubClassifications(self.classification)
                .then(function (result) {
                    self.classification.children = result;
                });
        };

        /**
         * @description this method call when the user take action then close the popup.
         * @param classification
         * @return {Promise}
         */
        self.behindScene = function (classification) {
            return classification.repairGlobalStatus();
        };

        /**
         * @description Delete multiple selected classification
         * @param $event
         */
        self.removeBulkClassifications = function ($event) {
            classificationService
                .controllerMethod
                .classificationDeleteBulk(self.selectedSubClassifications, $event)
                .then(function () {
                    self.reloadClassifications(self.grid.page);
                });
        };

        /**
         * @description Change the status of selected classification
         * @param status
         */
        self.changeBulkStatusClassifications = function (status) {
            self.statusServices[status](self.selectedSubClassifications).then(function () {
                self.reloadClassifications(self.grid.page).then(function () {
                    toast.success(langService.get('selected_status_updated'));
                });
            });
        };

        self.setSubClassificationSecurityLevel = function ($event) {
            if (self.classification.parent && !self.editMode) {
                self.classification.securityLevels = _.find(self.parentClassifications, function (parentClassification) {
                    return self.classification.parent.id === parentClassification.id;
                }).securityLevels;
            }
        };

        self.addSubClassificationFromCtrl = function ($event) {
            classificationService
                .controllerMethod
                .classificationAdd(self.classification, true, $event)
                .then(function () {
                    self.reloadClassifications(self.grid.page);
                })
                .catch(function () {
                    self.reloadClassifications(self.grid.page);
                });
        };
        /**
         * @description Delete single classification
         * @param classification
         * @param $event
         */
        self.removeClassification = function (classification, $event) {
            if (classification.hasOrganizations()) {
                dialog
                    .confirmMessage(langService.get('related_organization_confirm'), null, null, $event)
                    .then(function () {
                        classification.deleteAllOUClassifications()
                            .then(function () {
                                classification.delete().then(function () {
                                    toast.success(langService.get('delete_specific_success').change({name: classification.getNames()}));
                                    self.reloadClassifications(self.grid.page);
                                });
                            })
                    })
                    .catch(function () {
                        classification.setIsGlobal(false);
                    })

            } else {
                classificationService
                    .controllerMethod
                    .classificationDelete(classification, $event)
                    .then(function () {
                        self.reloadClassifications(self.grid.page);
                    });
            }
        };

        self.resetModel = function () {
            generator.resetFields(self.classification, self.model);
        };


    });
};
