module.exports = function (app) {
    app.controller('subClassificationViewPopCtrl', function ($q,
                                                             $filter,
                                                             generator,
                                                             dialog,
                                                             toast,
                                                             mainClassification,
                                                             subClassifications,
                                                             classificationService,
                                                             langService) {
        'ngInject';
        var self = this;
        self.controllerName = 'subClassificationNewViewPopCtrl';

        self.mainClassification = mainClassification;
        self.subClassifications = subClassifications;
        self.selectedSubClassifications = [];

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.subClassifications = $filter('orderBy')(self.subClassifications, self.grid.order);
        };


        self.grid = {
            progress: null,
            limit: 5, // default limit
            page: 1, // first page
            order: 'arName', // default sorting order
            limitOptions: [5, 10, 20, {
                label: langService.get('all'),
                value: function () {
                    return (self.subClassifications.length + 21);
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
         * @description Opens dialog for add new subClassification
         * @param $event
         */
        self.openAddSubClassificationDialog = function ($event) {
            return classificationService
                .controllerMethod
                .classificationAdd(self.mainClassification, false, $event)
                .then(function () {
                    self.reloadSubClassifications(self.grid.page);
                })
                .catch(function (error) {
                    self.reloadSubClassifications(self.grid.page);
                });
        };

        /**
         * @description Opens dialog for edit subClassification
         * @param subClassification
         * @param $event
         */
        self.openEditSubClassificationDialog = function (subClassification, $event) {
            classificationService
                .controllerMethod
                .classificationEdit(subClassification, null, $event)
                .then(function () {
                    self.reloadSubClassifications(self.grid.page).then(function () {
                        toast.success(langService.get('edit_success').change({name: subClassification.getNames()}));
                    });
                })
                .catch(function (classification) {
                    self.reloadSubClassifications(self.grid.page);
                });
        };
        /**
         * reload the grid again and if the pageNumber provide the current grid will be on it.
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadSubClassifications = function (pageNumber) {
            var defer = $q.defer();
            self.grid.progress = defer.promise;
            self.searchMode = false;
            self.searchModel = '';

            return classificationService
                .loadSubClassifications(self.mainClassification)
                .then(function (result) {
                    self.subClassifications = result;
                    self.selectedSubClassifications = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return result;
                });

        };

        /**
         * @description Delete single classification
         * @param subClassification
         * @param $event
         */
        self.removeSubClassification = function (subClassification, $event) {
            classificationService
                .controllerMethod
                .classificationDelete(subClassification, $event)
                .then(function () {
                    self.reloadSubClassifications(self.grid.page);
                });
        };

        /**
         * @description Delete multiple selected subClassifications
         * @param $event
         */
        self.removeBulkSubClassifications = function ($event) {
            classificationService
                .controllerMethod
                .classificationDeleteBulk(self.selectedSubClassifications, $event)
                .then(function () {
                    self.reloadSubClassifications(self.grid.page);
                });
        };

        /**
         * @description change the status of subClassification
         * @param subClassification
         */
        self.changeStatusSubClassification = function (subClassification) {
            subClassification.updateStatus()
                .then(function () {
                    toast.success(langService.get('status_success'));
                })
                .catch(function () {
                    subClassification.status = !subClassification.status;
                    dialog.errorMessage(langService.get('something_happened_when_update_status'));
                })
        };
        /**
         * @description change the status of subClassification
         * @param subClassification
         */
        self.changeGlobalSubClassification = function (subClassification) {
            if (subClassification.isGlobal) {
                dialog.confirmMessage(langService.get('related_organization_confirm'))
                    .then(function () {
                        subClassification.setRelatedOus([]);
                        subClassification.update().then(self.displayClassificationGlobalMessage);
                    })
                    .catch(function () {
                        subClassification.setIsGlobal(false);
                    });
            } else {
                self.openSelectOUClassificationDialog(subClassification)
                    .then(function (result) {
                        result.setRelatedOus([]);
                        result.update().then(self.displayClassificationGlobalMessage);
                    })
                    .catch(function () {
                        subClassification.setIsGlobal(true).update();
                    });
            }
        };
        /**
         * @description display for the global message.
         * @param subClassification
         */
        self.displayClassificationGlobalMessage = function (subClassification) {
            toast.success(langService.get('change_global_success')
                .change({
                    name: subClassification.getTranslatedName(),
                    global: subClassification.getTranslatedGlobal()
                }));
        };

        self.openSelectOUClassificationDialog = function (classification) {
            return classification
                .openDialogToSelectOrganizations()
                .then(function () {
                    return classification;
                });
        };
        /**
         * @description Change the status of selected subClassifications
         * @param status
         */
        self.changeBulkStatusSubClassifications = function (status) {
            var statusCheck = (status === 'activate');
            if (!generator.checkCollectionStatus(self.selectedSubClassifications, statusCheck)) {
                toast.success(langService.get(statusCheck ? 'success_activate_selected' : 'success_deactivate_selected'));
                return;
            }

            self.statusServices[status](self.selectedSubClassifications).then(function () {
                self.reloadSubClassifications(self.grid.page);
            });
        };

        /**
         * @description search in classification.
         * @param searchText
         * @return {*}
         */
        self.searchInSubClassifications = function (searchText) {
            if (!searchText)
                return;
            self.searchMode = true;
            return classificationService
                .classificationSearch(searchText, self.mainClassification)
                .then(function (result) {
                    self.subClassifications = result;
                })
        };


        /**
         * close the popup and sent the updated parent classifications.
         */
        self.closeSubClassificationView = function () {
            dialog.cancel();
        };

    });
};