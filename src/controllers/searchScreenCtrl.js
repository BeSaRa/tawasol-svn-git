module.exports = function (app) {
    app.controller('searchScreenCtrl', function (registryOrganizations, propertyConfigurations, approvers, employeeService) {
        var self = this;
        self.controllerName = 'searchScreenCtrl';
        // to give the user the ability to collapse the accordion by clicking on it's label.
        self.labelCollapse = true;
        // all available navigation tabs for search screens
        self.searchTabs = [
            {
                langKey: 'menu_item_search_module_outgoing',
                tabKey: 'outgoing',
                show: employeeService.hasPermissionTo('SEARCH_OUTGOING')
            },
            {
                langKey: 'menu_item_search_module_incoming',
                tabKey: 'incoming',
                show: employeeService.hasPermissionTo('SEARCH_INCOMING')
            },
            {
                langKey: 'menu_item_search_module_internal',
                tabKey: 'internal',
                show: employeeService.hasPermissionTo('SEARCH_INTERNAL_DOCUMENT')
            },
            {
                langKey: 'menu_item_search_module_general',
                tabKey: 'general',
                show: employeeService.hasPermissionTo('GENERAL_SEARCH')
            },
            {
                langKey: 'menu_item_search_module_outgoing_incoming',
                tabKey: 'outgoingIncoming',
                show: employeeService.getEmployee().hasThesePermissions(['SEARCH_OUTGOING', 'SEARCH_INCOMING'])
            }
        ];
        // current selected tab to display correct form search.
        self.selectedTabName = '';
        _setSelectedTabName();

        // registry organizations
        self.registryOrganizations = registryOrganizations;

        self.propertyConfigurations = propertyConfigurations;

        self.approvers = approvers;
        // all controller for available search screens
        self.searchScreens = {
            outgoing: {
                controller: {
                    selectedSearchedOutgoingDocuments: []
                }
            },
            incoming: {
                controller: {
                    selectedSearchedIncomingDocuments: []
                }
            },
            internal: {
                controller: {
                    selectedSearchedInternalDocuments: []
                }
            },
            general: {
                controller: {
                    selectedSearchedGeneralDocuments: []
                }
            },
            outgoingIncoming: {
                controller: {
                    selectedSearchedOutgoingIncomingDocuments: []
                }
            }
        };

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
            _setSelectedTabName(tab.tabKey);
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
            self.selectedTabName = tab.hasOwnProperty('tabKey') ? tab.tabKey : tab;
        }
    });
};
