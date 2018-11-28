module.exports = function (app) {
    app.controller('correspondenceSiteTypeCtrl', function (lookupService,
                                                           correspondenceSiteTypeService,
                                                           correspondenceSiteTypes,
                                                           $q,
                                                           errorCode,
                                                           $filter,
                                                           langService,
                                                           toast,
                                                           contextHelpService,
                                                           dialog,
                                                           gridService,
                                                           _) {
        'ngInject';
        var self = this;
        self.controllerName = 'correspondenceSiteTypeCtrl';
        contextHelpService.setHelpTo('correspondence-site-types');
        /**
         *@description All correspondence site types
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         */

        self.correspondenceSiteTypes = correspondenceSiteTypes;
        self.model = angular.copy(self.correspondenceSiteTypes);
        self.promise = null;
        self.selectedCorrespondenceSiteTypes = [];
        self.grid = {
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.administration.correspondenceSiteType) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.administration.correspondenceSiteType, self.correspondenceSiteTypes),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.administration.correspondenceSiteType, limit);
            }
        };
        /**
         *@description Contains methods for CRUD operations for correspondence site types
         */
        self.statusServices = {
            'activate': correspondenceSiteTypeService.activateBulkCorrespondenceSiteTypes,
            'deactivate': correspondenceSiteTypeService.deactivateBulkCorrespondenceSiteTypes,
            'true': correspondenceSiteTypeService.activateCorrespondenceSiteType,
            'false': correspondenceSiteTypeService.deactivateCorrespondenceSiteType
        };

        /**
         * @description Opens dialog for add new correspondence site type
         * @param $event
         */
        self.openAddCorrespondenceSiteTypeDialog = function ($event) {
            correspondenceSiteTypeService
                .controllerMethod
                .correspondenceSiteTypeAdd($event)
                .then(function (result) {
                    self.reloadCorrespondenceSiteTypes(self.grid.page).then(function () {
                        toast.success(langService.get('add_success').change({name: result.getNames()}));
                    });
                })
        };

        /**
         * @description Opens dialog for edit correspondence site type
         * @param $event
         * @param correspondenceSiteType
         */
        self.openEditCorrespondenceSiteTypeDialog = function (correspondenceSiteType, $event) {
            correspondenceSiteTypeService
                .controllerMethod
                .correspondenceSiteTypeEdit(correspondenceSiteType, $event)
                .then(function (result) {
                    self.reloadCorrespondenceSiteTypes(self.grid.page).then(function () {
                        toast.success(langService.get('edit_success').change({name: result.getNames()}));
                    });
                });
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.correspondenceSiteTypes = $filter('orderBy')(self.correspondenceSiteTypes, self.grid.order);
        };

        /**
         * @description Reload the grid of correspondence site type
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadCorrespondenceSiteTypes = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;
            return correspondenceSiteTypeService
                .loadCorrespondenceSiteTypes()
                .then(function (result) {
                    self.correspondenceSiteTypes = result;
                    self.selectedCorrespondenceSiteTypes = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return result;
                });
        };

        /**
         * @description Delete single correspondence site type
         * @param correspondenceSiteType
         * @param $event
         */
        self.removeCorrespondenceSiteType = function (correspondenceSiteType, $event) {
            correspondenceSiteTypeService
                .controllerMethod
                .correspondenceSiteTypeDelete(correspondenceSiteType)
                .then(function () {
                    self.reloadCorrespondenceSiteTypes();
                })
                .catch(function (error) {
                    return errorCode.checkIf(error, 'CAN_NOT_DELETE_LOOKUP', function () {
                        dialog.errorMessage(langService.get('cannot_delete_lookup').change({
                            lookup: langService.get('menu_item_correspondence_site_type'),
                            used: langService.get('other_places')
                        }), null, $event);
                    });
                });
        };

        /**
         * @description Delete multiple selected correspondence site types
         * @param $event
         */
        self.removeBulkCorrespondenceSiteTypes = function ($event) {
            correspondenceSiteTypeService
                .controllerMethod
                .correspondenceSiteTypeDeleteBulk(self.selectedCorrespondenceSiteTypes)
                .then(function () {
                    self.reloadCorrespondenceSiteTypes(self.grid.page);
                });
        };

        /**
         * @description Change the status of correspondence site type from grid
         * @param correspondenceSiteType
         */
        self.changeStatusCorrespondenceSiteType = function (correspondenceSiteType) {
            self.statusServices[correspondenceSiteType.status](correspondenceSiteType)
                .then(function () {
                    toast.success(langService.get('status_success'));
                })
                .catch(function () {
                    correspondenceSiteType.status = !correspondenceSiteType.status;
                    dialog.errorMessage(langService.get('something_happened_when_update_status'));
                })
        };

        /**
         * @description Change the status of selected correspondence site types
         * @param status
         */
        self.changeStatusBulkCorrespondenceSiteTypes = function (status) {
            self.statusServices[status](self.selectedCorrespondenceSiteTypes).then(function () {
                self.reloadCorrespondenceSiteTypes(self.grid.page).then(function () {
                    toast.success(langService.get('selected_status_updated'));
                });
            });
        };

        /**
         * @description can bulk delete
         * @returns {boolean}
         */
        self.canDeleteBulk = function () {
            return _.every(self.selectedCorrespondenceSiteTypes, function (correspondenceSiteType) {
                return correspondenceSiteType.canDelete();
            })
        }
    });
};