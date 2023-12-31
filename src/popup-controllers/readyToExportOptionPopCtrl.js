module.exports = function (app) {
    app.controller('readyToExportOptionPopCtrl', function (lookupService,
                                                           $q,
                                                           langService,
                                                           toast,
                                                           errorCode,
                                                           // sites,
                                                           _,
                                                           resend,
                                                           cmsTemplate,
                                                           downloadService,
                                                           readyToExport,
                                                           rootEntity,
                                                           ReadyToExportOption,
                                                           readyToExportService,
                                                           dialog,
                                                           correspondenceService,
                                                           PartialExportCollection,
                                                           g2gData,
                                                           WorkItem,
                                                           comments,
                                                           prepareExport) {
        'ngInject';
        var self = this;

        self.controllerName = 'readyToExportOptionPopCtrl';

        self.progress = null;
        self.readyToExport = readyToExport;
        self.resend = resend;
        self.model = new ReadyToExportOption();
        self.disableExport = false;
        self.settings = rootEntity.getGlobalSettings();
        // if selective export from global settings then false, otherwise true
        self.isGroupExport = self.settings.defaultExportTypeGrouping;
        self.mailRoomEnabled = rootEntity.isMailRoomIntegrationEnabled() && !self.resend;

        self.selectedComment = null;
        self.commentSearchText = '';
        self.comments = comments;

        /*self.correspondenceSites = [].concat(sites.first, _.map(sites.second, function (item) {
            item.ccVerion = true;
            return item;
        }));*/
        self.correspondenceSites = [].concat(prepareExport.sitesitesToList, _.map(prepareExport.sitesCCList, function (item) {
            item.ccVerion = true;
            return item;
        }));

        self.internalSites = [];
        self.externalSites = [];
        self.g2gSites = [];
        self.privateSites = [];
        self.selectedMailingRoomSites = [];
        self.g2gData = g2gData;
        self.hasExternalSite = _.find(self.correspondenceSites, function (item) {
            return item.siteCategory === 2;
        });
        self.isLimitedCentralUnitAccess = correspondenceService.isLimitedCentralUnitAccess(self.readyToExport);

        self.getExportWayText = function () {
            var exportWayMap = {
                1: 'export_electronic',
                2: 'export_manual',
                3: 'export_fax'
            };
            return langService.get(exportWayMap[prepareExport.exportWay]);
        };
        self.exportWayTextMain = self.getExportWayText();
        self.isElectronicExport = function () {
            return prepareExport.exportWay === 1;
        };
        self.isManualExport = function () {
            return prepareExport.exportWay === 2;
        };
        self.isFaxExport = function () {
            return prepareExport.exportWay === 3;
        };


        self.exportTypeList = [
            {key: 'export_by_group', value: true},
            {key: 'export_by_selection', value: false}
        ];


        // partial exported list
        self.partialExportList = new PartialExportCollection();
        self.exportOptions = self.partialExportList.getKeys();
        self.labels = _.map(self.partialExportList.getKeys(), function (label) {
            return label.toLowerCase();
        });

        self.loadRelatedThings = null;

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

        self.checkAnyLinkedDataAvailable = function (type) {
            if (self.readyToExport instanceof WorkItem) {
                if (type)
                    return self.readyToExport.generalStepElm[linkedDataCount[type]];
                return self.readyToExport.generalStepElm.attachementsNO || self.readyToExport.generalStepElm.linkedDocsNO || self.readyToExport.generalStepElm.linkedEntitiesNO;
            } else {
                return true;
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

        function _loadRecordsForSelection() {
            return correspondenceService
                .loadRelatedThingsForCorrespondence(self.readyToExport)
                .then(function (result) {
                    // set checkbox checked for attachments by default
                    _.map((result.ATTACHMENTS || result.attachments), function (attachment) {
                        if (attachment.exportStatus) {
                            _addItem(attachment, 'ATTACHMENTS');
                        }
                        return attachment;
                    });

                    // set checkbox checked for linked docs by default
                    if (prepareExport.hasOwnProperty('linkedDocList') && prepareExport.linkedDocList.length) {
                        var index, linkedDocsVSIDs = _.map(prepareExport.linkedDocList, function (linkedDoc) {
                            return linkedDoc.getInfo().vsId;
                        });
                        _.map(result.RELATED_BOOKS, function (relatedBook) {
                            index = _.findIndex(linkedDocsVSIDs, function (linkedDocVsId) {
                                return linkedDocVsId === relatedBook.getInfo().vsId;
                            });
                            if (index > -1) {
                                relatedBook.dummyDefaultSelected = true;
                                _addItem(relatedBook, 'RELATED_BOOKS');
                            }
                            return relatedBook;
                        });
                    }

                    self.loadRelatedThings = result;
                    return self.loadRelatedThings;
                });
        }

        self.onChangeExportType = function () {
            self.partialExportList = self.partialExportList.changeExportType();
            self.model.RELATED_BOOKS = true;
            if (!self.isGroupExport) {
                _loadRecordsForSelection();
            }
            _setDefaultLinkedDocs();
        };

        function _selectedItemExists(item, option) {
            return (_getItemPosition(item, option) !== -1);
        }

        function _getItemPosition(item, option) {
            return self.partialExportList.exportItems[option].indexOf(item);
        }

        function _addItem(item, option) {
            if (option === 'RELATED_BOOKS') {
                self.partialExportList.setAttachmentLinkedDocs(angular.copy(prepareExport.linkedDocList));
            }
            self.partialExportList.exportItems[option].push(item);
        }

        function _removeItem(item, option) {
            self.partialExportList.exportItems[option].splice(_getItemPosition(item, option), 1);
            _removeLinkedAttachedDoc(item, option);
        }

        function _removeLinkedAttachedDoc(item, option) {
            if (option === 'RELATED_BOOKS') {
                var docs = self.partialExportList.getAttachmentLinkedDocs(),
                    index = _.findIndex(docs, function (linkedAttachmentDoc) {
                        return linkedAttachmentDoc.getInfo().vsId === item.getInfo().vsId;
                    });
                if (index > -1) {
                    docs.splice(index, 1);
                }
            }
        }

        function _setDefaultLinkedDocs() {
            if (self.isGroupExport) {
                self.model.setAttachmentLinkedDocs(prepareExport.hasOwnProperty('linkedDocList') ? angular.copy(prepareExport.linkedDocList) : []);
            } else {
                self.partialExportList.setAttachmentLinkedDocs(prepareExport.hasOwnProperty('linkedDocList') ? angular.copy(prepareExport.linkedDocList) : []);
            }
        }

        self.getLinkedDocsCount = function () {
            return self.isGroupExport ? self.model.ATTACHMENT_LINKED_DOCS.length : self.partialExportList.exportItems.ATTACHMENT_LINKED_DOCS.length;
        };

        self.toggleSelectedItem = function (item, option) {
            if (_selectedItemExists(item, option)) {
                _removeItem(item, option);
            } else {
                _addItem(item, option);
            }
        };
        /**
         * @description export workItem
         */
        self.exportCorrespondenceWorkItem = function () {
            self.disableExport = true;
            var exportData = null;
            if (self.resend) {
                if (self.isGroupExport) {
                    exportData = self.validateExportOption(self.model);
                } else {
                    self.partialExportList.exportItems = self.validateExportOption(self.partialExportList.exportItems);
                    exportData = self.partialExportList;
                }

                return correspondenceService
                    .resendCorrespondenceWorkItem(self.readyToExport, exportData, g2gData, self.comment)
                    .then(function (result) {
                        dialog.hide(result);
                    })
                    .catch(function (error) {
                        self.disableExport = false;
                        if (errorCode.checkIf(error, 'INVALID_DOC_STATUS_TO_EXPORT') === true) {
                            dialog
                                .errorMessage(langService.get('already_exported_please_refresh'))
                                .then(function () {
                                    dialog.hide(error)
                                });
                        } else if (errorCode.checkIf(error, 'CANNOT_EXPORT_TOO_MANY_ATTACHMENTS_OR_LINKED_DOCUMENTS') === true) {
                            dialog.errorMessage(self.getTranslatedError(error));
                        } else if (errorCode.checkIf(error, 'CANNOT_EXPORT_MORE_THAN_FIFTY_ATTACHMENTS_OR_LINKED_DOCUMENTS_TO_G2G') === true) {
                            dialog.errorMessage(self.getTranslatedError(error));
                        }
                    });
            }

            if (self.isGroupExport) {
                readyToExportService
                    .exportReadyToExport(self.readyToExport, self.validateExportOption(self.model))
                    .then(function (result) {
                        toast.success(langService.get('export_success'));
                        dialog.hide(result);
                    })
                    .catch(function (error) {
                        self.disableExport = false;
                        if (errorCode.checkIf(error, 'INVALID_DOC_STATUS_TO_EXPORT') === true) {
                            dialog
                                .errorMessage(langService.get('already_exported_please_refresh'))
                                .then(function () {
                                    dialog.hide(error)
                                });
                        } else if (errorCode.checkIf(error, 'CANNOT_EXPORT_TOO_MANY_ATTACHMENTS_OR_LINKED_DOCUMENTS') === true) {
                            dialog.errorMessage(self.getTranslatedError(error));
                        } else if (errorCode.checkIf(error, 'CANNOT_EXPORT_MORE_THAN_FIFTY_ATTACHMENTS_OR_LINKED_DOCUMENTS_TO_G2G') === true) {
                            dialog.errorMessage(self.getTranslatedError(error));
                        }
                    });
            } else {
                self.partialExportList.exportItems = self.validateExportOption(self.partialExportList.exportItems);

                readyToExportService
                    .exportReadyToExportSelective(self.readyToExport, self.partialExportList)
                    .then(function (result) {
                        toast.success(langService.get('export_success'));
                        dialog.hide(result);
                    })
                    .catch(function (error) {
                        self.disableExport = false;
                        if (errorCode.checkIf(error, 'INVALID_DOC_STATUS_TO_EXPORT') === true) {
                            dialog
                                .errorMessage(langService.get('already_exported_please_refresh'))
                                .then(function () {
                                    dialog.hide(error)
                                });
                        } else if (errorCode.checkIf(error, 'CANNOT_EXPORT_TOO_MANY_ATTACHMENTS_OR_LINKED_DOCUMENTS') === true) {
                            dialog.errorMessage(self.getTranslatedError(error));

                        } else if (errorCode.checkIf(error, 'CANNOT_EXPORT_MORE_THAN_FIFTY_ATTACHMENTS_OR_LINKED_DOCUMENTS_TO_G2G') === true) {
                            dialog.errorMessage(self.getTranslatedError(error));
                        }
                    });
            }
        };

        self.printWithTerminate = function () {
            var readyToExport;
            if (self.isGroupExport) {
                readyToExport = readyToExportService.exportReadyToExport(self.readyToExport, self.validateExportOption(self.model))
            } else {
                self.partialExportList.exportItems = self.validateExportOption(self.partialExportList.exportItems);
                readyToExport = readyToExportService.exportReadyToExportSelective(self.readyToExport, self.partialExportList)
            }

            readyToExport
                .then(function (result) {
                    if (self.isLimitedCentralUnitAccess) {
                        toast.success(langService.get('export_success'));
                        dialog.hide(result);
                        return;
                    }
                    downloadService
                        .controllerMethod
                        .mainDocumentDownload(self.readyToExport, null, true)
                        .then(function () {
                            toast.success(langService.get('export_success'));
                            dialog.hide(result);
                        });
                })
                .catch(function (error) {
                    if (errorCode.checkIf(error, 'INVALID_DOC_STATUS_TO_EXPORT') === true) {
                        dialog
                            .errorMessage(langService.get('already_exported_please_refresh'))
                            .then(function () {
                                dialog.hide(error)
                            });
                    } else if (errorCode.checkIf(error, 'CANNOT_EXPORT_TOO_MANY_ATTACHMENTS_OR_LINKED_DOCUMENTS') === true) {
                        dialog.errorMessage(self.getTranslatedError(error));
                    } else if (errorCode.checkIf(error, 'CANNOT_EXPORT_MORE_THAN_FIFTY_ATTACHMENTS_OR_LINKED_DOCUMENTS_TO_G2G') === true) {
                        dialog.errorMessage(self.getTranslatedError(error));
                    }
                });
        };
        // validate before send to export
        self.validateExportOption = function (exportOption) {
            self.isGroupExport ? self.model.setMailingRoomSites(self.selectedMailingRoomSites) : self.partialExportList.setMailingRoomSites(self.selectedMailingRoomSites);
            _.map(canExportOptions, function (value, key) {
                if (!self.settings.canExport(value)) {
                    exportOption.hasOwnProperty(key) ? exportOption[key] = false : null;
                    if (key === 'RELATED_BOOKS') {
                        self.isGroupExport ? self.model.setAttachmentLinkedDocs([]) : self.partialExportList.setAttachmentLinkedDocs([]);
                    }
                }
            });
            return exportOption
        };

        /**
         * @description check if mail room selected to show icon
         */
        self.isExportToMailRoomSelected = function (site) {
            return self.selectedMailingRoomSites.indexOf(site) !== -1;
        }

        self.closeExportPopupFromCtrl = function () {
            dialog.cancel('close');
        };

        self.openLinkedDocsAttachmentDialog = function ($event) {
            return dialog
                .showDialog({
                    templateUrl: cmsTemplate.getPopup('linked-docs-attachments'),
                    controller: 'linkedDocsAttachmentPopCtrl',
                    controllerAs: 'ctrl',
                    locals: {
                        exportOptions: self.isGroupExport ? self.model : self.partialExportList,
                        model: self.readyToExport
                    },
                    resolve: {
                        linkedDocs: function (correspondenceService) {
                            'ngInject';
                            var info = self.readyToExport.getInfo();
                            return self.isGroupExport ? correspondenceService
                                .getLinkedDocumentsByVsIdClass(info.vsId, info.documentClass) : self.partialExportList.exportItems.RELATED_BOOKS;
                        }
                    }
                })
                .then(function (selectedCorrespondences) {
                    var currentModel = self.isGroupExport ? self.model : self.partialExportList;
                    currentModel.setAttachmentLinkedDocs(selectedCorrespondences);
                })
                .catch(function (selectedCorrespondences) {
                    var currentModel = self.isGroupExport ? self.model : self.partialExportList;
                    currentModel.setAttachmentLinkedDocs(selectedCorrespondences);
                })
        };

        self.resetExportLinkedDocumentAttachments = function (option) {
            if (option === 'RELATED_BOOKS') {
                self.model.setAttachmentLinkedDocs([]);

                if (self.model.RELATED_BOOKS)
                    _setDefaultLinkedDocs();
            }
        };

        // if selective export from global settings, change export type because in this popup, default is group export
        if (!self.isGroupExport) {
            self.onChangeExportType();
        }

        /**
         * @description get error message
         * @returns {string}
         */
        self.getTranslatedError = function (error) {
            var errorObj = error.data.eo;
            return langService.current === 'ar' ? errorObj.arName : errorObj.enName;
        };

        self.setComment = function () {
            self.comment = self.selectedComment.getComment();
        };


        /**
         * @description Clears the searchText for the given field
         * @param fieldType
         */
        self.clearSearchText = function (fieldType) {
            self[fieldType + 'SearchText'] = '';
        };

        /**
         * @description Prevent the default dropdown behavior of keys inside the search box of workflow action dropdown
         * @param $event
         */
        self.preventSearchKeyDown = function ($event) {
            if ($event) {
                var code = $event.which || $event.keyCode;
                if (code !== 38 && code !== 40)
                    $event.stopPropagation();
            }
        };

        // set linkedDocList from prepareExport to attachmentLinkedDocs in model to set them as selected by default
        _setDefaultLinkedDocs();
    });
};
