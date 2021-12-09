module.exports = function (app) {
    app.controller('groupMembersPopCtrl', function ($filter, gridService, generator, langService, groupMembers) {
        'ngInject';
        var self = this;

        self.controllerName = 'groupMembersPopCtrl';

        self.groupMembers = groupMembers;
        self.groupMembersCopy = angular.copy(self.groupMembers);
        self.selectedGroupMembers = [];

        self.grid = {
            progress: null,
            limit: 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: [5, 10, 20,
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.groupMembers.length + 21);
                    }
                }
            ],
            searchColumns: {
                arName: 'member.arFullName',
                enName: 'member.enFullName',
                organization: function (record) {
                    return self.getSortingKey('ouid', 'Organization');
                }
            },
            searchText: '',
            searchCallback: function (grid) {
                self.groupMembers = gridService.searchGridData(self.grid, self.groupMembersCopy);
            }
        };

        /**
         * @description Get the sorting key for given property
         * @param property
         * @param modelType
         * @returns {*}
         */
        self.getSortingKey = function (property, modelType) {
            return generator.getColumnSortingKey(property, modelType);
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.groupMembers = $filter('orderBy')(self.groupMembers, self.grid.order);
        };

        /**
         * @description Close the popup
         */
        self.closePopup = function () {
            dialog.cancel();
        };

    });
};
