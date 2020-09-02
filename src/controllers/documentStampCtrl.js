module.exports = function (app) {
    app.controller('documentStampCtrl', function (lookupService,
                                                  documentStampService,
                                                  documentStamps,
                                                  $q,
                                                  _,
                                                  generator,
                                                  langService,
                                                  toast,
                                                  dialog,
                                                  $filter,
                                                  gridService,
                                                  counterService,
                                                  selectedRegOU,
                                                  organizationService,
                                                  organizations,
                                                  employeeService) {
        'ngInject';
        var self = this;

        self.controllerName = 'documentStampCtrl';

        /**
         * @description All document stamps
         * @type {*}
         */
        self.documentStamps = documentStamps;
        self.documentStampsCopy = angular.copy(self.documentStamps);

        self.organizations = _.filter((angular.copy(organizations)), 'hasRegistry');
        self.sections = [];

        self.ouSearchText = '';
        self.ouSectionSearchText = '';


        /**
         * @description Contains the selected document stamps
         * @type {Array}
         */
        self.selectedDocumentStamps = [];
        self.selectedOrganization = selectedRegOU;

        /**
         * @description Contains options for grid configuration
         * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
         */
        self.grid = {
            name: gridService.grids.administration.documentStamp,
            progress: null,
            limit: 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.administration.documentStamp, self.documentStamps),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.administration.documentStamp, limit);
            },
            searchColumns: {
                docSubject: 'docSubject',
                docTitle: 'documentTitle'
            },
            searchText: '',
            searchCallback: function (grid) {
                self.documentStamps = gridService.searchGridData(self.grid, self.documentStampsCopy);
            }
        };

        /**
         * @description Get the sorting key for information or lookup model
         * @param property
         * @param modelType
         * @returns {*}
         */
        self.getSortingKey = function (property, modelType) {
            return generator.getColumnSortingKey(property, modelType);
        };

        /**
         * @description Contains methods for CRUD operations for document stamps
         */
        self.statusServices = {
            'activate': documentStampService.activateBulkDocumentStamps,
            'deactivate': documentStampService.deactivateBulkDocumentStamps,
            'true': documentStampService.activateDocumentStamp,
            'false': documentStampService.deactivateDocumentStamp
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.documentStamps = $filter('orderBy')(self.documentStamps, self.grid.order);
        };

        /**
         * @description Reload the grid of document stamp
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadDocumentStamps = function (pageNumber) {
            var defer = $q.defer();
            self.grid.progress = defer.promise;
            return documentStampService
                .loadDocumentStamps((self.selectedSection || self.selectedOrganization))
                .then(function (result) {
                    counterService.loadCounters();
                    self.documentStamps = result;
                    self.documentStampsCopy = angular.copy(self.documentStamps);
                    self.selectedDocumentStamps = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return result;
                });
        };


        self.regOuChanged = function (ignoreLoadStamps) {
            self.selectedSection = null;
            if (self.selectedOrganization > 0) {
                organizationService
                    .loadOrganizationChildren(self.selectedOrganization)
                    .then(function (result) {
                        self.sections = _.filter(result, function (item) {
                            return !item.hasRegistry;
                        });
                    });
            }

            if (!ignoreLoadStamps) {
                return self.reloadDocumentStamps();
            }

        };

        /**
         * @description Opens dialog for add new document stamp
         * @param $event
         */
        self.openAddDocumentStampDialog = function ($event) {
            documentStampService
                .controllerMethod
                .documentStampAdd($event, (self.selectedSection || self.selectedOrganization))
                .then(function (result) {
                    self.reloadDocumentStamps(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('add_success').change({name: result.getNames()}));
                        });
                });
        };

        /**
         * @description Opens dialog for edit document stamp
         * @param $event
         * @param documentStamp
         */
        self.openEditDocumentStampDialog = function (documentStamp, $event) {
            documentStampService
                .controllerMethod
                .documentStampEdit(documentStamp, $event)
                .then(function (result) {
                    self.reloadDocumentStamps(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('edit_success').change({name: result.getNames()}));
                        });
                });
        };

        /**
         * @description Delete single document stamp
         * @param documentStamp
         * @param $event
         */
        self.removeDocumentStamp = function (documentStamp, $event) {
            documentStampService
                .controllerMethod
                .documentStampDelete(documentStamp, $event)
                .then(function () {
                    self.reloadDocumentStamps(self.grid.page);
                });
        };

        /**
         * @description Delete multiple selected document stamps
         * @param $event
         */
        self.removeBulkDocumentStamps = function ($event) {
            return false;
            /*documentStampService
                .controllerMethod
                .documentStampDeleteBulk(self.selectedDocumentStamps, $event)
                .then(function () {
                    self.reloadDocumentStamps(self.grid.page)
                        .then(function () {
                            toast.success(langService.get("delete_success"));
                        });
                });*/
        };

        /**
         * @description Change the status of document stamp
         * @param documentStamp
         */
        self.changeStatusDocumentStamp = function (documentStamp) {
            self.statusServices[documentStamp.status](documentStamp)
                .then(function () {
                    toast.success(langService.get('status_success'));
                })
                .catch(function () {
                    documentStamp.status = !documentStamp.status;
                    dialog.errorMessage(langService.get('something_happened_when_update_status'));
                })
        };

        /**
         * @description Change the status of selected document stamps
         * @param status
         */
        self.changeStatusBulkDocumentStamps = function (status) {
            self.statusServices[status](self.selectedDocumentStamps)
                .then(function () {
                    self.reloadDocumentStamps(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('selected_status_updated'));
                        });
                });
        };


        self.isActionAllowed = function (record, checkForAdd) {
            return true;
        };

        self.isBulkActionAllowed = function () {
            return true;
        };

        /**
         * @description Clears the searchText for the given field
         * @param fieldType
         */
        self.clearSearchText = function (fieldType) {
            self[fieldType + 'SearchText'] = '';
        };

        /**
         * @description Prevent the default dropdown behavior of keys inside the search box of dropdown
         * @param $event
         */
        self.preventSearchKeyDown = function ($event) {
            if ($event) {
                var code = $event.which || $event.keyCode;
                if (code !== 38 && code !== 40)
                    $event.stopPropagation();
            }
        };

        self.$onInit = function () {
            self.regOuChanged(true);
        }
    });
};
