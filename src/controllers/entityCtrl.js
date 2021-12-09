module.exports = function (app) {
    app.controller('entityCtrl', function (lookupService,
                                           entityService,
                                           entities,
                                           rootEntity,
                                           $q,
                                           $filter,
                                           langService,
                                           toast,
                                           dialog,
                                           authenticationService,
                                           employeeService,
                                           $state,
                                           contextHelpService,
                                           gridService) {
        'ngInject';
        var self = this;
        self.controllerName = 'entityCtrl';

        contextHelpService.setHelpTo('entities');
        self.employeeService = employeeService;

        /**
         * @description All entities
         * @type {*}
         */
        self.entities = entities;
        self.entitiesCopy = angular.copy(self.entities);

        /**
         * @description Contains the selected entities
         * @type {Array}
         */
        self.selectedEntities = [];

        /**
         * @description Contains options for grid configuration
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         */
        self.grid = {
            progress: null,
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.administration.entity) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.administration.entity, self.entities),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.administration.entity, limit);
            },
            searchColumns: {
                identifier: 'identifier',
                arabicName: 'arName',
                englishName: 'enName',
                appArabicName: 'appArName',
                appEnglishName: 'appEnName'
            },
            searchText: '',
            searchCallback: function (grid) {
                self.entities = gridService.searchGridData(self.grid, self.entitiesCopy);
            }
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
                .catch(function (error) {
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
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.entities = $filter('orderBy')(self.entities, self.grid.order);
        };

        /**
         * @description Reload the grid of entity
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadEntities = function (pageNumber) {
            var defer = $q.defer();
            self.grid.progress = defer.promise;
            return entityService
                .loadEntities()
                .then(function (result) {
                    self.entities = result;
                    self.entitiesCopy = angular.copy(self.entities);
                    self.selectedEntities = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
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

        self.isCurrentRootEntity = function (entity) {
            return rootEntity.getRootEntityIdentifier() === entity.identifier;
        };

        /**
         * @description Change the status of entity
         * @param entity
         */
        self.changeStatusEntity = function (entity) {
            if (self.isCurrentRootEntity(entity)) {
                toast.info(langService.get('can_not_disable_logged_in_entity'));
                entity.status = !entity.status;
                return false;
            }
            self.statusServices[entity.status](entity)
                .then(function () {
                    toast.success(langService.get('status_success'));
                })
                .catch(function () {
                    entity.status = !entity.status;
                    dialog.errorMessage(langService.get('something_happened_when_update_status'));
                })
        };

        var _changeBulkStatus = function (entities, status) {
            self.statusServices[status](entities).then(function () {
                self.reloadEntities(self.grid.page).then(function () {
                    toast.success(langService.get('selected_status_updated'));
                });
            });
        };

        /**
         * @description Change the status of selected entities
         * @param status
         */
        self.changeStatusBulkEntities = function (status) {
            var isCurrentEntitySelected = _.find(self.selectedEntities, function (entity) {
                return self.isCurrentRootEntity(entity);
            });
            if (isCurrentEntitySelected) {
                if (self.selectedEntities.length === 1) {
                    toast.info(langService.get('can_not_disable_logged_in_entity'));
                    return;
                }
                else {
                    dialog.confirmMessage(langService.get('current_entity_selected_skip_and_continue'))
                        .then(function () {
                            var entities = _.filter(self.selectedEntities, function (entity) {
                                return !self.isCurrentRootEntity(entity)
                            });
                            _changeBulkStatus(entities, status);
                        });
                }
            }
            else {
                _changeBulkStatus(self.selectedEntities, status);
            }
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
