module.exports = function (app) {
    app.controller('versionPopCtrl', function (correspondence,
                                               versions,
                                               dialog,
                                               _,
                                               allowDuplicateAction,
                                               generator,
                                               langService,
                                               $filter) {
        'ngInject';
        var self = this;
        self.controllerName = 'versionPopCtrl';
        self.correspondence = correspondence;
        // self.versions = _.chunk(versions, 3);
        self.versions = versions;
        self.length = versions.length;
        self.actions = []; //actions;
        self.allowDuplicateAction = allowDuplicateAction;
        self.progress = null;
        self.selectedVersions = [];
        self.grid = {
            limit: 5, //self.globalSetting.searchAmount, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.versions.length + 21);
                    }
                }
            ]
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.versions = $filter('orderBy')(self.versions, self.grid.order);
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

        /*self.getVersionNumber = function (row, item) {
            return (item + row + (row * 3 + 1)) - row;
        };*/

        self.getVersionNumber = function (item, rowIndex) {
            if (!item.hasOwnProperty('virtualVersionNumber')) {
                item.virtualVersionNumber = self.versions.length - ((self.grid.limit * (self.grid.page - 1)) + rowIndex);
            }
            return item.virtualVersionNumber;
        };

        self.duplicateThisVersion = function (correspondence) {
            dialog.hide({
                correspondence: correspondence
            });
        };

        self.openVersion = function (version, $event) {
            return version.viewFromQueueById(self.actions, 'userInbox', $event);
        };

    });
};
