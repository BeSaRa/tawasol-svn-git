module.exports = function (app) {
    app.controller('externalDataSourceImportPopCtrl', function (_,
                                                                dataSourcesList,
                                                                toast,
                                                                generator,
                                                                dialog,
                                                                $filter,
                                                                userExternalDataSourceService,
                                                                langService) {
        'ngInject';
        var self = this;
        self.controllerName = 'externalDataSourceImportPopCtrl';

        self.userExtDataSourcesList = [];
        self.selectedUserDataSource = null;
        self.searchText = null;
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

        var _getSourceIdentifierFromSelectedMetaData = function (){
            return self.selectedMetaDatas[0][self.selectedUserDataSource.extImportStore.sourceIdentifier];
        }

        var _getExtDataSourceId = function (){
            return self.selectedUserDataSource.extImportStore.id;
        }

        self.isValidForm = function () {
            return !!self.selectedUserDataSource && !!self.searchText;
        }

        self.searchMetadata = function ($event) {
            if (!self.isValidForm()) {
                return;
            }
            self.metaDataList = [];
            self.metaDataKeysList = [];
            self.selectedMetaDatas = [];

            userExternalDataSourceService.loadMetaData(_getExtDataSourceId(), self.searchText)
                .then(function (result) {
                    if (!result) {
                        return;
                    }
                    self.metaDataList = result;
                    if (self.metaDataList && self.metaDataList.length > 0) {
                        self.metaDataKeysList = Object.keys(self.metaDataList[0]);

                        if (result.length === 1) {
                            self.selectedMetaDatas.splice(0, 0, self.metaDataList[0]);
                        }
                    }
                })
        };

        self.viewContent = function ($event, metaData) {
            userExternalDataSourceService.openContentDialog(_getExtDataSourceId(), _getSourceIdentifierFromSelectedMetaData(), metaData);
        };

        self.importData = function ($event) {
            if (!self.selectedMetaDatas.length) {
                return;
            }
            dialog.hide({
                metaData: self.selectedMetaDatas[0],
                sourceId: _getExtDataSourceId(),
                identifier: _getSourceIdentifierFromSelectedMetaData()
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
