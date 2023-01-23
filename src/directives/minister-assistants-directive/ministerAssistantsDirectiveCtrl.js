module.exports = function (app) {
    app.controller('ministerAssistantsDirectiveCtrl', function ($scope,
                                                                employeeService,
                                                                LangWatcher,
                                                                Information,
                                                                DistributionOUWFItem,
                                                                distributionWFService,
                                                                DistributionUserWFItem,
                                                                organizationService,
                                                                langService,
                                                                $filter,
                                                                toast,
                                                                $q,
                                                                generator,
                                                                dialog,
                                                                _) {
        'ngInject';
        var self = this;
        self.controllerName = 'ministerAssistantsDirectiveCtrl';
        LangWatcher($scope);

        self.ouSearchText = '';
        self.userSearchText = '';

        self.organizations = organizationService.organizations;
        self.selectedOrganization = null;
        self.selectedUser = null;
        self.ministerAssistants = [];
        self.selectedMinisterAssistants = [];

        self.onOrganizationChanged = function () {
            if (self.selectedOrganization) {
                return distributionWFService
                    .searchUsersByCriteria({ou: self.selectedOrganization})
                    .then(function (result) {
                        self.applicationUsers = result;
                        self.selectedUser = null;
                    });
            } else {
                self.applicationUsers = [];
            }
        }

        /**
         * @description
         */
        self.onAddMinisterAssistant = function () {
            distributionWFService.addMinistryAssistant(self.selectedOrganization, self.selectedUser)
                .then(() => {
                    toast.success(langService.get('add_success').change({name: self.selectedUser.getNames()}));
                    self.selectedUser = '';
                    self.reloadMinisterAssistants(self.grid.page);
                });
        }

        /**
         * @description remove Minister Assistant
         */
        self.removeMinisterAssistant = function (assistant, $event) {
            return dialog.confirmMessage(langService.get('confirm_delete').change({name: assistant.getNames()}))
                .then(function () {
                    distributionWFService.removeMinistryAssistant(assistant)
                        .then(result => {
                            toast.success(langService.get("remove_success"));
                            self.reloadMinisterAssistants(self.grid.page)
                        })
                });
        }

        self.applicationUserDisabled = function (user) {
            if (!user) {
                return true;
            }

            return _.some(self.ministerAssistants, (item) => {
                return self.selectedOrganization.id === item.ouId && user.id === item.userId;
            });
        }

        /**
         * @description Contains options for grid configuration
         * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
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
                        return (self.ministerAssistants.length + 21);
                    }
                }
            ]
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.ministerAssistants = $filter('orderBy')(self.ministerAssistants, self.grid.order);
        };

        self.getSortingKey = function (property, modelType) {
            return generator.getColumnSortingKey(property, modelType);
        };


        /**
         * @description Reload the grid of Ministry Assistants
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadMinisterAssistants = function (pageNumber) {
            var defer = $q.defer();
            self.grid.progress = defer.promise;
            return distributionWFService
                .loadMinisterAssistants()
                .then(function (result) {
                    self.ministerAssistants = result;
                    // self.ministerAssistantsCopy = angular.copy(self.ministerAssistants);
                    self.selectedMinisterAssistants = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return result;
                });
        };

        $scope.$watch(function () {
            return self.ministerAssistants;
        }, function (newVal) {
            if (newVal) {
                self.ministerAssistants = newVal;
            }
        });

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
    });
};
