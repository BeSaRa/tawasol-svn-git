module.exports = function (app) {
    app.controller('signaturePopCtrl', function (lookupService,
                                                 userInboxService,
                                                 $q,
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
        self.signatureChunks = _.chunk(signatures, 4);

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
          userInboxService
              .signDocument(userInbox, self.selectedSignature)
              .then(function(result){
                  if(result)
                      dialog.hide(true);
                  else
                      toast.error(langService.get('something_happened_when_sign'));
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