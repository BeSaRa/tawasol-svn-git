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
                                                                             dialog) {
        'ngInject';
        var self = this;

        self.controllerName = 'manageExcludedSubOrganizationsCommentPopCtrl';

        self.excludedSubOUs = (self.excludedIDs && self.excludedIDs.length) ? self.excludedIDs : [];
        self.selectedOu = null;
        self.searchText = null;
        self.selectedExcludedSubOUs = [];


        /**
         * @description add excluded sub ous
         */
        self.addExcludedSubOus = function () {
            dialog.hide(self.excludedSubOUs);
        };

        /**
         * @description remove exclude organization
         * @param $index
         * @param $event
         */
        self.removeExcluded = function ($index, $event) {
            dialog
                .confirmMessage(langService.get('confirm_delete').change({name: self.excludedSubOUs[$index].display}), null, null, $event)
                .then(function () {
                    self.excludedSubOUs.splice($index, 1);
                });
        };

        self.querySearch = function (query) {
            return organizationService
                .findOrganizationChildrenByText(query, null, self.organization)
                .then(function (result) {
                    return _.filter(result, function (item) {
                        if (_.map(self.excludedSubOUs, 'id').indexOf(item.id) > -1 || item.id === self.organization.id)
                            return false;

                        item.display = item[langService.current + 'Name'];
                        return item;
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
         * @param organization
         */
        self.onOrganizationSelected = function (organization) {
            if (!organization) {
                return;
            }
            self.excludedSubOUs.push(organization);
            self.searchText = null;
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
            order: 'display', // default sorting order
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