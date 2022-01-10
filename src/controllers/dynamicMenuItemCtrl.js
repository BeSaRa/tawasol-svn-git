module.exports = function (app) {
    app.controller('dynamicMenuItemCtrl', function (dynamicMenuItemService,
                                                    errorCode,
                                                    dynamicMenuItems,
                                                    toast,
                                                    $filter,
                                                    layoutService,
                                                    $q,
                                                    _,
                                                    langService,
                                                    gridService,
                                                    lookupService,
                                                    rootEntity,
                                                    contextHelpService) {
        'ngInject';
        var self = this;
        self.controllerName = 'dynamicMenuItemCtrl';
        contextHelpService.setHelpTo('dynamic-menu-items');
        self.rootEntity = rootEntity.returnRootEntity().rootEntity;

        /**
         * @description All document  types
         * @type {*}
         */
        self.dynamicMenuItems = dynamicMenuItems;
        self.dynamicMenuItemsCopy = angular.copy(self.dynamicMenuItems);

        self.menuTypes = {};

        _.map(lookupService.returnLookups(lookupService.menuItemType), function (type) {
            self.menuTypes[type.lookupKey] = type;
        });

        /**
         * @description Contains the selected document types
         * @type {Array}
         */
        self.selectedDynamicMenuItems = [];

        /**
         * @description
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         */
        self.grid = {
            progress: null,
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.administration.dynamicMenuItem) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.administration.dynamicMenuItem, self.dynamicMenuItems),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.administration.dynamicMenuItem, limit);
            },
            searchColumns: {
                arabicName: 'arName',
                englishName: 'enName'
            },
            searchText: '',
            searchCallback: function (grid) {
                self.dynamicMenuItems = gridService.searchGridData(self.grid, self.dynamicMenuItemsCopy);
            }
        };

        self.statusServices = {
            'activate': dynamicMenuItemService.activateBulkDynamicMenuItems,
            'deactivate': dynamicMenuItemService.deactivateBulkDynamicMenuItems,
            'true': dynamicMenuItemService.activateDynamicMenuItem,
            'false': dynamicMenuItemService.deactivateDynamicMenuItem
        };


        /**
         * @description Opens dialog for add new document type
         * @param $event
         */
        self.openAddDynamicMenuItemDialog = function ($event) {
            dynamicMenuItemService
                .controllerMethod
                .dynamicMenuItemAdd($event)
                .then(function (result) {
                    self.reloadDynamicMenuItems(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('add_success').change({name: result.getNames()}));
                        });
                })
        };

        /**
         * @description Opens dialog for edit document type
         * @param dynamicMenuItem
         * @param $event
         */
        self.openEditDynamicMenuItemDialog = function (dynamicMenuItem, $event) {
            dynamicMenuItemService
                .controllerMethod
                .dynamicMenuItemEdit(dynamicMenuItem, $event)
                .then(function (result) {
                    self.reloadDynamicMenuItems(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('edit_success').change({name: result.getNames()}));
                        });
                });
        };
        /**
         * @description view dynamic menu
         * @param dynamicMenuItem
         * @param $event
         */
        self.openSubDynamicMenuItemDialog = function (dynamicMenuItem, $event) {
            dynamicMenuItemService
                .controllerMethod
                .dynamicMenuItemEdit(dynamicMenuItem, $event, 2)
                .then(function (result) {
                    self.reloadDynamicMenuItems(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('edit_success').change({name: result.getNames()}));
                        });
                });
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.dynamicMenuItems = $filter('orderBy')(self.dynamicMenuItems, self.grid.order);
        };

        /**
         * @description this method to reload the grid
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadDynamicMenuItems = function (pageNumber) {
            var defer = $q.defer();
            self.grid.progress = defer.promise;
            return dynamicMenuItemService
                .loadParentDynamicMenuItems()
                .then(function (result) {
                    layoutService.loadLandingPage();
                    self.dynamicMenuItems = result;
                    self.dynamicMenuItemsCopy = angular.copy(self.dynamicMenuItems);
                    self.selectedDynamicMenuItems = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return result;
                });
        };

        /**
         * @description Delete single document type
         * @param dynamicMenuItem
         * @param $event
         */
        self.removeDynamicMenuItem = function (dynamicMenuItem, $event) {
            dynamicMenuItemService
                .controllerMethod
                .dynamicMenuItemDelete(dynamicMenuItem, $event)
                .then(function () {
                    self.reloadDynamicMenuItems(self.grid.page)
                        .then(function () {
                            layoutService.loadLandingPage().then(function () {

                            })
                        });
                })
                .catch(function (error) {
                    errorCode.checkIf(error, 'CAN_NOT_DELETE_LOOKUP', function () {
                        dialog.errorMessage(langService.get('cannot_delete_lookup').change({
                            lookup: langService.get('label_document_type'),
                            used: langService.get('other_places')
                        }), null, null, $event);
                    });
                });
        };

        /**
         * @description Delete multiple selected document types
         * @param $event
         */
        self.removeBulkDynamicMenuItems = function ($event) {
            dynamicMenuItemService
                .controllerMethod
                .dynamicMenuItemDeleteBulk(self.selectedDynamicMenuItems, $event)
                .then(function () {
                    self.reloadDynamicMenuItems(self.grid.page);
                });
        };

        /**
         * @description Change the status of document type
         * @param dynamicMenuItem
         */
        self.changeStatusDynamicMenuItem = function (dynamicMenuItem) {
            self.statusServices[dynamicMenuItem.status](dynamicMenuItem)
                .then(function () {
                    self.reloadDynamicMenuItems(self.grid.page);
                    toast.success(langService.get('status_success'));
                })
                .catch(function () {
                    dynamicMenuItem.status = !dynamicMenuItem.status;
                    dialog.errorMessage(langService.get('something_happened_when_update_status'));
                });
        };

        /**
         * @description Change the status of selected document types
         * @param status
         */
        self.changeStatusBulkDynamicMenuItems = function (status) {
            self.statusServices[status](self.selectedDynamicMenuItems)
                .then(function () {
                    self.reloadDynamicMenuItems(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('selected_status_updated'));
                        });
                });
        };


        /**
         * @description Change the globalization of sms template
         * @param dynamicMenuItem
         */
        self.changeGlobalDynamicMenuItem = function (dynamicMenuItem) {
            dynamicMenuItem
                .update(dynamicMenuItem)
                .then(function () {
                    toast.success(langService.get('globalization_success'));
                    self.reloadDynamicMenuItems(self.grid.page);
                })
                .catch(function () {
                    dynamicMenuItem.isGlobal = !dynamicMenuItem.isGlobal;
                    dialog.errorMessage(langService.get('something_happened_when_update_global'));
                });
        };


    });
};
