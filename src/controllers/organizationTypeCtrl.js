module.exports = function (app) {
    app.controller('organizationTypeCtrl', function ($q,
                                                     $filter,
                                                     organizationTypes,
                                                     dialog,
                                                     langService,
                                                     toast,
                                                     errorCode,
                                                     contextHelpService,
                                                     organizationTypeService,
                                                     gridService) {
        'ngInject';
        var self = this;
        self.controllerName = 'organizationTypeCtrl';

        contextHelpService.setHelpTo('organization-types');
        /**
         * @description All organization  types
         * @type {*}
         */
        self.organizationTypes = organizationTypes;
        self.organizationTypesCopy = angular.copy(self.organizationTypes);

        self.selectedOrganizationTypes = [];

        /**
         * @description Contains the selected organization types
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         */
        self.grid = {
            progress: null,
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.administration.organizationType) || 10, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.administration.organizationType, self.organizationTypes),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.administration.organizationType, limit);
            },
            searchColumns: {
                arabicName: 'arName',
                englishName: 'enName',
                itemOrder: 'itemOrder'
            },
            searchText: '',
            searchCallback: function (grid) {
                self.organizationTypes = gridService.searchGridData(self.grid, self.organizationTypesCopy);
            }
        };

        self.statusServices = {
            'activate': organizationTypeService.activateBulkOrganizationTypes,
            'deactivate': organizationTypeService.deactivateBulkOrganizationTypes,
            'true': organizationTypeService.activateOrganizationType,
            'false': organizationTypeService.deactivateOrganizationType
        };

        /**
         * @description Opens dialog for add new organization type
         * @param $event
         */
        self.openAddOrganizationTypeDialog = function ($event) {
            return organizationTypeService
                .controllerMethod
                .organizationTypeAdd($event)
                .then(function (result) {
                    self.reloadOrganizationTypes(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('add_success').change({name: result.getNames()}));
                        });
                });
        };

        /**
         * @description Opens dialog for edit organization type
         * @param organizationType
         * @param $event
         */
        self.openEditOrganizationTypeDialog = function (organizationType, $event) {
            organizationTypeService
                .controllerMethod
                .organizationTypeEdit(organizationType, $event)
                .then(function (result) {
                    self.reloadOrganizationTypes(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('edit_success').change({name: result.getNames()}));
                        });
                });
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.organizationTypes = $filter('orderBy')(self.organizationTypes, self.grid.order);
        };

        /**
         * reload the grid again and if the pageNumber provide the current grid will be on it.
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadOrganizationTypes = function (pageNumber) {
            var defer = $q.defer();
            self.grid.progress = defer.promise;
            return organizationTypeService
                .loadOrganizationTypes()
                .then(function (result) {
                    self.organizationTypes = result;
                    self.organizationTypesCopy= angular.copy(self.organizationTypes);
                    self.selectedOrganizationTypes = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return result;
                });
        };

        /**
         * @description Delete single organization type
         * @param organizationType
         * @param $event
         */
        self.removeOrganizationType = function (organizationType, $event) {
            organizationTypeService
                .controllerMethod
                .organizationTypeDelete(organizationType, $event)
                .then(function () {
                    self.reloadOrganizationTypes(self.grid.page);
                })
                .catch(function (error) {
                    errorCode.checkIf(error, 'CAN_NOT_DELETE_LOOKUP', function () {
                        dialog.errorMessage(langService.get('cannot_delete_lookup').change({
                            lookup: langService.get('organization_type'),
                            used: langService.get('other_organizations')
                        }), null, null, $event);
                    });
                });
        };

        /**
         * @description Delete multiple selected organization types
         * @param $event
         */
        self.removeBulkOrganizationTypes = function ($event) {
            organizationTypeService
                .controllerMethod
                .organizationTypeDeleteBulk(self.selectedOrganizationTypes, $event)
                .then(function () {
                    self.reloadOrganizationTypes(self.grid.page);
                });
        };

        /**
         * @description change the status of organization type
         * @param organizationType
         */
        self.changeStatusOrganizationType = function (organizationType) {
            self.statusServices[organizationType.status](organizationType)
                .then(function () {
                    toast.success(langService.get('status_success'));
                })
                .catch(function () {
                    organizationType.status = !organizationType.status;
                    dialog.errorMessage(langService.get('something_happened_when_update_status'));
                })
        };

        /**
         * @description Change the status of selected organization types
         * @param status
         */
        self.changeBulkStatusOrganizationTypes = function (status) {
            self.statusServices[status](self.selectedOrganizationTypes)
                .then(function () {
                    self.reloadOrganizationTypes(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('selected_status_updated'));
                        });
                });
        };
    });
};
