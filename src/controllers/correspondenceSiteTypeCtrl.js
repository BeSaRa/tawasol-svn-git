module.exports = function (app) {
    app.controller('correspondenceSiteTypeCtrl', function (lookupService,
                                                           correspondenceSiteTypeService,
                                                           correspondenceSiteTypes,
                                                           $q,
                                                           langService,
                                                           toast,
                                                           contextHelpService,
                                                           dialog) {
        'ngInject';
        var self = this;
        self.controllerName = 'correspondenceSiteTypeCtrl';
        contextHelpService.setHelpTo('correspondence-site-types');
        /**
         *@description All correspondence site types
         */

        self.correspondenceSiteTypes = correspondenceSiteTypes;
        self.model = angular.copy(self.correspondenceSiteTypes);
        self.promise = null;
        self.selectedCorrespondenceSiteTypes = [];
        self.grid = {
            limit: 5, // default limit
            page: 1, // first page
            //order: 'arName', // default sorting order
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.correspondenceSiteTypes.length + 21)
                    }
                }
            ]
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
                    return result;
                });
        };

        /**
         * @description Delete single correspondence site type
         * @param correspondenceSiteType
         * @param $event
         */
        self.removeCorrespondenceSiteType = function (correspondenceSiteType) {
            correspondenceSiteTypeService
                .controllerMethod
                .correspondenceSiteTypeDelete(correspondenceSiteType)
                .then(function () {
                    self.reloadCorrespondenceSiteTypes();
                });
        };

        /**
         * @description Delete multiple selected correspondence site types
         * @param $event
         */
        self.removeBulkCorrespondenceSiteTypes = function () {
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

    });
};