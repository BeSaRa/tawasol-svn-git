module.exports = function (app) {
    app.controller('privateRegistryOUPopCtrl', function (dialog, registryOrganizations, toast, langService, organizationService) {
        'ngInject';
        var self = this;
        self.controllerName = 'privateRegistryOUPopCtrl';

        self.allRegOus = registryOrganizations;
        self.selectedPrivateRegOus = [];

        self.privateRegOusGrid = [];
        self.selectedPrivateRegOusGrid = [];
        self.excludedPrivateRegOU = _.map(self.excludedPrivateRegOU, 'ouid');

        /**
         * @description add private registry Ous
         * @param $event
         */
        self.addPrivateRegistryOUs = function ($event) {
            self.privateRegOusGrid = self.privateRegOusGrid.concat(self.selectedPrivateRegOus);
            self.excludedPrivateRegOU = self.excludedPrivateRegOU.concat(_.map(self.privateRegOusGrid, 'id'));
            self.selectedPrivateRegOus = [];
        };

        /**
         *@description save private registry Ous
         * @param $event
         */
        self.savePrivateRegistryOUs = function ($event) {
            organizationService.addPrivateRegistryOUs(self.organization, self.privateRegOusGrid)
                .then(function () {
                    dialog.hide();
                });
        };


        self.excludeOrganizationIfExists = function (organization) {
            organization = organization.hasOwnProperty('id') ? organization.id : organization;
            return self.excludedPrivateRegOU.indexOf(organization) === -1;
        };

        self.removePrivateRegistryOu = function (organization) {
            var ouId = organization.hasOwnProperty('id') ? organization.id : organization;
            self.excludedPrivateRegOU = _.filter(self.excludedPrivateRegOU, function (id) {
                return ouId !== id;
            });
            self.privateRegOusGrid = _.filter(self.privateRegOusGrid, function (Ou) {
                return Ou.id !== ouId;
            });
        };

        self.removeBulkPrivateRegistryOu = function () {
            for (var i = 0; i < self.selectedPrivateRegOusGrid.length; i++) {
                self.removePrivateRegistryOu(self.selectedPrivateRegOusGrid[i]);
            }
            self.selectedPrivateRegOusGrid = [];
        };


        self.grid = {
            limit: 5, // default limit
            page: 1, // first page
            order: 'arName', // default sorting order
            limitOptions: [5, 10, 20, {
                label: langService.get('all'),
                value: function () {
                    return (self.privateRegOusGrid.length + 21);
                }
            }]
        };

        self.closePopup = function () {
            dialog.cancel();
        }
    });
};
