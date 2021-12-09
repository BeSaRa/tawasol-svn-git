module.exports = function (app) {
    app.controller('organizationWithoutRegTreeViewDirectiveCtrl', function (lookupService,
                                                                            $q,
                                                                            $scope,
                                                                            langService,
                                                                            ouApplicationUserService,
                                                                            toast,
                                                                            dialog) {
        'ngInject';
        var self = this;

        self.controllerName = 'organizationWithoutRegTreeViewDirectiveCtrl';
        self.currentLang = langService.current;
        self.selectedOrganizations = [];

        /**
         * @description Toggles the child nodes on click of parent node
         * @param selectedNode
         */
        self.toggleChildNodes = function (selectedNode) {
            selectedNode.collapsed = !selectedNode.collapsed;
        };
        /**
         * @description add/remove organizations in array on click of checkbox
         * @param node
         */
        self.addOrganization = function (node) {
            var isOUExist = _.filter(self.selectedOrganizations, function (organization) {
                return organization.id === node.id;
            })[0];
            if (isOUExist) {
                var indexOfOU = _.findIndex(self.selectedOrganizations, function (organization) {
                    return organization.id === isOUExist.id;
                });
                self.selectedOrganizations.splice(indexOfOU, 1);
            } else {
                self.selectedOrganizations.push(node);
            }
        };
        /**
         * @description select/Unselect checkbox in treeview based on OU
         * @param node
         * @returns {boolean}
         */
        self.selectCheckbox = function (node) {
            var isOUExist = _.filter(self.selectedOrganizations, function (organization) {
                return organization.id === node.id;
            })[0];
            return !!isOUExist;
        };

        /**
         * @description Highlight the selected node
         * @param selectedNode
         */
        self.selectCurrentNode = function (selectedNode) {
            /*if (selectedNode.id === self.selectedNode)
                self.selectedNode = null;
            else*/
            self.selectedNode = selectedNode.id;

            self.getUsersForOrganization(selectedNode);
        };
        /**
         * @description get users for selected organization from tree
         */
        self.getUsersForOrganization = function (selectedOrganization) {
            ouApplicationUserService.loadRelatedOUApplicationUsers(selectedOrganization).then(function (result) {
                self.ouApplicationUsers = result;
            });
        }

        /*self.filterOrganizationTree = function (node) {
            if (!self.selectedFilterOrganization || !self.selectedFilterOrganization.id)
                return true;
            return (self.selectedFilterOrganization.id === node.id) || (self.selectedFilterOrganization.parent === node.id);
        }*/

    });
};