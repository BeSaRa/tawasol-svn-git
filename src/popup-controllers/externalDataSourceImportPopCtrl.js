module.exports = function (app) {
    app.controller('externalDataSourceImportPopCtrl', function (_,
                                                                dataSourcesList,
                                                                toast,
                                                                generator,
                                                                dialog,
                                                                $filter,
                                                                userExternalDataSourceService,
                                                                langService,
                                                                cmsTemplate) {
        'ngInject';
        var self = this;
        self.controllerName = 'externalDataSourceImportPopCtrl';

        self.userExtDataSourcesList = [];
        self.selectedUserDataSource = null;
        self.identifier = null;
        self.metaDataKeysList = [];
        self.metaDataList = [];
        self.selectedMetaDatas = [];

        self.metaDataGrid = {
            name: 'metaDataGrid',
            progress: null,
            limit: 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.metaDataList.length + 21)
                    }
                }
            ]
        };

        self.getSortedMetaData = function () {
            self.metaDataList = $filter('orderBy')(self.metaDataList, self.metaDataGrid.order);
        };

        self.isValidForm = function () {
            return !!self.selectedUserDataSource && !!self.identifier;
        }

        self.getMetadata = function ($event) {
            if (!self.isValidForm()) {
                return;
            }
            userExternalDataSourceService.loadMetaData(self.selectedUserDataSource.extImportStore.id, self.identifier)
                .then(function (result) {
                    self.metaDataKeysList = [];
                    if (result && result.length > 0) {
                        self.metaDataKeysList = Object.keys(result[0]);
                    }
                    self.metaDataList = result;
                    if (result.length === 1) {
                        self.selectedMetaDatas = result;
                    }
                })
        };

        self.viewContent = function ($event, metaData) {
            userExternalDataSourceService.openContentDialog(self.selectedUserDataSource.extImportStore.id, self.identifier, metaData);
        };

        self.importData = function ($event) {
            if (!self.selectedMetaDatas.length) {
                return;
            }
            dialog.hide({
                metaData: self.selectedMetaDatas[0],
                sourceId: self.selectedUserDataSource.extImportStore.id,
                identifier: self.identifier
            });
        };

        /**
         * @description Close the popup
         */
        self.closePopup = function () {
            dialog.cancel();
        };

        self.$onInit = function () {
            self.userExtDataSourcesList = dataSourcesList;
            if (dataSourcesList.length === 1) {
                self.selectedUserDataSource = self.userExtDataSourcesList[0];
            }
        };
    });
};
