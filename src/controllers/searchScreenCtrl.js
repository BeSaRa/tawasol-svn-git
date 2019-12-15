module.exports = function (app) {
    app.controller('searchScreenCtrl', function (registryOrganizations, propertyConfigurations, approvers) {
        var self = this;
        self.controllerName = 'searchScreenCtrl';

        // to give the user the ability to collapse the accordion by clicking on it's label.
        self.labelCollapse = true;
        // all available navigation tabs for search screens
        self.searchTabs = [
            {
                langKey: 'menu_item_search_module_outgoing',
                tabKey: 'outgoing'
            },
            {
                langKey: 'menu_item_search_module_incoming',
                tabKey: 'incoming'
            },
            {
                langKey: 'menu_item_search_module_internal',
                tabKey: 'internal'
            },
            {
                langKey: 'menu_item_search_module_general',
                tabKey: 'general'
            },
            {
                langKey: 'menu_item_search_module_outgoing_incoming',
                tabKey: 'outgoingIncoming'
            }
        ];
        // current selected tab to display correct form search.
        self.selectedTabName = 'outgoing';

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
            self.selectedTabName = tab.tabKey;
        };
    });
};