module.exports = function (app) {
    app.provider('viewDocumentService', function () {
        'ngInject';
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
                                  configurationService,
                                  generator,
                                  $http,
                                  $timeout,
                                  $sce,
                                  $q,
                                  _,
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
                                  EditInDesktopCallback,
                                  LinkedObject,
                                  errorCode,
                                  rootEntity,
                                  Information) {
            'ngInject';
            var self = this,
                GeneralStepElementView,
                WorkItem,
                EventHistory,
                SentItemDepartmentInbox;
            self.serviceName = 'viewDocumentService';

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

                var desktop = new EditInDesktopCallback({
                    url: _createUrlSchema(null, info.documentClass, 'id/' + info.id + '/with-content'),
                    type: 'correspondence'
                });

                return $http.get(_createUrlSchema(null, info.documentClass, 'id/' + info.id + '/with-content'))
                    .then(function (result) {
                        var documentClass = result.data.rs.metaData.classDescription;
                        result.data.rs.metaData = generator.interceptReceivedInstance(['Correspondence', _getModelName(documentClass), 'View' + _getModelName(documentClass)], generator.generateInstance(result.data.rs.metaData, _getModel(documentClass)));
                        return result.data.rs;
                    })
                    .then(function (result) {
                        result.metaData.viewVersion = true;
                        result.content.viewURL = $sce.trustAsResourceUrl(result.content.viewURL);
                        if (result.content.hasOwnProperty('editURL') && result.content.editURL) {
                            result.content.editURL = $sce.trustAsResourceUrl(result.content.editURL);
                        }
                        result.content.desktop = desktop;
                        generator.addPopupNumber();
                        return dialog.showDialog({
                            templateUrl: cmsTemplate.getPopup('view-correspondence-new'),
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
                                popupNumber: generator.getPopupNumber(),
                                disableEverything: disabled.disableAll,
                                pageName: pageName,
                                reloadCallback: undefined,
                                allowedEditProperties: false,
                                resetCorrespondenceCallback: undefined
                            },
                            resolve: {
                                organizations: function (organizationService) {
                                    'ngInject';
                                    return organizationService.loadOrganizations(true);
                                },
                                lookups: function (correspondenceService) {
                                    'ngInject';
                                    return correspondenceService.loadCorrespondenceLookups(info.documentClass);
                                }
                            }
                        }).then(function () {
                            generator.removePopupNumber();
                            return true;
                        }).catch(function () {
                            generator.removePopupNumber();
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
             * @param viewOnly - to hide edit content button in delete pages
             * @param allowedEditProperties
             */
            self.viewQueueDocument = function (correspondence, actions, pageName, $event, viewOnly, allowedEditProperties) {
                var info = typeof correspondence.getInfo === 'function' ? correspondence.getInfo() : new Outgoing(correspondence).getInfo(),
                    disabled;
                var desktop = new EditInDesktopCallback({
                    url: _createUrlSchema(info.vsId, info.documentClass, 'with-content'),
                    type: 'correspondence'
                });
                return $http.get(_createUrlSchema(info.vsId, info.documentClass, 'with-content'))
                    .then(function (result) {
                        var documentClass = result.data.rs.metaData.classDescription;
                        result.data.rs.metaData = generator.interceptReceivedInstance(['Correspondence', _getModelName(documentClass), 'View' + _getModelName(documentClass)], generator.generateInstance(result.data.rs.metaData, _getModel(documentClass)));
                        return result.data.rs;
                    }).catch(function (error) {
                        if (errorCode.checkIf(error, 'DOCUMENT_HAS_BEEN_DELETED') === true) {
                            dialog.errorMessage(langService.get('document_has_been_deleted'));
                            return $q.reject('documentDeleted');
                        }
                        return $q.reject(error);
                    })
                    .then(function (result) {
                        result.metaData.viewVersion = viewOnly;
                        result.content.viewURL = $sce.trustAsResourceUrl(result.content.viewURL);
                        if (result.content.hasOwnProperty('editURL') && result.content.editURL) {
                            result.content.editURL = $sce.trustAsResourceUrl(result.content.editURL);
                        }
                        result.content.desktop = desktop;
                        disabled = _checkDisabled(pageName, result.metaData);

                        if (disabled.disableAll) {
                            disabled.disableSites = true;
                            disabled.disableProperties = true;
                        }

                        if (correspondence.highlights) {
                            result.metaData.highlights = correspondence.highlights;
                        }

                        generator.addPopupNumber();
                        return dialog.showDialog({
                            templateUrl: cmsTemplate.getPopup('view-correspondence-new'),
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
                                popupNumber: generator.getPopupNumber(),
                                disableEverything: disabled.disableAll,
                                pageName: pageName,
                                reloadCallback: undefined,
                                allowedEditProperties: allowedEditProperties || false,
                                resetCorrespondenceCallback: undefined
                            },
                            resolve: {
                                organizations: function (organizationService) {
                                    'ngInject';
                                    return organizationService.loadOrganizations(true);
                                },
                                lookups: function (correspondenceService) {
                                    'ngInject';
                                    return correspondenceService.loadCorrespondenceLookups(info.documentClass);
                                }
                            }
                        }).then(function () {
                            generator.removePopupNumber();
                            return true;
                        }).catch(function () {
                            generator.removePopupNumber();
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
             * @param viewOnly - to hide edit content button in delete pages
             */
            self.viewDeletedDocument = function (correspondence, actions, pageName, $event, viewOnly) {
                var info = typeof correspondence.getInfo === 'function' ? correspondence.getInfo() : new Outgoing(correspondence).getInfo(),
                    disabled;
                var desktop = new EditInDesktopCallback({
                    url: _createUrlSchema(info.vsId, info.documentClass, 'removed/with-content'),
                    type: 'correspondence'
                });
                return $http.get(_createUrlSchema(info.vsId, info.documentClass, 'removed/with-content'))
                    .then(function (result) {
                        var documentClass = result.data.rs.metaData.classDescription;
                        result.data.rs.metaData = generator.interceptReceivedInstance(['Correspondence', _getModelName(documentClass), 'View' + _getModelName(documentClass)], generator.generateInstance(result.data.rs.metaData, _getModel(documentClass)));
                        return result.data.rs;
                    })
                    .then(function (result) {
                        result.metaData.viewVersion = viewOnly;
                        result.content.viewURL = $sce.trustAsResourceUrl(result.content.viewURL);
                        if (result.content.hasOwnProperty('editURL') && result.content.editURL) {
                            result.content.editURL = $sce.trustAsResourceUrl(result.content.editURL);
                        }
                        result.content.desktop = desktop;
                        disabled = _checkDisabled(pageName, result.metaData);

                        if (disabled.disableAll) {
                            disabled.disableSites = true;
                            disabled.disableProperties = true;
                        }

                        generator.addPopupNumber();
                        return dialog.showDialog({
                            templateUrl: cmsTemplate.getPopup('view-correspondence-new'),
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
                                popupNumber: generator.getPopupNumber(),
                                disableEverything: disabled.disableAll,
                                pageName: pageName,
                                reloadCallback: undefined,
                                allowedEditProperties: false,
                                resetCorrespondenceCallback: undefined
                            },
                            resolve: {
                                organizations: function (organizationService) {
                                    'ngInject';
                                    return organizationService.loadOrganizations(true);
                                },
                                lookups: function (correspondenceService) {
                                    'ngInject';
                                    return correspondenceService.loadCorrespondenceLookups(info.documentClass);
                                }
                            }
                        }).then(function () {
                            generator.removePopupNumber();
                            return true;
                        }).catch(function () {
                            generator.removePopupNumber();
                            return false;
                        });
                    })
                    .catch(function (error) {
                        if (errorCode.checkIf(error, 'DOCUMENT_HAS_BEEN_DELETED') === true) {
                            dialog.errorMessage(langService.get('document_has_been_deleted'));
                            return $q.reject('documentDeleted');
                        }
                        return $q.reject(false);
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
                var desktop = new EditInDesktopCallback({
                    url: _createUrlSchema(info.vsId, info.documentClass, 'with-content'),
                    type: 'correspondence'
                });

                return $http.get(_createUrlSchema(info.vsId, info.documentClass, 'with-content'))
                    .then(function (result) {
                        var documentClass = result.data.rs.metaData.classDescription;
                        result.data.rs.metaData = generator.interceptReceivedInstance(['Correspondence', _getModelName(documentClass), 'View' + _getModelName(documentClass)], generator.generateInstance(result.data.rs.metaData, _getModel(documentClass)));
                        return result.data.rs;
                    })
                    .then(function (result) {
                        result.content.viewURL = $sce.trustAsResourceUrl(result.content.viewURL);
                        if (result.content.hasOwnProperty('editURL') && result.content.editURL) {
                            result.content.editURL = $sce.trustAsResourceUrl(result.content.editURL);
                        }
                        result.content.desktop = desktop;
                        generator.addPopupNumber();
                        return dialog.showDialog({
                            templateUrl: cmsTemplate.getPopup('view-correspondence-new'),
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
                                popupNumber: generator.getPopupNumber(),
                                disableEverything: disabled.disableAll,
                                pageName: pageName,
                                reloadCallback: undefined,
                                allowedEditProperties: false,
                                resetCorrespondenceCallback: undefined
                            },
                            resolve: {
                                organizations: function (organizationService) {
                                    'ngInject';
                                    return organizationService.loadOrganizations(true);
                                },
                                lookups: function (correspondenceService) {
                                    'ngInject';
                                    return correspondenceService.loadCorrespondenceLookups(info.documentClass);
                                }
                            }
                        }).then(function () {
                            generator.removePopupNumber();
                            return true;
                        }).catch(function () {
                            generator.removePopupNumber();
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
             * @param getGeneralStepElementView
             * @param reloadCallback
             */
            self.viewUserInboxDocument = function (workItem, actions, pageName, $event, getGeneralStepElementView, reloadCallback) {
                var info = typeof workItem.getInfo === 'function' ? workItem.getInfo() : new WorkItem(workItem).getInfo();
                var disabled = _checkDisabled(pageName, workItem);

                if (disabled.disableAll) {
                    disabled.disableSites = true;
                    disabled.disableProperties = true;
                }

                var desktop = new EditInDesktopCallback({
                    url: urlService.inboxWF + '/wob-num/' + info.wobNumber,
                    type: 'workItem'
                });

                return $http.get(urlService.inboxWF + '/wob-num/' + info.wobNumber)
                    .then(function (result) {
                        return generator.interceptReceivedInstance('GeneralStepElementView', generator.generateInstance(result.data.rs, GeneralStepElementView));
                    })
                    .then(function (generalStepElementView) {
                        generalStepElementView.documentViewInfo.desktop = desktop;
                        generalStepElementView.allInternalSites = workItem.allInternalSites;
                        if (getGeneralStepElementView) {
                            return generalStepElementView;
                        }
                        generator.addPopupNumber();
                        return dialog.showDialog({
                            templateUrl: cmsTemplate.getPopup('view-correspondence-new'),
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
                                popupNumber: generator.getPopupNumber(),
                                pageName: pageName,
                                reloadCallback: reloadCallback,
                                allowedEditProperties: false,
                                resetCorrespondenceCallback: undefined
                            },
                            resolve: {
                                organizations: function (organizationService) {
                                    'ngInject';
                                    return organizationService.loadOrganizations(true);
                                },
                                lookups: function (correspondenceService) {
                                    'ngInject';
                                    return correspondenceService.loadCorrespondenceLookups(info.documentClass);
                                },
                                replyOn: function (distributionWFService, manageLaunchWorkflowService, employeeService) {
                                    'ngInject';
                                    if (!employeeService.getEmployee().isViewQuickSendEnabled()) {
                                        return null;
                                    }
                                    if (manageLaunchWorkflowService.isValidLaunchData()) {
                                        return manageLaunchWorkflowService.getLaunchSelectedItems()[0];
                                    }
                                    return distributionWFService
                                        .loadSenderUserForWorkItem(generalStepElementView);
                                }
                            }
                        })
                            .then(function () {
                                generator.removePopupNumber();
                                return true;
                            })
                            .catch(function () {
                                generator.removePopupNumber();
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

                var desktop = new EditInDesktopCallback({
                    url: _createCorrespondenceWFSchema([info.documentClass, 'approved-queue', 'wob-num', info.wobNumber]),
                    type: 'workItem'
                });

                return $http.get(_createCorrespondenceWFSchema([info.documentClass, 'approved-queue', 'wob-num', info.wobNumber]))
                    .then(function (result) {
                        return generator.interceptReceivedInstance('GeneralStepElementView', generator.generateInstance(result.data.rs, GeneralStepElementView));
                    })
                    .then(function (generalStepElementView) {
                        generalStepElementView.documentViewInfo.desktop = desktop;
                        generator.addPopupNumber();
                        return dialog.showDialog({
                            templateUrl: cmsTemplate.getPopup('view-correspondence-new'),
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
                                popupNumber: generator.getPopupNumber(),
                                pageName: pageName,
                                reloadCallback: undefined,
                                allowedEditProperties: false,
                                resetCorrespondenceCallback: undefined
                            },
                            resolve: {
                                organizations: function (organizationService) {
                                    'ngInject';
                                    return organizationService.loadOrganizations(true);
                                },
                                lookups: function (correspondenceService) {
                                    'ngInject';
                                    return correspondenceService.loadCorrespondenceLookups(info.documentClass);
                                }
                            }
                        })
                            .then(function () {
                                generator.removePopupNumber();
                                return true;
                            })
                            .catch(function (error) {
                                generator.removePopupNumber();
                                return error ?? false;
                            });
                    })
                    .catch(function (error) {
                        if (errorCode.checkIf(error, 'WORK_ITEM_NOT_FOUND') === true) {
                            dialog.errorMessage(langService.get('work_item_not_found').change({wobNumber: info.wobNumber}));
                            return $q.reject('WORK_ITEM_NOT_FOUND');
                        } else if (errorCode.checkIf(error, 'ITEM_LOCKED') === true) {
                            dialog.infoMessage(generator.getBookLockMessage(null, error));
                            return $q.reject('itemLocked');
                        }
                        return $q.reject(error);
                    });
            };

            /**
             * @description Open the view popup for proxy mail
             * @param workItem
             * @param actions
             * @param $event
             * @param pageName
             * @param getGeneralStepElementView
             */
            self.viewUserInboxProxyDocument = function (workItem, actions, pageName, $event, getGeneralStepElementView) {
                var info = typeof workItem.getInfo === 'function' ? workItem.getInfo() : new WorkItem(workItem).getInfo();
                var disabled = _checkDisabled(pageName, workItem);

                if (disabled.disableAll) {
                    disabled.disableSites = true;
                    disabled.disableProperties = true;
                }
                var url = urlService.inboxWF + '/proxy/wob-num/' + info.wobNumber;
                var desktop = new EditInDesktopCallback({
                    url: url,
                    type: 'workItem'
                });
                //url = approvedQueue ? _createCorrespondenceWFSchema([info.documentClass, 'approved-queue', 'wob-num', info.wobNumber]) : _createWorkItemSchema(info, department, readyToExport);
                return $http.get(url)
                    .then(function (result) {
                        return generator.interceptReceivedInstance('GeneralStepElementView', generator.generateInstance(result.data.rs, GeneralStepElementView));
                    })
                    .then(function (generalStepElementView) {
                        generalStepElementView.documentViewInfo.desktop = desktop;
                        generalStepElementView.allInternalSites = workItem.allInternalSites;
                        if (getGeneralStepElementView) {
                            return generalStepElementView;
                        }

                        generator.addPopupNumber();
                        return dialog.showDialog({
                            templateUrl: cmsTemplate.getPopup('view-correspondence-new'),
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
                                popupNumber: generator.getPopupNumber(),
                                pageName: pageName,
                                reloadCallback: undefined,
                                allowedEditProperties: false,
                                resetCorrespondenceCallback: undefined
                            },
                            resolve: {
                                organizations: function (organizationService) {
                                    'ngInject';
                                    return organizationService.loadOrganizations(true);
                                },
                                lookups: function (correspondenceService) {
                                    'ngInject';
                                    return correspondenceService.loadCorrespondenceLookups(info.documentClass);
                                }
                            }
                        })
                            .then(function () {
                                generator.removePopupNumber();
                                return true;
                            })
                            .catch(function () {
                                generator.removePopupNumber();
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

                var desktop = new EditInDesktopCallback({
                    url: [urlService.correspondence, 'ou-queue', 'wob-num', info.wobNumber].join('/'),
                    type: 'workItem'
                });

                return $http.get([urlService.correspondence, 'ou-queue', 'wob-num', info.wobNumber].join('/'))
                    .then(function (result) {
                        return generator.interceptReceivedInstance('GeneralStepElementView', generator.generateInstance(result.data.rs, GeneralStepElementView));
                    })
                    .then(function (generalStepElementView) {
                        generalStepElementView.documentViewInfo.desktop = desktop;
                        generator.addPopupNumber();
                        return dialog.showDialog({
                            templateUrl: cmsTemplate.getPopup('view-correspondence-new'),
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
                                popupNumber: generator.getPopupNumber(),
                                pageName: pageName,
                                reloadCallback: undefined,
                                allowedEditProperties: false,
                                resetCorrespondenceCallback: undefined
                            },
                            resolve: {
                                organizations: function (organizationService) {
                                    'ngInject';
                                    return organizationService.loadOrganizations(true);
                                },
                                lookups: function (correspondenceService) {
                                    'ngInject';
                                    return correspondenceService.loadCorrespondenceLookups(info.documentClass);
                                }
                            }
                        })
                            .then(function () {
                                generator.removePopupNumber();

                                return true;
                            })
                            .catch(function (error) {
                                generator.removePopupNumber();
                                return error ?? false;
                            });
                    })
                    .catch(function (error) {
                        if (errorCode.checkIf(error, 'ITEM_LOCKED') === true) {
                            dialog.infoMessage(generator.getBookLockMessage(null, error));
                            return $q.reject('itemLocked');
                        }
                        return $q.reject(error);
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

                var desktop = new EditInDesktopCallback({
                    url: _createUrlSchema(info.vsId, info.documentClass, 'with-content'),
                    type: 'correspondence'
                });

                return $http.get(_createUrlSchema(info.vsId, info.documentClass, 'with-content'), {
                    params: {
                        'as-admin': true
                    }
                }).then(function (result) {
                    var documentClass = result.data.rs.metaData.classDescription;
                    result.data.rs.metaData = generator.interceptReceivedInstance(['Correspondence', _getModelName(documentClass), 'View' + _getModelName(documentClass)], generator.generateInstance(result.data.rs.metaData, _getModel(documentClass)));
                    return result.data.rs;
                }).catch(function (error) {
                    if (errorCode.checkIf(error, 'DOCUMENT_HAS_BEEN_DELETED') === true) {
                        dialog.errorMessage(langService.get('document_has_been_deleted'));
                        return $q.reject('documentDeleted');
                    }
                    return $q.reject(error);
                })
                    .then(function (result) {
                        result.content.viewURL = $sce.trustAsResourceUrl(result.content.viewURL);
                        if (result.content.hasOwnProperty('editURL') && result.content.editURL) {
                            result.content.editURL = $sce.trustAsResourceUrl(result.content.editURL);
                        }
                        result.content.desktop = desktop;
                        generator.addPopupNumber();
                        return dialog.showDialog({
                            templateUrl: cmsTemplate.getPopup('view-correspondence-new'),
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
                                popupNumber: generator.getPopupNumber(),
                                pageName: pageName,
                                reloadCallback: undefined,
                                allowedEditProperties: false,
                                resetCorrespondenceCallback: undefined
                            },
                            resolve: {
                                organizations: function (organizationService) {
                                    'ngInject';
                                    return organizationService.loadOrganizations(true);
                                },
                                lookups: function (correspondenceService) {
                                    'ngInject';
                                    return correspondenceService.loadCorrespondenceLookups(info.documentClass);
                                }
                            }
                        }).then(function () {
                            generator.removePopupNumber();
                            return true;
                        }).catch(function () {
                            generator.removePopupNumber();
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

                var desktop = new EditInDesktopCallback({
                    url: _createWorkItemSchema(info, true, true),
                    type: 'workItem'
                });

                return $http.get(_createWorkItemSchema(info, true, true))
                    .then(function (result) {
                        return generator.interceptReceivedInstance('GeneralStepElementView', generator.generateInstance(result.data.rs, GeneralStepElementView));
                    })
                    .then(function (generalStepElementView) {
                        generalStepElementView.documentViewInfo.desktop = desktop;
                        generator.addPopupNumber();
                        return dialog.showDialog({
                            templateUrl: cmsTemplate.getPopup('view-correspondence-new'),
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
                                popupNumber: generator.getPopupNumber(),
                                pageName: pageName,
                                reloadCallback: undefined,
                                allowedEditProperties: false,
                                resetCorrespondenceCallback: undefined
                            },
                            resolve: {
                                organizations: function (organizationService) {
                                    'ngInject';
                                    return organizationService.loadOrganizations(true);
                                },
                                lookups: function (correspondenceService) {
                                    'ngInject';
                                    return correspondenceService.loadCorrespondenceLookups(info.documentClass);
                                }
                            }
                        })
                            .then(function () {
                                generator.removePopupNumber();
                                return true;
                            })
                            .catch(function (error) {
                                generator.removePopupNumber();
                                return error ?? false;
                            });
                    })
                    .catch(function (error) {
                        if (errorCode.checkIf(error, 'WORK_ITEM_NOT_FOUND') === true) {
                            dialog.errorMessage(langService.get('work_item_not_found').change({wobNumber: info.wobNumber}));
                            return $q.reject('WORK_ITEM_NOT_FOUND');
                        } else if (errorCode.checkIf(error, 'ITEM_LOCKED') === true) {
                            dialog.infoMessage(generator.getBookLockMessage(null, error));
                            return $q.reject('itemLocked');
                        }
                        return $q.reject(error);
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
                var desktop = new EditInDesktopCallback({
                    url: _createWorkItemSchema(info, true, true),
                    type: 'workItem'
                });

                return $http.get(_createWorkItemSchema(info, true, false))
                    .then(function (result) {
                        return generator.interceptReceivedInstance('GeneralStepElementView', generator.generateInstance(result.data.rs, GeneralStepElementView));
                    })
                    .then(function (generalStepElementView) {
                        generalStepElementView.documentViewInfo.desktop = desktop;
                        generator.addPopupNumber();
                        return dialog.showDialog({
                            templateUrl: cmsTemplate.getPopup('view-correspondence-new'),
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
                                popupNumber: generator.getPopupNumber(),
                                pageName: pageName,
                                reloadCallback: undefined,
                                allowedEditProperties: false,
                                resetCorrespondenceCallback: undefined
                            },
                            resolve: {
                                organizations: function (organizationService) {
                                    'ngInject';
                                    return organizationService.loadOrganizations(true);
                                },
                                lookups: function (correspondenceService) {
                                    'ngInject';
                                    return correspondenceService.loadCorrespondenceLookups(info.documentClass);
                                }
                            }
                        })
                            .then(function () {
                                generator.removePopupNumber();
                                return true;
                            })
                            .catch(function (error) {
                                generator.removePopupNumber();
                                return error ?? false;
                            });
                    })
                    .catch(function (error) {
                        if (errorCode.checkIf(error, 'WORK_ITEM_NOT_FOUND') === true) {
                            dialog.errorMessage(langService.get('work_item_not_found').change({wobNumber: info.wobNumber}));
                            return $q.reject('WORK_ITEM_NOT_FOUND');
                        } else if (errorCode.checkIf(error, 'ITEM_LOCKED') === true) {
                            dialog.infoMessage(generator.getBookLockMessage(null, error));
                            return $q.reject('itemLocked');
                        }
                        return $q.reject(error);
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

                var desktop = new EditInDesktopCallback({
                    url: _createUrlSchema(vsId, docClass, 'with-content'),
                    type: 'correspondence'
                });

                return $http.get(_createUrlSchema(vsId, docClass, 'with-content'))
                    .then(function (result) {
                        var documentClass = result.data.rs.metaData.classDescription;
                        result.data.rs.metaData = generator.interceptReceivedInstance(['Correspondence', _getModelName(documentClass), 'View' + _getModelName(documentClass)], generator.generateInstance(result.data.rs.metaData, _getModel(documentClass)));
                        return result.data.rs;
                    })
                    .then(function (result) {
                        result.content.viewURL = $sce.trustAsResourceUrl(result.content.viewURL);
                        if (result.content.hasOwnProperty('editURL') && result.content.editURL) {
                            result.content.editURL = $sce.trustAsResourceUrl(result.content.editURL);
                        }
                        result.content.desktop = desktop;
                        generator.addPopupNumber();
                        return dialog.showDialog({
                            templateUrl: cmsTemplate.getPopup('view-correspondence-new'),
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
                                popupNumber: generator.getPopupNumber(),
                                disableEverything: disabled.disableAll,
                                pageName: pageName,
                                reloadCallback: undefined,
                                allowedEditProperties: false,
                                resetCorrespondenceCallback: undefined
                            },
                            resolve: {
                                organizations: function (organizationService) {
                                    'ngInject';
                                    return organizationService.loadOrganizations(true);
                                },
                                lookups: function (correspondenceService) {
                                    'ngInject';
                                    return correspondenceService.loadCorrespondenceLookups(info.documentClass);
                                }
                            }
                        }).then(function () {
                            generator.removePopupNumber();
                            return true;
                        }).catch(function () {
                            generator.removePopupNumber();
                            return false;
                        });
                    })
                    .catch(function (error) {
                        if (errorCode.checkIf(error, 'WORK_ITEM_NOT_FOUND') === true) {
                            dialog.errorMessage(langService.get('work_item_not_found').change({wobNumber: info.wobNumber}));
                            return $q.reject('WORK_ITEM_NOT_FOUND');
                        } else if (errorCode.checkIf(error, 'ITEM_LOCKED') === true) {
                            dialog.infoMessage(generator.getBookLockMessage(null, error));
                            return $q.reject('itemLocked');
                        }
                        return $q.reject(error);
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
                var desktop = new EditInDesktopCallback({
                    url: urlService.departmentWF + '/returned/' + info.wobNumber,
                    type: 'correspondence'
                });

                return $http.get(urlService.departmentWF + '/returned/' + info.wobNumber)
                    .then(function (result) {
                        return generator.interceptReceivedInstance('GeneralStepElementView', generator.generateInstance(result.data.rs, GeneralStepElementView));
                    })
                    .then(function (generalStepElementView) {
                        generalStepElementView.documentViewInfo.desktop = desktop;
                        generator.addPopupNumber();
                        return dialog.showDialog({
                            templateUrl: cmsTemplate.getPopup('view-correspondence-new'),
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
                                popupNumber: generator.getPopupNumber(),
                                pageName: pageName,
                                reloadCallback: undefined,
                                allowedEditProperties: false,
                                resetCorrespondenceCallback: undefined
                            },
                            resolve: {
                                organizations: function (organizationService) {
                                    'ngInject';
                                    return organizationService.loadOrganizations(true);
                                },
                                lookups: function (correspondenceService) {
                                    'ngInject';
                                    return correspondenceService.loadCorrespondenceLookups(info.documentClass);
                                }
                            }
                        })
                            .then(function () {
                                generator.removePopupNumber();
                                return true;
                            })
                            .catch(function (error) {
                                generator.removePopupNumber();
                                return error ?? false;
                            });
                    })
                    .catch(function (error) {
                        if (errorCode.checkIf(error, 'WORK_ITEM_NOT_FOUND') === true) {
                            dialog.errorMessage(langService.get('work_item_not_found').change({wobNumber: info.wobNumber}));
                            return $q.reject('WORK_ITEM_NOT_FOUND');
                        } else if (errorCode.checkIf(error, 'ITEM_LOCKED') === true) {
                            dialog.infoMessage(generator.getBookLockMessage(null, error));
                            return $q.reject('itemLocked');
                        }
                        return $q.reject(error);
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

                var desktop = new EditInDesktopCallback({
                    url: _createUrlSchema(info.vsId, info.documentClass, 'with-content'),
                    type: 'correspondence'
                });

                return $http.get(_createUrlSchema(info.vsId, info.documentClass, 'with-content'))
                    .then(function (result) {
                        var documentClass = result.data.rs.metaData.classDescription;
                        result.data.rs.metaData = generator.interceptReceivedInstance(['Correspondence', _getModelName(documentClass), 'View' + _getModelName(documentClass)], generator.generateInstance(result.data.rs.metaData, _getModel(documentClass)));
                        return result.data.rs;
                    }).catch(function (error) {
                        if (errorCode.checkIf(error, 'DOCUMENT_HAS_BEEN_DELETED') === true) {
                            dialog.errorMessage(langService.get('document_has_been_deleted'));
                            return $q.reject('documentDeleted');
                        }
                        return $q.reject(error);
                    })
                    .then(function (result) {
                        result.content.viewURL = $sce.trustAsResourceUrl(result.content.viewURL);
                        if (result.content.hasOwnProperty('editURL') && result.content.editURL) {
                            result.content.editURL = $sce.trustAsResourceUrl(result.content.editURL);
                        }
                        result.content.desktop = desktop;
                        generator.addPopupNumber();
                        return dialog.showDialog({
                            templateUrl: cmsTemplate.getPopup('view-correspondence-new'),
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
                                popupNumber: generator.getPopupNumber(),
                                disableEverything: disabled.disableAll,
                                pageName: pageName,
                                reloadCallback: undefined,
                                allowedEditProperties: false,
                                resetCorrespondenceCallback: undefined
                            },
                            resolve: {
                                organizations: function (organizationService) {
                                    'ngInject';
                                    return organizationService.loadOrganizations(true);
                                },
                                lookups: function (correspondenceService) {
                                    'ngInject';
                                    return correspondenceService.loadCorrespondenceLookups(info.documentClass);
                                }
                            }
                        }).then(function () {
                            generator.removePopupNumber();
                            return true;
                        }).catch(function () {
                            generator.removePopupNumber();
                            return false;
                        });
                    });
            };

            /**
             * @description Open the view popup for g2g pending item document
             * @param g2gItem
             * @param actions
             * @param $event
             * @param pageName
             */
            self.viewG2GPendingItemDocument = function (g2gItem, actions, pageName, $event) {
                var info = typeof g2gItem.getInfo === 'function' ? g2gItem.getInfo() : new Outgoing(g2gItem).getInfo();
                var disabled = _checkDisabled(pageName, g2gItem);

                if (disabled.disableAll) {
                    disabled.disableSites = true;
                    disabled.disableProperties = true;
                }

                var desktop = new EditInDesktopCallback({
                    url: _createUrlSchema(info.vsId, info.documentClass, 'with-content'),
                    type: 'correspondence'
                });

                return $http.get(_createUrlSchema(info.vsId, info.documentClass, 'with-content'))
                    .then(function (result) {
                        var documentClass = result.data.rs.metaData.classDescription;
                        result.data.rs.metaData = generator.interceptReceivedInstance(['Correspondence', _getModelName(documentClass), 'View' + _getModelName(documentClass)], generator.generateInstance(result.data.rs.metaData, _getModel(documentClass)));
                        return result.data.rs;
                    })
                    .then(function (result) {
                        result.content.viewURL = $sce.trustAsResourceUrl(result.content.viewURL);
                        if (result.content.hasOwnProperty('editURL') && result.content.editURL) {
                            result.content.editURL = $sce.trustAsResourceUrl(result.content.editURL);
                        }
                        result.content.desktop = desktop;
                        result.metaData.g2gId = g2gItem.id;
                        generator.addPopupNumber();
                        return dialog.showDialog({
                            templateUrl: cmsTemplate.getPopup('view-correspondence-new'),
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
                                popupNumber: generator.getPopupNumber(),
                                disableEverything: disabled.disableAll,
                                pageName: pageName,
                                reloadCallback: undefined,
                                allowedEditProperties: false,
                                resetCorrespondenceCallback: undefined
                            },
                            resolve: {
                                organizations: function (organizationService) {
                                    'ngInject';
                                    return organizationService.loadOrganizations(true);
                                },
                                lookups: function (correspondenceService) {
                                    'ngInject';
                                    return correspondenceService.loadCorrespondenceLookups(info.documentClass);
                                }
                            }
                        }).then(function () {
                            generator.removePopupNumber();
                            return true;
                        }).catch(function () {
                            generator.removePopupNumber();
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

                var desktop = new EditInDesktopCallback({
                    url: _createWorkItemSchema(info, true, true),
                    type: 'workItem'
                });
                return $http.get(_createWorkItemSchema(info, true, true))
                    .then(function (result) {
                        return generator.interceptReceivedInstance('GeneralStepElementView', generator.generateInstance(result.data.rs, GeneralStepElementView));
                    })
                    .then(function (generalStepElementView) {
                        generalStepElementView.documentViewInfo.desktop = desktop;
                        generalStepElementView.allInternalSites = workItem.allInternalSites;
                        generator.addPopupNumber();
                        return dialog.showDialog({
                            templateUrl: cmsTemplate.getPopup('view-correspondence-new'),
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
                                popupNumber: generator.getPopupNumber(),
                                pageName: pageName,
                                reloadCallback: undefined,
                                allowedEditProperties: false,
                                resetCorrespondenceCallback: undefined
                            },
                            resolve: {
                                organizations: function (organizationService) {
                                    'ngInject';
                                    return organizationService.loadOrganizations(true);
                                },
                                lookups: function (correspondenceService) {
                                    'ngInject';
                                    return correspondenceService.loadCorrespondenceLookups(info.documentClass);
                                }
                            }
                        })
                            .then(function () {
                                generator.removePopupNumber();
                                return true;
                            })
                            .catch(function (error) {
                                generator.removePopupNumber();
                                return error ?? false;
                            });
                    })
                    .catch(function (error) {
                        if (errorCode.checkIf(error, 'WORK_ITEM_NOT_FOUND') === true) {
                            dialog.errorMessage(langService.get('work_item_not_found').change({wobNumber: info.wobNumber}));
                            return $q.reject('WORK_ITEM_NOT_FOUND');
                        } else if (errorCode.checkIf(error, 'ITEM_LOCKED') === true) {
                            dialog.infoMessage(generator.getBookLockMessage(null, error));
                            return $q.reject('itemLocked');
                        }
                        return $q.reject(error);
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

                        if (!rootEntity.isQatarVersion() && g2gItemCopy.hasOwnProperty('correspondence') && g2gItemCopy.correspondence.hasOwnProperty('isReceived')) {
                            // temporary property added to correspondence(will be removed before send)
                            result.data.rs.metaData.isReceived = g2gItemCopy.correspondence.isReceived;
                        }

                        localStorageService.remove('vsid');
                        localStorageService.set('vsid', metaData.vsId);
                        return result.data.rs;
                    })
                    .then(function (result) {
                        result.content.viewURL = $sce.trustAsResourceUrl(result.content.viewURL);
                        if (result.content.hasOwnProperty('editURL') && result.content.editURL) {
                            result.content.editURL = $sce.trustAsResourceUrl(result.content.editURL);
                        }
                        generator.addPopupNumber();
                        return dialog.showDialog({
                            /*templateUrl: cmsTemplate.getPopup('view-correspondence-g2g'),
                            controller: 'viewCorrespondenceG2GPopCtrl',*/
                            templateUrl: cmsTemplate.getPopup('view-correspondence-new'),
                            controller: 'viewCorrespondencePopCtrl',
                            controllerAs: 'ctrl',
                            bindToController: true,
                            escapeToCancel: false,
                            locals: {
                                correspondence: result.metaData,
                                content: result.content,
                                actions: actions,
                                workItem: false,
                                popupNumber: generator.getPopupNumber(),
                                disableEverything: true,
                                disableProperties: true,
                                disableCorrespondence: true,
                                g2gItemCopy: g2gItemCopy,
                                pageName: pageName,
                                reloadCallback: undefined,
                                allowedEditProperties: false,
                                resetCorrespondenceCallback: undefined
                            }
                        }).then(function (result) {
                            generator.removePopupNumber();
                            return result;
                        }).catch(function (error) {
                            generator.removePopupNumber();
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
                var isInternal = g2gItem.isInternalG2G();
                //g2gItem = generator.interceptSendInstance('G2GMessagingHistory', g2gItem);
                return $http
                    .put(urlService.g2gInbox + 'open-sent-return/' + isInternal, generator.interceptSendInstance('G2GMessagingHistory', g2gItem))
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
                            // item.documentClass = documentClass;
                            return generator.interceptReceivedInstance('LinkedObject', new LinkedObject(item));
                        });

                        result.data.rs.metaData = metaData;
                        localStorageService.remove('vsid');
                        localStorageService.set('vsid', metaData.vsId);
                        // temporary property added to correspondence(will be removed before send)
                        metaData.internalG2G = isInternal;
                        return result.data.rs;
                    })
                    .then(function (result) {
                        var g2gItemCopy = angular.copy(g2gItem);
                        var disabled = _checkDisabled(pageName, result.metaData);
                        if (disabled.disableAll) {
                            disabled.disableSites = true;
                            disabled.disableProperties = true;
                        }

                        result.content.viewURL = $sce.trustAsResourceUrl(result.content.viewURL);
                        if (result.content.hasOwnProperty('editURL') && result.content.editURL) {
                            result.content.editURL = $sce.trustAsResourceUrl(result.content.editURL);
                        }
                        generator.addPopupNumber();
                        return dialog.showDialog({
                            templateUrl: cmsTemplate.getPopup('view-correspondence-new'),
                            controller: 'viewCorrespondencePopCtrl',
                            controllerAs: 'ctrl',
                            bindToController: true,
                            escapeToCancel: false,
                            locals: {
                                correspondence: result.metaData,
                                content: result.content,
                                actions: actions,
                                workItem: false,
                                popupNumber: generator.getPopupNumber(),
                                disableEverything: disabled.disableAll,
                                disableProperties: disabled.disableProperties,
                                disableCorrespondence: disabled.disableSites,
                                g2gItemCopy: g2gItemCopy,
                                pageName: pageName,
                                reloadCallback: undefined,
                                allowedEditProperties: false,
                                resetCorrespondenceCallback: undefined
                            }
                        }).then(function (result) {
                            generator.removePopupNumber();
                            return result;
                        }).catch(function (error) {
                            generator.removePopupNumber();
                            return error;
                        });
                    })
                    .catch(function (error) {
                        errorCode.checkIf(error, 'G2G_ERROR_FETCH_SENT_OR_RETURN_BOOK', function () {
                            dialog.errorMessage(langService.get('g2g_error_fetch_sent_return_book'));
                        });
                    });
            };

            /**
             * @description Open the view popup for queues
             * @param correspondence
             * @param actions
             * @param $event
             * @param pageName
             * @param viewOnly - to hide edit content button in delete pages
             * @param reloadCallback
             */
            self.viewReturnedCentralArchiveDocument = function (correspondence, actions, pageName, $event, viewOnly, reloadCallback) {
                var info = typeof correspondence.getInfo === 'function' ? correspondence.getInfo() : new Outgoing(correspondence).getInfo(),
                    disabled;
                var desktop = new EditInDesktopCallback({
                    url: _createUrlSchema(info.vsId, info.documentClass, 'with-content'),
                    type: 'correspondence'
                });
                return $http.get(_createUrlSchema(info.vsId, info.documentClass, 'with-content'))
                    .then(function (result) {
                        var documentClass = result.data.rs.metaData.classDescription;
                        result.data.rs.metaData = generator.interceptReceivedInstance(['Correspondence', _getModelName(documentClass), 'View' + _getModelName(documentClass)], generator.generateInstance(result.data.rs.metaData, _getModel(documentClass)));
                        return result.data.rs;
                    }).catch(function (error) {
                        if (errorCode.checkIf(error, 'DOCUMENT_HAS_BEEN_DELETED') === true) {
                            dialog.errorMessage(langService.get('document_has_been_deleted'));
                            return $q.reject('documentDeleted');
                        }
                        return $q.reject(error);
                    })
                    .then(function (result) {
                        result.metaData.viewVersion = viewOnly;
                        result.content.viewURL = $sce.trustAsResourceUrl(result.content.viewURL);
                        if (result.content.hasOwnProperty('editURL') && result.content.editURL) {
                            result.content.editURL = $sce.trustAsResourceUrl(result.content.editURL);
                        }
                        result.content.desktop = desktop;
                        disabled = _checkDisabled(pageName, result.metaData);

                        if (disabled.disableAll) {
                            disabled.disableSites = true;
                            disabled.disableProperties = true;
                        }

                        if (correspondence.highlights) {
                            result.metaData.highlights = correspondence.highlights;
                        }

                        generator.addPopupNumber();
                        return dialog.showDialog({
                            templateUrl: cmsTemplate.getPopup('view-correspondence-new'),
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
                                popupNumber: generator.getPopupNumber(),
                                disableEverything: disabled.disableAll,
                                pageName: pageName,
                                reloadCallback: reloadCallback,
                                allowedEditProperties: false,
                                resetCorrespondenceCallback: undefined
                            },
                            resolve: {
                                organizations: function (organizationService) {
                                    'ngInject';
                                    return organizationService.loadOrganizations(true);
                                },
                                lookups: function (correspondenceService) {
                                    'ngInject';
                                    return correspondenceService.loadCorrespondenceLookups(info.documentClass);
                                },
                                centralArchives: function ($q, employeeService, organizationService) {
                                    'ngInject';
                                    var currentOU = employeeService.getEmployee().userOrganization;
                                    if (employeeService.isCentralArchive()) {
                                        return (organizationService.centralArchiveOrganizations().then(function (organizations) {
                                            if (employeeService.isCentralArchiveHasRegistry() && (_.map(organizations, 'id').indexOf(currentOU.id) === -1)) {
                                                organizations.push(currentOU);
                                            }

                                            return organizations;
                                        }));
                                    }
                                    return false;
                                }
                            }
                        }).then(function () {
                            generator.removePopupNumber();
                            return true;
                        }).catch(function () {
                            generator.removePopupNumber();
                            return false;
                        });
                    });
            };

            /***
             * @description open document before approve as signed document with draft watermark
             * @param correspondence
             * @param actions
             * @param pageName
             * @param $event
             */
            self.viewDocumentAsApproved = function (correspondence, actions, pageName, $event) {
                var info = typeof correspondence.getInfo === 'function' ? correspondence.getInfo() : _createInstance(correspondence).getInfo();

                return $http.get(_createUrlSchema(null, info.documentClass, 'preview/vsid/' + info.vsId))
                    .then(function (result) {
                        result = result.data.rs;
                        result.viewURL = $sce.trustAsResourceUrl(result.viewURL);
                        if (result.hasOwnProperty('editURL') && result.editURL) {
                            result.editURL = $sce.trustAsResourceUrl(result.editURL);
                        }
                        return dialog.showDialog({
                            templateUrl: cmsTemplate.getPopup('view-document-readonly'),
                            controller: 'viewDocumentReadOnlyPopCtrl',
                            controllerAs: 'ctrl',
                            bindToController: true,
                            escapeToCancel: false,
                            locals: {
                                document: correspondence,
                                content: result,
                                typeOfDoc: 'as-approved'
                            }
                        });
                    });
            }

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

            self.loadGeneralStepElementView = function (workItem) {
                var info = workItem.getInfo();
                return $http.get(urlService.inboxWF + '/wob-num/' + info.wobNumber)
                    .then(function (result) {
                        return generator.interceptReceivedInstance('GeneralStepElementView', generator.generateInstance(result.data.rs, GeneralStepElementView));
                    })
            }

            $timeout(function () {
                CMSModelInterceptor.runEvent('viewDocumentService', 'init', self);
            }, 100);
            return self;
        }
    });
};
