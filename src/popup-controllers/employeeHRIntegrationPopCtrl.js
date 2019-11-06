module.exports = function (app) {
    app.controller('employeeHRIntegrationPopCtrl', function (_,
                                                             toast,
                                                             validationService,
                                                             generator,
                                                             $interval,
                                                             dialog,
                                                             managerService,
                                                             linkedEntities,
                                                             entityTypeService,
                                                             langService) {
        'ngInject';

        var self = this;
        self.controllerName = 'employeeHRIntegrationPopCtrl';

        self.criteria = null;
        self.employees = [];
        self.selectedEmployees = [];

        self.selectedTabName = "search";
        self.selectedTabIndex = 0;
        self.entityTypes = entityTypeService.getEntityTypes();
        self.linkedEntitiesCopy = angular.copy(linkedEntities);
        self.hasEmployees = _isLinkedEntitiesHasEmployee();
        self.selectedExcludedEmployeeNumbers = _.map(self.linkedEntitiesCopy, 'employeeNum');
        /**
         * @description Set the current tab name
         * @param tabName
         */
        self.setCurrentTab = function (tabName) {
            self.selectedTabName = tabName;
        };

        self.canSelectMulti = function () {
            return !!(!self.fromApplicationUser);
        };

        function _isLinkedEntitiesHasEmployee() {
            return _.some(self.linkedEntitiesCopy, function (linkedEntity) {
                return linkedEntity.typeId.lookupStrKey.toLowerCase() === 'employee';
            });
        }

        self.search = function () {
            managerService.searchForIntegratedHREmployees(self.criteria, self.attachDomainNameToModel)
                .then(function (result) {
                    if (self.hasEmployees) {
                        self.employees = _.filter(result, function (hrEmployee) {
                            return self.selectedExcludedEmployeeNumbers.indexOf(hrEmployee.employeeNum) === -1;
                        });
                    } else {
                        self.employees = result;
                    }
                    if (self.employees.length) {
                        self.selectedTabIndex = 1;
                    } else {
                        // if no result found display message.
                        dialog.infoMessage(langService.get('no_results_found_for_your_search_criteria'));
                    }
                });
        };

        self.addEmployeeLinkedEntity = function () {
            dialog.hide(self.selectedEmployees);
        };


        self.resetPopupForm = function () {
            self.criteria = null;
            self.selectedTabIndex = 0;
        };

        /**
         * @description Close the popup
         */
        self.closePopupFromCtrl = function () {
            dialog.cancel('close');
        };

        /**
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         * @type {Array}
         */
        self.grid = {
            progress: null,
            limit: 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.employees.length + 21);
                    }
                }
            ]
        };
    });
};
