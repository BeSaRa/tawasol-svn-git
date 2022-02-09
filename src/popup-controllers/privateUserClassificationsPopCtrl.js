module.exports = function (app) {
    app.controller('privateUserClassificationsPopCtrl', function (ouApplicationUser,
                                                                  privateClassifications,
                                                                  userClassifications,
                                                                  gridService,
                                                                  $filter,
                                                                  $q,
                                                                  generator,
                                                                  privateUserClassificationService,
                                                                  toast,
                                                                  langService,
                                                                  dialog) {
        'ngInject';
        var self = this;
        self.controllerName = 'privateUserClassificationsPopCtrl';
        self.ouApplicationUser = ouApplicationUser;
        self.privateClassifications = privateClassifications;
        self.userClassifications = userClassifications;
        self.userClassificationsCopy = angular.copy(userClassifications);

        self.grid = {
            progress: null,
            limit: 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(),
            searchColumns: {
                arName: 'classification.arName',
                enName: 'classification.enName',
                viewSecurityLevels: 'viewSecurityLevelsString',
                archiveSecurityLevels: 'archiveSecurityLevelsString'
            },
            searchText: '',
            searchCallback: function () {
                self.userClassifications = gridService.searchGridData(self.grid, self.userClassificationsCopy);
            }
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.userClassifications = $filter('orderBy')(self.userClassifications, self.grid.order);
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

        self.openAddUserClassificationDialog = function ($event) {
            privateUserClassificationService
                .controllerMethod
                .privateUserClassificationAdd(self.privateClassifications, self.ouApplicationUser, $event)
                .then(function (result) {
                    self.reloadPrivateUserClassifications(self.grid.page).then(function () {
                        toast.success(langService.get('add_success').change({name: result.getNames()}));
                    });
                });
        }

        self.openEditUserClassificationDialog = function (privateUserClassification, $event) {
            privateUserClassificationService
                .controllerMethod
                .privateUserClassificationEdit(privateUserClassification, self.privateClassifications, self.ouApplicationUser, $event)
                .then(function (result) {
                    self.reloadPrivateUserClassifications(self.grid.page).then(function () {
                        toast.success(langService.get('edit_success').change({name: result.getNames()}));
                    });
                });
        }

        /**
         * @description reload privateUser classifications
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadPrivateUserClassifications = function (pageNumber) {
            var defer = $q.defer();
            self.grid.progress = defer.promise;
            return privateUserClassificationService
                .loadPrivateUserClassifications(self.ouApplicationUser)
                .then(function (result) {
                    self.userClassifications = result;
                    self.userClassificationsCopy = angular.copy(self.userClassifications);

                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return result;
                });
        };

        /**
         * @description remove private classification
         * @param userClassification
         * @param $event
         */
        self.removePrivateUserClassification = function (userClassification, $event) {
            privateUserClassificationService
                .controllerMethod
                .privateUserClassificationDelete(userClassification, $event)
                .then(function (result) {
                    self.reloadPrivateUserClassifications(self.grid.page).then(function () {
                        toast.success(langService.get('delete_success').change({name: userClassification.getNames()}));
                    });
                });
        }

        /**
         * @description close the popup
         */
        self.closePopUp = function () {
            dialog.cancel();
        };
    });
};
