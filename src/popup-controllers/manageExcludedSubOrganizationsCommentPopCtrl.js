module.exports = function (app) {
    app.controller('manageExcludedSubOrganizationsCommentPopCtrl', function ($q,
                                                                             langService,
                                                                             toast,
                                                                             _,
                                                                             $timeout,
                                                                             generator,
                                                                             organizationService,
                                                                             gridService,
                                                                             $filter,
                                                                             organizationChildren,
                                                                             dialog) {
        'ngInject';
        var self = this;

        self.controllerName = 'manageExcludedSubOrganizationsCommentPopCtrl';
        self.selectedOu = null;
        self.searchText = null;
        self.selectedExcludedSubOUs = [];

        self.searchOuChildren = function (searchText) {
            return _.filter(organizationChildren, function (item) {
                if (!searchText)
                    return _.map(self.excludedSubOUs, 'id').indexOf(item.id) === -1;

                return item.getTranslatedName().toLowerCase().indexOf(searchText.toLowerCase()) !== -1 && self.excludedSubOUs.indexOf(item.id) === -1;
            });
        };

        /**
         * @description Adds the organization to exclude sub organization list
         * @param organization
         */
        self.onOrganizationSelected = function (organization) {
            if (!organization) {
                return;
            }
            var selectedOu = angular.copy(organization);
            selectedOu.parent = self.organization.id;
            self.excludedSubOUs.push(selectedOu);
            self.searchText = null;
        };

        /**
         * @description remove exclude organization
         * @param organization
         * @param $event
         */
        self.removeExcluded = function (organization, $event) {
            dialog
                .confirmMessage(langService.get('confirm_delete').change({name: organization.getTranslatedName()}), null, null, $event)
                .then(function () {
                    self.excludedSubOUs = _.filter(self.excludedSubOUs, function (item) {
                        return item.id !== (organization.hasOwnProperty('id') ? organization.id : organization);
                    });
                });
        };

        /**
         * @description remove bulk excluded organizations
         * @param $event
         */
        self.removeBulkSelected = function ($event) {
            dialog
                .confirmMessage(langService.get('confirm_delete_selected_multiple'), null, null, $event)
                .then(function () {
                    var ids = _.map(self.selectedExcludedSubOUs, 'id');
                    self.excludedSubOUs = _.filter(self.excludedSubOUs, function (item) {
                        return ids.indexOf(item.id) === -1;
                    });
                    self.selectedExcludedSubOUs = [];
                });
        };

        /**
         * @description add excluded sub ous
         */
        self.addExcludedSubOus = function () {
            dialog.hide(self.excludedSubOUs);
        };

        /**
         * @description Close the popup
         */
        self.closePopup = function () {
            dialog.cancel();
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.excludedSubOUs = $filter('orderBy')(self.excludedSubOUs, self.grid.order);
        };

        // for all grids in the directive.
        self.grid = {
            limit: 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.excludedSubOUs.length + 21)
                    }
                }
            ]
        }
    });
};
