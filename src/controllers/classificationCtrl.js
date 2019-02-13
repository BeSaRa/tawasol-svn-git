module.exports = function (app) {
    app.controller('classificationCtrl', function ($q,
                                                   $filter,
                                                   classifications,
                                                   dialog,
                                                   langService,
                                                   generator,
                                                   $timeout,
                                                   toast,
                                                   classificationService,
                                                   contextHelpService,
                                                   gridService) {
        'ngInject';
        var self = this;
        self.controllerName = 'classificationCtrl';

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
            progress: null,
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
                .then(function (result) {
                    self.reloadClassifications(self.grid.page);
                })
                .catch(function (error) {
                    self.reloadClassifications(self.grid.page);
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
                .then(function (result) {
                    self.reloadClassifications(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('edit_success').change({name: result.getTranslatedName()}));
                        })
                })
                .catch(function (error) {
                    self.reloadClassifications(self.grid.page)
                });
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
            self.grid.progress = defer.promise;
            self.searchMode = false;
            self.searchModel = '';
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
            classification.updateStatus()
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
        /**
         * @description change global status
         * @param classification
         */
        self.changeGlobalFromFromGrid = function (classification) {
            if (classification.isGlobal) {
                dialog.confirmMessage(langService.get('related_organization_confirm'))
                    .then(function () {
                        classification.setRelatedOus([]);
                        classification.update().then(self.displayClassificationGlobalMessage);
                    });
            } else {
                self.openSelectOUClassificationDialog(classification)
                    .then(function (result) {
                        result.update().then(self.displayClassificationGlobalMessage);
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
            var statusCheck = (status === 'activate');
            if (!generator.checkCollectionStatus(self.selectedClassifications, statusCheck)) {
                toast.success(langService.get(statusCheck ? 'success_activate_selected' : 'success_deactivate_selected'));
                return;
            }

            self.statusServices[status](self.selectedClassifications).then(function () {
                self.reloadClassifications(self.grid.page);
            });
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
        };

        /**
         * @description this method to display the sub classifications for given classification
         * @param mainClassification
         * @param $event
         */
        self.openSubClassificationDialog = function (mainClassification, $event) {
            classificationService
                .controllerMethod
                .viewSubClassifications(mainClassification, $event)
                .then(function () {
                    self.reloadClassifications(self.grid.page);
                })
                .catch(function () {
                    self.reloadClassifications(self.grid.page);
                });
        };

    });
};