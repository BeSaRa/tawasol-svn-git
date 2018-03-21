module.exports = function (app) {
    app.controller('entityCtrl', function (lookupService,
                                           entityService,
                                           entities,
                                           $q,
                                           langService,
                                           toast,
                                           dialog,
                                           authenticationService,
                                           employeeService,
                                           $state,
                                           contextHelpService) {
        'ngInject';
        var self = this;
        self.controllerName = 'entityCtrl';

        self.progress = null;

        contextHelpService.setHelpTo('entities');

        /**
         * @description All entities
         * @type {*}
         */
        self.entities = entities;

        /**
         * @description Contains the selected entities
         * @type {Array}
         */
        self.selectedEntities = [];

        /**
         * @description Contains options for grid configuration
         * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
         */
        self.grid = {
            limit: 5, // default limit
            page: 1, // first page
            //order: 'identifier', // default sorting order
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.entities.length + 21);
                    }
                }
            ]
        };

        /**
         * @description Contains methods for CRUD operations for entities
         */
        self.statusServices = {
            'activate': entityService.activateBulkEntities,
            'deactivate': entityService.deactivateBulkEntities,
            'true': entityService.activateEntity,
            'false': entityService.deactivateEntity
        };

        /**
         * @description Opens dialog for add new entity
         * @param $event
         */
        self.openAddEntityDialog = function ($event) {
            entityService
                .controllerMethod
                .entityAdd($event)
                .then(function (result) {
                    self.reloadEntities(self.grid.page).then(function () {
                        toast.success(langService.get('add_success').change({name: result.getNames()}));
                    });
                })
                .catch(function(error){
                })
        };

        /**
         * @description Opens dialog for edit entity
         * @param $event
         * @param entity
         */
        self.openEditEntityDialog = function (entity, $event) {
            entityService
                .controllerMethod
                .entityEdit(entity, $event)
                .then(function (result) {
                    self.reloadEntities(self.grid.page).then(function () {
                        toast.success(langService.get('edit_success').change({name: result.getNames()}));
                    });
                })
                .catch(function (error) {
                });
        };

        /**
         * @description Reload the grid of entity
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadEntities = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;
            return entityService
                .loadEntities()
                .then(function (result) {
                    self.entities = result;
                    self.selectedEntities = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    return result;
                });
        };

        /**
         * @description Delete single entity
         * @param entity
         * @param $event
         */
        self.removeEntity = function (entity, $event) {
            entityService
                .controllerMethod
                .entityDelete(entity, $event)
                .then(function () {
                    self.reloadEntities(self.grid.page);
                });
        };

        /**
         * @description Delete multiple selected entities
         * @param $event
         */
        self.removeBulkEntities = function ($event) {
            entityService
                .controllerMethod
                .entityDeleteBulk(self.selectedEntities, $event)
                .then(function () {
                    self.reloadEntities(self.grid.page);
                });
        };

        /**
         * @description Change the status of entity
         * @param entity
         */
        self.changeStatusEntity = function (entity) {
            self.statusServices[entity.status](entity)
                .then(function () {
                    toast.success(langService.get('status_success'));
                })
                .catch(function () {
                    entity.status = !entity.status;
                    dialog.errorMessage(langService.get('something_happened_when_update_status'));
                })
        };

        /**
         * @description Change the status of selected entities
         * @param status
         */
        self.changeStatusBulkEntities = function (status) {
            self.statusServices[status](self.selectedEntities).then(function () {
                self.reloadEntities(self.grid.page).then(function () {
                    toast.success(langService.get('selected_status_updated'));
                });
            });
        };

        /**
         * @description Opens the global setting for the given entity
         * @param entity
         */
        self.openGlobalSetting = function (entity) {
            $state.go('app.administration.entity-global-settings', {entityId: entity.id});
        };
    });
};