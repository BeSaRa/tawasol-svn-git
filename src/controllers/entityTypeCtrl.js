module.exports = function (app) {
    app.controller('entityTypeCtrl', function (lookupService,
                                               entityTypeService,
                                               entityTypes,
                                               $q,
                                               $filter,
                                               errorCode,
                                               langService,
                                               toast,
                                               contextHelpService,
                                               dialog) {
        'ngInject';
        var self = this;
        self.controllerName = 'entityTypeCtrl';
        contextHelpService.setHelpTo('entity-types');
        /**
         *@description All entity types
         */
        self.entityTypes = entityTypes;

        self.promise = null;
        self.selectedEntityTypes = [];

        self.grid = {
            limit: 5, // default limit
            page: 1, // first page
            //order: 'arName', // default sorting order
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.entityTypes.length + 21);
                    }
                }
            ]
        };
        /**
         *@description Contains methods for CRUD operations for entity types
         */
        self.statusServices = {
            'activate': entityTypeService.activateBulkEntityTypes,
            'deactivate': entityTypeService.deactivateBulkEntityTypes,
            'true': entityTypeService.activateEntityType,
            'false': entityTypeService.deactivateEntityType
        };

        /**
         * @description Opens dialog for add new entity type
         * @param $event
         */
        self.openAddEntityTypeDialog = function ($event) {
            entityTypeService
                .controllerMethod
                .entityTypeAdd($event)
                .then(function (result) {
                    self.reloadEntityTypes(self.grid.page).then(function () {
                        toast.success(langService.get('add_success').change({name: result.getNames()}));
                    });

                });
        };

        /**
         * @description Opens dialog for edit entity type
         * @param $event
         * @param entityType
         */
        self.openEditEntityTypeDialog = function (entityType, $event) {
            entityTypeService
                .controllerMethod
                .entityTypeEdit(entityType, $event)
                .then(function (result) {
                    self.reloadEntityTypes(self.grid.page).then(function () {
                        toast.success(langService.get('edit_success').change({name: result.getNames()}));
                    });
                });
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.entityTypes = $filter('orderBy')(self.entityTypes, self.grid.order);
        };

        /**
         * @description Reload the grid of entity type
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadEntityTypes = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;
            return entityTypeService
                .loadEntityTypes()
                .then(function (result) {
                    self.entityTypes = result;
                    self.selectedEntityTypes = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return result;
                });
        };

        /**
         * @description Delete single entity type
         * @param entityType
         * @param $event
         */
        self.removeEntityType = function (entityType, $event) {
            entityTypeService
                .controllerMethod
                .entityTypeDelete(entityType, $event)
                .then(function () {
                    self.reloadEntityTypes(self.grid.page);
                })
                .catch(function (error) {
                    if (!error)
                        return;
                    errorCode.checkIf(error, 'CAN_NOT_DELETE_LOOKUP', function () {
                        dialog.errorMessage(langService.get('cannot_delete_lookup').change({
                            lookup: langService.get('entity_type'),
                            used: langService.get('other_places')
                        }), null, null, $event);
                    });
                });
        };

        /**
         * @description Delete multiple selected entity types
         * @param $event
         */
        self.removeBulkEntityTypes = function ($event) {
            entityTypeService
                .controllerMethod
                .entityTypeDeleteBulk(self.selectedEntityTypes, $event)
                .then(function () {
                    self.reloadEntityTypes(self.grid.page);
                });
        };

        /**
         * @description Change the status of entity type from grid
         * @param entityType
         */
        self.changeStatusEntityType = function (entityType) {
            self.statusServices[entityType.status](entityType)
                .then(function () {
                    toast.success(langService.get('status_success'));
                })
                .catch(function () {
                    entityType.status = !entityType.status;
                    dialog.errorMessage(langService.get('something_happened_when_update_status'));
                })
        };

        /**
         * @description Change the status of selected entity types
         * @param status
         */
        self.changeStatusBulkEntityTypes = function (status) {
            self.statusServices[status](self.selectedEntityTypes).then(function () {
                self.reloadEntityTypes(self.grid.page).then(function () {
                    toast.success(langService.get('selected_status_updated'));
                });
            });
        };

    });
};