module.exports = function (app) {
    app.controller('selectOrganizationPopCtrl', function (organizationService, langService, exclude, dialog, label, _) {
        var self = this;
        self.controllerName = 'selectOrganizationPopCtrl';
        // list of organizations from organization service
        self.organizations = organizationService.organizations;
        // to check if user make any actions
        self.hasChanges = false;
        // current selected organization
        self.selectedOrganization = null;
        // selected organizations from grid
        self.selectedOrganizations = [];
        // all organizations in the grid
        self.gridOrganizations = [];
        // label
        self.label = label || false;
        /**
         * @description to add organization to the gird.
         */
        self.addOrganizationToGrid = function () {
            // change the hasChanges to true to enable the save button.
            self.hasChanges = true;
            // push the selected organization to the grid
            self.gridOrganizations.push(self.selectedOrganization);
            // return back again the selected organization to null to disable the add button
            self.selectedOrganization = null;
        };
        /**
         * to check if the given organization in the grid
         * @param organization
         */
        self.existsInGrid = function (organization) {
            var id = organization.id;
            return _.find(self.gridOrganizations, function (organization) {
                return id === organization.id;
            });
        };
        /**
         * remove organization from grid
         * @param organization
         */
        self.removeOrganizationFromGrid = function (organization) {
            self.selectedOrganizations = [];
            var id = organization.id;
            self.gridOrganizations = _.filter(self.gridOrganizations, function (organization) {
                return id !== organization.id;
            });
            self.checkHasChanges();
        };
        /**
         * remove multi select organizations from the grid.
         */
        self.removeSelectedOrganizationsFromGrid = function () {
            var organizationsIds = _.map(self.selectedOrganizations, 'id');
            self.gridOrganizations = _.filter(self.gridOrganizations, function (organization) {
                return organizationsIds.indexOf(organization.id) === -1;
            });
            self.selectedOrganizations = [];
            self.checkHasChanges();
        };
        /**
         * check has changes .
         */
        self.checkHasChanges = function () {
            self.hasChanges = self.gridOrganizations.length;
            return self.hasChanges;
        };
        /**
         * close dialog
         */
        self.closeDialog = function () {
            if (!self.checkHasChanges()) {
                dialog.cancel();
                return;
            }
            // check if the user need to save the changes or not.
            dialog
                .confirmMessage(langService.get('sure_you_leave_without_save_changes'))
                .then(function () {
                    self.saveSelectedOrganizations();
                });
        };
        /**
         * resolve the promise with the selected organizations
         */
        self.saveSelectedOrganizations = function () {
            dialog.hide(self.gridOrganizations);
        }

    });
};