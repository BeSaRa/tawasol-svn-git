module.exports = function (app) {
    app.controller('distWorkflowGroupMembersPopCtrl', function ($q,
                                                                langService,
                                                                toast,
                                                                dialog,
                                                                generator,
                                                                _,
                                                                wfGroup,
                                                                gridService) {
        'ngInject';
        var self = this;

        self.controllerName = 'distWorkflowGroupMembersPopCtrl';
        self.wfGroup = wfGroup;
        self.wfGroupCopy = angular.copy(wfGroup);

        self.selectedMembers = [];

        self.grid = {
            limit: 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.wfGroup.members.length + 21);
                    }
                }
            ],
            searchColumns: {
                user: function (record) {
                    return langService.current + 'Name';
                },
                organization: function (record) {
                    return langService.current + 'OUName';
                }
            },
            searchText: '',
            searchCallback: function (grid) {
                self.wfGroup.members = gridService.searchGridData(self.grid, self.wfGroupCopy.members);
            }
        };

        self.getSortedData = function () {
            self.wfGroup.members = $filter('orderBy')(self.wfGroup.members, self.grid.order);
        };

        /**
         * @description Get the sorting key for information or lookup model
         * @param property
         * @param modelType
         * @returns {*}
         */
        self.getSortingKey = function (property, modelType) {
            return generator.getColumnSortingKey(property, modelType);
        };

        self.addSelectedMembers = function () {
            if (!self.selectedMembers.length) {
                return false;
            }
            dialog.hide(self.selectedMembers);
        };

        self.isAnyOutOfOffice = function () {
            return _.some(self.wfGroup.members, function (item) {
                return item.isUserOutOfOffice();
            })
        };

        /**
         * @description Close the popup
         */
        self.closePopup = function () {
            dialog.cancel();
        };

    });
};
