module.exports = function (app) {
    app.controller('signaturePopCtrl', function (lookupService,
                                                 userInboxService,
                                                 $q,
                                                 correspondenceService,
                                                 langService,
                                                 toast,
                                                 dialog,
                                                 userInbox,
                                                 signatures) {
        'ngInject';
        var self = this;

        self.controllerName = 'signaturePopCtrl';

        self.progress = null;

        /**
         * @description All signatures
         * @type {*}
         */
        self.signatures = signatures;
        self.signatureChunks = _.chunk(signatures, 5);

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
                        return ( self.signatures.length + 21);
                    }
                }
            ]
        };

        /**
         * @description Set the selected signature
         * @param signature
         * @param $event
         */
        self.setSelectedSignature = function(signature, $event){
            self.selectedSignature = signature
        };

        /**
         * @description Sign the document
         * @param $event
         */
        self.signDocumentFromCtrl = function($event){
          correspondenceService
              .approveCorrespondence(userInbox , self.selectedSignature)
              .then(function (result) {
                  dialog.hide(result);
              })
        };

        /**
         * @description Close the popup
         */
        self.closeSignaturesPopupFromCtrl = function () {
            dialog.cancel();
        }

    });
};