module.exports = function (app) {
    app.controller('subClassificationViewPopCtrl', function ($q,
                                                             dialog,
                                                             toast,
                                                             classification,
                                                             classifications,
                                                             classificationService,
                                                             langService,
                                                             ouClassificationService) {
        'ngInject';
        var self = this;
        self.controllerName = 'subClassificationViewPopCtrl';
        // current classification to view his sub classifications
        self.classification = classification;

        self.classifications = self.classification.children;

        self.parentClassifications = classifications;

        self.selectedClassifications = [];

        self.grid = {
            limit: 5, // default limit
            page: 1, // first page
            order: 'arName', // default sorting order
            limitOptions: [5, 10, 20, {
                label: langService.get('all'),
                value: function () {
                    return self.classifications.length;
                }
            }]
        };


        self.statusServices = {
            'activate': classificationService.activateBulkClassifications,
            'deactivate': classificationService.deactivateBulkClassifications,
            'true': classificationService.activateClassification,
            'false': classificationService.deactivateClassification
        };

        /**
         * @description Opens dialog for add new classification
         * @param $event
         */
        self.openAddClassificationDialog = function ($event) {
            return classificationService
                .controllerMethod
                .classificationAdd($event)
                .then(function () {
                    self.reloadClassifications();
                });
        };

        /**
         * @description Opens dialog for edit classification
         * @param classification
         * @param $event
         */
        self.openEditClassificationDialog = function (classification, $event) {
            classificationService
                .controllerMethod
                .classificationEdit(classification, $event)
                .then(function () {
                    self.reloadClassifications(self.grid.page).then(function () {
                        toast.success(langService.get('edit_success').change({name: classification.getNames()}));
                    });
                })
                .catch(function (classification) {
                    self.behindScene(classification)
                        .then(function () {
                            self.reloadClassifications(self.grid.page);
                        });
                });
        };
        /**
         * reload the grid again and if the pageNumber provide the current grid will be on it.
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadClassifications = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;

            return ouClassificationService
                .loadOUClassifications()
                .then(function () {
                    return classificationService
                        .loadClassifications()
                        .then(function (result) {
                            self.parentClassifications = classificationService.getMainClassifications(result);
                            self.classification = classificationService.getClassificationById(self.classification);
                            self.classifications = self.classification.children;
                            if (!self.classifications.length) {
                                dialog.hide(self.parentClassifications);
                            }

                            self.selectedClassifications = [];
                            defer.resolve(true);
                            if (pageNumber)
                                self.grid.page = pageNumber;
                            return result;
                        });
                });
        };

        /**
         * @description Delete single classification
         * @param classification
         * @param $event
         */
        self.removeClassification = function (classification, $event) {
            classificationService
                .controllerMethod
                .classificationDelete(classification, $event)
                .then(function () {
                    self.reloadClassifications(self.grid.page);
                });
        };

        /**
         * @description Delete multiple selected classification
         * @param $event
         */
        self.removeBulkClassifications = function ($event) {
            classificationService
                .controllerMethod
                .classificationDeleteBulk(self.selectedClassifications, $event)
                .then(function () {
                    self.reloadClassifications(self.grid.page);
                });
        };

        /**
         * @description change the status of classification
         * @param classification
         */
        self.changeStatusClassification = function (classification) {
            self.statusServices[classification.status](classification)
                .then(function () {
                    toast.success(langService.get('status_success'));
                })
                .catch(function () {
                    classification.status = !classification.status;
                    dialog.errorMessage(langService.get('something_happened_when_update_status'));
                })
        };
        /**
         * @description change the status of classification
         * @param classification
         */
        self.changeGlobalClassification = function (classification) {
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
            toast.success(langService.get('change_global_success')
                .change({
                    name: classification.getTranslatedName(),
                    global: classification.getTranslatedGlobal()
                }));
        };

        self.openSelectOUClassificationDialog = function (classification) {
            return classification
                .opendDialogToSelectOrganizations()
                .then(function () {
                    return classification;
                });
        };
        /**
         * @description Change the status of selected classification
         * @param status
         */
        self.changeBulkStatusClassifications = function (status) {
            self.statusServices[status](self.selectedClassifications).then(function () {
                self.reloadClassifications(self.grid.page).then(function () {
                    toast.success(langService.get('selected_status_updated'));
                });
            });
        };
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
        /**
         * close the popup and sent the updated parent classifications.
         */
        self.closeSubClassificationView = function () {
            dialog.hide(self.parentClassifications);
        };
        /**
         * @description this method call when the user take action then close the popup.
         * @param classification
         * @return {Promise}
         */
        self.behindScene = function (classification) {
            return classification.repairGlobalStatus();
        }

    });
};