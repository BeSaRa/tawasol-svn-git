module.exports = function (app) {
    app.controller('signaturePopCtrl', function (lookupService,
                                                 userInboxService,
                                                 $q,
                                                 correspondenceService,
                                                 langService,
                                                 toast,
                                                 dialog,
                                                 workItem,
                                                 signatures,
                                                 additionalData,
                                                 exportData,
                                                 ignoreMessage,
                                                 attachment,
                                                 attachmentService,
                                                 _,
                                                 rootEntity,
                                                 pinCodeRequired) {
        'ngInject';
        var self = this;

        self.controllerName = 'signaturePopCtrl';
        self.attachment = attachment;
        self.progress = null;
        self.rootEntity = rootEntity;

        /**
         * @description All signatures
         * @type {*}
         */
        self.signatures = signatures;
        self.pinCodeRequired = pinCodeRequired;
        self.exportData = exportData;

        var signatureChunkLength = 5;
        self.signatureChunks = _.chunk(signatures, signatureChunkLength);

        self.getEmptySigns = function (chunk) {
            var diff = signatureChunkLength - chunk.length;
            return (new Array(diff));
        };


        /**
         * @description Contains the selected signatures
         * @type {Array}
         */
        self.selectedSignature = null;
        self.pinCode = null;

        /**
         * @description Contains options for grid configuration
         * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
         */
        self.grid = {
            limit: 5, // default limit
            page: 1, // first page
            order: 'arName', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.signatures.length + 21);
                    }
                }
            ]
        };

        /**
         * @description Set the selected signature
         * @param signature
         * @param $event
         */
        self.setSelectedSignature = function (signature, $event) {
            if (self.selectedSignature && self.selectedSignature.vsId === signature.vsId) {
                self.selectedSignature = null;
            } else {
                self.selectedSignature = signature;
            }
        };

        self.isSignatureSelected = function (signature) {
            if (!self.selectedSignature)
                return false;
            return self.selectedSignature.vsId === signature.vsId;
        };

        /**
         * @description Sign the document
         * @param $event
         */
        self.signDocumentFromCtrl = function ($event) {
            if (self.checkDisabled()) {
                return false;
            }
            var isComposite = workItem.isWorkItem() ? workItem.isComposite() : workItem.isCompositeSites();
            if (isComposite) {
                return dialog
                    .confirmMessage(langService.get('document_is_composite'))
                    .then(function () {
                        return _approveBook(workItem, true, ignoreMessage, additionalData);
                    })
                    .catch(function () {
                        return _approveBook(workItem, false, ignoreMessage, additionalData);
                    })
            } else {
                return _approveBook(workItem, false, ignoreMessage, additionalData);
            }
        };

        var _approveBook = function (workItem, isComposite, ignoreMessage, additionalData) {
            return correspondenceService.approveCorrespondence(workItem, self.selectedSignature, self.pinCode, isComposite, ignoreMessage, additionalData, null, self.exportData)
                .then(function (result) {
                    if (result === 'AUTHORIZE_CANCELLED') {
                        return result;
                    }
                    dialog.hide(result);
                    return result;
                });
        };

        self.signAttachmentFromCtrl = function ($event) {
            return attachmentService.authorizeContract(workItem, self.attachment, self.selectedSignature)
                .then(function (result) {
                    dialog.hide(result);
                    return result;
                })
        }

        /**
         * @description Checks if approve button is disabled
         * @returns {boolean}
         */
        self.checkDisabled = function () {
            if (self.pinCodeRequired) {
                return !self.selectedSignature || !self.pinCode;
            }
            return !self.selectedSignature;
        };

        /**
         * @description Close the popup
         */
        self.closeSignaturesPopupFromCtrl = function () {
            dialog.cancel();
        }

    });
};
