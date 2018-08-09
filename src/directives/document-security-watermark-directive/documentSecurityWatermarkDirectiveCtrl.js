module.exports = function (app) {
    app.controller('documentSecurityWatermarkDirectiveCtrl', function ($scope,
                                                                       $rootScope,
                                                                       $timeout,
                                                                       _,
                                                                       generator,
                                                                       DocumentSecurity,
                                                                       DocumentSecuritySetting,
                                                                       langService,
                                                                       LangWatcher,
                                                                       Lookup,
                                                                       $compile,
                                                                       $element,
                                                                       globalSettingService,
                                                                       BarcodeSetting,
                                                                       lookupService,
                                                                       documentSecurityService,
                                                                       DocumentSecurityBarcodeBox,
                                                                       DocumentSecurityPage,
                                                                       dialog) {
        'ngInject';
        var self = this;
        self.controllerName = 'documentSecurityWatermarkDirectiveCtrl';
        LangWatcher($scope);
        self.barcodeSpecs = null;
        self.availableDocTypesToProtect = lookupService.returnLookups(lookupService.documentClass, true);
        self.documentSecurityTextOrientations = lookupService.returnLookups(lookupService.waterMarkTextOrientation);

        self.documentSecurityPage = new DocumentSecurityPage();
        self.documentSecurityBarcodeBox = new DocumentSecurityBarcodeBox();

        $timeout(function () {
            self.initializeDocumentSecurity();
            self.securityLevels = self.globalSettingCopy.securityLevels;
        });


        /**
         * @description Initialize a new instance of document security setting by type
         * @param {number | documentClass} [documentType]
         * DocumentType differentiates between the initialization of security setting.
         * If not passed, all the document security settings will be initialized with new instance.
         * @param {boolean=} initDocumentSecurity
         * @param {boolean=} makeCopy
         */
        self.initDocumentSecuritySetting = function (documentType, initDocumentSecurity, makeCopy) {
            if (initDocumentSecurity) {
                self.documentSecurity = new DocumentSecurity();
            }
            if (typeof documentType === 'undefined' || documentType === null || documentType === false) {
                self.documentSecurityOutgoing = new DocumentSecuritySetting({documentType: 0});
                self.documentSecurityIncoming = new DocumentSecuritySetting({documentType: 1});
                self.documentSecurityInternal = new DocumentSecuritySetting({documentType: 2});
                self.documentSecurityTawasolAttachment = new DocumentSecuritySetting({documentType: 4});
            }
            else {
                documentType = documentType.hasOwnProperty('lookupKey') ? documentType.lookupKey : documentType;
                if (documentType === 0) {
                    self.documentSecurityOutgoing = new DocumentSecuritySetting({documentType: 0});
                }
                else if (documentType === 1) {
                    self.documentSecurityIncoming = new DocumentSecuritySetting({documentType: 1});
                }
                else if (documentType === 2) {
                    self.documentSecurityInternal = new DocumentSecuritySetting({documentType: 2});
                }
                else if (documentType === 4) {
                    self.documentSecurityTawasolAttachment = new DocumentSecuritySetting({documentType: 4});
                }
            }

            if (makeCopy) {
                self.makeDocumentSecuritySettingCopy(documentType, initDocumentSecurity);
            }
        };

        /**
         * @description Makes the copy of the document security setting.
         * @param {number | documentClass} [documentType]
         * Represents the document type to make copy. If not passed, copy of all the document type security settings will be made
         * @param {boolean=} copyDocumentSecurity
         * Checks whether to make a copy of document security object or not
         */
        self.makeDocumentSecuritySettingCopy = function (documentType, copyDocumentSecurity) {
            if (copyDocumentSecurity) {
                self.documentSecurityCopy = angular.copy(self.documentSecurity);
            }
            if (typeof documentType === 'undefined' || documentType === null || documentType === false) {
                self.documentSecurityOutgoingCopy = angular.copy(self.documentSecurityOutgoing);
                self.documentSecurityIncomingCopy = angular.copy(self.documentSecurityIncoming);
                self.documentSecurityInternalCopy = angular.copy(self.documentSecurityInternal);
                self.documentSecurityTawasolAttachmentCopy = angular.copy(self.documentSecurityTawasolAttachment);
            }
            else {
                documentType = documentType.hasOwnProperty('lookupKey') ? documentType.lookupKey : documentType;
                if (documentType === 0) {
                    self.documentSecurityOutgoingCopy = angular.copy(self.documentSecurityOutgoing);
                }
                else if (documentType === 1) {
                    self.documentSecurityIncomingCopy = angular.copy(self.documentSecurityIncoming);
                }
                else if (documentType === 2) {
                    self.documentSecurityInternalCopy = angular.copy(self.documentSecurityInternal);
                }
                else if (documentType === 4) {
                    self.documentSecurityTawasolAttachmentCopy = angular.copy(self.documentSecurityTawasolAttachment);
                }
            }
        };

        /**
         * @description Initializes the document security
         * If value is already available(on load or after reload), value will be used from service
         * otherwise, new object will be initialized
         */
        self.initializeDocumentSecurity = function () {
            /* After reload, documentSecurity will have value in service and it will differentiate all kinds of security settings*/
            if (documentSecurityService.documentSecurity) {
                self.documentSecurity = angular.copy(documentSecurityService.documentSecurity);
                if (self.documentSecurity.settingDetails && self.documentSecurity.settingDetails.length) {
                    _.map(self.documentSecurity.settingDetails, function (settingDetail) {
                        if (settingDetail.documentType === 0)
                            self.documentSecurityOutgoing = settingDetail;
                        else if (settingDetail.documentType === 1)
                            self.documentSecurityIncoming = settingDetail;
                        else if (settingDetail.documentType === 2)
                            self.documentSecurityInternal = settingDetail;
                        else if (settingDetail.documentType === 4)
                            self.documentSecurityTawasolAttachment = settingDetail;
                    });
                    var availableType,
                        existingDocTypes = _.map(self.documentSecurity.settingDetails, 'documentType');
                    for (var i = 0; i < self.availableDocTypesToProtect.length; i++) {
                        availableType = self.availableDocTypesToProtect[i];
                        if (existingDocTypes.indexOf(availableType.lookupKey) < 0) {
                            self.initDocumentSecuritySetting(availableType.lookupKey);
                        }
                    }
                }
                else {
                    self.initDocumentSecuritySetting();
                }
            }
            else {
                self.initDocumentSecuritySetting(null, true);
            }

            /* Make the copy of the available data*/
            self.makeDocumentSecuritySettingCopy(null, true);
        };

        self.watermarkTabsToShow = [
            'outgoing',
            'incoming',
            'internal',
            'tawasolattachment'
        ];
        self.watermarkTabsToShowKeys = _.map(self.watermarkTabsToShow, 'value');

        self.showWatermarkTab = function (tabName) {
            return self.watermarkTabsToShow.indexOf(tabName.toLowerCase()) > -1;
        };

        /**
         * @description Contains the selected tab name
         * @type {string}
         */
        self.selectedWatermarkTabName = "outgoing";

        /**
         * @description Sets the selected tab's lookup
         * @param lookupKey
         * @private
         */
        function _setSelectedTabDocType(lookupKey) {
            self.selectedWatermarkTabDocType = _.find(self.availableDocTypesToProtect, function (docType) {
                if (docType.lookupKey === Number(lookupKey)) {
                    return docType
                }
            });
        }

        _setSelectedTabDocType(0);

        /**
         * @description Set the current tab name
         * @param tabName
         * @param lookupKey
         */
        self.setCurrentWatermarkTab = function (tabName, lookupKey) {
            self.selectedWatermarkTabName = tabName.toLowerCase();
            _setSelectedTabDocType(lookupKey)
        };

        /**
         * @description Check if the document security is disabled
         * @param type
         * @returns {boolean}
         */
        self.checkDisabledDocSecurity = function (type) {
            type = type.toLowerCase();
            var enabled = true;
            if (type === 'outgoing') {
                enabled = self.documentSecurityOutgoing && self.documentSecurityOutgoing.status;
            }
            else if (type === 'incoming') {
                enabled = self.documentSecurityIncoming && self.documentSecurityIncoming.status;
            }
            else if (type === 'internal') {
                enabled = self.documentSecurityInternal && self.documentSecurityInternal.status;
            }
            else if (type === 'tawasolattachment') {
                enabled = self.documentSecurityTawasolAttachment && self.documentSecurityTawasolAttachment.status;
            }
            return !(self.documentSecurity && self.documentSecurity.status && enabled);
        };

        /**
         * @description Check if the document security is required
         * @param type
         * @param dependentOnField
         * @returns {boolean}
         */
        self.checkRequiredDocSecurity = function (type, dependentOnField) {
            type = type.toLowerCase();
            var required = true;
            if (type === 'outgoing') {
                required = self.documentSecurityOutgoing && self.documentSecurityOutgoing.status;
                if (dependentOnField)
                    required = required && self.documentSecurityOutgoing[dependentOnField];
            }
            else if (type === 'incoming') {
                required = self.documentSecurityIncoming && self.documentSecurityIncoming.status;
                if (dependentOnField)
                    required = required && self.documentSecurityIncoming[dependentOnField];
            }
            else if (type === 'internal') {
                required = self.documentSecurityInternal && self.documentSecurityInternal.status;
                if (dependentOnField)
                    required = required && self.documentSecurityInternal[dependentOnField];
            }
            else if (type === 'tawasolattachment') {
                required = self.documentSecurityTawasolAttachment && self.documentSecurityTawasolAttachment.status;
                if (dependentOnField)
                    required = required && self.documentSecurityTawasolAttachment[dependentOnField];
            }
            return self.documentSecurity.status && required;
        };

        /**
         * @description Requests for the real time preview of the settings made by user.
         * @param $event
         */
        self.previewDocumentSecuritySettings = function ($event) {
            var documentSecurityPreview = angular.copy(self.documentSecurity);
            documentSecurityPreview.settingDetails = [];

            documentSecurityPreview.settingDetails.push(angular.copy(self.documentSecurityOutgoing));
            documentSecurityPreview.settingDetails.push(angular.copy(self.documentSecurityIncoming));
            documentSecurityPreview.settingDetails.push(angular.copy(self.documentSecurityInternal));
            documentSecurityPreview.settingDetails.push(angular.copy(self.documentSecurityTawasolAttachment));

            if (self.selectedWatermarkTabName === 'outgoing') {
                documentSecurityPreview.selectedDocumentType = 0;
            }
            else if (self.selectedWatermarkTabName === 'incoming') {
                documentSecurityPreview.selectedDocumentType = 1;
            }
            else if (self.selectedWatermarkTabName === 'internal') {
                documentSecurityPreview.selectedDocumentType = 2;
            }
            else if (self.selectedWatermarkTabName === 'tawasolattachment') {
                documentSecurityPreview.selectedDocumentType = 4;
            }

            documentSecurityService
                .previewDocumentSecurity(documentSecurityPreview)
                .then(function (blob) {
                    // var bytesArray = new Uint8Array(result.data);
                    // var file = new Blob([bytesArray], {type: 'application/pdf'});
                    var fileURL = URL.createObjectURL(blob);
                    window.open(fileURL);
                });
        };

        /**
         * @description Adds the new document security for global setting
         */
        self.addDocumentSecurity = function () {
            self.documentSecurity.settingDetails = [];
            self.documentSecurity.settingDetails.push(self.documentSecurityOutgoing);
            self.documentSecurity.settingDetails.push(self.documentSecurityIncoming);
            self.documentSecurity.settingDetails.push(self.documentSecurityInternal);
            self.documentSecurity.settingDetails.push(self.documentSecurityTawasolAttachment);
            documentSecurityService
                .addDocumentSecurity(self.documentSecurity)
                .then(function () {
                    self.reloadDocumentSecurity();
                })
        };

        /**
         * @description Updates the document security for global setting
         * @param $event
         */
        self.saveDocumentSecurity = function ($event) {
            self.documentSecurity.settingDetails = [];
            self.documentSecurity.settingDetails.push(self.documentSecurityOutgoing);
            self.documentSecurity.settingDetails.push(self.documentSecurityIncoming);
            self.documentSecurity.settingDetails.push(self.documentSecurityInternal);
            self.documentSecurity.settingDetails.push(self.documentSecurityTawasolAttachment);
            documentSecurityService
                .saveDocumentSecurity(self.documentSecurity)
                .then(function () {
                    self.reloadDocumentSecurity();
                })
        };

        /**
         * @description Reloads the document security from database
         * @returns {*}
         */
        self.reloadDocumentSecurity = function () {
            return documentSecurityService.loadDocumentSecurity()
                .then(function (result) {
                    self.initializeDocumentSecurity();
                })
        };

        /**
         * @description check if text orientation disabled you can't disable both
         * @param $event
         */
        self.checkIfTextOrientationDisabled = function ($event) {
            if (self.documentSecurityOutgoing.textOrientation === 0 && self.documentSecurityOutgoing.status2D &&
                self.selectedWatermarkTabName === 'outgoing') {
                dialog.errorMessage(langService.get("can_not_disable_2D_orientation"));
                self.documentSecurityOutgoing.status2D = !self.documentSecurityOutgoing.status2D;
            }

            else if (self.documentSecurityIncoming.textOrientation === 0 && self.documentSecurityIncoming.status2D &&
                self.selectedWatermarkTabName === 'incoming') {
                dialog.errorMessage(langService.get("can_not_disable_2D_orientation"));
                self.documentSecurityIncoming.status2D = !self.documentSecurityIncoming.status2D;
            }

            else if (self.documentSecurityInternal.textOrientation === 0 && self.documentSecurityInternal.status2D &&
                self.selectedWatermarkTabName === 'internal') {
                dialog.errorMessage(langService.get("can_not_disable_2D_orientation"));
                self.documentSecurityInternal.status2D = !self.documentSecurityInternal.status2D;
            }

            else if (self.documentSecurityTawasolAttachment.textOrientation === 0 && self.documentSecurityTawasolAttachment.status2D &&
                self.selectedWatermarkTabName === 'tawasolattachment') {
                dialog.errorMessage(langService.get("can_not_disable_2D_orientation"));
                self.documentSecurityTawasolAttachment.status2D = !self.documentSecurityTawasolAttachment.status2D;
            }
        };

        /**
         * @description check if status2D disabled you can't disable both
         * @param $event
         */
        self.checkIfStatus2DDisabled = function ($event) {
            if (self.documentSecurityOutgoing.textOrientation === 0 && !self.documentSecurityOutgoing.status2D &&
                self.selectedWatermarkTabName === 'outgoing') {
                dialog.errorMessage(langService.get('can_not_disable_2D_orientation'));
                self.documentSecurityOutgoing.textOrientation = self.documentSecurityOutgoingCopy.textOrientation;
            }
            else if (self.documentSecurityIncoming.textOrientation === 0 && !self.documentSecurityIncoming.status2D &&
                self.selectedWatermarkTabName === 'incoming') {
                dialog.errorMessage(langService.get('can_not_disable_2D_orientation'));
                self.documentSecurityIncoming.textOrientation = self.documentSecurityIncomingCopy.textOrientation;
            }
            else if (self.documentSecurityInternal.textOrientation === 0 && !self.documentSecurityInternal.status2D &&
                self.selectedWatermarkTabName === 'internal') {
                dialog.errorMessage(langService.get('can_not_disable_2D_orientation'));
                self.documentSecurityInternal.textOrientation = self.documentSecurityInternalCopy.textOrientation;
            }
            else if (self.documentSecurityTawasolAttachment.textOrientation === 0 && !self.documentSecurityTawasolAttachment.status2D &&
                self.selectedWatermarkTabName === 'tawasolattachment') {
                dialog.errorMessage(langService.get('can_not_disable_2D_orientation'));
                self.documentSecurityTawasolAttachment.textOrientation = self.documentSecurityTawasolAttachmentCopy.textOrientation;
            }
            else {
                self.makeDocumentSecuritySettingCopy(null, true);
            }
        }
    });
};