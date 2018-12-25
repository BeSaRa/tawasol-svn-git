module.exports = function (app) {
    app.controller('bulkExportOptionPopCtrl', function (lookupService,
                                                        $q,
                                                        langService,
                                                        toast,
                                                        errorCode,
                                                        //sites,
                                                        _,
                                                        resend,
                                                        downloadService,
                                                        workItems,
                                                        rootEntity,
                                                        ReadyToExportOption,
                                                        readyToExportService,
                                                        dialog,
                                                        correspondenceService,
                                                        PartialExportCollection,
                                                        WorkItem) {
        'ngInject';
        var self = this;

        self.controllerName = 'bulkExportOptionPopCtrl';

        self.progress = null;
        self.workItemsCopy = workItems;
        self.workItems = angular.copy(workItems);
        self.workItems = _.map(self.workItems, function (workItem) {
            workItem.exportType = 1;
            workItem.relatedThings = [];
            workItem.model = new ReadyToExportOption();
            workItem.partialExportList = new PartialExportCollection();
            workItem.exportOptions = workItem.partialExportList.getKeys();
            return workItem;
        });

        self.resend = resend;
        self.settings = rootEntity.getGlobalSettings();

        self.exportTypeList = [
            {id: 1, key: 'export_by_group'},
            {id: 2, key: 'export_by_selection'}
        ];

        self.model = new ReadyToExportOption();
        self.partialExportList = new PartialExportCollection();
        self.exportOptions = self.partialExportList.getKeys();
        self.labels = _.map(self.partialExportList.getKeys(), function (label) {
            return label.toLowerCase();
        });
        self.exportType = 1;

        var canExportOptions = {
            'ATTACHMENTS': 'Attachment',
            'RELATED_BOOKS': 'LinkedDoc',
            'RELATED_OBJECTS': 'LinkedObj'
        };

        var linkedDataCount = {
            'ATTACHMENTS': 'attachementsNO',
            'RELATED_BOOKS': 'linkedDocsNO',
            'RELATED_OBJECTS': 'linkedEntitiesNO'
        };

        self.onChangeExportTypeAll = function ($event) {
            var workItem;
            for (var i = 0; i < self.workItems.length; i++) {
                workItem = self.workItems[i];
                if (self.canExportAnyRelatedData()) {
                    workItem.exportType = self.exportType;
                    self.onChangeExportType(workItem);
                }
            }
        };

        self.updateExportOptionsForWorkItems = function (option, $event) {
            var workItem, exportOption = self.model[option];
            for (var i = 0; i < self.workItems.length; i++) {
                workItem = self.workItems[i];
                if (self.canExportAnyRelatedData()) {
                    workItem.model[option] = exportOption;
                }
            }
        };

        self.canExportAnyRelatedData = function () {
            var canExport;
            for (var i in canExportOptions) {
                canExport = self.settings.canExport(canExportOptions[i]);
                if (canExport)
                    break;
            }
            return canExport;// && self.checkAnyLinkedDataAvailable();
        };

        self.canExportRelatedData = function (type) {
            return self.settings.canExport(canExportOptions[type]);// && self.checkAnyLinkedDataAvailable(type);
        };

        self.onChangeExportType = function (workItem) {
            workItem.partialExportList = workItem.partialExportList.changeExportType();
            if (workItem.exportType === 2) {
                correspondenceService
                    .loadRelatedThingsForCorrespondence(workItem)
                    .then(function (result) {
                        workItem.relatedThings = result;
                    });
            }
        };

        function _selectedItemExists(item, option, workItem) {
            return (_getItemPosition(item, option, workItem) !== -1);
        }

        function _getItemPosition(item, option, workItem) {
            return workItem.partialExportList.exportItems[option].indexOf(item);
        }

        function _addItem(item, option, workItem) {
            workItem.partialExportList.exportItems[option].push(item);
        }

        function _removeItem(item, option, workItem) {
            workItem.partialExportList.exportItems[option].splice(_getItemPosition(item, option, workItem), 1);
        }

        self.toggleSelectedItem = function (item, option, workItem) {
            if (_selectedItemExists(item, option, workItem)) {
                _removeItem(item, option, workItem);
            } else {
                _addItem(item, option, workItem);
            }
        };
        /**
         * @description export workItem
         */
        self.exportCorrespondenceWorkItem = function () {
            self.validateAllWorkItemsExportOption();
            return correspondenceService
                .resendBulkCorrespondenceWorkItems(self.workItems)
                .then(function (result) {
                    dialog.hide(result);
                })
                .catch(function (error) {
                    /*errorCode.checkIf(error, 'INVALID_DOC_STATUS_TO_EXPORT', function () {
                        dialog
                            .errorMessage(langService.get('already_exported_please_refresh'))
                            .then(function () {
                                dialog.hide(error)
                            });
                    });*/
                });
        };

        self.printWithTerminate = function () {

        };

        // validate all workitems before send to export
        self.validateAllWorkItemsExportOption = function () {
            for (var i = 0; i < self.workItems.length; i++) {
                if (self.workItems[i].exportType === 1)
                    self.workItems[i].model = self.validateExportOption(self.workItems[i].model);
            }
        };

        // validate before send to export
        self.validateExportOption = function (exportOption) {
            _.map(canExportOptions, function (value, key) {
                if (!self.settings.canExport(value)) {
                    exportOption.hasOwnProperty(key) ? exportOption[key] = false : null;
                }
            });
            return exportOption
        };

        self.closeExportPopupFromCtrl = function () {
            dialog.cancel();
        };

    });
};