module.exports = function (app) {
    app.controller('classificationCtrl', function ($q,
                                                   $filter,
                                                   classifications,
                                                   dialog,
                                                   langService,
                                                   organizationService,
                                                   $timeout,
                                                   toast,
                                                   ouClassificationService,
                                                   classificationService,
                                                   contextHelpService,
                                                   gridService) {
        'ngInject';
        var self = this;
        self.controllerName = 'classificationCtrl';

        self.progress = null;
        contextHelpService.setHelpTo('classifications');
        self.searchModel = '';

        self.searchMode = false;

        /**
         * @description All classifications
         * @type {*}
         */
        self.classifications = classificationService.getMainClassifications(classifications);

        /**
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         * @type {Array}
         */
        self.selectedClassifications = [];

        self.grid = {
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.administration.classification) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.administration.classification, self.classifications),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.administration.classification, limit);
            }
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
                .classificationAdd(null, false, $event)
                .then(function (classification) {
                    self.behindScene(classification)
                        .then(function () {
                            self.reloadClassifications(self.grid.page);
                        });
                })
                .catch(function (classification) {
                    if (!classification.id)
                        return;

                    self.behindScene(classification)
                        .then(function () {
                            self.reloadClassifications(self.grid.page);
                        });
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
                .then(function (classification) {
                    self.behindScene(classification)
                        .then(function (classification) {
                            self.replaceRecordFromGrid(classification);
                            toast.success(langService.get('edit_success').change({name: classification.getTranslatedName()}));
                        });
                })
                .catch(function (classification) {
                    self.replaceRecordFromGrid(classification);
                });
        };

        self.replaceRecordFromGrid = function (classification) {
            self.classifications.splice(_.findIndex(self.classifications, function (item) {
                return item.id === classification.id;
            }), 1, classification);
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.classifications = $filter('orderBy')(self.classifications, self.grid.order);
        };

        /**
         * reload the grid again and if the pageNumber provide the current grid will be on it.
         * @param pageNumber
         * @return {*|Promise<Classification>}
         */
        self.reloadClassifications = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;
            self.searchMode = false;
            self.searchModel = '';
            // return ouClassificationService
            //     .loadOUClassifications()
            //     .then(function () {
            return classificationService
                .loadClassificationsWithLimit()
                .then(function (classifications) {
                    self.classifications = classificationService.getMainClassifications(classifications);
                    self.selectedClassifications = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return classifications;
                });
            // });
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
                                    self.reloadClassifications(self.grid.page)
                                        .then(function () {
                                            toast.success(langService.get('delete_specific_success').change({name: classification.getNames()}));
                                        });
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
            classification.updateStatus()
                .then(function () {
                    self.reloadClassifications(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('status_success'));
                        })
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
            toast.success(langService.get('change_global_success')
                .change({
                    name: classification.getTranslatedName(),
                    global: classification.getTranslatedGlobal()
                }));
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
        /**
         * @description this method to display the sub classifications for given classification
         * @param classification
         * @param $event
         */
        self.openSubClassificationDialog = function (classification, $event) {
            classificationService
                .controllerMethod
                .viewSubClassifications(classification, $event);
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
         * @description search in classification.
         * @param searchText
         * @return {*}
         */
        self.searchInClassification = function (searchText) {
            if (!searchText)
                return;
            self.searchMode = true;
            return classificationService
                .classificationSearch(searchText)
                .then(function (result) {
                    self.classifications = result;
                })
        }

    });
};