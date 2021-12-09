module.exports = function (app) {
    app.controller('viewDocumentPopCtrl', function (correspondence,
                                                    dialog,
                                                    correspondenceService,
                                                    fullAccess,
                                                    documentUrl,
                                                    $element,
                                                    outgoing,
                                                    OUDocumentFile,
                                                    buttonsToShow,
                                                    toast,
                                                    langService,
                                                    $timeout,
                                                    justView,
                                                    documentFileService,
                                                    documentTypeService,
                                                    managerService) {
        'ngInject';

        var self = this;
        self.controllerName = 'viewDocumentPopCtrl';
        self.fullscreen = false;
        self.buttonsToShow = buttonsToShow;
        self.documentUrl = justView ? documentUrl : documentUrl.viewURL;
        self.fullScreenToggle = function () {
            self.fullscreen = !self.fullscreen;
        };
        self.src = './assets/images/document.jpg';
        // validation for accordion
        self.validation = true;
        // collapse from label
        self.collapse = true;

        self.outgoing = outgoing;


        self.maxCreateDate = new Date();


        self.preventPropagation = function ($event) {
            $event.stopPropagation();
        };

        self.shortcut = {
            /**
             * add new document as shortcut.
             * @param $event
             */
            addNewDocumentType: function ($event) {
                documentTypeService
                    .controllerMethod
                    .documentTypeAdd($event)
                    .then(function (documentType) {
                        toast.success(langService.get('add_success').change({name: documentType.getNames()}));
                        self.documentTypes.unshift(documentType);
                        self.outgoing.docType = documentType;
                    });
            },
            /**
             * add new documentFile as shortcut.
             * @param $event
             */
            addNewDocumentFile: function ($event) {
                documentFileService.getDocumentFiles()
                    .then(function () {
                        documentFileService
                            .controllerMethod
                            .documentFileAdd(null, $event)
                            .then(function (documentFile) {
                              //  toast.success(langService.get('add_success').change({name: documentFile.getNames()}));
                                self.documentFiles.unshift(new OUDocumentFile({file: documentFile}));
                                self.outgoing.fileId = documentFile;
                            });
                    })
            }
        };

        self.saveCorrespondence = function (statue) {
            self.outgoing
                .saveDocument(statue)
                .then(function (result) {
                    self.outgoing = result;
                    toast.success(langService.get('outgoing_metadata_saved_success'));
                    self.model = angular.copy(self.outgoing);
                }).catch(function (error) {
                toast.error(error);
            });
        };

        self.openManageDocumentTags = function ($event) {
            managerService
                .manageDocumentTags(self.outgoing, $event)
                .then(function (result) {
                    self.outgoing = result;
                })
                .catch(function (result) {
                    self.outgoing = result;
                });
        };

        self.openManageDocumentAttachments = function ($event) {
            managerService
                .manageDocumentAttachments(self.outgoing.vsId, self.outgoing.docClassName, self.outgoing.docSubject, $event)
                .then(function (attachments) {
                    self.outgoing.attachments = attachments;
                })
                .catch(function (attachments) {
                    self.outgoing.attachments = attachments;
                });
        };

        self.openManageDocumentComments = function ($event) {
            self.outgoing.manageDocumentComments($event)
                .then(function (documentComments) {
                    self.outgoing.documentComments = documentComments;
                })
                .catch(function (documentComments) {
                    self.outgoing.documentComments = documentComments;
                });
        };

        self.openManageDocumentProperties = function ($event) {
            var properties = [
                'attachments',
                'linkedEntities',
                'documentComments',
                'linkedDocs',
                'sitesInfoTo',
                'sitesInfoCC'
            ];

            managerService
                .manageDocumentProperties(self.outgoing.vsId, self.outgoing.docClassName, self.outgoing.docSubject, $event)
                .then(function (document) {
                    self.outgoing = generator.preserveProperties(properties, self.outgoing, document);
                })
                .catch(function (document) {
                    self.outgoing = generator.preserveProperties(properties, self.outgoing, document);
                });

        };

        /**
         * @description process callback of buttons without params
         * @param callbackMethod
         * @param model
         * @param $event
         */
        self.processButtonsCallback = function (callbackMethod, model, $event) {
            callbackMethod(model, $event);
        };

        /**
         * @description process callback of buttons with params
         * @param callbackMethod
         * @param model
         * @param params
         * @param $event
         */
        self.processButtonsCallbackWithParams = function (callbackMethod, model, params, $event) {
            callbackMethod(model, params, $event);
        };

        self.closeView = function () {
            /*if (justView) {
                return dialog.cancel();
            }
            correspondence.saveDocumentWithContent(documentUrl).then(function () {
                dialog.cancel();
            });*/
            if (justView) {
                return dialog.hide();
            }
            correspondence.saveDocumentWithContent(documentUrl).then(function () {
                dialog.hide();
            });
        };

    });
};
