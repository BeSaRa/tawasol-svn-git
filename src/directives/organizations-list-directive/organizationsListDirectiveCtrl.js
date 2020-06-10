module.exports = function (app) {
    app.controller('organizationsListDirectiveCtrl', function (organizationService,
                                                               gridService,
                                                               generator,
                                                               $filter,
                                                               $timeout,
                                                               $scope,
                                                               langService,
                                                               LangWatcher,
                                                               $q,
                                                               _,
                                                               rootEntity,
                                                               Entity,
                                                               toast,
                                                               employeeService,
                                                               dialog) {
        'ngInject';
        var self = this,
            columnSearchCriteria = {
                ouName: '',
                parent: '',
                hasRegistry: null,
                centralArchive: null,
                isPrivateRegistry: null,
                status: null,
                manageable: true
            };
        self.controllerName = 'organizationsListDirectiveCtrl';
        // watch the language for any changes from current user.
        LangWatcher($scope);

        self.rootEntity = new Entity(rootEntity.returnRootEntity().rootEntity);

        self.selectedOrganizations = [];

        self.grid = {
            progress: null,
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.administration.organization) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.administration.organization, self.organizationsList),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.administration.organization, limit);
            },
            searchColumns: {
                arabicName: 'arName',
                englishName: 'enName',
                parent: function (record) {
                    return self.getSortingKey('parentOrReportingToInfo', 'Organization');
                }
            },
            searchText: '',
            searchCallback: function (grid) {
                self.organizationsList = gridService.searchGridData(self.grid, self.organizationsListCopy);
            },
            columnSearchCriteria: angular.copy(columnSearchCriteria),
            columnSearchCallback: function () {
                self.organizationsList = _searchByColumns();
            }
        };

        self.hasRegistryOptions = [
            {id: null, key: 'all', value: null},
            {id: 1, key: 'yes', value: true},
            {id: 2, key: 'no', value: false}
        ];

        self.hasPrivateRegistryOptions = [
            {id: null, key: 'all', value: null},
            {id: 1, key: 'yes', value: true},
            {id: 2, key: 'no', value: false}
        ];

        self.centralArchiveOptions = [
            {id: null, key: 'all', value: null},
            {id: 1, key: 'yes', value: true},
            {id: 2, key: 'no', value: false}
        ];

        self.statusOptions = [
            {id: null, key: 'all', value: null},
            {id: 1, key: 'active', value: true},
            {id: 2, key: 'inactive', value: false}
        ];


        /**
         *@description Contains methods for CRUD operations for organizations
         */
        self.statusServices = {
            'true': organizationService.activateOrganization,
            'false': organizationService.deactivateOrganization
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
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.organizationsList = $filter('orderBy')(self.organizationsList, self.grid.order);
        };

        self.reloadOrganizations = function (ignoreLoadOrganizations, pageNumber) {
            var defer = $q.defer();
            self.grid.progress = defer.promise;

            self.reloadCallback(ignoreLoadOrganizations || false)
                .then(function (result) {
                    self.organizationsList = _filterManageable(result);
                    self.organizationsListCopy = angular.copy(self.organizationsList);
                    self.selectedOrganizations = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.grid.order = '';
                    self.getSortedData();
                    _getAllParentIds();
                    $timeout(function () {
                        self.grid.columnSearchCallback();
                    })
                })
        };

        /**
         * @description Opens the add organization popup
         * @param organization
         * @param $event
         */
        self.openAddOrganizationDialog = function (organization, $event) {
            organizationService
                .controllerMethod
                .organizationAdd(organization, $event)
                .finally(function () {
                    self.reloadOrganizations(false);
                })
                .catch(function () {
                    self.reloadOrganizations(false);
                });
        };

        /**
         * @description Opens the edit organization popup
         * @param organization
         * @param $event
         */
        self.openEditOrganizationDialog = function (organization, $event) {
            organizationService
                .controllerMethod
                .organizationEdit(organization, $event)
                .then(function () {
                    self.reloadOrganizations(false);
                })
                .catch(function () {
                    self.reloadOrganizations(false);
                })
        };

        /**
         * @description Change the status of organization
         * @param organization
         * @param $event
         * @returns {boolean}
         */
        self.changeOrganizationStatus = function (organization, $event) {
            if (employeeService.getEmployee().getOUID() === organization.id) {
                organization.status = !organization.status;
                return false;
            }
            dialog.confirmMessage(langService.get('confirm_change_affect_whole_system'))
                .then(function () {
                    self.statusServices[organization.status](organization)
                        .then(function () {
                            toast.success(langService.get('status_success'));
                        })
                        .catch(function () {
                            organization.status = !organization.status;
                            dialog.errorMessage(langService.get('something_happened_when_update_status'));
                        });
                })
                .catch(function () {
                    organization.status = !organization.status;
                });
        };

        /**
         * @description Shows the children of given organization
         * @param organization
         * @param $event
         */
        self.openChildrenDialog = function (organization, $event) {
            if (!self.isOuHasChildren(organization)) {
                toast.info(langService.get('no_records_found'));
                return;
            }

            organizationService
                .controllerMethod
                .organizationEdit(organization, $event, 'children')
                .then(function () {
                    self.reloadOrganizations(false);
                })
                .catch(function () {
                    self.reloadOrganizations(false);
                })
        };

        self.isOuHasChildren = function (ou) {
            return self.parentIds.indexOf(ou.hasOwnProperty('id') ? ou.id : ou) > -1;
        };

        function _getAllParentIds() {
            self.parentIds = [];
            var parentId = null;
            _.map(self.organizationsListCopy, function (ou) {
                if (ou.parent) {
                    parentId = ou.parent.hasOwnProperty('id') ? ou.parent.id : ou.parent;
                    if (self.parentIds.indexOf(parentId) === -1) {
                        self.parentIds.push(parentId);
                    }
                }
                return ou;
            })
        }

        function _isValidSearchText(searchText) {
            return typeof searchText !== 'undefined' && searchText !== null && searchText !== '';
        }

        function _getFinalSearchCriteria() {
            var criteria = angular.copy(self.grid.columnSearchCriteria), searchText = '';
            for (var columnName in criteria) {
                searchText = angular.copy(criteria[columnName]);
                if (!_isValidSearchText(searchText)) {
                    delete criteria[columnName];
                } else {
                    if (columnName === 'ouName') {
                        criteria[langService.current + 'Name'] = searchText;
                        delete criteria[columnName];
                    } else if (columnName === 'parent') {
                        criteria['parentOrReportingToInfo'] = {};
                        criteria['parentOrReportingToInfo'][langService.current + 'Name'] = searchText;
                        delete criteria[columnName];
                    }
                }
            }
            return criteria;
        }

        function _searchByColumns() {
            var criteria = _getFinalSearchCriteria();
            if (Object.keys(criteria).length === 0) {
                return self.organizationsListCopy;
            }

            return $filter('filter')(self.organizationsListCopy, criteria);
        }

        self.resetViewGrid = function () {
            // set grid defaults and clear search
            self.grid.order = '';
            self.grid.page = 1;
            self.grid.columnSearchCriteria = angular.copy(columnSearchCriteria);
            self.grid.columnSearchCallback();
            self.getSortedData();
        };

        /**
         * @description Filters the manageable organizations
         * @param organizations
         * @returns {Array}
         * @private
         */
        var _filterManageable = function (organizations) {
            return _.filter(angular.copy(organizations), 'manageable');
        };

        self.$onInit = function () {
            self.organizationsList = _filterManageable(self.organizationsList);
            self.organizationsListCopy = angular.copy(self.organizationsList);
            _getAllParentIds();
        };

    });
};
