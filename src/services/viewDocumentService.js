module.exports = function (app) {
    app.service('viewDocumentService', function (dialog,
                                                 generator,
                                                 $http,
                                                 $sce,
                                                 urlService,
                                                 cmsTemplate,
                                                 classificationService,
                                                 outgoingService,
                                                 documentTypeService,
                                                 documentFileService,
                                                 managerService,
                                                 validationService,
                                                 langService,
                                                 toast,
                                                 employeeService,
                                                 $timeout,
                                                 lookupService,
                                                 organizationService) {
        'ngInject';
        var self = this;
        self.serviceName = 'viewDocumentService';
        self.document = {
            'content': './assets/images/document.jpg',
            'author': 'A.Smith',
            'sender': 'Another',
            'due': '20/05/17',
            'received': '10/05/17',
            'serial': '134567892',
            'description': 'This report covers our findings based on the research that we conducted as part of phase one.',
            'linkedDocuments': [{'id': 1, 'name': 'Document 1'}, {'id': 2, 'name': 'Document 2'}],
            'attachments': [{'id': 1, 'name': 'Attachment 1'}, {'id': 2, 'name': 'Attachment 2'}],
            'linkedPersons': [{'id': 1, 'name': 'Person 1'}, {'id': 2, 'name': 'Person 2'}],
            'notes': 'Testing notes'
        };

        function _checkView(info, justView) {
            return info.documentClass.toLowerCase() === 'incoming' ? true : justView;
        }

        self.loadDocumentViewUrl = function (vsId) {
            return $http.get((urlService.officeWebApps).replace('{{vsId}}', vsId))
                .then(function (result) {
                    console.log('RESUTL', result);
                    return result.data.rs;
                });
        };

        self.loadDocumentViewUrlWithOutEdit = function (vsId) {
            return $http.get((urlService.officeWebApps).replace('{{vsId}}', vsId).replace('/edit', ''))
                .then(function (result) {
                    return result.data.rs;
                });
        };


        self.openDocumentPopup = function (outgoing, fullAccess, buttonsToShow, $event, justView) {
            if (!outgoing.hasContent()) {
                dialog.alertMessage(langService.get('content_not_found'));
                return;
            }

            /*if(!employeeService.hasPermissionTo('VIEW_DOCUMENT')){
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }*/

            var info = outgoing.getInfo();
            justView = _checkView(info, justView);

            dialog
                .showDialog({
                    targetEvent: $event,
                    template: cmsTemplate.getPopup('view-document'),
                    controller: 'viewDocumentPopCtrl',
                    controllerAs: 'ctrl',
                    locals: {
                        fullAccess: fullAccess,
                        outgoing: outgoing,
                        buttonsToShow: buttonsToShow,
                        justView: justView
                    },
                    resolve: {
                        attachments: function () {
                            'ngInject';
                            return outgoing.loadDocumentAttachments().then(function (attachments) {
                                outgoing.attachments = attachments;
                                return attachments;
                            }).catch(function (e) {
                                console.log(e);
                            });
                        },
                        documentComments: function () {
                            'ngInject';
                            return outgoing.loadDocumentComments().then(function (documentComments) {
                                outgoing.documentComments = documentComments;
                                return documentComments;
                            }).catch(function (e) {
                                console.log(e);
                            });
                        },
                        documentUrl: function () {
                            'ngInject';
                            var method = justView ? 'loadDocumentViewUrlWithOutEdit' : 'loadDocumentViewUrl';
                            return self[method](outgoing.vsId)
                                .then(function (result) {
                                    if (justView) {
                                        return $sce.trustAsResourceUrl(result);
                                    } else {
                                        result.viewURL = $sce.trustAsResourceUrl(result.viewURL);
                                        return result;
                                    }
                                });
                        },
                        correspondence: function (correspondenceService) {
                            'ngInject';
                            return correspondenceService.loadCorrespondenceByVsIdClass(info.vsId, info.documentClass);
                        }
                    }

                });
        };

        self.openFakeDocumentPopup = function (outgoing, fullAccess, buttonsToShow, $event, justView) {
           /* if(!employeeService.hasPermissionTo('VIEW_DOCUMENT')){
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }*/
            var info = outgoing.getInfo();
            console.log('justView',arguments);
            justView = _checkView(info, justView);

            return dialog
                .showDialog({
                    targetEvent: $event,
                    template: cmsTemplate.getPopup('view-document'),
                    controller: 'viewDocumentPopCtrl',
                    controllerAs: 'ctrl',
                    escapeToClose: false,
                    locals: {
                        fullAccess: fullAccess,
                        outgoing: outgoing,
                        attachments: [],
                        documentComments: [],
                        buttonsToShow: buttonsToShow,
                        justView: justView
                    },
                    resolve: {
                        documentUrl: function () {
                            'ngInject';
                            var method = justView ? 'loadDocumentViewUrlWithOutEdit' : 'loadDocumentViewUrl';
                            return self[method](outgoing.generalStepElm.vsId)
                                .then(function (result) {
                                    if (justView) {
                                        return $sce.trustAsResourceUrl(result);
                                    } else {
                                        result.viewURL = $sce.trustAsResourceUrl(result.viewURL);
                                        return result;
                                    }
                                });
                        },
                        correspondence: function (correspondenceService) {
                            'ngInject';
                            return correspondenceService.loadCorrespondenceByVsIdClass(info.vsId, info.documentClass);
                        }

                    }

                });
        };

        self.openQuickSearchDocumentPopup = function (correspondence, fullAccess, buttonsToShow, $event, justView) {
            /*if(!employeeService.hasPermissionTo('VIEW_DOCUMENT')){
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }*/
            var info = correspondence.getInfo();
            justView = info.documentClass === 'incoming' ? true : justView;
            dialog
                .showDialog({
                    targetEvent: $event,
                    template: cmsTemplate.getPopup('view-document'),
                    controller: 'viewDocumentPopCtrl',
                    controllerAs: 'ctrl',
                    locals: {
                        fullAccess: fullAccess,
                        outgoing: correspondence,
                        attachments: [],
                        documentComments: [],
                        buttonsToShow: buttonsToShow,
                        justView: justView
                    },
                    resolve: {
                        documentUrl: function () {
                            'ngInject';
                            var method = justView ? 'loadDocumentViewUrlWithOutEdit' : 'loadDocumentViewUrl';
                            return self[method](correspondence.vsId)
                                .then(function (result) {
                                    if (justView) {
                                        return $sce.trustAsResourceUrl(result);
                                    } else {
                                        result.viewURL = $sce.trustAsResourceUrl(result.viewURL);
                                        return result;
                                    }
                                });
                        },
                        correspondence: function (correspondenceService) {
                            'ngInject';
                            return correspondenceService.loadCorrespondenceByVsIdClass(info.vsId, info.documentClass);
                        }
                    }

                });
        };
        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteViewDocument, self.updateViewDocument);
    });
};
