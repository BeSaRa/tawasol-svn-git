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
                                                                       documentSecurityService) {
        'ngInject';
        var self = this;
        self.controllerName = 'documentSecurityWatermarkDirectiveCtrl';
        LangWatcher($scope);
        self.barcodeSpecs = null;
        self.availableDocTypesToProtect = lookupService.returnLookups(lookupService.documentClass, true);
        self.documentSecurityTextOrientations = lookupService.returnLookups(lookupService.waterMarkTextOrientation);

        $timeout(function () {
            self.initializeDocumentSecurity();
            self.setDefaultBarcodeSettings();
            self.securityLevels = self.globalSettingCopy.securityLevels;
        });

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
         * @description Initializes the document security
         * If value is already available(on load or after reload), value will be used from service
         * otherwise, new object will be initialized
         */
        self.initializeDocumentSecurity = function () {
            /* After reload, documentSecurity will have value in service and it will differentiate all kinds of security settings*/
            if (documentSecurityService.documentSecurity) {
                self.documentSecurity = angular.copy(documentSecurityService.documentSecurity);
                _.map(self.documentSecurity.settingDetails, function (settingDetail) {
                    if (settingDetail.documentType === 0)
                        self.documentSecurityOutgoing = settingDetail;
                    else if (settingDetail.documentType === 1)
                        self.documentSecurityIncoming = settingDetail;
                    else if (settingDetail.documentType === 2)
                        self.documentSecurityInternal = settingDetail;
                    else if (settingDetail.documentType === 3 || settingDetail.documentType === 4)
                        self.documentSecurityTawasolAttachment = settingDetail;
                })
            }
            else {
                self.documentSecurity = new DocumentSecurity();
                self.documentSecurityOutgoing = new DocumentSecuritySetting({documentType: 0});
                self.documentSecurityIncoming = new DocumentSecuritySetting({documentType: 1});
                self.documentSecurityInternal = new DocumentSecuritySetting({documentType: 2});
                self.documentSecurityTawasolAttachment = new DocumentSecuritySetting({documentType: 4});
            }

            self.documentSecurityCopy = angular.copy(self.documentSecurity);
            self.documentSecurityOutgoingCopy = angular.copy(self.documentSecurityOutgoing);
            self.documentSecurityIncomingCopy = angular.copy(self.documentSecurityIncoming);
            self.documentSecurityInternalCopy = angular.copy(self.documentSecurityInternal);
            self.documentSecurityTawasolAttachmentCopy = angular.copy(self.documentSecurityTawasolAttachment);
        };

        /**
         * @description Set the default barcode settings
         * Contains pageSettings, barcode size, barcode size(in pixels), barcodeBoxPosition(in pixels)
         * @private
         */
        self.setDefaultBarcodeSettings = function () {
            var pageSettings = {
                type: 'A4',
                height: 842,
                width: 595,
                hwRatio: (842 / 595)//1.4145
            };
            var pageSettingsPx = {
                type: pageSettings.type,
                height: pageSettings.height + 'px',
                width: pageSettings + 'px',
                hwRatio: (pageSettings.height / pageSettings.width)//1.4145
            };

            var barcodeHeight = angular.copy(self.globalSetting.barcodeElements.height),
                barcodeWidth = angular.copy(self.globalSetting.barcodeElements.width);

            barcodeHeight = barcodeHeight.indexOf('px') > -1 ? Number(barcodeHeight.substring(0, barcodeHeight.indexOf('px'))) : Number(barcodeHeight);
            barcodeWidth = barcodeWidth.indexOf('px') > -1 ? Number(barcodeWidth.substring(0, barcodeWidth.indexOf('px'))) : Number(barcodeWidth);

            var barcodeSize = {
                height: barcodeHeight,
                width: barcodeWidth
            };
            var barcodeSizePx = {
                height: barcodeSize.height + 'px',
                width: barcodeSize.width + 'px'
            };
            var barcodeBoxPosition = {
                //left: (pageSettings.width - barcodeSize.width) - self.documentSecurity.locationX2D,
                left: self.documentSecurity.locationX2D,
                top: (pageSettings.height - barcodeSize.height) - self.documentSecurity.locationY2D
            };
            var barcodeBoxPositionPx = {
                left: barcodeBoxPosition.left + 'px',
                top: barcodeBoxPosition.top + 'px'
            };
            var barcodeBoxPositionSize = {
                left: barcodeBoxPosition.left,
                top: barcodeBoxPosition.top,
                height: barcodeSize.height,
                width: barcodeSize.width
            };
            var barcodeBoxPositionSizePx = {
                left: barcodeBoxPositionPx.left,
                top: barcodeBoxPositionPx.top,
                height: barcodeSizePx.height,
                width: barcodeSizePx.width
            };

            self.barcodeSpecs = {
                pageSettings: pageSettings,
                pageSettingsPx: pageSettingsPx,
                barcodeSize: barcodeSize,
                barcodeSizePx: barcodeSizePx,
                barcodeBoxPosition: barcodeBoxPosition,
                barcodeBoxPositionPx: barcodeBoxPositionPx,
                barcodeBoxPositionSize: barcodeBoxPositionSize,
                barcodeBoxPositionSizePx: barcodeBoxPositionSizePx
            };
        };

        self.checkDisabledDocSecurity = function (type) {
            type = type.toLowerCase();
            var enabled = true;
            if (type === 'outgoing') {
                enabled = self.documentSecurityOutgoing.status;
            }
            else if (type === 'incoming') {
                enabled = self.documentSecurityIncoming.status;
            }
            else if (type === 'internal') {
                enabled = self.documentSecurityInternal.status;
            }
            else if (type === 'tawasolattachment') {
                enabled = self.documentSecurityTawasolAttachment.status;
            }
            return !(self.documentSecurity.status && enabled);
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
                .then(function () {

                })
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
        }

    });
};


/* function _setDocSecurityType(docType) {
     var type = docType.lookupStrKey;
     if (type.toLowerCase() === 'tawasolattachment')
         type = 'TawasolAttachment';
     else
         type = generator.ucFirst(type.toLowerCase());

     self['documentSecurity' + type] = new DocumentSecuritySetting({documentType: docType.lookupKey});
 }

 self.resetDocSecurityByType = function (type) {
     if (!type || type.toLowerCase() === 'all') {
         _.map(self.availableDocTypesToProtect, function (docType) {
             _setDocSecurityType(docType);
         });
     }
     else {
         type = _.find(self.availableDocTypesToProtect, function (docType) {
             return docType.lookupKey === type;
         });
         _setDocSecurityType(type);
     }
 };
 self.resetDocSecurityByType();*/
