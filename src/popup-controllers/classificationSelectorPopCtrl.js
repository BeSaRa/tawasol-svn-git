module.exports = function (app) {
    app.controller('classificationSelectorPopCtrl', function (_, langService,
                                                              dialog,
                                                              classificationService,
                                                              excluded,
                                                              $filter,
                                                              gridService) {
        'ngInject';
        var self = this;
        self.controllerName = 'classificationSelectorPopCtrl';

        self.selectedClassifications = [];
        self.selectedClassificationsAdded = [];
        self.selectedClassificationsGrid = [];
        self.classifications = classificationService.classifications;

        self.grid = {
            limit: 10, // default limit
            page: 1, // first page
            order: 'arName', // default sorting order
            limitOptions: [10, 15, 20, {
                label: langService.get('all'),
                value: function () {
                    return (self.classifications.length + 21);
                }
            }],
            searchColumns: {
                arabicName: 'arName',
                englishName: 'enName'
            },
            searchText: '',
            searchCallback: function (grid) {
                self.classifications = gridService.searchGridData(self.grid, self.classificationsCopy);
            }
        };

        self.gridAdded = {
            limit: 10, // default limit
            page: 1, // first page
            order: 'arName', // default sorting order
            limitOptions: [10, 15, 20, {
                label: langService.get('all'),
                value: function () {
                    return (self.selectedClassifications.length + 21);
                }
            }]
        };


        // the excluded must be Classification Instance.
        self.excluded = _.map(excluded, 'id');


        self.excludeIfExists = function (classification) {
            return self.excluded.indexOf(classification.id) === -1;
        };

        self.includeIfEnabled = function (classification) {
            return classification.status;
        };

        self.sendSelectedClassification = function () {
            dialog.hide(self.selectedClassifications);
        };

        self.addClassificationToSelectedClassification = function () {
            self.selectedClassifications = self.selectedClassifications.concat(self.selectedClassificationsGrid);
            self.excluded = self.excluded.concat(_.map(self.selectedClassificationsGrid, 'id'));
            self.classifications = self.filterClassifications(self.classifications);
            self.classificationsCopy = angular.copy(self.classifications);
            self.selectedClassificationsGrid = [];
            self.selectedClassificationsAdded = [];
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.classifications = $filter('orderBy')(self.classifications, self.grid.order);
        };

        self.removeClassification = function (classification, doNotclear) {
            var classificationId = classification.id;
            self.excluded = _.filter(self.excluded, function (id) {
                return classificationId !== id;
            });
            self.selectedClassifications = _.filter(self.selectedClassifications, function (classification) {
                return classification.id !== classificationId;
            });
            if (!doNotclear)
                self.selectedClassificationsAdded = [];

            self.classifications = self.filterClassifications([classification]);
            self.classificationsCopy = angular.copy(self.classifications);
        };

        self.removeSelectedClassification = function () {
            for (var i = 0; i < self.selectedClassificationsAdded.length; i++) {
                self.removeClassification(self.selectedClassificationsAdded[i], true);
            }
            self.selectedClassificationsAdded = [];
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.classifications = $filter('orderBy')(self.classifications, self.grid.order);
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedDataAdded = function () {
            self.selectedClassifications = $filter('orderBy')(self.selectedClassifications, self.grid.order);
        };

        self.filterClassifications = function (classifications) {
            return _.filter(classifications, function (classification) {
                return self.excludeIfExists(classification) && self.includeIfEnabled(classification) && !classification.isGlobal
            })
        }

        self.$onInit = function () {
            self.classifications = self.filterClassifications(self.classifications);
            self.classificationsCopy = angular.copy(self.classifications);
        }
    });
};