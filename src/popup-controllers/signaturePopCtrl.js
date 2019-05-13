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
                                                 additionalData) {
        'ngInject';
        var self = this;

        self.controllerName = 'signaturePopCtrl';

        self.progress = null;

        /**
         * @description All signatures
         * @type {*}
         */
        self.signatures = signatures;

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
            if (workItem.isComposite()) {
                return dialog
                    .confirmMessage(langService.get('document_is_composite'))
                    .then(function () {
                        return _approveBook(workItem, self.selectedSignature, true, false, additionalData);
                    })
                    .catch(function () {
                        return _approveBook(workItem, self.selectedSignature, false, false, additionalData);
                    })
            } else {
                return _approveBook(workItem, self.selectedSignature, false, false, additionalData);
            }
        };

        var _approveBook = function (workItem, selectedSignature, isComposite, ignoreMessage, additionalData) {
            return correspondenceService.approveCorrespondence(workItem, selectedSignature, isComposite, ignoreMessage, additionalData)
                .then(function (result) {
                    dialog.hide(result);
                    return result;
                });
        };

        /**
         * @description Close the popup
         */
        self.closeSignaturesPopupFromCtrl = function () {
            dialog.cancel();
        }

    });
};
