module.exports = function (app) {
    app.controller('selectRegistryOUsCentralArchivePopCtrl', function (lookupService,
                                                                       $q,
                                                                       langService,
                                                                       toast,
                                                                       dialog,
                                                                       registryOrganizations,
                                                                       documentRegOUId,
                                                                       $filter,
                                                                       selectedRecords,
                                                                       gridService,
                                                                       _) {
        'ngInject';
        var self = this;
        self.controllerName = 'selectRegistryOUsCentralArchivePopCtrl';
        self.registryOrganizations = registryOrganizations;
        self.registryOrganizationsCopy = angular.copy(registryOrganizations);

        self.documentRegOUId = documentRegOUId;
        self.selectedRecords = selectedRecords.filter((item) => item.id !== documentRegOUId);

        self.grid = {
            limit: 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.registryOrganizations.length + 21);
                    }
                }
            ],
            searchColumns: {
                arName: 'arName',
                enName: 'enName'
            },
            searchText: '',
            searchCallback: function () {
                self.registryOrganizations = gridService.searchGridData(self.grid, self.registryOrganizationsCopy);
            }
        };

        self.getSortedData = function () {
            self.registryOrganizations = $filter('orderBy')(self.registryOrganizations, self.grid.order);
        };


        self.saveRegistryOUs = function () {
            dialog.hide(self.selectedRecords);
        }

        /**
         * @description close the popup
         */
        self.closePopup = function () {
            dialog.cancel();
        }
    });
};
