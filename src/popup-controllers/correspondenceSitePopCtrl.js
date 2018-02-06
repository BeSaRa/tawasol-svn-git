module.exports = function (app) {
    app.controller('correspondenceSitePopCtrl', function (parent,
                                                          sub,
                                                          ouCorrespondenceSiteService,
                                                          correspondenceSiteTypeService,
                                                          $q,
                                                          organizationService,
                                                          toast,
                                                          langService,
                                                          correspondenceSiteService,
                                                          generator,
                                                          validationService,
                                                          dialog,
                                                          CorrespondenceSite,
                                                          editMode,
                                                          correspondenceSite) {
        'ngInject';
        var self = this;
        self.controllerName = 'correspondenceSitePopCtrl';
        self.editMode = editMode;
        self.correspondenceSite = new CorrespondenceSite(correspondenceSite);
        self.organizations = organizationService.organizations;
        self.selectedSubCorrespondenceSites = [];
        self.selectedOrganization = null;
        self.selectedOUCorrespondenceSites = [];
        self.disableParent = false;
        self.correspondenceTypes = correspondenceSiteTypeService.correspondenceSiteTypes;

        // get parents correspondenceSites and exclude the current from the result if in edit mode.
        self.parentCorrespondenceSites = correspondenceSiteService.getParentCorrespondenceSites(editMode ? self.correspondenceSite : false);

        if (sub) {
            self.correspondenceSite.parent = parent;
            self.disableParent = true;
        }

        self.model = new CorrespondenceSite(self.correspondenceSite);

        self.grid = {
            limit: 5, // default limit
            page: 1, // first page
            //order: 'arName', // default sorting order
            order: '', // default sorting order
            limitOptions: [5, 10, 20, {
                label: langService.get('all'),
                value: function () {
                    return self.correspondenceSite.children.length;
                }
            }]
        };

        self.statusServices = {
            'activate': correspondenceSiteService.activateBulkCorrespondenceSites,
            'deactivate': correspondenceSiteService.deactivateBulkCorrespondenceSites,
            'true': correspondenceSiteService.activateCorrespondenceSite,
            'false': correspondenceSiteService.deactivateCorrespondenceSite
        };

        self.closeCorrespondenceSiteDialog = function () {
            dialog.cancel(self.model);
        };

        self.saveCorrespondenceSite = function () {
            validationService
                .createValidation('CLASSIFICATION_VALIDATION')
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
                    self.correspondenceSite.save().then(function (correspondenceSite) {
                        self.correspondenceSite = correspondenceSite;
                        self.model = angular.copy(self.correspondenceSite);
                        self.disableParent = false;
                        if (self.editMode) {
                            dialog.hide(self.correspondenceSite);

                        } else {
                            self.editMode = true;
                            toast.success(langService.get('add_success').change({name: self.correspondenceSite.getNames()}));
                        }
                    })
                });
        };

        self.changeCorrespondenceSiteStatus = function (correspondenceSite) {
            correspondenceSite
                .updateStatus()
                .then(function () {
                    toast.success(langService.get('status_success'));
                })
                .catch(function () {
                    correspondenceSite.status = !correspondenceSite.status;
                    dialog.errorMessage(langService.get('something_happened_when_update_status'));
                });
        };

        self.openSelectOUCorrespondenceSiteDialog = function (correspondenceSite) {
            return correspondenceSite
                .opendDialogToSelectOrganizations()
                .then(function () {
                    return correspondenceSite;
                });
        };

        self.excludeOrganizationIfExists = function (organization) {
            return _.find(self.correspondenceSite.relatedOus, function (ou) {
                return ou.ouid.id === organization.id;
            });
        };

        self.includeIfEnabled = function(correspondenceSite){
            return correspondenceSite.status;
        };

        self.changeGlobalFromEdit = function () {
            if (!self.editMode)
                return;
            self.changeGlobalFromFromGrid(self.correspondenceSite);
        };
        /**
         * check global status
         * @param correspondenceSite
         */
        self.changeGlobalFromFromGrid = function (correspondenceSite) {
            // if correspondenceSite global and has organizations.
            if (correspondenceSite.isGlobal && correspondenceSite.hasOrganizations()) {
                dialog.confirmMessage(langService.get('related_organization_confirm'))
                    .then(function () {
                        correspondenceSite
                            .deleteAllOUCorrespondenceSites()
                            .then(function () {
                                correspondenceSite.isGlobal = true;
                                correspondenceSite.update().then(self.displayCorrespondenceSiteGlobalMessage);
                            });
                    })
                    .catch(function () {
                        correspondenceSite.isGlobal = false;
                    })
            }
            // if correspondenceSite global and has not organizations.
            if (correspondenceSite.isGlobal && !correspondenceSite.hasOrganizations()) {
                correspondenceSite.update().then(self.displayCorrespondenceSiteGlobalMessage);
            }
            // if correspondenceSite not global and no organizations.
            if (!correspondenceSite.isGlobal && !correspondenceSite.hasOrganizations()) {
                self.openSelectOUCorrespondenceSiteDialog(correspondenceSite)
                    .then(function (correspondenceSite) {
                        correspondenceSite.update().then(self.displayCorrespondenceSiteGlobalMessage);
                    })
                    .catch(function () {
                        correspondenceSite.setIsGlobal(true).update();
                    });
            }
        };
        /**
         * display for the global messages.
         * @param correspondenceSite
         */
        self.displayCorrespondenceSiteGlobalMessage = function (correspondenceSite) {
            self.model = angular.copy(correspondenceSite);
            toast.success(langService.get('change_global_success')
                .change({
                    name: correspondenceSite.getTranslatedName(),
                    global: correspondenceSite.getTranslatedGlobal()
                }));
        };

        /**
         * @description Opens dialog for edit correspondenceSite
         * @param correspondenceSite
         * @param $event
         */
        self.editSubCorrespondenceSite = function (correspondenceSite, $event) {
            correspondenceSiteService
                .controllerMethod
                .subCorrespondenceSiteEdit(correspondenceSite, $event)
                .then(function (correspondenceSite) {
                    self.behindScene(correspondenceSite)
                        .then(function (correspondenceSite) {
                            self.reloadCorrespondenceSites(self.grid.page).then(function () {
                                toast.success(langService.get('edit_success').change({name: correspondenceSite.getTranslatedName()}));
                            });
                        });
                })
                .catch(function (correspondenceSite) {
                    self.replaceRecordFromGrid(correspondenceSite);
                });
        };

        self.replaceRecordFromGrid = function (correspondenceSite) {
            self.correspondenceSite.children.splice(_.findIndex(self.correspondenceSite.children, function (item) {
                return item.id === correspondenceSite.id;
            }), 1, correspondenceSite);
        };

        self.reloadCorrespondenceSites = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;
            return ouCorrespondenceSiteService
                .loadOUCorrespondenceSites()
                .then(function () {
                    return correspondenceSiteService
                        .loadCorrespondenceSites()
                        .then(function (correspondenceSites) {
                            self.parentCorrespondenceSites = correspondenceSiteService.getMainCorrespondenceSites(correspondenceSites);
                            self.correspondenceSite = self.model = correspondenceSiteService.getCorrespondenceSiteById(self.correspondenceSite);
                            self.selectedSubCorrespondenceSites = [];
                            defer.resolve(true);
                            if (pageNumber)
                                self.grid.page = pageNumber;
                            return correspondenceSites;
                        });
                });
        };

        self.addOrganizationToCorrespondenceSite = function () {
            self.correspondenceSite
                .addToOUCorrespondenceSites(self.selectedOrganization)
                .then(function () {
                    toast.success(langService.get('add_success').change({name: self.selectedOrganization.getTranslatedName()}));
                    self.selectedOrganization = null;
                });

        };
        self.deleteOUCorrespondenceSiteFromCtrl = function (ouCorrespondenceSite) {
            if (self.correspondenceSite.relatedOus.length === 1) {
                return dialog
                    .confirmMessage(langService.get('last_organization_delete').change({name: self.correspondenceSite.getTranslatedName()}))
                    .then(function () {
                        return self
                            .deleteOUCorrespondenceSiteConfirmed(ouCorrespondenceSite)
                            .then(function () {
                                return self.correspondenceSite
                                    .setIsGlobal(true)
                                    .update()
                                    .then(function () {
                                        self.model = angular.copy(self.correspondenceSite);
                                    });
                            });
                    })
            }
            return self.deleteOUCorrespondenceSiteConfirmed(ouCorrespondenceSite);
        };

        self.deleteOUCorrespondenceSiteConfirmed = function (ouCorrespondenceSite) {
            return ouCorrespondenceSiteService.deleteOUCorrespondenceSite(ouCorrespondenceSite).then(function () {
                toast.success(langService.get('delete_success'));
                var index = self.correspondenceSite.relatedOus.indexOf(ouCorrespondenceSite);
                self.correspondenceSite.relatedOus.splice(index, 1);
            });
        };

        self.removeBulkOUCorrespondenceSites = function () {
            self.correspondenceSite
                .deleteBulkFromOUCorrespondenceSites(self.selectedOUCorrespondenceSites)
                .then(function () {
                    self.selectedOUCorrespondenceSites = [];
                    toast.success(langService.get('related_organizations_deleted_success'));
                });
        };

        /**
         * @description this method call when the user take action then close the popup.
         * @param correspondenceSite
         * @return {Promise}
         */
        self.behindScene = function (correspondenceSite) {
            return correspondenceSite.repairGlobalStatus();
        };

        /**
         * @description Delete multiple selected correspondenceSite
         * @param $event
         */
        self.removeBulkCorrespondenceSites = function ($event) {
            correspondenceSiteService
                .controllerMethod
                .correspondenceSiteDeleteBulk(self.selectedSubCorrespondenceSites, $event)
                .then(function () {
                    self.reloadCorrespondenceSites(self.grid.page);
                });
        };

        /**
         * @description Change the status of selected correspondenceSite
         * @param status
         */
        self.changeBulkStatusCorrespondenceSites = function (status) {
            self.statusServices[status](self.selectedSubCorrespondenceSites).then(function () {
                self.reloadCorrespondenceSites(self.grid.page).then(function () {
                    toast.success(langService.get('selected_status_updated'));
                });
            });
        };

        self.addSubCorrespondenceSiteFromCtrl = function ($event) {
            correspondenceSiteService
                .controllerMethod
                .correspondenceSiteAdd(self.correspondenceSite, true, $event)
                .then(function () {
                    self.reloadCorrespondenceSites(self.grid.page);
                })
                .catch(function () {
                    self.reloadCorrespondenceSites(self.grid.page);
                });
        };
        /**
         * @description Delete single correspondenceSite
         * @param correspondenceSite
         * @param $event
         */
        self.removeCorrespondenceSite = function (correspondenceSite, $event) {
            if (correspondenceSite.hasOrganizations()) {
                dialog
                    .confirmMessage(langService.get('related_organization_confirm'), null, null, $event)
                    .then(function () {
                        correspondenceSite.deleteAllOUCorrespondenceSites()
                            .then(function () {
                                correspondenceSite.delete().then(function () {
                                    toast.success(langService.get('delete_specific_success').change({name: correspondenceSite.getNames()}));
                                    self.reloadCorrespondenceSites(self.grid.page);
                                });
                            })
                    })
                    .catch(function () {
                        correspondenceSite.setIsGlobal(false);
                    })

            } else {
                correspondenceSiteService
                    .controllerMethod
                    .correspondenceSiteDelete(correspondenceSite, $event)
                    .then(function () {
                        self.reloadCorrespondenceSites(self.grid.page);
                    });
            }
        };

        /**
         * Add new correspondence site type on click of button
         * @param $event
         */
        self.addNewCorrespondenceSiteType = function ($event) {
            correspondenceSiteTypeService
                .controllerMethod
                .correspondenceSiteTypeAdd($event)
                .then(function (result) {
                    toast.success(langService.get('add_success').change({name: result.getNames()}));
                    self.correspondenceTypes.push(result);
                    self.correspondenceSite.correspondenceTypeId = result;
                })
        };

        self.resetModel = function (form) {
            generator.resetFields(self.correspondenceSite, self.model);
            form.$setUntouched();
        };

    });
};
