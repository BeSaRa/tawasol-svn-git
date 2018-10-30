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
                                  $timeout,
                                  $sce,
                                  $q,
                                  CMSModelInterceptor,
                                  urlService,
                                  cmsTemplate,
                                  langService,
                                  Correspondence,
                                  General,
                                  Outgoing,
                                  Internal,
                                  Incoming,
                                  DocumentComment,
                                  localStorageService,
                                  Attachment,
                                  LinkedObject) {
            'ngInject';
            var self = this,
                GeneralStepElementView,
                WorkItem,
                EventHistory,
                SentItemDepartmentInbox;
            self.serviceName = 'viewDocumentService';
            // number of opened popup
            self.popupNumber = 0;

            function _getPage(pageName) {
                return provider.getPageByName(pageName);
            }

            function _setPage(page, allCallback, propCallback, sitesCallback) {
                allCallback ? _setDisable(page, 'disableAll', allCallback) : null;
                propCallback ? _setDisable(page, 'disableProperties', propCallback) : null;
                sitesCallback ? _setDisable(page, 'disableSites', sitesCallback) : null;
            }

            function _setDisable(page, propertyName, callback) {
                page[propertyName] = callback;
            }

            self.getPageName = function (pageName, propCallback, sitesCallback, allCallback) {
                var page = _getPage(pageName);
                if (!page)
                    return;
                _setPage(page, allCallback, propCallback, sitesCallback);
                return self;
            };

            self.getPageNameOverride = function (pageName, pageNameOverride, override) {
                var oPage = _getPage(pageNameOverride);
                var page = _getPage(pageName);

                if (!page || !oPage)
                    return;
                // override page by selected page
                _setPage(page, oPage.disableAll, oPage.disableProperties, oPage.disableSites);
                // override again if you have any special override functions
                if (!override)
                    override = {};
                _setPage(page, override.disableAll, override.disableProperties, override.disableSites);
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

            function _createWorkItemSchema(info, department, readyToExport) {
                var url = [readyToExport ? urlService.readyToExports : (department) ? urlService.departmentWF : urlService.inboxWF];
                if (!readyToExport)
                    url.push('wob-num');
                url.push(info.wobNumber);
                return url.join('/');
            }

            function _createCorrespondenceWFSchema() {
                var url = [urlService.correspondenceWF];
                if (arguments[0] && angular.isArray(arguments[0])) {
                    url = url.concat(arguments[0]);
                } else {
                    url = url.concat(arguments);
                }
                return url.join('/')
            }

            function _getDocumentClass(correspondence) {
                var documentClass = null;
                if (correspondence.hasOwnProperty('docClassName') && correspondence.docClassName) {
                    documentClass = correspondence.docClassName;
                } else if (correspondence.hasOwnProperty('classDescription') && correspondence.classDescription) {
                    documentClass = correspondence.classDescription;
                } else if (correspondence.hasOwnProperty('generalStepElm')) {
                    documentClass = generator.getDocumentClassName(correspondence.generalStepElm.docType);
                } else { // if notification Item
                    documentClass = generator.getDocumentClassName(correspondence.docClassId);
                }
                return documentClass ? documentClass.toLowerCase() : documentClass;
            }

            self.interceptReceivedCollectionBasedOnEachDocumentClass = function (collection) {
                _.map(collection, function (correspondence, key) {
                    var documentClass = _getModelName(_getDocumentClass(correspondence));
                    correspondence = generator.generateInstance(correspondence, _getModel(documentClass));
                    collection[key] = generator.interceptReceivedInstance(['Correspondence', documentClass], correspondence);
                });
                return collection;
            };

            /**
             * the registered models for our CMS
             * @type {{outgoing: (Outgoing|*), internal: (Internal|*), incoming: (Incoming|*)}}
             */
            self.models = {
                outgoing: Outgoing,
                internal: Internal,
                incoming: Incoming,
                general: General
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

            function _createInstance(correspondence) {
                return new Correspondence(correspondence);
            }

            function _getModel(documentClass) {
                return self.models[documentClass.toLowerCase()];
            }

            function _checkDisabled(pageName, model) {
                var page = _getPage(pageName);
                //console.log(page);
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
            self.viewQueueDocumentById = function (correspondence, actions, pageName, $event) {
                var info = typeof correspondence.getInfo === 'function' ? correspondence.getInfo() : new Outgoing(correspondence).getInfo();
                var disabled = _checkDisabled(pageName, correspondence);

                if (disabled.disableAll) {
                    disabled.disableSites = true;
                    disabled.disableProperties = true;
                }
                return $http.get(_createUrlSchema(null, info.documentClass, 'id/' + info.id + '/with-content'))
                    .then(function (result) {
                        var documentClass = result.data.rs.metaData.classDescription;
                        result.data.rs.metaData = generator.interceptReceivedInstance(['Correspondence', _getModelName(documentClass), 'View' + _getModelName(documentClass)], generator.generateInstance(result.data.rs.metaData, _getModel(documentClass)));
                        return result.data.rs;
                    })
                    .then(function (result) {
                        result.metaData.viewVersion = true;
                        result.content.viewURL = $sce.trustAsResourceUrl(result.content.viewURL);
                        self.popupNumber += 1;
                        return dialog.showDialog({
                            template: cmsTemplate.getPopup('view-correspondence-new'),
                            controller: 'viewCorrespondencePopCtrl',
                            controllerAs: 'ctrl',
                            targetEvent: $event,
                            bindToController: true,
                            escapeToCancel: false,
                            locals: {
                                correspondence: result.metaData,
                                content: result.content,
                                actions: actions,
                                workItem: false,
                                disableProperties: disabled.disableProperties,
                                disableCorrespondence: disabled.disableSites,
                                popupNumber: self.popupNumber,
                                disableEverything: disabled.disableAll
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

            /**
             * @description Open the view popup for queues
             * @param correspondence
             * @param actions
             * @param $event
             * @param pageName
             */
            self.viewQueueDocument = function (correspondence, actions, pageName, $event) {
                var info = typeof correspondence.getInfo === 'function' ? correspondence.getInfo() : new Outgoing(correspondence).getInfo();
                var disabled = _checkDisabled(pageName, correspondence);

                if (disabled.disableAll) {
                    disabled.disableSites = true;
                    disabled.disableProperties = true;
                }
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
                                popupNumber: self.popupNumber,
                                disableEverything: disabled.disableAll
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


            /**
             * @description Open the new view popup for favorite documents
             * @param favoriteDocument
             * @param actions
             * @param $event
             * @param pageName
             */
            self.viewFavoriteDocument = function (favoriteDocument, actions, pageName, $event) {
                var info = null;
                if (typeof favoriteDocument.getInfo === 'function')
                    info = favoriteDocument.getInfo();
                else {
                    var model = self.models[favoriteDocument.classDescription.toLowerCase()];
                    info = new model(favoriteDocument).getInfo();
                }
                var disabled = _checkDisabled(pageName, favoriteDocument);

                if (disabled.disableAll) {
                    disabled.disableSites = true;
                    disabled.disableProperties = true;
                }
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
                                popupNumber: self.popupNumber,
                                disableEverything: disabled.disableAll
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

            /**
             * @description Open the view popup for workItems under userInbox
             * @param workItem
             * @param actions
             * @param $event
             * @param pageName
             */
            self.viewUserInboxDocument = function (workItem, actions, pageName, $event) {
                var info = typeof workItem.getInfo === 'function' ? workItem.getInfo() : new WorkItem(workItem).getInfo();
                var disabled = _checkDisabled(pageName, workItem);

                if (disabled.disableAll) {
                    disabled.disableSites = true;
                    disabled.disableProperties = true;
                }

                return $http.get(urlService.inboxWF + '/wob-num/' + info.wobNumber)
                    .then(function (result) {
                        return generator.interceptReceivedInstance('GeneralStepElementView', generator.generateInstance(result.data.rs, GeneralStepElementView));
                    })
                    .then(function (generalStepElementView) {
                        self.popupNumber += 1;
                        return dialog.showDialog({
                            template: cmsTemplate.getPopup('view-correspondence-new'),
                            controller: 'viewCorrespondencePopCtrl',
                            controllerAs: 'ctrl',
                            bindToController: true,
                            escapeToCancel: false,
                            locals: {
                                correspondence: generalStepElementView.correspondence,
                                content: generalStepElementView.documentViewInfo,
                                actions: actions,
                                workItem: generalStepElementView,
                                readyToExport: false,
                                disableProperties: disabled.disableProperties,
                                disableCorrespondence: disabled.disableSites,
                                disableEverything: disabled.disableAll,
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
                        })
                            .then(function () {
                                self.popupNumber -= 1;
                                return true;
                            })
                            .catch(function () {
                                self.popupNumber -= 1;
                                return false;
                            });
                    })
                    .catch(function (error) {
                        return errorCode.checkIf(error, 'WORK_ITEM_NOT_FOUND', function () {
                            dialog.errorMessage(langService.get('work_item_not_found').change({wobNumber: info.wobNumber}));
                            return $q.reject('WORK_ITEM_NOT_FOUND');
                        })
                    });
            };

            /**
             * @description Open the view popup for approved internal workItem
             * @param workItem
             * @param actions
             * @param $event
             * @param pageName
             */
            self.viewApprovedInternalDocument = function (workItem, actions, pageName, $event) {
                var info = typeof workItem.getInfo === 'function' ? workItem.getInfo() : new WorkItem(workItem).getInfo();
                var disabled = _checkDisabled(pageName, workItem);

                if (disabled.disableAll) {
                    disabled.disableSites = true;
                    disabled.disableProperties = true;
                }

                return $http.get(_createCorrespondenceWFSchema([info.documentClass, 'approved-queue', 'wob-num', info.wobNumber]))
                    .then(function (result) {
                        return generator.interceptReceivedInstance('GeneralStepElementView', generator.generateInstance(result.data.rs, GeneralStepElementView));
                    })
                    .then(function (generalStepElementView) {
                        self.popupNumber += 1;
                        return dialog.showDialog({
                            template: cmsTemplate.getPopup('view-correspondence-new'),
                            controller: 'viewCorrespondencePopCtrl',
                            controllerAs: 'ctrl',
                            bindToController: true,
                            escapeToCancel: false,
                            locals: {
                                correspondence: generalStepElementView.correspondence,
                                content: generalStepElementView.documentViewInfo,
                                actions: actions,
                                workItem: generalStepElementView,
                                readyToExport: false,
                                disableProperties: disabled.disableProperties,
                                disableCorrespondence: disabled.disableSites,
                                disableEverything: false,
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
                        })
                            .then(function () {
                                self.popupNumber -= 1;
                                return true;
                            })
                            .catch(function () {
                                self.popupNumber -= 1;
                                return false;
                            });
                    })
                    .catch(function (error) {
                        return errorCode.checkIf(error, 'WORK_ITEM_NOT_FOUND', function () {
                            dialog.errorMessage(langService.get('work_item_not_found').change({wobNumber: info.wobNumber}));
                            return $q.reject('WORK_ITEM_NOT_FOUND');
                        })
                    });
            };

            /**
             * @description Open the view popup for proxy mail
             * @param workItem
             * @param actions
             * @param $event
             * @param pageName
             */
            self.viewUserInboxProxyDocument = function (workItem, actions, pageName, $event) {
                var info = typeof workItem.getInfo === 'function' ? workItem.getInfo() : new WorkItem(workItem).getInfo();
                var disabled = _checkDisabled(pageName, workItem);

                if (disabled.disableAll) {
                    disabled.disableSites = true;
                    disabled.disableProperties = true;
                }
                var url = urlService.inboxWF + '/proxy/wob-num/' + info.wobNumber;
                //url = approvedQueue ? _createCorrespondenceWFSchema([info.documentClass, 'approved-queue', 'wob-num', info.wobNumber]) : _createWorkItemSchema(info, department, readyToExport);
                return $http.get(url)
                    .then(function (result) {
                        return generator.interceptReceivedInstance('GeneralStepElementView', generator.generateInstance(result.data.rs, GeneralStepElementView));
                    })
                    .then(function (generalStepElementView) {
                        self.popupNumber += 1;
                        return dialog.showDialog({
                            template: cmsTemplate.getPopup('view-correspondence-new'),
                            controller: 'viewCorrespondencePopCtrl',
                            controllerAs: 'ctrl',
                            bindToController: true,
                            escapeToCancel: false,
                            locals: {
                                correspondence: generalStepElementView.correspondence,
                                content: generalStepElementView.documentViewInfo,
                                actions: actions,
                                workItem: generalStepElementView,
                                readyToExport: false,
                                disableProperties: disabled.disableProperties,
                                disableCorrespondence: disabled.disableSites,
                                disableEverything: false,
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
                        })
                            .then(function () {
                                self.popupNumber -= 1;
                                return true;
                            })
                            .catch(function () {
                                self.popupNumber -= 1;
                                return false;
                            });
                    })
                    .catch(function (error) {
                        return errorCode.checkIf(error, 'WORK_ITEM_NOT_FOUND', function () {
                            dialog.errorMessage(langService.get('work_item_not_found').change({wobNumber: info.wobNumber}));
                            return $q.reject('WORK_ITEM_NOT_FOUND');
                        })
                    });
            };

            /**
             * @description Open the view popup for group mail
             * @param workItem
             * @param actions
             * @param $event
             * @param pageName
             */
            self.viewGroupMailDocument = function (workItem, actions, pageName, $event) {
                var info = typeof workItem.getInfo === 'function' ? workItem.getInfo() : new WorkItem(workItem).getInfo();

                var disabled = _checkDisabled(pageName, workItem);

                if (disabled.disableAll) {
                    disabled.disableSites = true;
                    disabled.disableProperties = true;
                }

                return $http.get([urlService.correspondence, 'ou-queue', 'wob-num', info.wobNumber].join('/'))
                    .then(function (result) {
                        return generator.interceptReceivedInstance('GeneralStepElementView', generator.generateInstance(result.data.rs, GeneralStepElementView));
                    })
                    .then(function (generalStepElementView) {
                        self.popupNumber += 1;
                        return dialog.showDialog({
                            template: cmsTemplate.getPopup('view-correspondence-new'),
                            controller: 'viewCorrespondencePopCtrl',
                            controllerAs: 'ctrl',
                            bindToController: true,
                            escapeToCancel: false,
                            locals: {
                                correspondence: generalStepElementView.correspondence,
                                content: generalStepElementView.documentViewInfo,
                                actions: actions,
                                workItem: generalStepElementView,
                                readyToExport: false,
                                disableProperties: disabled.disableProperties,
                                disableCorrespondence: disabled.disableSites,
                                disableEverything: disabled.disableAll,
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
                        })
                            .then(function () {
                                self.popupNumber -= 1;

                                return true;
                            })
                            .catch(function () {
                                self.popupNumber -= 1;
                                return false;
                            });
                    });
            };

            /**
             * @description Open the view popup for user sent items
             * @param sentItem
             * @param actions
             * @param $event
             * @param pageName
             */
            self.viewUserSentDocument = function (sentItem, actions, pageName, $event) {
                var info = typeof sentItem.getInfo === 'function' ? sentItem.getInfo() : new EventHistory(sentItem).getInfo();
                var disabled = _checkDisabled(pageName, sentItem);

                if (disabled.disableAll) {
                    disabled.disableSites = true;
                    disabled.disableProperties = true;
                }

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

            /**
             * @description Open the view popup for central archive ready to export
             * @param workItem
             * @param actions
             * @param $event
             * @param pageName
             */
            self.viewCentralArchiveReadyToExportDocument = function (workItem, actions, pageName, $event) {
                var info = typeof workItem.getInfo === 'function' ? workItem.getInfo() : new WorkItem(workItem).getInfo();
                var disabled = _checkDisabled(pageName, workItem);

                if (disabled.disableAll) {
                    disabled.disableSites = true;
                    disabled.disableProperties = true;
                }

                return $http.get(_createWorkItemSchema(info, true, true))
                    .then(function (result) {
                        return generator.interceptReceivedInstance('GeneralStepElementView', generator.generateInstance(result.data.rs, GeneralStepElementView));
                    })
                    .then(function (generalStepElementView) {
                        self.popupNumber += 1;
                        return dialog.showDialog({
                            template: cmsTemplate.getPopup('view-correspondence-new'),
                            controller: 'viewCorrespondencePopCtrl',
                            controllerAs: 'ctrl',
                            bindToController: true,
                            escapeToCancel: false,
                            locals: {
                                correspondence: generalStepElementView.correspondence,
                                content: generalStepElementView.documentViewInfo,
                                actions: actions,
                                workItem: generalStepElementView,
                                readyToExport: true,
                                disableProperties: disabled.disableProperties,
                                disableCorrespondence: disabled.disableSites,
                                disableEverything: disabled.disableAll,
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
                        })
                            .then(function () {
                                self.popupNumber -= 1;
                                return true;
                            })
                            .catch(function () {
                                self.popupNumber -= 1;
                                return false;
                            });
                    })
                    .catch(function (error) {
                        return errorCode.checkIf(error, 'WORK_ITEM_NOT_FOUND', function () {
                            dialog.errorMessage(langService.get('work_item_not_found').change({wobNumber: info.wobNumber}));
                            return $q.reject('WORK_ITEM_NOT_FOUND');
                        })
                    });
            };


            /**
             * @description Open the view popup for department incoming document
             * @param workItem
             * @param actions
             * @param $event
             * @param pageName
             */
            self.viewDepartmentIncomingAsWorkItemDocument = function (workItem, actions, pageName, $event) {
                var info = typeof workItem.getInfo === 'function' ? workItem.getInfo() : new WorkItem(workItem).getInfo();
                var disabled = _checkDisabled(pageName, workItem);

                if (disabled.disableAll) {
                    disabled.disableSites = true;
                    disabled.disableProperties = true;
                }

                return $http.get(_createWorkItemSchema(info, true, false))
                    .then(function (result) {
                        return generator.interceptReceivedInstance('GeneralStepElementView', generator.generateInstance(result.data.rs, GeneralStepElementView));
                    })
                    .then(function (generalStepElementView) {
                        self.popupNumber += 1;
                        return dialog.showDialog({
                            template: cmsTemplate.getPopup('view-correspondence-new'),
                            controller: 'viewCorrespondencePopCtrl',
                            controllerAs: 'ctrl',
                            bindToController: true,
                            escapeToCancel: false,
                            locals: {
                                correspondence: generalStepElementView.correspondence,
                                content: generalStepElementView.documentViewInfo,
                                actions: actions,
                                workItem: generalStepElementView,
                                readyToExport: false,
                                disableProperties: disabled.disableProperties,
                                disableCorrespondence: disabled.disableSites,
                                disableEverything: disabled.disableAll,
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
                        })
                            .then(function () {
                                self.popupNumber -= 1;
                                return true;
                            })
                            .catch(function () {
                                self.popupNumber -= 1;
                                return false;
                            });
                    })
                    .catch(function (error) {
                        return errorCode.checkIf(error, 'WORK_ITEM_NOT_FOUND', function () {
                            dialog.errorMessage(langService.get('work_item_not_found').change({wobNumber: info.wobNumber}));
                            return $q.reject('WORK_ITEM_NOT_FOUND');
                        })
                    });
            };

            /**
             * @description Open the view popup for department incoming document
             * @param workItem
             * @param actions
             * @param $event
             * @param pageName
             */
            self.viewDepartmentIncomingAsCorrespondenceDocument = function (workItem, actions, pageName, $event) {
                var info = typeof workItem.getInfo === 'function' ? workItem.getInfo() : new WorkItem(workItem).getInfo();
                var disabled = _checkDisabled(pageName, workItem);

                if (disabled.disableAll) {
                    disabled.disableSites = true;
                    disabled.disableProperties = true;
                }

                var incomingWithIncomingVsId = info.incomingVsId;

                var vsId = incomingWithIncomingVsId ? info.incomingVsId : info.vsId;
                var docClass = incomingWithIncomingVsId ? 'incoming' : info.documentClass;
                return $http.get(_createUrlSchema(vsId, docClass, 'with-content'))
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
                                workItem: workItem,
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

            /**
             * @description Open the view popup for department returned document
             * @param workItem
             * @param actions
             * @param $event
             * @param pageName
             */
            self.viewDepartmentReturnedDocument = function (workItem, actions, pageName, $event) {
                var info = typeof workItem.getInfo === 'function' ? workItem.getInfo() : new WorkItem(workItem).getInfo();
                var disabled = _checkDisabled(pageName, workItem);

                if (disabled.disableAll) {
                    disabled.disableSites = true;
                    disabled.disableProperties = true;
                }

                return $http.get(urlService.departmentWF + '/returned/' + info.wobNumber)
                    .then(function (result) {
                        return generator.interceptReceivedInstance('GeneralStepElementView', generator.generateInstance(result.data.rs, GeneralStepElementView));
                    })
                    .then(function (generalStepElementView) {
                        self.popupNumber += 1;
                        return dialog.showDialog({
                            template: cmsTemplate.getPopup('view-correspondence-new'),
                            controller: 'viewCorrespondencePopCtrl',
                            controllerAs: 'ctrl',
                            bindToController: true,
                            escapeToCancel: false,
                            locals: {
                                correspondence: generalStepElementView.correspondence,
                                content: generalStepElementView.documentViewInfo,
                                actions: actions,
                                workItem: generalStepElementView,
                                readyToExport: false,
                                disableProperties: disabled.disableProperties,
                                disableCorrespondence: disabled.disableSites,
                                disableEverything: false,
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
                        })
                            .then(function () {
                                self.popupNumber -= 1;
                                return true;
                            })
                            .catch(function () {
                                self.popupNumber -= 1;
                                return false;
                            });
                    })
                    .catch(function (error) {
                        return errorCode.checkIf(error, 'WORK_ITEM_NOT_FOUND', function () {
                            dialog.errorMessage(langService.get('work_item_not_found').change({wobNumber: info.wobNumber}));
                            return $q.reject('WORK_ITEM_NOT_FOUND');
                        })
                    });
            };

            /**
             * @description Open the view popup for department sent item document
             * @param sentItem
             * @param actions
             * @param $event
             * @param pageName
             */
            self.viewDepartmentSentItemDocument = function (sentItem, actions, pageName, $event) {
                var info = typeof sentItem.getInfo === 'function' ? sentItem.getInfo() : new Outgoing(sentItem).getInfo();
                var disabled = _checkDisabled(pageName, sentItem);

                if (disabled.disableAll) {
                    disabled.disableSites = true;
                    disabled.disableProperties = true;
                }
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
                                popupNumber: self.popupNumber,
                                disableEverything: disabled.disableAll
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

            /**
             * @description Open the view popup for department ready to export
             * @param workItem
             * @param actions
             * @param $event
             * @param pageName
             */
            self.viewDepartmentReadyToExportDocument = function (workItem, actions, pageName, $event) {
                var info = typeof workItem.getInfo === 'function' ? workItem.getInfo() : new WorkItem(workItem).getInfo();
                var disabled = _checkDisabled(pageName, workItem);

                if (disabled.disableAll) {
                    disabled.disableSites = true;
                    disabled.disableProperties = true;
                }

                return $http.get(_createWorkItemSchema(info, true, true))
                    .then(function (result) {
                        return generator.interceptReceivedInstance('GeneralStepElementView', generator.generateInstance(result.data.rs, GeneralStepElementView));
                    })
                    .then(function (generalStepElementView) {
                        self.popupNumber += 1;
                        return dialog.showDialog({
                            template: cmsTemplate.getPopup('view-correspondence-new'),
                            controller: 'viewCorrespondencePopCtrl',
                            controllerAs: 'ctrl',
                            bindToController: true,
                            escapeToCancel: false,
                            locals: {
                                correspondence: generalStepElementView.correspondence,
                                content: generalStepElementView.documentViewInfo,
                                actions: actions,
                                workItem: generalStepElementView,
                                readyToExport: true,
                                disableProperties: disabled.disableProperties,
                                disableCorrespondence: disabled.disableSites,
                                disableEverything: disabled.disableAll,
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
                        })
                            .then(function () {
                                self.popupNumber -= 1;
                                return true;
                            })
                            .catch(function () {
                                self.popupNumber -= 1;
                                return false;
                            });
                    })
                    .catch(function (error) {
                        return errorCode.checkIf(error, 'WORK_ITEM_NOT_FOUND', function () {
                            dialog.errorMessage(langService.get('work_item_not_found').change({wobNumber: info.wobNumber}));
                            return $q.reject('WORK_ITEM_NOT_FOUND');
                        })
                    });
            };

            /**
             * @description Open the view popup for g2g incoming document
             * @param g2gIncoming
             * @param actions
             * @param $event
             * @param pageName
             */
            self.viewG2GDocument = function (g2gIncoming, actions, pageName, $event) {
                var g2gItemCopy = angular.copy(g2gIncoming);
                var disabled = _checkDisabled(pageName, g2gIncoming);
                var isInternal = g2gIncoming.isInternalG2G();
                if (disabled.disableAll) {
                    disabled.disableSites = true;
                    disabled.disableProperties = true;
                }

                //var site = angular.copy(g2gIncoming.correspondence.site);
                // intercept send instance for G2G
                g2gIncoming = generator.interceptSendInstance('G2G', g2gIncoming);
                // get correspondence from G2G object
                g2gIncoming = g2gIncoming.hasOwnProperty('correspondence') ? g2gIncoming.correspondence : g2gIncoming;

                return $http
                    .put(urlService.g2gInbox + 'open/' + isInternal, g2gIncoming)
                    .then(function (result) {
                        var metaData = result.data.rs.metaData;
                        //metaData.site = site;
                        metaData = generator.interceptReceivedInstance(['Correspondence', 'Incoming', 'ViewIncoming'], generator.generateInstance(metaData, Incoming));

                        metaData.documentComments = _.map(metaData.linkedCommentsList, function (item) {
                            return generator.interceptReceivedInstance('DocumentComment', new DocumentComment(item));
                        });

                        metaData.attachments = _.map([].concat(metaData.linkedAttachmentList || [], metaData.linkedAttachmenstList || [], metaData.linkedExportedDocsList || []), function (item) {
                            return generator.interceptReceivedInstance('Attachment', new Attachment(item))
                        });
                        metaData.linkedDocs = self.interceptReceivedCollectionBasedOnEachDocumentClass(metaData.linkedDocList);
                        metaData.linkedEntities = _.map(metaData.linkedEntitiesList, function (item) {
                            item.documentClass = documentClass;
                            return generator.interceptReceivedInstance('LinkedObject', new LinkedObject(item));
                        });

                        // temporary property added to correspondence(will be removed before send)
                        metaData.internalG2G = isInternal;

                        result.data.rs.metaData = metaData;
                        localStorageService.remove('vsid');
                        localStorageService.set('vsid',metaData.vsId);
                        return result.data.rs;
                    })
                    .then(function (result) {
                        result.content.viewURL = $sce.trustAsResourceUrl(result.content.viewURL);
                        self.popupNumber += 1;
                        return dialog.showDialog({
                            /*template: cmsTemplate.getPopup('view-correspondence-g2g'),
                            controller: 'viewCorrespondenceG2GPopCtrl',*/
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
                                popupNumber: self.popupNumber,
                                disableEverything: true,
                                disableProperties: true,
                                disableCorrespondence: true,
                                g2gItemCopy: g2gItemCopy
                            }
                        }).then(function (result) {
                            self.popupNumber -= 1;
                            return result;
                        }).catch(function (error) {
                            self.popupNumber -= 1;
                            return error;
                        });
                    });
            };

            /**
             * @description Open the view popup for g2g messaging history document
             * @param g2gItem
             * @param actions
             * @param $event
             * @param pageName
             */
            self.viewG2GHistoryDocument = function (g2gItem, actions, pageName, $event) {
                var g2gItemCopy = angular.copy(g2gItem);
                var disabled = _checkDisabled(pageName, g2gItem);
                var isInternal = g2gItem.isInternalG2G();

                if (disabled.disableAll) {
                    disabled.disableSites = true;
                    disabled.disableProperties = true;
                }

                g2gItem = generator.interceptSendInstance('G2GMessagingHistory', g2gItem);
                return $http
                    .put(urlService.g2gInbox + 'open-sent-return/' + isInternal, g2gItem)
                    .then(function (result) {
                        var metaData = result.data.rs.metaData;
                        metaData = generator.interceptReceivedInstance(['Correspondence', 'Outgoing', 'ViewOutgoing'], generator.generateInstance(metaData, Outgoing));

                        metaData.documentComments = _.map(metaData.linkedCommentsList, function (item) {
                            return generator.interceptReceivedInstance('DocumentComment', new DocumentComment(item));
                        });

                        metaData.attachments = _.map([].concat(metaData.linkedAttachmentList || [], metaData.linkedAttachmenstList || [], metaData.linkedExportedDocsList || []), function (item) {
                            return generator.interceptReceivedInstance('Attachment', new Attachment(item))
                        });
                        metaData.linkedDocs = self.interceptReceivedCollectionBasedOnEachDocumentClass(metaData.linkedDocList);
                        metaData.linkedEntities = _.map(metaData.linkedEntitiesList, function (item) {
                            item.documentClass = documentClass;
                            return generator.interceptReceivedInstance('LinkedObject', new LinkedObject(item));
                        });

                        result.data.rs.metaData = metaData;
                        localStorageService.remove('vsid');
                        localStorageService.set('vsid',metaData.vsId);
                        // temporary property added to correspondence(will be removed before send)
                        metaData.internalG2G = isInternal;

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
                                popupNumber: self.popupNumber,
                                disableEverything: disabled.disableAll,
                                disableProperties: disabled.disableProperties,
                                disableCorrespondence: disabled.disableSites,
                                g2gItemCopy: g2gItemCopy
                            }
                        }).then(function (result) {
                            self.popupNumber -= 1;
                            return result;
                        }).catch(function (error) {
                            self.popupNumber -= 1;
                            return error;
                        });
                    })
                    .catch(function (error) {
                        errorCode.checkIf(error, 'G2G_ERROR_FETCH_SENT_OR_RETURN_BOOK', function () {
                            dialog.errorMessage(langService.get('g2g_error_fetch_sent_return_book'));
                        });
                    });
            };

            self.setGeneralStepElementView = function (factory) {
                GeneralStepElementView = factory;
                return self;
            };
            self.setWorkItem = function (factory) {
                WorkItem = factory;
                return self;
            };
            self.setEventHistory = function (factory) {
                EventHistory = factory;
                return self;
            };
            self.setSentItemDepartmentInbox = function (factory) {
                SentItemDepartmentInbox = factory;
                return self;
            };

            $timeout(function () {
                CMSModelInterceptor.runEvent('viewDocumentService', 'init', self);
            }, 100);
            return self;
        }
    });
};
