module.exports = function (app) {
    app.controller('sequentialWorkflowCtrl', function ($q,
                                                       _,
                                                       generator,
                                                       langService,
                                                       toast,
                                                       dialog,
                                                       $filter,
                                                       gridService,
                                                       employeeService,
                                                       organizations,
                                                       sequentialWorkflowService) {
        'ngInject';
        var self = this;

        self.controllerName = 'sequentialWorkflowCtrl';

        self.sequentialWorkflows = [];
        self.sequentialWorkflowsCopy = angular.copy(self.sequentialWorkflows);

        self.organizations = organizations;
        self.employeeService = employeeService;
        self.employee = employeeService.getEmployee();

        self.ouSearchText = '';

        /**
         * @description Contains the selected sequential workflows
         * @type {Array}
         */
        self.selectedSequentialWorkflows = [];


        self.isActionAllowed = function (record, checkForAdd) {
            return true;
        };

        self.isBulkActionAllowed = function () {
            return true;
        };

        /**
         * @description Contains options for grid configuration
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         */
        self.grid = {
            progress: null,
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.administration.sequentialWF) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.administration.sequentialWF, self.sequentialWorkflows),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.administration.sequentialWF, limit);
            },
            searchColumns: {
                arabicName: 'arName',
                englishName: 'enName',
                documentClass: function (record) {
                    return self.getSortingKey('docClassInfo', 'Lookup');
                }
            },
            searchText: '',
            searchCallback: function (grid) {
                self.sequentialWorkflows = gridService.searchGridData(self.grid, self.sequentialWorkflowsCopy);
            }
        };

        /**
         * @description Get the sorting key
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
            self.sequentialWorkflows = $filter('orderBy')(self.sequentialWorkflows, self.grid.order);
        };
        /**
         * @description Reload the grid of sequential workflows
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadSequentialWorkflows = function (pageNumber) {
            if (!self.selectedOrganization) {
                self.sequentialWorkflows = [];
                self.sequentialWorkflowsCopy = angular.copy(self.sequentialWorkflows);
                self.selectedSequentialWorkflows = [];
                return null;
            }
            var defer = $q.defer();
            self.grid.progress = defer.promise;
            return sequentialWorkflowService.loadSequentialWorkflowsByRegOu(self.selectedOrganization)
                .then(function (result) {
                    self.sequentialWorkflows = result;
                    self.sequentialWorkflowsCopy = angular.copy(self.sequentialWorkflows);
                    self.selectedSequentialWorkflows = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return result;
                })
        };

        self.regOuChanged = function ($event) {
            self.reloadSequentialWorkflows();
        };

        /**
         * @description Contains methods for CRUD operations for sequential workflows
         */
        self.statusServices = {
            'activate': sequentialWorkflowService.activateBulkSequentialWorkflows,
            'deactivate': sequentialWorkflowService.deactivateBulkSequentialWorkflows,
            'true': sequentialWorkflowService.activateSequentialWorkflow,
            'false': sequentialWorkflowService.deactivateSequentialWorkflow
        };

        /**
         * @description Opens dialog for add new sequential workflow
         * @param $event
         */
        self.openAddSequentialWorkflowDialog = function ($event) {
            if (!employeeService.hasPermissionTo('ADD_SEQ_WF')) {
                return;
            }
            if (!self.selectedOrganization) {
                toast.info(langService.get('please_select_record').change({name: langService.get('organization')}));
                return;
            }
            sequentialWorkflowService
                .controllerMethod
                .sequentialWorkflowAdd(self.selectedOrganization, null, $event)
                .then(function (result) {
                    self.reloadSequentialWorkflows(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('add_success').change({name: result.getNames()}));
                        });
                })
                .catch(function () {
                    self.reloadSequentialWorkflows(self.grid.page);
                });
        };

        /**
         * @description Opens dialog for edit sequential workflow
         * @param $event
         * @param {SequentialWF} sequentialWorkflow
         */
        self.openEditSequentialWorkflowDialog = function (sequentialWorkflow, $event) {
            if (!employeeService.hasPermissionTo('ADD_SEQ_WF')) {
                return;
            }
            sequentialWorkflowService
                .controllerMethod
                .sequentialWorkflowEdit(sequentialWorkflow, $event)
                .then(function (result) {
                    self.reloadSequentialWorkflows(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('edit_success').change({name: result.getNames()}));
                        });
                });
        };

        /**
         * @description Opens dialog for adding a copy sequential workflow
         * @param $event
         * @param {SequentialWF} sequentialWorkflow
         */
        self.openCopyDialog = function (sequentialWorkflow, $event) {
            if (!employeeService.hasPermissionTo('ADD_SEQ_WF')) {
                return;
            }
            if (!self.selectedOrganization) {
                toast.info(langService.get('please_select_record').change({name: langService.get('organization')}));
                return;
            }
            sequentialWorkflowService
                .controllerMethod
                .sequentialWorkflowCopy($event, angular.copy(sequentialWorkflow), self.selectedOrganization, false, false, true)
                .then(function (result) {
                    self.reloadSequentialWorkflows(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('add_success').change({name: result.getNames()}));
                        });
                });
        };

        /**
         * @description Change the status of sequential workflow
         * @param sequentialWorkflow
         */
        self.changeStatusSequentialWorkflow = function (sequentialWorkflow) {
            if (!employeeService.hasPermissionTo('ADD_SEQ_WF')) {
                return;
            }
            if (!self.isActionAllowed(sequentialWorkflow)) {
                sequentialWorkflow.status = !sequentialWorkflow.status;
                return false;
            }
            self.statusServices[sequentialWorkflow.status](sequentialWorkflow)
                .then(function () {
                    toast.success(langService.get('status_success'));
                })
                .catch(function () {
                    sequentialWorkflow.status = !sequentialWorkflow.status;
                    dialog.errorMessage(langService.get('something_happened_when_update_status'));
                })
        };

        /**
         * @description Change the status of selected sequential workflows
         * @param status
         */
        self.changeStatusBulkSequentialWorkflows = function (status) {
            if (!employeeService.hasPermissionTo('ADD_SEQ_WF')) {
                return;
            }
            if (!self.isBulkActionAllowed()) {
                return false;
            }
            self.statusServices[status](self.selectedSequentialWorkflows)
                .then(function () {
                    self.reloadSequentialWorkflows(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('selected_status_updated'));
                        });
                });
        };

        /**
         * @description Delete single sequential workflow
         * @param sequentialWorkflow
         * @param $event
         */
        self.removeSequentialWorkflow = function (sequentialWorkflow, $event) {
            if (!employeeService.hasPermissionTo('ADD_SEQ_WF')) {
                return;
            }
            if (!self.isActionAllowed(sequentialWorkflow)) {
                return false;
            }
            sequentialWorkflowService
                .controllerMethod
                .sequentialWorkflowDelete(sequentialWorkflow, $event)
                .then(function () {
                    return self.reloadSequentialWorkflows(self.grid.page);
                });
        };

        /**
         * @description Delete multiple selected sequential workflows
         * @param $event
         */
        self.removeBulkSequentialWorkflows = function ($event) {
            if (!employeeService.hasPermissionTo('ADD_SEQ_WF')) {
                return;
            }
            if (!self.isBulkActionAllowed()) {
                return false;
            }
            sequentialWorkflowService
                .controllerMethod
                .sequentialWorkflowDeleteBulk(self.selectedSequentialWorkflows, $event)
                .then(function () {
                    self.reloadSequentialWorkflows(self.grid.page);
                });
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
            self.selectedOrganization = self.employee.isInDepartment() ? self.employee.getRegistryOUID() : null;

            if (self.selectedOrganization && (_.find(organizations, {'id': self.selectedOrganization}))) {
                self.reloadSequentialWorkflows(self.grid.page);
            }
        };

    });
};
