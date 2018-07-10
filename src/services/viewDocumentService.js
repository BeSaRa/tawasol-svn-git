module.exports = function (app) {
    app.provider('viewDocumentService', function () {
        var provider = this, pageNames = {};

        provider.addPageName = function (pageName) {
            pageNames.hasOwnProperty(pageName) ? console.error('Page Already exists ') :
                pageNames[pageName] = {
                    disableProperties: false,
                    disableSites: false,
                    disableAll: false
                };
            return provider;
        };

        provider.getPageByName = function (pageName) {
            return pageNames.hasOwnProperty(pageName) ? pageNames[pageName] : console.error('PageName Not Exists: ', pageName);
        };

        provider.$get = function (dialog,
                                  generator,
                                  $http,
                                  $sce,
                                  urlService,
                                  cmsTemplate,
                                  Correspondence,
                                  General,
                                  G2G,
                                  G2GMessagingHistory,
                                  Outgoing,
                                  Internal,
                                  Incoming,
                                  WorkItem,
                                  EventHistory) {
            'ngInject';
            var self = this;
            self.serviceName = 'viewDocumentService';
            // number of opened popup
            self.popupNumber = 0;

            function _getPage(pageName) {
                return provider.getPageByName(pageName);
            }

            self.getPageName = function (pageName, propCallback, sitesCallback, allCallback) {
                var page = _getPage(pageName);
                if (!page)
                    return;

                page.disableAll = allCallback;
                page.disableProperties = propCallback;
                page.disableSites = sitesCallback;
                return self;
            };

            /**
             * @description Get the readonly document view url
             * Used for get link.
             * @param vsId
             */
            self.loadDocumentViewUrlWithOutEdit = function (vsId) {
                return $http.get((urlService.officeWebApps).replace('{{vsId}}', vsId).replace('/edit', ''))
                    .then(function (result) {
                        return result.data.rs;
                    });
            };


            /**
             * @description to create the url schema depend on document class and vsId if found.
             * @param vsId
             * @param documentClass
             * @param extension
             * @return {string}
             * @private
             */
            function _createUrlSchema(vsId, documentClass, extension) {
                var url = [urlService.correspondence];
                vsId = (vsId ? vsId : null);
                documentClass = documentClass ? documentClass.toLowerCase() : null;
                if (documentClass)
                    url.push(documentClass);
                if (vsId)
                    url.push(vsId);
                if (extension)
                    url.push(extension);
                return url.join('/');
            }

            /**
             * the registered models for our CMS
             * @type {{outgoing: (Outgoing|*), internal: (Internal|*), incoming: (Incoming|*)}}
             */
            self.models = {
                outgoing: Outgoing,
                internal: Internal,
                incoming: Incoming,
                general: General,
                g2g: G2G,
                g2gmessaginghistory: G2GMessagingHistory
            };

            self.screenLookups = {
                outgoing: {},
                incoming: {},
                internal: {},
                general: {}
            };

            /**
             * @description to specifying the model Name from given document class.
             * @param documentClass
             * @return {string}
             * @private
             */
            function _getModelName(documentClass) {
                documentClass = documentClass.toLowerCase();
                return documentClass.charAt(0).toUpperCase() + documentClass.substr(1);
            }


            function _getModel(documentClass) {
                return self.models[documentClass.toLowerCase()];
            }

            function _checkDisabled(pageName, model) {
                var page = _getPage(pageName);
                console.log(page);
                return {
                    disableAll: page ? page.disableAll(model) : false,
                    disableProperties: page ? page.disableProperties(model) : false,
                    disableSites: page ? page.disableSites(model) : false
                }
            }


            /**
             * @description Open the view popup for queues
             * @param correspondence
             * @param actions
             * @param $event
             * @param pageName
             */
            self.viewQueueDocument = function (correspondence, actions, $event, pageName) {
                var info = typeof correspondence.getInfo === 'function' ? correspondence.getInfo() : new Outgoing(correspondence).getInfo();
                var disabled = _checkDisabled(pageName, correspondence);

                if (disabled.disableAll) {
                    disabled.disableSites = true;
                    disabled.disableProperties = true;
                }

                console.log(disabled);

                return $http.get(_createUrlSchema(info.vsId, info.documentClass, 'with-content'))
                    .then(function (result) {
                        var documentClass = result.data.rs.metaData.classDescription;
                        result.data.rs.metaData = generator.interceptReceivedInstance(['Correspondence', _getModelName(documentClass), 'View' + _getModelName(documentClass)], generator.generateInstance(result.data.rs.metaData, _getModel(documentClass)));
                        return result.data.rs;
                    })
                    .then(function (result) {
                        result.content.viewURL = $sce.trustAsResourceUrl(result.content.viewURL);
                        self.popupNumber += 1;
                        return dialog.showDialog({
                            template: cmsTemplate.getPopup('view-correspondence-new'),
                            controller: 'viewCorrespondencePopCtrl',
                            controllerAs: 'ctrl',
                            bindToController: true,
                            escapeToCancel: false,
                            locals: {
                                correspondence: result.metaData,
                                content: result.content,
                                actions: actions,
                                workItem: false,
                                disableProperties: disabled.disableProperties,
                                disableCorrespondence: disabled.disableSites,
                                popupNumber: self.popupNumber
                            },
                            resolve: {
                                organizations: function (organizationService) {
                                    'ngInject';
                                    return organizationService.getOrganizations();
                                },
                                lookups: function (correspondenceService) {
                                    'ngInject';
                                    return correspondenceService.loadCorrespondenceLookups(info.documentClass);
                                }
                            }
                        }).then(function () {
                            self.popupNumber -= 1;
                            return true;
                        }).catch(function () {
                            self.popupNumber -= 1;
                            return false;
                        });
                    });
            };

            self.viewUserInboxDocument = function (workItem, gridActions, disableProperties, disableDestinations, $event) {

            };

            self.viewUserSentDocument = function (sentItem, gridActions, disableProperties, disableDestinations, $event) {

            };

            self.viewDepartmentIncomingDocument = function (departmentIncomingDocument, gridActions, disableProperties, disableDestinations, $event) {

            };

            self.viewDepartmentReturnedDocument = function (departmentReturnedDocument, gridActions, disableProperties, disableDestinations, $event) {

            };

            self.viewDepartmentSentDocument = function (departmentSentDocument, gridActions, disableProperties, disableDestinations, $event) {

            };

            self.viewDepartmentReadyToExportDocument = function (workItem, gridActions, disableProperties, disableDestinations, $event) {

            };

            return self;
        }
    });
};
