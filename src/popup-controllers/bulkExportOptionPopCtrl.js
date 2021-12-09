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
        self.settings = rootEntity.getGlobalSettings();
        self.workItemsCopy = workItems;
        self.workItems = angular.copy(workItems);
        self.workItems = _.map(self.workItems, function (workItem) {
            workItem.isGroupExport = true;
            workItem.relatedThings = [];
            workItem.model = new ReadyToExportOption();
            workItem.partialExportList = new PartialExportCollection();
            workItem.exportOptions = workItem.partialExportList.getKeys();
            return workItem;
        });

        self.resend = resend;
        self.disableExport = false;
        self.exportTypeList = [
            {key: 'export_by_group', value: true},
            {key: 'export_by_selection', value: false}
        ];

        self.model = new ReadyToExportOption();
        self.partialExportList = new PartialExportCollection();
        self.exportOptions = self.partialExportList.getKeys();
        self.labels = _.map(self.partialExportList.getKeys(), function (label) {
            return label.toLowerCase();
        });

        // if selective export from global settings then false, otherwise true
        self.isGroupExport = self.settings.defaultExportTypeGrouping;

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
                    workItem.isGroupExport = self.isGroupExport;
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
            if (!workItem.isGroupExport) {
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
            self.disableExport = true;
            self.validateAllWorkItemsExportOption();
            return correspondenceService
                .resendBulkCorrespondenceWorkItems(self.workItems)
                .then(function (result) {
                    dialog.hide(result);
                })
                .catch(function (error) {
                    self.disableExport = false;
                    errorCode.checkIf(error, 'CANNOT_EXPORT_TOO_MANY_ATTACHMENTS_OR_LINKED_DOCUMENTS', function () {
                        dialog.errorMessage(self.getTranslatedError(error))
                    });
                    errorCode.checkIf(error, 'CANNOT_EXPORT_MORE_THAN_FIFTY_ATTACHMENTS_OR_LINKED_DOCUMENTS_TO_G2G', function () {
                        dialog.errorMessage(self.getTranslatedError(error));
                    });
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
                if (self.workItems[i].isGroupExport)
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

        /**
         * @description get error message
         * @returns {string}
         */
        self.getTranslatedError = function (error) {
            var errorObj = error.data.eo;
            return langService.current === 'ar' ? errorObj.arName : errorObj.enName;
        };
    });
};
