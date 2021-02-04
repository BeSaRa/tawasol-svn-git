module.exports = function (app) {
    app.controller('searchScreenCtrl', function (registryOrganizations,
                                                 propertyConfigurations,
                                                 approvers,
                                                 availableRegistryOrganizations,
                                                 organizationService,
                                                 $scope,
                                                 $compile,
                                                 generator,
                                                 $q,
                                                 $timeout,
                                                 employeeService,
                                                 emailItem) {
        var self = this;
        self.controllerName = 'searchScreenCtrl';
        // to give the user the ability to collapse the accordion by clicking on it's label.
        self.labelCollapse = true;
        self.emailItem = emailItem;
        // all available navigation tabs for search screens
        self.searchTabs = [
            {
                langKey: 'menu_item_search_module_general',
                tabKey: 'general',
                show: employeeService.hasPermissionTo('GENERAL_SEARCH'),
                resultKey: 'searchedGeneralDocuments'
            },
            {
                langKey: 'menu_item_search_module_outgoing',
                tabKey: 'outgoing',
                show: employeeService.hasPermissionTo('SEARCH_OUTGOING'),
                resultKey: 'searchedOutgoingDocuments'
            },
            {
                langKey: 'menu_item_search_module_incoming',
                tabKey: 'incoming',
                show: employeeService.hasPermissionTo('SEARCH_INCOMING'),
                resultKey: 'searchedIncomingDocuments'
            },
            {
                langKey: 'menu_item_search_module_internal',
                tabKey: 'internal',
                show: employeeService.hasPermissionTo('SEARCH_INTERNAL_DOCUMENT'),
                resultKey: 'searchedInternalDocuments'
            },
            {
                langKey: 'menu_item_search_module_outgoing_incoming',
                tabKey: 'outgoingIncoming',
                show: employeeService.getEmployee().hasThesePermissions(['SEARCH_OUTGOING', 'SEARCH_INCOMING']),
                resultKey: 'searchedOutgoingIncomingDocuments'
            }
        ];
        // current selected tab to display correct form search.
        self.selectedTabName = '';

        self.searchForms = {
            general: '',
            outgoing: '',
            incoming: '',
            internal: '',
            outgoingIncoming: ''
        };
        self.renderdTabs = {};
        // selected
        self.selectedTabResultKey = '';
        // registry organizations
        self.registryOrganizations = registryOrganizations;
        // all property configurations
        self.propertyConfigurations = propertyConfigurations;
        // the approvers for (outgoing , internal ) documents
        self.approvers = approvers;
        // all controller for available search screens
        self.creators = angular.copy(approvers);

        self.availableRegistryOrganizations = availableRegistryOrganizations;

        self.searchScreens = {
            outgoing: {
                controller: {
                    selectedSearchedOutgoingDocuments: [],
                    searchedOutgoingDocuments: []
                }
            },
            incoming: {
                controller: {
                    selectedSearchedIncomingDocuments: [],
                    searchedIncomingDocuments: []
                }
            },
            internal: {
                controller: {
                    selectedSearchedInternalDocuments: [],
                    searchedInternalDocuments: []
                }
            },
            general: {
                controller: {
                    selectedSearchedGeneralDocuments: [],
                    searchedGeneralDocuments: []
                }
            },
            outgoingIncoming: {
                controller: {
                    selectedSearchedOutgoingIncomingDocuments: [],
                    searchedOutgoingIncomingDocuments: []
                }
            }
        };

        self.organizations = [];

        self.employee = employeeService.getEmployee();
        /**
         * @description Reloads the current tab result data
         */
        self.reloadCurrentSearch = function () {
            self.searchScreens[self.selectedTabName].controller.reloadSearchCorrespondence()
                .then(function () {
                  //  console.log('Reloaded Complete ', self.selectedTabName);
                });
        };
        /**
         * @description used to change selected tab after user click on one of navigation tabs.
         * @param tab
         * @param $event
         */
        self.onTabClicked = function (tab, $event) {
            $event.preventDefault();
            _setSelectedTabName(tab);
        };

        /**
         * @description Sets the selected tab name
         * @param tab
         * @private
         */
        function _setSelectedTabName(tab) {
            if (!tab) {
                for (var i = 0; i < self.searchTabs.length; i++) {
                    if (self.searchTabs[i].show) {
                        tab = self.searchTabs[i];
                        break;
                    }
                }
            }
            self.selectedTabResultKey = tab.resultKey;
            self.selectedTabName = tab.tabKey;
            generator.selectedSearchCtrl = self.searchScreens[tab.tabKey];
            return self.renderSelectedTab(self.selectedTabName);
        }

        /**
         * @description check if print button for current tab should display or not.
         * @returns {boolean}
         */
        self.isShowButton = function () {
            return self.selectedTabName && self.searchScreens[self.selectedTabName].controller[self.selectedTabResultKey].length > 0;
        };
        /**
         * @description Prints the current tab result data
         */
        self.print = function () {
            self.searchScreens[self.selectedTabName].controller.printResult();
        };

        self.loadSubOrganizationsToAllScreens = function () {
            // load children organizations by selected regOUId
            return organizationService
                .loadChildrenOrganizations(self.employee.getRegistryOUID())
                .then(function (organizations) {
                    var organizationsIdList = _.map(organizations, 'id');
                    // the use logged in with reg ou
                    if (self.employee.isInDepartment()) {
                        organizationsIdList.indexOf(self.employee.getOUID()) === -1 && organizations.unshift(angular.copy(self.employee.userOrganization));
                    } else {
                        organizationsIdList.indexOf(self.employee.getRegistryOUID()) === -1 && organizations.unshift(organizationService.getOrganizationById(self.employee.getRegistryOUID(), true));
                    }
                    self.organizations = organizations;
                    return self.organizations;
                });
        };
        self.$onInit = function () {
            self.loadSubOrganizationsToAllScreens().then(function () {
                self.compileSearchScreenDirectives();
                var selectedTab = self.emailItem ? (self.searchTabs.find(item => {
                    return item.tabKey === self.emailItem.getInfo().documentClass;
                })) : null;

                _setSelectedTabName(selectedTab).then(function (actions) {
                    var actionMenu = actions.find((action) => {
                        return action.text === 'grid_action_view';
                    });

                    if (actionMenu && self.emailItem) {
                        actionMenu.callback(self.emailItem);
                    }
                });
            });
        };

        self.compileSearchScreenDirectives = function () {
            self.searchForms.outgoing = '<search-outgoing-screen-directive\n' +
                '                                    controller="ctrl.searchScreens.outgoing"\n' +
                '                                    ous="ctrl.organizations"\n' +
                '                                    available-registry-organizations="ctrl.availableRegistryOrganizations"\n' +
                '                                    approvers="ctrl.approvers"\n' +
                '                                    creators="ctrl.creators"\n' +
                '                                    ng-show="ctrl.selectedTabName === \'outgoing\'"\n' +
                '                                    registry-organizations="ctrl.registryOrganizations"\n' +
                '                                    property-configurations="ctrl.propertyConfigurations.Outgoing"\n' +
                '                                    label-collapse="ctrl.labelCollapse">\n' +
                '                            </search-outgoing-screen-directive>';

            self.searchForms.internal = '<search-internal-screen-directive\n' +
                '                                    controller="ctrl.searchScreens.internal"\n' +
                '                                    ous="ctrl.organizations"\n' +
                '                                    approvers="ctrl.approvers"\n' +
                '                                    creators="ctrl.creators"\n' +
                '                                    ng-show="ctrl.selectedTabName === \'internal\'"\n' +
                '                                    registry-organizations="ctrl.registryOrganizations"\n' +
                '                                    property-configurations="ctrl.propertyConfigurations.Internal"\n' +
                '                                    label-collapse="ctrl.labelCollapse">\n' +
                '                            </search-internal-screen-directive>';

            self.searchForms.incoming = '<search-incoming-screen-directive\n' +
                '                                    controller="ctrl.searchScreens.incoming"\n' +
                '                                    ous="ctrl.organizations"\n' +
                '                                    creators="ctrl.creators"\n' +
                '                                    available-registry-organizations="ctrl.availableRegistryOrganizations"\n' +
                '                                    ng-show="ctrl.selectedTabName === \'incoming\'"\n' +
                '                                    registry-organizations="ctrl.registryOrganizations"\n' +
                '                                    property-configurations="ctrl.propertyConfigurations.Incoming"\n' +
                '                                    label-collapse="ctrl.labelCollapse">\n' +
                '                            </search-incoming-screen-directive>';

            self.searchForms.outgoingIncoming = '<search-outgoing-incoming-screen-directive\n' +
                '                                    controller="ctrl.searchScreens.outgoingIncoming"\n' +
                '                                    ous="ctrl.organizations"\n' +
                '                                    creators="ctrl.creators"\n' +
                '                                    available-registry-organizations="ctrl.availableRegistryOrganizations"\n' +
                '                                    ng-show="ctrl.selectedTabName === \'outgoingIncoming\'"\n' +
                '                                    registry-organizations="ctrl.registryOrganizations"\n' +
                '                                    property-configurations="ctrl.propertyConfigurations.OutgoingIncoming"\n' +
                '                                    label-collapse="ctrl.labelCollapse">\n' +
                '                            </search-outgoing-incoming-screen-directive>';

            self.searchForms.general = '<search-general-screen-directive\n' +
                '                                    controller="ctrl.searchScreens.general"\n' +
                '                                    ous="ctrl.organizations"\n' +
                '                                    creators="ctrl.creators"\n' +
                '                                    ng-show="ctrl.selectedTabName === \'general\'"\n' +
                '                                    registry-organizations="ctrl.registryOrganizations"\n' +
                '                                    property-configurations="ctrl.propertyConfigurations.Correspondence"\n' +
                '                                    label-collapse="ctrl.labelCollapse">\n' +
                '                            </search-general-screen-directive>';
            return $q.resolve(true);
        };

        self.renderSelectedTab = function (tab) {
            var defer = $q.defer()
            if (!self.renderdTabs.hasOwnProperty(tab)) {
                self.renderdTabs[tab] = true;
                angular.element('#search-container').append($compile(self.searchForms[tab])($scope));
                $timeout(function () {
                    defer.resolve(self.searchScreens[tab].controller.gridActions);
                }, 1000);
            } else {
                defer.reject();
            }

            return defer.promise;
        }
    });
};
