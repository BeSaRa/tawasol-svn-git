module.exports = function (app) {
    app.controller('customLevelGroupCtrl', function (lookupService,
                                                     customLevelGroupService,
                                                     customLevelGroups,
                                                     $q,
                                                     $filter,
                                                     langService,
                                                     toast,
                                                     contextHelpService,
                                                     dialog,
                                                     gridService) {
        'ngInject';
        var self = this;
        self.controllerName = 'customLevelGroupCtrl';

        contextHelpService.setHelpTo('custom-level-group');

        /**
         * @description All custom Level Groups
         * @type {*}
         */
        self.customLevelGroups = customLevelGroups;
        self.customLevelGroupsCopy = angular.copy(self.customLevelGroups);

        /**
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         * @type {Array}
         */
        self.selectedCustomLevelGroups = [];

        self.grid = {
            progress: null,
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.administration.customLevelGroup) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.administration.customLevelGroup, self.customLevelGroups),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.administration.customLevelGroup, limit);
            },
            searchColumns: {
                arabicName: 'arName',
                englishName: 'enName',
            },
            searchText: '',
            searchCallback: function (grid) {
                self.customLevelGroups = gridService.searchGridData(self.grid, self.customLevelGroupsCopy);
            }
        };

        self.statusServices = {
            /*'activate': customLevelGroupService.activateBulkCustomLevelGroups,
            'deactivate': customLevelGroupService.deactivateBulkCustomLevelGroups,*/
            'true': customLevelGroupService.activateCustomLevelGroup,
            'false': customLevelGroupService.deactivateCustomLevelGroup
        };

        /**
         * @description Opens dialog for add new custom level group
         * @param $event
         */
        self.openAddCustomLevelGroupDialog = function ($event) {
            customLevelGroupService
                .controllerMethod
                .customLevelGroupAdd($event)
                .then(function (result) {
                    self.reloadCustomLevelGroups(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('add_success').change({name: result.getNames()}));
                        });
                })
        };

        /**
         * @description Opens dialog for edit custom level group
         * @param customLevelGroup
         * @param $event
         */
        self.openEditCustomLevelGroupDialog = function (customLevelGroup, $event) {
            customLevelGroupService
                .controllerMethod
                .customLevelGroupEdit(customLevelGroup, false, $event)
                .then(function (result) {
                    self.reloadCustomLevelGroups(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('edit_success').change({name: result.getNames()}));
                        });
                });
        };

        /**
         *@description
         */
        self.openOrganizationLevelIdsDialog = function (customLevelGroup, $event) {
            customLevelGroupService
                .controllerMethod
                .customLevelGroupEdit(customLevelGroup, true, $event)
                .then(function (result) {
                });
        }

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.customLevelGroups = $filter('orderBy')(self.customLevelGroups, self.grid.order);
        };

        /**
         * @description this method to reload the grid
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadCustomLevelGroups = function (pageNumber) {
            var defer = $q.defer();
            self.grid.progress = defer.promise;
            return customLevelGroupService
                .loadCustomLevelGroups()
                .then(function (result) {
                    self.customLevelGroups = result;
                    self.customLevelGroupsCopy = angular.copy(self.customLevelGroups);
                    self.selectedCustomLevelGroups = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return result;
                });
        };

        /**
         * @description delete custom level group
         * @param customLevelGroup
         * @param $event
         */
        self.removeCustomLevelGroup = function (customLevelGroup, $event) {
            customLevelGroupService
                .controllerMethod
                .customLevelGroupDelete(customLevelGroup, $event)
                .then(function () {
                    self.reloadCustomLevelGroups(self.grid.page);
                })
                .catch(function (error) {
                    console.log(error);
                });
        }


        /**
         * @description Change the status of Custom Level Group
         * @param customLevelGroup
         */
        self.changeStatusCustomLevelGroup = function (customLevelGroup) {
            self.statusServices[customLevelGroup.status](customLevelGroup)
                .then(function () {
                    toast.success(langService.get('status_success'));
                })
                .catch(function () {
                    customLevelGroup.status = !customLevelGroup.status;
                    dialog.errorMessage(langService.get('something_happened_when_update_status'));
                })
        };
    });
};
