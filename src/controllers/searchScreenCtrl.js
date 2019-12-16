module.exports = function (app) {
    app.controller('searchScreenCtrl', function (registryOrganizations,
                                                 propertyConfigurations,
                                                 approvers,
                                                 employeeService) {
        var self = this;
        self.controllerName = 'searchScreenCtrl';
        // to give the user the ability to collapse the accordion by clicking on it's label.
        self.labelCollapse = true;
        // all available navigation tabs for search screens
        self.searchTabs = [
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
                langKey: 'menu_item_search_module_general',
                tabKey: 'general',
                show: employeeService.hasPermissionTo('GENERAL_SEARCH'),
                resultKey: 'searchedGeneralDocuments'
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
        self.selectedTabResultKey = '';
        _setSelectedTabName();

        // registry organizations
        self.registryOrganizations = registryOrganizations;

        self.propertyConfigurations = propertyConfigurations;

        self.approvers = approvers;
        // all controller for available search screens
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

        /**
         * @description Reloads the current tab result data
         */
        self.reloadCurrentSearch = function () {
            self.searchScreens[self.selectedTabName].controller.reloadSearchCorrespondence()
                .then(function () {
                    console.log('Reloaded Complete ', self.selectedTabName);
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
        }

        self.isShowPrintButton = function () {
            return self.searchScreens[self.selectedTabName].controller[self.selectedTabResultKey].length > 0;
        };

        /**
         * @description Prints the current tab result data
         * @param $event
         */
        self.print = function ($event) {
            self.searchScreens[self.selectedTabName].controller.printResult();

        };
    });
};
