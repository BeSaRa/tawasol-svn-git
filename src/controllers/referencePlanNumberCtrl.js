module.exports = function (app) {
    app.controller('referencePlanNumberCtrl', function (lookupService,
                                                        referencePlanNumberService,
                                                        referencePlanNumbers,
                                                        $q,
                                                        $filter,
                                                        langService,
                                                        toast,
                                                        contextHelpService,
                                                        dialog,
                                                        gridService) {
        'ngInject';
        var self = this;

        self.controllerName = 'referencePlanNumberCtrl';

        contextHelpService.setHelpTo('reference-number-plans');
        /**
         * @description All reference plan numbers
         * @type {*}
         */
        self.referencePlanNumbers = referencePlanNumbers;
        self.referencePlanNumbersCopy = angular.copy(self.referencePlanNumbers);

        /**
         * @description Contains the selected reference plan numbers
         * @type {Array}
         */
        self.selectedReferencePlanNumbers = [];

        /**
         * @description Contains options for grid configuration
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         */
        self.grid = {
            progress: null,
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.administration.referenceNumberPlan) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.administration.referenceNumberPlan, self.referencePlanNumbers),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.administration.referenceNumberPlan, limit);
            },
            searchColumns: {
                arabicName: 'arName',
                englishName: 'enName'
            },
            searchText: '',
            searchCallback: function (grid) {
                self.referencePlanNumbers = gridService.searchGridData(self.grid, self.referencePlanNumbersCopy);
            }
        };

        /**
         * @description Contains methods for CRUD operations for reference plan numbers
         */
        self.statusServices = {
            'activate': referencePlanNumberService.activateBulkReferencePlanNumbers,
            'deactivate': referencePlanNumberService.deactivateBulkReferencePlanNumbers,
            'true': referencePlanNumberService.activateReferencePlanNumber,
            'false': referencePlanNumberService.deactivateReferencePlanNumber
        };

        /**
         * @description Opens dialog for add new reference plan number
         * @param $event
         */
        self.openAddReferencePlanNumberDialog = function ($event) {
            referencePlanNumberService
                .controllerMethod
                .referencePlanNumberAdd($event)
                .then(function (result) {
                    self.reloadReferencePlanNumbers(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('add_success').change({name: result.getNames()}));
                        });
                });
        };

        /**
         * @description Opens dialog for edit reference plan number
         * @param $event
         * @param referencePlanNumber
         */
        self.openEditReferencePlanNumberDialog = function (referencePlanNumber, $event) {
            referencePlanNumberService
                .controllerMethod
                .referencePlanNumberEdit(referencePlanNumber, $event)
                .then(function (result) {
                    self.reloadReferencePlanNumbers(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('edit_success').change({name: result.getNames()}));
                        });
                });
        };
        /**
         * @description open related organization units
         */
        self.openRelatedOrganizationDialog = function (referencePlanNumber, $event) {
            referencePlanNumberService
                .controllerMethod
                .relatedOrganizationUnits(referencePlanNumber, $event)
                .then(function (result) {
                    self.reloadReferencePlanNumbers(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('edit_success').change({name: result.getNames()}));
                        });
                });
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.referencePlanNumbers = $filter('orderBy')(self.referencePlanNumbers, self.grid.order);
        };

        /**
         * @description Reload the grid of reference plan number
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadReferencePlanNumbers = function (pageNumber) {
            var defer = $q.defer();
            self.grid.progress = defer.promise;
            return referencePlanNumberService
                .loadReferencePlanNumbers()
                .then(function (result) {
                    self.referencePlanNumbers = result;
                    self.referencePlanNumbersCopy = angular.copy(self.referencePlanNumbers);
                    self.selectedReferencePlanNumbers = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return result;
                });
        };

        /**
         * @description Delete single reference plan number
         * @param referencePlanNumber
         * @param $event
         */
        self.removeReferencePlanNumber = function (referencePlanNumber, $event) {
            referencePlanNumberService
                .controllerMethod
                .referencePlanNumberDelete(referencePlanNumber, $event)
                .then(function () {
                    self.reloadReferencePlanNumbers(self.grid.page);
                });
        };

        /**
         * @description Delete multiple selected reference plan numbers
         * @param $event
         */
        self.removeBulkReferencePlanNumbers = function ($event) {
            referencePlanNumberService
                .controllerMethod
                .referencePlanNumberDeleteBulk(self.selectedReferencePlanNumbers, $event)
                .then(function () {
                    self.reloadReferencePlanNumbers(self.grid.page)
                        .then(function () {
                            toast.success(langService.get("delete_success"));
                        });
                });
        };

        /**
         * @description Change the status of reference plan number
         * @param referencePlanNumber
         */
        self.changeStatusReferencePlanNumber = function (referencePlanNumber) {
            self.statusServices[referencePlanNumber.status](referencePlanNumber)
                .then(function () {
                    toast.success(langService.get('status_success'));
                })
                .catch(function () {
                    referencePlanNumber.status = !referencePlanNumber.status;
                    dialog.errorMessage(langService.get('something_happened_when_update_status'));
                })
        };

        /**
         * @description Change the status of selected reference plan numbers
         * @param status
         */
        self.changeStatusBulkReferencePlanNumbers = function (status) {
            self.statusServices[status](self.selectedReferencePlanNumbers)
                .then(function () {
                    self.reloadReferencePlanNumbers(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('selected_status_updated'));
                        });
                });
        };

        /**
         * @description Change the globalization of reference plan number
         * @param referencePlanNumber
         */
        self.changeGlobalReferencePlanNumber = function (referencePlanNumber) {
            if (referencePlanNumber.isGlobal) {
                referencePlanNumberService.updateReferencePlanNumber(referencePlanNumber)
                    .then(function () {
                        toast.success(langService.get('globalization_success'));
                    })
                    .catch(function () {
                        referencePlanNumber.global = !referencePlanNumber.global;
                        dialog.errorMessage(langService.get('something_happened_when_update_global'));
                    });
            } else {
                referencePlanNumber.update().then(function () {
                    toast.success(langService.get('globalization_success'));
                })
            }
        };
    });
};
