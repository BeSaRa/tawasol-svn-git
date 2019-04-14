module.exports = function (app) {
    app.service('correspondenceService', function (urlService,
                                                   $http,
                                                   ImageThumbnail,
                                                   cmsTemplate,
                                                   tokenService,
                                                   Pair,
                                                   downloadService,
                                                   helper,
                                                   CommentModel,
                                                   CMSModelInterceptor,
                                                   employeeService,
                                                   $timeout,
                                                   loadingIndicatorService,
                                                   langService,
                                                   CorrespondenceInfo,
                                                   Site,
                                                   $q,
                                                   $sce,
                                                   dialog,
                                                   generator,
                                                   lookupService,
                                                   LinkedObject,
                                                   Classification,
                                                   CorrespondenceSiteType,
                                                   localStorageService,
                                                   DocumentTemplate,
                                                   Lookup,
                                                   DocumentType,
                                                   DocumentFile,
                                                   EntityType,
                                                   OUDocumentFile,
                                                   OUClassification,
                                                   util,
                                                   Correspondence,
                                                   Outgoing,
                                                   Internal,
                                                   Incoming,
                                                   Information,
                                                   GeneralStepElementView,
                                                   WorkItem,
                                                   toast,
                                                   SignDocumentModel,
                                                   applicationUserSignatureService,
                                                   General,
                                                   errorCode,
                                                   DistributionWF, // just for make the inheritance
                                                   _,
                                                   PartialExport,
                                                   PartialExportCollection,
                                                   PartialExportSelective,
                                                   ReadyToExportOption,
                                                   DuplicateOption,
                                                   Attachment,
                                                   DistributionList,
                                                   OUDistributionList,
                                                   OutgoingSearch,
                                                   IncomingSearch,
                                                   InternalSearch,
                                                   GeneralSearch,
                                                   OutgoingIncomingSearch,
                                                   G2G,
                                                   G2GMessagingHistory,
                                                   DocumentComment,
                                                   userFolderService,
                                                   $stateParams) {
        'ngInject';
        var self = this, managerService, correspondenceStorageService;
        self.serviceName = 'correspondenceService';
        // make inherits from parent Model (Correspondence)
        util.inherits(Outgoing, Correspondence);
        util.inherits(Internal, Correspondence);
        util.inherits(Incoming, Correspondence);
        util.inherits(General, Correspondence);
        util.inherits(GeneralStepElementView, WorkItem);
        // for partial export
        util.inherits(PartialExportCollection, PartialExport);
        util.inherits(PartialExportSelective, PartialExport);
        util.inherits(DuplicateOption, ReadyToExportOption);
        // search
        util.inherits(OutgoingSearch, Outgoing);
        util.inherits(IncomingSearch, Outgoing);
        util.inherits(InternalSearch, Outgoing);
        util.inherits(GeneralSearch, Correspondence);
        util.inherits(OutgoingIncomingSearch, IncomingSearch);


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

        var merge = {
                classifications: {
                    model: OUClassification,
                    merge: 'ouClassifications',
                    property: 'classification'
                },
                documentFiles: {
                    model: OUDocumentFile,
                    merge: 'ouDocumentFiles',
                    property: 'file'
                },
                distributionList: {
                    model: OUDistributionList,
                    merge: 'ouDistributionList',
                    property: 'distributionList'
                }
            },
            defaultEntityTypes = ['COMPANY', 'EMPLOYEE', 'EXTERNAL_USER']; // default entity types.

        function _createInstance(correspondence) {
            return new Correspondence(correspondence);
        }

        function _findProperty(property, model) {
            var value = null;
            _.map(model, function (item, key) {
                if (property === key.toLowerCase())
                    value = item;
            });
            return value;
        }

        function _checkPropertyConfiguration(model, properties) {
            var criteria = {};
            _.map(properties, function (item) {
                criteria[item.symbolicName] = _findProperty(item.symbolicName.toLowerCase(), model);
            });
            return criteria;
        }

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

        /**
         * @description get documentClass from given correspondence whatever if Correspondence or WorkItem.
         * @param correspondence
         * @return {*}
         * @private
         */
        function _getDocumentClass(correspondence) {
            var documentClass = null;
            if (correspondence.hasOwnProperty('docClassName') && correspondence.docClassName) {
                documentClass = correspondence.docClassName;
            } else if (correspondence.hasOwnProperty('classDescription') && correspondence.classDescription) {
                documentClass = correspondence.classDescription;
            } else if (correspondence.hasOwnProperty('generalStepElm')) {
                documentClass = generator.getDocumentClassName(correspondence.generalStepElm.docType);
            } else if (correspondence.hasOwnProperty('docClassId')) { // if notification Item
                documentClass = generator.getDocumentClassName(correspondence.docClassId);
            } else { // if Mail Notification
                documentClass = generator.getDocumentClassName(correspondence.docType);
            }
            return documentClass ? documentClass.toLowerCase() : documentClass;
        }

        /**
         * @description get correspondence title from Correspondence or WorkItem.
         * @param correspondence
         * @returns {*}
         * @private
         */
        function _getTitle(correspondence) {
            var docSubject = "";
            if (correspondence instanceof G2GMessagingHistory)
                docSubject = correspondence.subject;
            else {
                docSubject = (correspondence.hasOwnProperty('generalStepElm') && correspondence.generalStepElm)
                    ? correspondence.generalStepElm.docSubject
                    : correspondence.docSubject;
            }
            return docSubject;
        }

        function _getIsPaperElectronic(correspondence) {
            var isPaper = 1;
            if (correspondence.hasOwnProperty('generalStepElm') && correspondence.generalStepElm) { /*WorkItem */
                isPaper = correspondence.generalStepElm.hasOwnProperty('addMethod') ? correspondence.generalStepElm.addMethod : 1;
            } else if (correspondence.hasOwnProperty('addMethod')) { /* Correspondence */
                isPaper = correspondence.addMethod;
            }
            return isPaper;

            /* The ternary condition is removed and separate if else added due to the model "EventHistory" which has different structure than workItem and correspondence */
            //return correspondence.hasOwnProperty('generalStepElm') ? correspondence.generalStepElm.addMethod : correspondence.addMethod;
        }

        /**
         * @description get vsId from  given correspondence whatever if Correspondence or WorkItem.
         * @param correspondence
         * @return {*}
         * @private
         */
        function _getVsId(correspondence) {
            var vsId = "";
            if (correspondence.hasOwnProperty('generalStepElm') && correspondence.generalStepElm) { /* WorkItem */
                vsId = correspondence.generalStepElm.vsId;
            } else if (correspondence.hasOwnProperty('documentVSID') && correspondence.documentVSID) { /* Event History */
                vsId = correspondence.documentVSID;
            }
            /*in case of G2G*/
            else if (correspondence.hasOwnProperty('correspondence')) {
                vsId = correspondence.correspondence.vsId;
            } else {  /* Correspondence */
                vsId = correspondence.vsId;
            }
            return vsId;

            /* The ternary condition is removed and separate if else added due to the model "EventHistory" which has different structure than workItem and correspondence */
            //return correspondence.hasOwnProperty('generalStepElm') ? correspondence.generalStepElm.vsId : correspondence.vsId;
        }

        function _getId(correspondence) {
            return correspondence.id ? correspondence.id : null;
        }

        function _getIncomingVsId(correspondence) {
            var incomingVsId = "";
            if (correspondence.hasOwnProperty('generalStepElm') && correspondence.generalStepElm) { /* WorkItem */
                incomingVsId = correspondence.generalStepElm.incomingVSID;
            }
            /*else if (correspondence.hasOwnProperty('incomingVSID') && correspondence.incomingVSID) { /!* Event History *!/
             incomingVsId = correspondence.incomingVSID;
             }*/
            else {  /* Correspondence */
                incomingVsId = correspondence.incomingVSID;
            }
            return incomingVsId;
        }

        function _getWorkFlow(correspondence) {
            return correspondence.hasOwnProperty('generalStepElm') && correspondence.generalStepElm && correspondence.generalStepElm.workFlowName ? correspondence.generalStepElm.workFlowName.toLowerCase() : null;
        }

        function _getWobNumber(correspondence) {
            var wobNumber = "";
            if (correspondence.hasOwnProperty('generalStepElm') && correspondence.generalStepElm) { /* WorkItem */
                wobNumber = correspondence.generalStepElm.workObjectNumber;
            } else if (correspondence.hasOwnProperty('wobNum') && correspondence.wobNum) { /* EventHistory */
                wobNumber = correspondence.wobNum;
            } else {  /* Correspondence */
                wobNumber = correspondence.workObjectNumber;
            }
            return wobNumber;

            /* The ternary condition is removed and separate if else added due to the model "EventHistory" which has different structure than workItem and correspondence */
            //return correspondence.hasOwnProperty('generalStepElm') ? correspondence.generalStepElm.workObjectNumber : correspondence.workObjectNumber;
        }


        /**
         * @description get document status from given correspondence whatever if Correspondence or WorkItem.
         * @param correspondence
         * @return {*}
         * @private
         */
        function _getDocumentStatus(correspondence) {
            var documentStatus = 0;
            //var allDocumentStatuses = documentStatusService.getDocumentStatuses();
            if (correspondence.hasOwnProperty('generalStepElm') && correspondence.generalStepElm) {
                documentStatus = correspondence.generalStepElm.docStatus;
            } else if (correspondence.hasOwnProperty('docStatus') && correspondence.docStatus) {
                documentStatus = correspondence.docStatus;
            }
            /*else { // if notification Item
             documentStatus = generator.getDocumentClassName(correspondence.docClassId);
             }*/
            return documentStatus;
        }

        /**
         * @description get document full serial from given correspondence whatever if Correspondence or WorkItem.
         * @param correspondence
         * @return {*}
         * @private
         */
        function _getDocFullSerial(correspondence) {
            var docFullSerial = "";
            if (correspondence.hasOwnProperty('generalStepElm') && correspondence.generalStepElm) {
                docFullSerial = correspondence.generalStepElm.docFullSerial;
            } else if (correspondence.hasOwnProperty('docFullSerial') && correspondence.docFullSerial) {
                docFullSerial = correspondence.docFullSerial;
            }
            /*else { // if notification Item
             documentStatus = generator.getDocumentClassName(correspondence.docClassId);
             }*/
            return docFullSerial;
        }

        /**
         * @description get document type from given correspondence whatever if Correspondence or WorkItem.
         * @param correspondence
         * @return {*}
         * @private
         */
        function _getDocType(correspondence) {
            var docType = null;
            if (correspondence.hasOwnProperty('generalStepElm') && correspondence.generalStepElm) {
                docType = correspondence.generalStepElm.docType;
            } else if (correspondence.hasOwnProperty('docType') && correspondence.docType) {
                docType = correspondence.docType;
            }
            /*else { // if notification Item
             docType = generator.getDocumentClassName(correspondence.docType);
             }*/
            return docType;
        }

        /**
         * @description to get fromEditOnDesktop porperty value // note: it will not work from any model except Correspondence Model like [Outgoing,incoming,internal]
         * @param correspondence
         * @return {boolean}
         * @private
         */
        function _getEditInDesktop(correspondence) {
            return correspondence.hasOwnProperty('generalStepElm') ? false : (correspondence.hasOwnProperty('fromEditOnDesktop') ? correspondence.fromEditOnDesktop : false);
        }

        /**
         * @description bulk message for any bulk actions.
         * @param result
         * @param collection
         * @param ignoreMessage
         * @param errorMessage
         * @param successMessage
         * @param failureSomeMessage
         * @returns {*}
         * @private
         */
        function _bulkMessages(result, collection, ignoreMessage, errorMessage, successMessage, failureSomeMessage) {
            var failureCollection = [];
            var currentIndex = 0;
            _.map(result.data.rs, function (value) {
                if (!value)
                    failureCollection.push(collection[currentIndex]);
                currentIndex++;
            });
            if (!ignoreMessage) {
                if (failureCollection.length === collection.length) {
                    toast.error(langService.get(errorMessage));
                } else if (failureCollection.length) {
                    generator.generateFailedBulkActionRecords(failureSomeMessage, _.map(failureCollection, function (item) {
                        return item.getTranslatedName();
                    }));
                } else {
                    toast.success(langService.get(successMessage));
                }
            }
            return collection;
        }

        /**
         * to create correspondence structure for update or prepare document with Content.
         * @param correspondence
         * @param information
         * @return {{book, userGuid: *, fileName: (*|null)}}
         * @private
         */
        function _createCorrespondenceStructure(correspondence, information) {
            return {
                book: generator.interceptSendInstance(['Correspondence', _getModelName(correspondence.docClassName)], correspondence),
                userGuid: information.userGuid,
                fileName: information.fileName
            };
        }

        self.interceptSendCollectionBasedOnEachDocumentClass = function (collection) {
            var correspondences = [];
            _.map(collection, function (correspondence) {
                correspondences.push(generator.interceptSendInstance(['Correspondence', _getModelName(correspondence.getInfo().documentClass)], correspondence));
            });
            return correspondences;
        };

        self.interceptReceivedCollectionBasedOnEachDocumentClass = function (collection) {
            _.map(collection, function (correspondence, key) {
                var documentClass = _getModelName(_getDocumentClass(correspondence));
                correspondence = generator.generateInstance(correspondence, _getModel(documentClass));
                collection[key] = generator.interceptReceivedInstance(['Correspondence', documentClass], correspondence);
            });
            return collection;
        };

        /**
         * @description get correspondence information (documentClass , vsId ) from given correspondence or WorkItem.
         * @param correspondence
         * @return {CorrespondenceInfo}
         */
        self.getCorrespondenceInformation = function (correspondence) {
            return new CorrespondenceInfo({
                documentClass: _getDocumentClass(correspondence),
                vsId: _getVsId(correspondence),
                id: _getId(correspondence),
                workFlow: _getWorkFlow(correspondence),
                wobNumber: _getWobNumber(correspondence),
                title: _getTitle(correspondence),
                isPaper: _getIsPaperElectronic(correspondence),
                docStatus: _getDocumentStatus(correspondence),
                docFullSerial: _getDocFullSerial(correspondence),
                incomingVsId: _getIncomingVsId(correspondence),
                docType: _getDocType(correspondence),
                editByDeskTop: _getEditInDesktop(correspondence)
            });
        };
        /**
         * @description to get the book by vsId and document class.
         * @param vsId
         * @param documentClass
         */
        self.loadCorrespondenceByVsIdClass = function (vsId, documentClass) {
            return $http.get(_createUrlSchema(vsId, documentClass))
                .then(function (result) {
                    var model = generator.generateInstance(result.data.rs, _getModel(documentClass));
                    return generator.interceptReceivedInstance(['Correspondence', _getModelName(documentClass)], model);
                })
        };
        /**
         * @description add linked object for Correspondence.
         * @param correspondence
         */
        self.addLinkedObject = function (correspondence) {
            var id = correspondence.hasOwnProperty('vsId') ? correspondence.vsId : correspondence;
            return $http.put((urlService.outgoings + '/' + id + '/linked-objects'),
                (generator.interceptSendCollection('LinkedObject', correspondence.linkedEntities))
            ).then(function () {
                return generator.generateCollection(correspondence.linkedEntities, LinkedObject);
            });
        };

        /**
         * @description get linked entities
         * @param correspondence
         */
        self.getLinkedEntities = function (correspondence) {
            return $http
                .get(_createUrlSchema(correspondence.vsId, correspondence.docClassName, 'linked-objects'))
                .then(function (result) {
                    return generator.interceptReceivedCollection('LinkedObject', _.map(generator.generateCollection(result.data.rs, LinkedObject), function (item) {
                        item.documentClass = correspondence.docClassName;
                        return item;
                    }));
                });
        };

        /**
         * get linked entities by vsId and documentClass.
         * @param vsId
         * @param documentClass
         */
        self.getLinkedEntitiesByVsIdClass = function (vsId, documentClass) {
            var correspondence = {
                vsId: vsId,
                docClassName: documentClass
            };
            return self.getLinkedEntities(correspondence);
        };

        /**
         * @description make an update for given correspondence.
         * @param correspondence
         * @return {Promise|Correspondence}
         */
        self.updateCorrespondence = function (correspondence) {
            return $http
                .put(
                    _createUrlSchema(null, correspondence.docClassName, 'metadata'),
                    generator.interceptSendInstance(['Correspondence', _getModelName(correspondence.docClassName)], correspondence)
                ).then(function () {
                    return generator.generateInstance(correspondence, _getModel(correspondence.docClassName));
                }).catch(function (error) {
                    return $q.reject(self.getTranslatedError(error));
                });
        };

        /**
         * @description  add correspondence
         * @param correspondence
         * @return {Promise|Correspondence}
         */
        self.createCorrespondence = function (correspondence) {
            var route = correspondence.docStatus === 3 ? 'draft' : 'metadata';
            if (correspondence.contentFile) {
                //route = 'draft';
                if (correspondence.addMethod === 0)
                    correspondence.signaturesCount = 1;
            }

            return $http
                .post(_createUrlSchema(correspondence.vsId, correspondence.docClassName, route),
                    generator.interceptSendInstance(['Correspondence', _getModelName(correspondence.docClassName)], correspondence)
                )
                .then(function (result) {
                    correspondence.vsId = result.data.rs;
                    return generator.generateInstance(correspondence, _getModel(correspondence.docClassName));
                }).catch(function (error) {
                    return $q.reject(self.getTranslatedError(error));
                });
        };
        /**
         * add Correspondence with the full-template
         * @param correspondence
         * @param information
         */
        self.addCorrespondenceWithTemplate = function (correspondence, information) {
            if (correspondence.hasVsId()) {
                return self.updateCorrespondenceWithContent(correspondence, information);
            }
            var book = _createCorrespondenceStructure(correspondence, information);
            var url = _createUrlSchema(correspondence.vsId, correspondence.docClassName, 'full-with-template');
            // BeSaRa: just for NHRC and after that i will remove it and should make it from backend team.
            return $http.post(url, book)
                .then(function (result) {
                    correspondence.vsId = result.data.rs;
                    return generator.generateInstance(correspondence, _getModel(correspondence.docClassName));
                }).catch(function (error) {
                    return $q.reject(self.getTranslatedError(error));
                });
        };

        /**
         * update Correspondence with content.
         * @param correspondence
         * @param information
         */
        self.updateCorrespondenceWithContent = function (correspondence, information) {
            var book = _createCorrespondenceStructure(correspondence, information);
            // BeSaRa: just for NHRC and after that i will remove it and should make it from backend team.
            return $http.put(_createUrlSchema(null, correspondence.docClassName, 'full-with-template'), book)
                .then(function (result) {
                    correspondence.vsId = result.data.rs;
                    return generator.generateInstance(correspondence, _getModel(correspondence.docClassName));
                }).catch(function (error) {
                    return $q.reject(self.getTranslatedError(error));
                });
        };

        /**
         * @description add content file into document.
         * @param correspondence
         */
        self.saveDocumentContentFile = function (correspondence) {
            if (correspondence.hasVsId()) {
                var form = new FormData();
                //console.log("FROM SERVICE", correspondence.contentFile);
                form.append('content', correspondence.contentFile);
                return $http.post(_createUrlSchema(correspondence.vsId, correspondence.docClassName, 'content'), form, {
                    headers: {
                        'Content-Type': undefined
                    }
                })
                    .then(function (result) {
                        correspondence.vsId = result.data.rs;
                        return generator.generateInstance(correspondence, _getModel(correspondence.docClassName));
                    });
            }
        };

        /**
         * @description to get the book by id.
         * @param id
         * @param documentClass
         */
        self.loadCorrespondenceById = function (id, documentClass) {
            return $http.get(urlService.correspondence + '/' + documentClass + '/id/' + id)
                .then(function (result) {
                    var model = generator.generateInstance(result.data.rs, _getModel(documentClass));
                    return generator.interceptReceivedInstance(['Correspondence', _getModelName(documentClass)], model);

                });
        };
        /**
         * correspondence search for any document Type.
         * @param correspondence
         */
        self.correspondenceSearch = function (correspondence) {
            var info = correspondence.getInfo(), criteria;
            criteria = generator.interceptSendInstance('Search' + _getModelName(info.documentClass), correspondence);
            criteria = _checkPropertyConfiguration(criteria, lookupService.getPropertyConfigurations(info.documentClass));
            return $http
                .post(urlService.correspondence + '/search/' + info.documentClass, generator.interceptSendInstance('SearchCriteria', criteria))
                .then(function (result) {
                    return generator.interceptReceivedCollection(['Correspondence', _getModelName(info.documentClass)], generator.generateCollection(result.data.rs, _getModel(info.documentClass)))
                });
        };
        /**
         * @description get linked documents for given correspondence.
         * @param correspondence
         * @returns {Array}
         */
        self.getLinkedDocuments = function (correspondence) {
            return $http
                .get(_createUrlSchema(correspondence.vsId, correspondence.docClassName, 'linked-docs'))
                .then(function (result) {
                    return self.interceptReceivedCollectionBasedOnEachDocumentClass(result.data.rs);
                })
                .catch(function (error) {
                    // check if empty result return empty array
                    return errorCode.checkIf(error, 'EMPTY_RESULT', function () {
                        return [];
                    });
                });
        };
        /**
         * @description get linked document for given vsId and documentClass
         * @param vsId
         * @param documentClass
         * @returns {Array}
         */
        self.getLinkedDocumentsByVsIdClass = function (vsId, documentClass) {
            var correspondence = {
                vsId: vsId,
                docClassName: documentClass
            };
            return self.getLinkedDocuments(correspondence);
        };
        /**
         * @description
         * @param correspondence
         */
        self.updateLinkedDocuments = function (correspondence) {
            return $http
                .put(_createUrlSchema(correspondence.vsId, correspondence.docClassName, 'linked-docs'), self.interceptSendCollectionBasedOnEachDocumentClass(correspondence.linkedDocs))
                .then(function () {
                    return correspondence.linkedDocs;
                });

        };
        /**
         * @description load lookups for correspondence depend on documentClass.
         * @param documentClass
         */
        self.loadCorrespondenceLookups = function (documentClass) {
            documentClass = documentClass.toLowerCase();
            return $http
                .get(urlService.correspondenceLookups.replace('{{documentClass}}', documentClass))
                .then(function (result) {
                    if (documentClass !== 'common') {
                        self.screenLookups[documentClass] = self.prepareLookups(documentClass, result.data.rs);
                    } else {
                        var documentClasses = Object.keys(self.screenLookups);
                        _.map(result.data.rs, function (lookups, key) {
                            self.screenLookups[documentClasses[key]] = self.prepareLookups(documentClasses[key], lookups);
                        });
                        return self.screenLookups;
                    }
                    return self.screenLookups[documentClass];
                });
        };

        /**
         * get correspondence lookups
         * @param documentClass
         * @returns {Promise}
         */
        self.getCorrespondenceLookups = function (documentClass) {
            documentClass = documentClass.toLowerCase();
            return self.screenLookups[documentClass] ? $q.when(self.screenLookups[documentClass]) : self.loadCorrespondenceLookups(documentClass);
        };

        /**
         * @description private method to prepare the lookup for correspondence.
         * @param documentClass
         * @param screenLookups
         * @returns {*}
         */
        self.prepareLookups = function (documentClass, screenLookups) {
            var lookups = {
                classifications: {
                    model: Classification,
                    modelName: 'Classification'
                },
                docTypes: {
                    model: DocumentType,
                    modelName: 'DocumentType'
                },
                documentFiles: {
                    model: DocumentFile,
                    modelName: 'DocumentFile'
                },
                ouClassifications: {
                    model: OUClassification,
                    modelName: 'OUClassification'
                },
                ouDocumentFiles: {
                    model: OUDocumentFile,
                    modelName: 'OUDocumentFile'
                },
                securityLevels: {
                    model: Lookup,
                    modelName: 'Lookup'
                },
                siteTypes: {
                    model: CorrespondenceSiteType,
                    modelName: 'CorrespondenceSiteType'
                },
                entityTypes: {
                    model: EntityType,
                    modelName: 'EntityType'
                },
                templates: {
                    model: DocumentTemplate,
                    modelName: 'DocumentTemplate'
                },
                distributionList: {
                    model: DistributionList,
                    modelName: 'DistributionList'
                }
            };
            _.map(lookups, function (value, key) {
                screenLookups[key] = generator.generateCollection(screenLookups[key], value.model);
                screenLookups[key] = generator.interceptReceivedCollection(value.modelName, screenLookups[key]);
            });

            return self.prepareLookupHierarchy(screenLookups);
        };
        /**
         * merge and make hierarchy for lookups
         * @param lookups
         * @returns {*}
         */
        self.prepareLookupHierarchy = function (lookups) {
            // change model structure
            var children;

            _.map(merge, function (value, key) {
                lookups[key + 'Flat'] = _.map(lookups[key], function (model) {
                    var mappedModel = {};
                    mappedModel[value.property] = model;
                    return new value.model(mappedModel)
                }).concat(lookups[value.merge] || []);

                lookups[key] = _.filter(lookups[key + 'Flat'], function (model) {
                    return !model[value.property].parent;
                });
                children = _.filter(lookups[key + 'Flat'], function (model) {
                    return !!(model[value.property].parent);
                });
                // get children for lookups
                lookups[key] = _.map(lookups[key], function (model) {
                    model[value.property].children = _.map(_.filter(children, function (child) {
                        var parentId = child[value.property].parent.hasOwnProperty('id') ? child[value.property].parent.id : child[value.property].parent;
                        return model[value.property].id === parentId;
                    }), value.property);
                    return model;
                });

                delete lookups[value.merge];
            });
            return lookups;
        };
        /***
         * get lookups
         * @param documentClass
         * @param lookupKey
         * @param lookupName
         * @returns {*}
         */
        self.getLookup = function (documentClass, lookupName, lookupKey) {
            return (typeof lookupKey === 'undefined') ? self.screenLookups[documentClass.toLowerCase()][lookupName] : _.find(self.screenLookups[documentClass.toLowerCase()][lookupName], function (item) {
                return Number(item.lookupKey) === Number(lookupKey);
            });
        };

        self.getLookupUnionByLookupName = function (lookupName, lookupKey) {
            var lookups = [];
            for (var i in self.screenLookups) {
                if (self.screenLookups.hasOwnProperty(i) && self.screenLookups[i] && self.screenLookups[i].hasOwnProperty(lookupName)) {
                    lookups = lookups.concat(self.screenLookups[i][lookupName]);
                }
            }
            lookups = _.uniqBy(lookups, 'lookupKey');
            return (typeof lookupKey === 'undefined') ? lookups : _.find(lookups, function (item) {
                return Number(item.lookupKey) === Number(lookupKey);
            });
        };

        /**
         * @description get custom entity type for documentClass
         * @param documentClass
         * @return {Array}
         */
        self.getCustomEntityTypesForDocumentClass = function (documentClass) {
            return _.filter(self.getLookup(documentClass, 'entityTypes'), function (type) {
                return defaultEntityTypes.indexOf(type.lookupStrKey) === -1;
            });
        };
        /**
         * @description get default entity types for document class.
         * @param documentClass
         * @return {Array}
         */
        self.getDefaultEntityTypesForDocumentClass = function (documentClass) {
            return _.filter(self.getLookup(documentClass, 'entityTypes'), function (type) {
                return defaultEntityTypes.indexOf(type.lookupStrKey) !== -1;
            });
        };
        /**
         * get lookup By Id from lookups
         * @param documentClass
         * @param lookupName
         * @param id
         */
        self.getCorrespondenceLookupById = function (documentClass, lookupName, id) {
            var insideMerge = (Object.keys(merge).indexOf(lookupName) !== -1) ? merge[lookupName].property : false;
            lookupName = insideMerge ? (lookupName + 'Flat') : lookupName;
            return _.find(_.map(self.screenLookups[documentClass][lookupName], function (lookup) {
                return insideMerge ? lookup[insideMerge] : lookup;
            }), function (lookup) {
                return Number(lookup.id) === id;
            });
        };
        /**
         * @description get barcode url for correspondence.
         * @param correspondence
         */
        self.correspondenceGetBarcode = function (correspondence) {
            var info = correspondence.getInfo();
            return $http
                .get(_createUrlSchema(null, info.documentClass, 'barcode/' + info.vsId))
                .then(function (result) {
                    return result.data.rs
                })
        };
        /**
         * @description transfer single workItem.
         * @param workItem
         */
        self.transferSingleWorkItem = function (workItem) {
            return $http
                .put((urlService.userInbox + '/' + workItem.wobNumber + '/reassign'), {
                    user: workItem.user,
                    comment: workItem.comment,
                    appUserOUID: workItem.appUserOUID
                })
                .then(function (result) {
                    return result.data.rs;
                });
        };
        /**
         * @description transfer bulk workItems.
         * @param workItems
         */
        self.transferSingleWorkItemBulk = function (workItems) {
            return $http
                .put(urlService.userInbox + '/reassign/bulk', _.map(workItems, function (workItem) {
                    return {
                        wobNum: workItem.getInfo().wobNumber,
                        comment: workItem.comment,
                        user: workItem.user,
                        appUserOUID: workItem.appUserOUID
                    }
                }))
                .then(function (result) {
                    return result.data.rs;
                })
        };

        /**
         * @description open print barcode dialog to start print the barcode.
         * @param correspondence
         * @param $event
         * @returns {promise|*}
         */
        self.correspondencePrintBarcode = function (correspondence, $event) {
            var defer = $q.defer();
            return dialog.showDialog({
                templateUrl: cmsTemplate.getPopup('print-barcode'),
                bindToController: true,
                controllerAs: 'ctrl',
                eventTarget: $event,
                controller: function ($element, $timeout) {
                    'ngInject';
                    this.printCorrespondenceBarcodeFromCtrl = function () {
                        var WinPrint = window.open('', '', 'left=0,top=0,width=0,height=0,toolbar=0,scrollbars=0,status=0');
                        $timeout(function () {
                            WinPrint.document.write($element.find("#barcode-area")[0].innerHTML);
                            WinPrint.document.close();
                            WinPrint.focus();
                            WinPrint.print();
                            WinPrint.close();
                        });
                    }
                },
                locals: {
                    title: correspondence.getInfo().title
                },
                resolve: {
                    loadBarcode: function () {
                        return self
                            .correspondenceGetBarcode(correspondence)
                            .then(function (result) {
                                return result.replace('\\', '');
                            }).then(function (result) {
                                defer.resolve(result);
                            });
                    },
                    barcode: function () {
                        'ngInject';
                        return defer.promise.then(function (url) {
                            var image = new Image(), defer2 = $q.defer();
                            var canvas = document.createElement("canvas");
                            var ctx = canvas.getContext("2d");
                            image.crossOrigin = "anonymous";
                            image.onload = function (ev) {
                                canvas.width = image.width;
                                canvas.height = image.height;
                                ctx.drawImage(image, 0, 0);
                                defer2.resolve(canvas.toDataURL());
                            };
                            image.src = url;
                            return defer2.promise;
                        });
                    }
                }
            })
        };
        /**
         * @description open transfer dialog to select user to transfer.
         * @param workItems
         * @param currentFollowedUpUser
         * @param $event
         */
        self.openTransferDialog = function (workItems, currentFollowedUpUser, $event) {
            var isArray = angular.isArray(workItems);

            return dialog
                .showDialog({
                    templateUrl: cmsTemplate.getPopup('transfer-mail'),
                    controller: 'transferMailPopCtrl',
                    controllerAs: 'ctrl',
                    targetEvent: $event,
                    locals: {
                        workItems: workItems,
                        isArray: isArray,
                        currentFollowedUpUser: currentFollowedUpUser
                    },
                    resolve: {
                        organizations: function (organizationService) {
                            'ngInject';
                            return organizationService.getOrganizationsByRegOU(employeeService.getEmployee().getRegistryOUID());
                        },
                        comments: function (userCommentService) {
                            'ngInject';
                            return userCommentService.getUserComments()
                                .then(function (result) {
                                    return _.filter(result, 'status');
                                });
                        }
                    }
                })
                .then(function (workItems) {
                    var promise;
                    if (!isArray) {
                        promise = self.transferSingleWorkItem(workItems);
                    } else {
                        promise = self.transferSingleWorkItemBulk(workItems);
                    }
                    return promise;
                });
        };
        /**
         * @description open comment dialog for workItem reason.
         * @returns {promise|*}
         */
        self.openCommentDialog = function () {
            return dialog
                .showDialog({
                    templateUrl: cmsTemplate.getPopup('reason'),
                    controller: 'reasonPopCtrl',
                    controllerAs: 'ctrl',
                    bindToController: true,
                    locals: {
                        justReason: true,
                        title: 'select_reason'
                    },
                    resolve: {
                        comments: function (userCommentService) {
                            'ngInject';
                            return userCommentService.getUserComments();
                        }
                    }
                });
        };
        var _sendToReadyToExport = function (correspondence, $event) {
            var info = correspondence.getInfo();
            var parts = info.wobNumber ? ('vsid/' + info.vsId + '/wob-num/' + info.wobNumber + '/to-ready-export') : 'vsid/' + info.vsId + '/to-ready-export';
            var url = info.wobNumber ? _createUrlSchema(null, info.documentClass, parts).replace('/correspondence', '/correspondence/wf') : _createUrlSchema(null, info.documentClass, parts);
            return $http.put(url)
                .then(function (result) {
                    return result.data.rs;
                });
        };
        /**
         * @description send correspondence to ready to export queue.
         * @param correspondence
         * @param $event
         */
        self.sendCorrespondenceToReadyToExport = function (correspondence, $event) {
            var normalCorrespondence = angular.isArray(correspondence) ? !correspondence[0].isWorkItem() : !correspondence.isWorkItem();
            var count = angular.isArray(correspondence) ? correspondence.length : 1;
            if (normalCorrespondence) {
                var sitesValidation = self.validateBeforeSend(correspondence);
                if (sitesValidation.length && sitesValidation.length === count && count === 1) {
                    var info = correspondence.getInfo();
                    return dialog
                        .confirmMessage(langService.get('no_sites_cannot_send'), 'add', 'cancel', $event)
                        .then(function () {
                            return managerService
                                .manageDocumentCorrespondence(info.vsId, info.documentClass, info.title, $event)
                                .then(function (result) {
                                    return result.hasSite() ? _sendToReadyToExport(correspondence, $event) : null;
                                })
                        })
                } else {
                    return _sendToReadyToExport(correspondence, $event);
                }
            }
            return _sendToReadyToExport(correspondence, $event);
        };

        var _sendToCentralArchiveReadyToExport = function (correspondence, ignoreMessage) {
            var info = correspondence.getInfo();
            return $http
                .put(_createUrlSchema(null, info.documentClass, ['vsid', info.vsId, 'to-ready-export-central-archive'].join('/')))
                .then(function (result) {
                    if (!ignoreMessage) {
                        var success = result.data.rs, method = success ? 'success' : 'error',
                            message = success ? 'sent_to_the_central_archive_success' : 'internal_server_error';
                        toast[method](langService.get(message));
                    }
                    return correspondence;
                });
        };
        /**
         * @description send correspondence to central archive from review.
         * @param correspondence
         * @param ignoreMessage
         * @param $event
         */
        self.sendToCentralArchiveReadyToExport = function (correspondence, ignoreMessage, $event) {
            var normalCorrespondence = angular.isArray(correspondence) ? !correspondence[0].isWorkItem() : !correspondence.isWorkItem();
            var count = angular.isArray(correspondence) ? correspondence.length : 1;
            if (normalCorrespondence) {
                var sitesValidation = self.validateBeforeSend(correspondence);
                if (sitesValidation.length && sitesValidation.length === count && count === 1) {
                    var info = correspondence.getInfo();
                    return dialog
                        .confirmMessage(langService.get('no_sites_cannot_send'), 'add', 'cancel', $event)
                        .then(function () {
                            return managerService
                                .manageDocumentCorrespondence(info.vsId, info.documentClass, info.title, $event)
                                .then(function (result) {
                                    return result.hasSite() ? _sendToCentralArchiveReadyToExport(correspondence, ignoreMessage) : null;
                                })
                        })
                } else {
                    return _sendToCentralArchiveReadyToExport(correspondence, ignoreMessage);
                }
            }
            return _sendToCentralArchiveReadyToExport(correspondence, ignoreMessage);
        };
        /**
         * create reply from workItem.
         * @param documentClass
         * @param wobNumber
         * @param fromDocumentClass
         * @param followUpStatus
         */
        self.createReplyFromWorkItem = function (documentClass, wobNumber, fromDocumentClass, followUpStatus) {
            return $http
                .put(_createUrlSchema(null, documentClass, wobNumber + '/create-replay/' + fromDocumentClass.toLowerCase()), followUpStatus)
                .then(function (result) {
                    return generator.interceptReceivedInstance(['Correspondence', _getModelName(fromDocumentClass)], generator.generateInstance(result.data.rs, _getModel(fromDocumentClass)));
                });
        };
        /**
         * @description create reply from vsId
         * @param documentClass
         * @param vsId
         * @param fromDocumentClass
         * @param followUpStatus
         */
        self.createReplyFromCorrespondence = function (documentClass, vsId, fromDocumentClass, followUpStatus) {
            return $http
                .put(_createUrlSchema(null, documentClass, vsId + '/create-replay-from-search/' + fromDocumentClass.toLowerCase()), followUpStatus)
                .then(function (result) {
                    return generator.interceptReceivedInstance(['Correspondence', _getModelName(fromDocumentClass)], generator.generateInstance(result.data.rs, _getModel(fromDocumentClass)));
                });
        };
        /**
         * @description edit Correspondence after approved from readyTo Export
         * @param documentClass
         * @param vsId
         * @param wobNumber
         */
        self.correspondenceEditAfterApproved = function (documentClass, vsId, wobNumber) {
            return $http
                .put(_createUrlSchema(null, documentClass, 'vsid/' + vsId + '/wob-num/' + wobNumber + '/authorize/edit'))
                .then(function (result) {
                    result.data.rs.metaData = generator.interceptReceivedInstance(['Correspondence', _getModelName(documentClass), 'View' + _getModelName(documentClass)], generator.generateInstance(result.data.rs.metaData, _getModel(documentClass)));
                    return result.data.rs;
                });
        };
        /**
         * @description edit after export while the current document
         * @param documentClass
         * @param vsId
         * @param wobNumber
         */
        self.correspondenceEditAfterExport = function (documentClass, vsId, wobNumber) {
            return $http
                .put(_createUrlSchema(null, documentClass, 'vsid/' + vsId + '/wob-num/' + wobNumber + '/export/edit'))
                .then(function (result) {
                    result.data.rs.metaData = generator.interceptReceivedInstance(['Correspondence', _getModelName(documentClass), 'View' + _getModelName(documentClass)], generator.generateInstance(result.data.rs.metaData, _getModel(documentClass)));
                    return result.data.rs;
                });
        };
        /**
         * @description load correspondence Sites for correspondence.
         * @param correspondence
         */
        self.loadCorrespondenceSites = function (correspondence) {
            var info = correspondence.getInfo();
            return $http
                .get(_createUrlSchema(info.vsId, info.documentClass, 'correspondence-site'))
                .then(function (result) {
                    result.data.rs.first = _.map(result.data.rs.first, function (site) {
                        site.docClassName = info.documentClass;
                        return site;
                    });
                    result.data.rs.second = _.map(result.data.rs.second, function (site) {
                        site.docClassName = info.documentClass;
                        return site;
                    });
                    return generator.interceptReceivedHashMap('Site', generator.generateHashMap(result.data.rs, Site));
                });
        };
        /**
         * @description update correspondence site for document
         * @param correspondence
         * @returns {Promise}
         */
        self.updateCorrespondenceSites = function (correspondence) {
            var info = correspondence.getInfo();
            return $http
                .put(_createUrlSchema(info.vsId, info.documentClass, 'correspondence-site'), {
                    first: generator.interceptSendCollection('Site', correspondence.sitesInfoTo),
                    second: generator.interceptSendCollection('Site', correspondence.sitesInfoCC)
                });
        };

        /**
         * @description view correspondence
         * @param correspondence
         * @param actions
         * @param disableProperties
         * @param disableCorrespondence
         * @param department
         * @param readyToExport(true if the view from readyToExport department.)
         * @param approvedQueue
         * @param departmentIncoming
         */
        self.viewCorrespondence = function (correspondence, actions, disableProperties, disableCorrespondence, department, readyToExport, approvedQueue, departmentIncoming) {
            var info = typeof correspondence.getInfo === 'function' ? correspondence.getInfo() : _createInstance(correspondence).getInfo();
            var workItem = info.isWorkItem() ? correspondence : false;
            var incomingWithIncomingVsId = departmentIncoming && info.incomingVsId;
            //if (incomingWithIncomingVsId)
            //    workItem = false;
            if (workItem && !incomingWithIncomingVsId && info.docType !== 1)
                return self.viewCorrespondenceWorkItem(info, actions, disableProperties, disableCorrespondence, department, readyToExport, approvedQueue, departmentIncoming);

            return $http.get(_createUrlSchema(incomingWithIncomingVsId ? info.incomingVsId : info.vsId, incomingWithIncomingVsId ? 'incoming' : info.documentClass, 'with-content'))
                .then(function (result) {
                    var documentClass = result.data.rs.metaData.classDescription;
                    result.data.rs.metaData = generator.interceptReceivedInstance(['Correspondence', _getModelName(documentClass), 'View' + _getModelName(documentClass)], generator.generateInstance(result.data.rs.metaData, _getModel(documentClass)));
                    if (correspondence.openInEditMode) {
                        result.data.rs.metaData.openInEditMode = correspondence.openInEditMode;
                    }
                    return result.data.rs;
                })
                .then(function (result) {
                    result.content.viewURL = $sce.trustAsResourceUrl(result.content.viewURL);
                    result.content.editURL = $sce.trustAsResourceUrl(result.content.editURL);
                    generator.addPopupNumber();
                    return dialog.showDialog({
                        templateUrl: cmsTemplate.getPopup('view-correspondence'),
                        controller: 'viewCorrespondencePopCtrl',
                        controllerAs: 'ctrl',
                        bindToController: true,
                        escapeToCancel: false,
                        locals: {
                            correspondence: result.metaData,
                            content: result.content,
                            actions: actions,
                            workItem: info.workFlow === 'internal' ? correspondence : workItem,
                            disableProperties: disableProperties,
                            disableCorrespondence: disableCorrespondence,
                            popupNumber: generator.getPopupNumber(),
                            disableEverything: !!departmentIncoming,
                            pageName: 'none'
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
                        generator.removePopupNumber();
                        return true;
                    }).catch(function () {
                        generator.removePopupNumber();
                        return false;
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
         * get view link for documents.
         * @param correspondence
         */
        self.getLinkedDocumentViewURL = function (correspondence) {
            var info = correspondence.getInfo();
            return $http.get(_createUrlSchema(info.vsId, info.documentClass, 'with-content'))
                .then(function (result) {
                    var documentClass = result.data.rs.metaData.classDescription;
                    result.data.rs.metaData = generator.interceptReceivedInstance(['Correspondence', _getModelName(documentClass), 'View' + _getModelName(documentClass)], generator.generateInstance(result.data.rs.metaData, _getModel(documentClass)));
                    return result.data.rs;
                })
                .then(function (result) {
                    return result.content.viewURL = $sce.trustAsResourceUrl(result.content.viewURL);
                })
        };

        /**
         * @description open group inbox
         * @param correspondence
         * @param actions
         * @param disableProperties
         * @param disableCorrespondence
         */
        self.viewCorrespondenceGroupMail = function (correspondence, actions, disableProperties, disableCorrespondence) {
            var info = typeof correspondence.getInfo === 'function' ? correspondence.getInfo() : _createInstance(correspondence).getInfo();
            return $http.get([urlService.correspondence, 'ou-queue', 'wob-num', info.wobNumber].join('/'))
                .then(function (result) {
                    return generator.interceptReceivedInstance('GeneralStepElementView', generator.generateInstance(result.data.rs, GeneralStepElementView));
                })
                .then(function (generalStepElementView) {
                    generator.addPopupNumber();
                    return dialog.showDialog({
                        templateUrl: cmsTemplate.getPopup('view-correspondence'),
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
                            disableProperties: disableProperties,
                            disableCorrespondence: disableCorrespondence,
                            disableEverything: false,
                            popupNumber: generator.getPopupNumber()
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
                            generator.removePopupNumber();

                            return true;
                        })
                        .catch(function () {
                            generator.removePopupNumber();
                            return false;
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
         * @description to view correspondence workItem
         */
        self.viewCorrespondenceWorkItem = function (info, actions, disableProperties, disableCorrespondence, department, readyToExport, approvedQueue, departmentIncoming) {
            return $http.get(approvedQueue ? _createCorrespondenceWFSchema([info.documentClass, 'approved-queue', 'wob-num', info.wobNumber]) : _createWorkItemSchema(info, department, readyToExport))
                .then(function (result) {
                    return generator.interceptReceivedInstance('GeneralStepElementView', generator.generateInstance(result.data.rs, GeneralStepElementView));
                })
                .then(function (generalStepElementView) {
                    generator.addPopupNumber();
                    return dialog
                        .showDialog({
                            templateUrl: cmsTemplate.getPopup('view-correspondence'),
                            controller: 'viewCorrespondencePopCtrl',
                            controllerAs: 'ctrl',
                            bindToController: true,
                            escapeToCancel: false,
                            locals: {
                                correspondence: generalStepElementView.correspondence,
                                content: generalStepElementView.documentViewInfo,
                                actions: actions,
                                workItem: generalStepElementView,
                                readyToExport: readyToExport,
                                disableProperties: disableProperties,
                                disableCorrespondence: disableCorrespondence,
                                disableEverything: departmentIncoming,
                                popupNumber: generator.getPopupNumber(),
                                pageName: 'none'
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
                            generator.removePopupNumber();
                            return true;
                        })
                        .catch(function () {
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
         * @description to view correspondence workItem(proxy mail)
         */
        self.viewCorrespondenceProxyWorkItem = function (info, actions, disableProperties, disableCorrespondence, department, readyToExport, approvedQueue, departmentIncoming) {
            var url = urlService.inboxWF + '/proxy/wob-num/' + info.wobNumber;
            //url = approvedQueue ? _createCorrespondenceWFSchema([info.documentClass, 'approved-queue', 'wob-num', info.wobNumber]) : _createWorkItemSchema(info, department, readyToExport);
            return $http.get(url)
                .then(function (result) {
                    return generator.interceptReceivedInstance('GeneralStepElementView', generator.generateInstance(result.data.rs, GeneralStepElementView));
                })
                .then(function (generalStepElementView) {
                    generator.addPopupNumber();
                    return dialog.showDialog({
                        templateUrl: cmsTemplate.getPopup('view-correspondence'),
                        controller: 'viewCorrespondencePopCtrl',
                        controllerAs: 'ctrl',
                        bindToController: true,
                        escapeToCancel: false,
                        locals: {
                            correspondence: generalStepElementView.correspondence,
                            content: generalStepElementView.documentViewInfo,
                            actions: actions,
                            workItem: generalStepElementView,
                            readyToExport: readyToExport,
                            disableProperties: disableProperties,
                            disableCorrespondence: disableCorrespondence,
                            disableEverything: departmentIncoming,
                            popupNumber: generator.getPopupNumber(),
                            pageName: 'none'
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
         * @description view linked document
         * @param correspondence
         */
        self.viewLinkedDocument = function (correspondence) {
            var info = typeof correspondence.getInfo === 'function' ? correspondence.getInfo() : _createInstance(correspondence).getInfo();

            return $http.get(_createUrlSchema(info.vsId, info.documentClass, 'with-content'))
                .then(function (result) {
                    var documentClass = result.data.rs.metaData.classDescription;
                    result.data.rs.metaData = generator.interceptReceivedInstance(['Correspondence', _getModelName(documentClass), 'View' + _getModelName(documentClass)], generator.generateInstance(result.data.rs.metaData, _getModel(documentClass)));
                    return result.data.rs;
                })
                .then(function (result) {
                    generator.addPopupNumber();
                    result.content.viewURL = $sce.trustAsResourceUrl(result.content.viewURL);
                    return dialog.showDialog({
                        templateUrl: cmsTemplate.getPopup('view-document-readonly'),
                        controller: 'viewDocumentReadOnlyPopCtrl',
                        controllerAs: 'ctrl',
                        bindToController: true,
                        escapeToCancel: false,
                        locals: {
                            document: result.metaData,
                            content: result.content
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

        self.viewCorrespondenceG2G = function (g2gItem, actions, model, $event) {
            /*var site = null,*/
            var url;
            var g2gItemCopy = angular.copy(g2gItem);
            var isInternal = g2gItem.isInternalG2G();
            if (model.toLowerCase() === 'g2g') {
                // site = angular.copy(g2gItem.correspondence.site);
                // intercept send instance for G2G
                g2gItem = g2gItem instanceof G2G ? generator.interceptSendInstance('G2G', g2gItem) : g2gItem;
                // get correspondence from G2G object
                g2gItem = g2gItem.hasOwnProperty('correspondence') ? g2gItem.correspondence : g2gItem;
                url = urlService.g2gInbox + 'open/' + isInternal;
                // only required in case of g2gMessagingHistory
            } else if (model.toLowerCase() === 'g2gmessaginghistory') {
                g2gItemCopy = angular.copy(g2gItem);
                g2gItem = generator.interceptSendInstance('G2GMessagingHistory', g2gItem);
                url = urlService.g2gInbox + 'open-sent-return/' + isInternal;
            }
            return $http
                .put(url, g2gItem)
                .then(function (result) {
                    var metaData = result.data.rs.metaData;
                    metaData = generator.interceptReceivedInstance(['Correspondence', 'Incoming', 'ViewIncoming'], generator.generateInstance(metaData, Incoming));

                    metaData.documentComments = _.map(metaData.linkedCommentsList, function (item) {
                        return generator.interceptReceivedInstance('DocumentComment', new DocumentComment(item));
                    });

                    metaData.attachments = _.map([].concat(metaData.linkedAttachmentList || [], metaData.linkedAttachmenstList || [], metaData.linkedExportedDocsList || []), function (item) {
                        return generator.interceptReceivedInstance('Attachment', new Attachment(item))
                    });
                    metaData.linkedDocs = self.interceptReceivedCollectionBasedOnEachDocumentClass(metaData.linkedDocList);
                    metaData.linkedEntities = _.map(metaData.linkedEntitiesList, function (item) {
                        /*
                        item.documentClass = documentClass;*/
                        return generator.interceptReceivedInstance('LinkedObject', new LinkedObject(item));
                    });

                    result.data.rs.metaData = metaData;
                    localStorageService.set('vsid', metaData.vsId);
                    return result.data.rs;
                })
                .then(function (result) {
                    result.content.viewURL = $sce.trustAsResourceUrl(result.content.viewURL);
                    generator.addPopupNumber();
                    return dialog.showDialog({
                        templateUrl: cmsTemplate.getPopup('view-correspondence-g2g'),
                        controller: 'viewCorrespondenceG2GPopCtrl',
                        controllerAs: 'ctrl',
                        targetEvent: $event,
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
                            pageName: 'none'
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
         * to use it just inside edit after approved.
         * @param information
         * @returns {promise|*}
         */
        self.openCorrespondenceEditor = function (information) {
            return dialog.showDialog({
                templateUrl: cmsTemplate.getPopup('view-correspondence'),
                controller: 'viewCorrespondencePopCtrl',
                controllerAs: 'ctrl',
                bindToController: true,
                escapeToCancel: false,
                locals: {
                    correspondence: false,
                    content: information,
                    popupNumber: generator.getPopupNumber()
                }
            });
        };
        /**
         * @description receive incoming workItem.
         * @param wobNumber
         */
        self.prepareReceiveIncoming = function (wobNumber) {
            return $http
                .put((urlService.departmentWF + '/' + wobNumber + '/prepare/receive'))
                .then(function (result) {
                    result = result.data.rs;
                    result.metaData = generator.interceptReceivedInstance(['Correspondence', 'Incoming', 'ViewIncoming'], new Incoming(result.metaData));
                    return result;
                });
        };

        /**
         * @description receive incoming by vsid.
         * @param vsId
         */
        self.prepareReceiveIncomingByVsId = function (vsId) {
            return $http
                .get(urlService.g2gInbox + 'start-receive/' + vsId)
                .then(function (result) {
                    result.data.rs.metaData.addMethod = 1;
                    result = result.data.rs;
                    result.metaData = generator.interceptReceivedInstance(['Correspondence', 'Incoming', 'ViewIncoming'], new Incoming(result.metaData));
                    return result;
                });
        };

        /**
         * @description receive incoming document
         * @param correspondence
         * @param wobNumber
         */
        self.receiveIncoming = function (correspondence, wobNumber) {
            return $http
                .put((urlService.departmentWF + '/' + wobNumber + '/receive'), generator.interceptSendInstance(['Correspondence', _getModelName(correspondence.docClassName)], correspondence))
                .then(function (result) {
                    correspondence.vsId = result.data.rs;
                    return generator.generateInstance(correspondence, _getModel(correspondence.docClassName));
                });
        };

        /**
         * @description receive incoming document
         * @param correspondence
         */
        self.receiveG2GIncoming = function (correspondence) {
            var isInternalG2G = $stateParams.internalg2g;
            return $http
                .put(urlService.g2gInbox + 'receive/' + isInternalG2G,
                    generator.interceptSendInstance(['Correspondence', 'Incoming'], correspondence))
                .then(function () {
                    return correspondence;
                })
                .catch(function (error) {
                    errorCode.checkIf(error, 'G2G_USER_NOT_AUTHENTICATED', function () {
                        dialog.errorMessage(langService.get('g2g_not_authenticated'));
                    });
                    errorCode.checkIf(error, 'G2G_USER_NOT_AUTHORIZED', function () {
                        dialog.errorMessage(langService.get('g2g_not_authorized'));
                    });
                    errorCode.checkIf(error, 'G2G_BOOK_PROPERTIES_CAN_NOT_BE_EMPTY', function () {
                        dialog.errorMessage(langService.get('g2g_book_properties_can_not_be_empty'));
                    });
                    errorCode.checkIf(error, 'G2G_ERROR_WHILE_RECEIVING', function () {
                        dialog.errorMessage(langService.get('g2g_error_while_receiving'));
                    });
                    errorCode.checkIf(error, 'G2G_CAN_NOT_RECEIVE_RECALLED_DOCUMENT', function () {
                        dialog.errorMessage(langService.get('g2g_can_not_receive_recalled_document'));
                    });
                });
        };


        /**
         * send upload word file to make prepare and replace the placeholders from Correspondence.
         * @param file
         * @param correspondence
         */
        self.sendUploadedFileToPrepare = function (file, correspondence) {
            return $http
                .post(_createUrlSchema(null, correspondence.getInfo().documentClass, 'prepare'), generator.interceptSendInstance('PrepareCorrespondence', {
                    entity: correspondence,
                    content: file
                }), {
                    headers: {
                        'Content-Type': undefined
                    }
                })
                .then(function (result) {
                    return result.data.rs;
                })
        };

        self.broadcasting = function (broadcast, correspondence) {
            var info = correspondence.getInfo(), url = [info.documentClass, 'vsid', info.vsId, 'broadcast'];
            // workItem =>  /vsid/{vsid}/wob-num/{wobNum}/broadcast
            // correspondence => /vsid/{vsid}/broadcast
            if (info.isWorkItem()) {
                url.splice(-1, 0, 'wob-num', info.wobNumber);
            }
            return $http.put(_createCorrespondenceWFSchema(url), generator.interceptSendInstance('Broadcast', broadcast)).then(function (result) {
                return result;
            });
        };

        function _broadcast(correspondence, $event) {
            return dialog
                .showDialog({
                    targetEvent: $event,
                    templateUrl: cmsTemplate.getPopup('broadcast'),
                    controller: 'broadcastPopCtrl',
                    controllerAs: 'ctrl',
                    locals: {
                        correspondence: correspondence
                    },
                    resolve: {
                        organizations: function (organizationService, employeeService) {
                            'ngInject';
                            // get all child organizations for current logged in user department.
                            return organizationService.loadOrganizationChildren(employeeService.getEmployee().getRegistryOUID());
                        },
                        actions: function (employeeService) {
                            'ngInject';
                            return employeeService.getEmployee().loadMyWorkflowActions();
                        },
                        workflowGroups: function (broadcastService) {
                            'ngInject';
                            return broadcastService.loadWorkflowGroups();
                        }
                    }
                });
        }

        /**
         * @description broadcast correspondence.
         * @param correspondence
         * @param $event
         */
        self.broadcastCorrespondence = function (correspondence, $event) {
            var normalCorrespondence = angular.isArray(correspondence) ? !correspondence[0].isWorkItem() : !correspondence.isWorkItem();
            var count = angular.isArray(correspondence) ? correspondence.length : 1;
            if (normalCorrespondence) {
                var sitesValidation = self.validateBeforeSend(correspondence);
                if (sitesValidation.length && sitesValidation.length === count && count === 1) {
                    var info = correspondence.getInfo();
                    return dialog
                        .confirmMessage(langService.get('no_sites_cannot_broadcast_confirm_add'), 'add', 'cancel', $event)
                        .then(function () {
                            return managerService
                                .manageDocumentCorrespondence(info.vsId, info.documentClass, info.title, $event)
                                .then(function (result) {
                                    return result.hasSite() ? _broadcast(correspondence, $event) : null;
                                })
                        })
                } else {
                    return _broadcast(correspondence, $event);
                }
            }
            return _broadcast(correspondence, $event);
        };

        self.validateSite = function (correspondence) {
            return correspondence.hasSite() ? false : correspondence;
        };

        self.validateBeforeSend = function (correspondence) {
            correspondence = angular.isArray(correspondence) ? correspondence : [correspondence];
            var result = [];
            _.map(correspondence, function (item) {
                result.push(self.validateSite(item));
            });
            // send the correspondence that doesn't have correspondence sites
            return _.filter(result, function (item) {
                return typeof item.getInfo === 'function';
            });
        };

        function _launchCorrespondence(correspondence, $event, action, tab, isDeptIncoming) {
            var multi = angular.isArray(correspondence) && correspondence.length > 1;
            action = action || 'forward';
            var errorMessage = [];
            return dialog
                .showDialog({
                    templateUrl: cmsTemplate.getPopup('launch-correspondence-workflow'),
                    controller: 'launchCorrespondenceWorkflowPopCtrl',
                    controllerAs: 'ctrl',
                    targetEvent: $event,
                    locals: {
                        multi: multi,
                        correspondence: multi ? correspondence : (angular.isArray(correspondence) ? correspondence[0] : correspondence),
                        selectedTab: tab,
                        actionKey: action,
                        errorMessage: errorMessage,
                        isDeptIncoming: isDeptIncoming
                    },
                    resolve: {
                        favoritesUsers: function (distributionWFService) {
                            'ngInject';
                            return distributionWFService.loadFavorites('users')
                                .catch(function () {
                                    errorMessage.push('users');
                                    return []
                                });
                        },
                        favoritesOrganizations: function (distributionWFService) {
                            'ngInject';
                            return distributionWFService.loadFavorites('organizations')
                                .catch(function () {
                                    errorMessage.push('organizations');
                                    return [];
                                });
                        },
                        comments: function (userCommentService) {
                            'ngInject';
                            return userCommentService
                                .getUserComments()
                                .then(function (result) {
                                    return _.filter(result, 'status');
                                });
                        },
                        workflowActions: function (workflowActionService) {
                            'ngInject';
                            return workflowActionService.loadCurrentUserWorkflowActions()
                        },
                        // used to show regou name infront of section in users tab (ou dropdown)
                        organizations: function (organizationService) {
                            'ngInject';
                            return organizationService.getOrganizations();
                        },
                        organizationGroups: function (distributionWFService) {
                            'ngInject';
                            return distributionWFService
                                .loadDistWorkflowOrganizations('organizations')
                        },
                        replyOn: function (distributionWFService, $timeout) {
                            'ngInject';
                            if (angular.isArray(correspondence) || !correspondence.getInfo().isWorkItem() || action !== 'reply') {
                                return $timeout(function () {
                                    return false;
                                })
                            }
                            return distributionWFService
                                .loadSenderUserForWorkItem(correspondence);

                        },
                        centralArchiveOUs: function (distributionWFService) {
                            'ngInject';
                            if (employeeService.hasPermissionTo('SEND_TO_CENTRAL_ARCHIVE')) {
                                return distributionWFService
                                    .loadDistWorkflowOrganizations('centralArchivesForUser')
                                    .then(function (result) {
                                        return result;
                                    })
                                    .catch(function (error) {
                                        return [];
                                    })
                            }
                            return [];
                        }
                    }
                });
        }

        /**
         * @description
         * @param correspondence
         * @param action
         * @param tab
         * @param $event
         * @param isDeptIncoming
         * @param isDeptSent
         * @returns {promise|*}
         */
        self.launchCorrespondenceWorkflow = function (correspondence, $event, action, tab, isDeptIncoming, isDeptSent) {
            var normalCorrespondence = false;
            if (!isDeptSent) {
                normalCorrespondence = angular.isArray(correspondence) ? !correspondence[0].isWorkItem() : !correspondence.isWorkItem();
            }
            var count = angular.isArray(correspondence) ? correspondence.length : 1;
            if (normalCorrespondence) {
                var sitesValidation = self.validateBeforeSend(correspondence);
                if (sitesValidation.length && sitesValidation.length === count && count === 1) {
                    var info = correspondence.getInfo();
                    return dialog
                        .confirmMessage(langService.get('no_sites_cannot_send'), 'add', 'cancel', $event)
                        .then(function () {
                            return managerService
                                .manageDocumentCorrespondence(info.vsId, info.documentClass, info.title, $event)
                                .then(function (result) {
                                    return result.hasSite() ? _launchCorrespondence(correspondence, $event, action, tab, isDeptIncoming) : null;
                                })
                        })
                } else {
                    return _launchCorrespondence(correspondence, $event, action, tab, isDeptIncoming);
                }
            }
            return _launchCorrespondence(correspondence, $event, action, tab, isDeptIncoming);

        };
        /**
         * @description load group inbox from service
         */
        self.loadGroupInbox = function () {
            return $http
                .get(urlService.correspondenceWF.replace('wf', 'ou-queue/all-mails'))
                .then(function (result) {
                    return generator.interceptReceivedCollection('WorkItem', generator.generateCollection(result.data.rs, WorkItem));
                });
        };
        /**
         * @description load user inbox
         */
        self.loadUserInbox = function () {
            return $http
                .get(urlService.inboxWF + '/all-mails?optional-fields=registeryOu')
                .then(function (result) {
                    return generator.interceptReceivedCollection('WorkItem', generator.generateCollection(result.data.rs, WorkItem));
                });
        };
        /**
         * @description load folder content by folder Id
         * @param folder
         */
        self.loadUserInboxByFolder = function (folder) {
            var folderId = folder.hasOwnProperty('id') ? folder.id : folder;
            return $http
                .get(urlService.inboxWF + '/folder/' + folderId + '?optional-fields=registeryOu')
                .then(function (result) {
                    return generator.interceptReceivedCollection('WorkItem', generator.generateCollection(result.data.rs, WorkItem));
                });
        };

        /**
         * @description Mark workItem as read/unread
         * @param workItem
         * @param $event
         * @param ignoreMessage
         * @param isGroupMail
         * @returns {*}
         */
        self.workItemMarkAsReadUnreadSingle = function (workItem, $event, ignoreMessage, isGroupMail) {
            var isOpen = workItem.hasOwnProperty('generalStepElm')
                ? (workItem.generalStepElm.hasOwnProperty('isOpen') ? workItem.generalStepElm.isOpen : workItem.generalStepElm)
                : (workItem.hasOwnProperty('isOpen') ? workItem.isOpen : workItem);
            var wob = workItem.getInfo().wobNumber;
            var readUnread = isOpen ? '/un-read' : '/read';
            var url = urlService.userInbox + readUnread;
            var defer = $q.defer();
            if (isGroupMail) {
                url = urlService.correspondenceWF.replace('wf', 'ou-queue') + readUnread + '/' + wob;
                $http
                    .put(url, null, {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    })
                    .then(function () {
                        defer.resolve(true);
                    });
            } else {
                $http
                    .put(url, new Array(wob))
                    .then(function () {
                        defer.resolve(true);
                    });
            }
            return defer.promise.then(function () {
                workItem.generalStepElm.isOpen = !workItem.generalStepElm.isOpen;
                if (!ignoreMessage) {
                    if (!workItem.generalStepElm.isOpen)
                        toast.success(langService.get('mark_as_unread_success').change({name: workItem.getTranslatedName()}));
                    else
                        toast.success(langService.get('mark_as_read_success').change({name: workItem.getTranslatedName()}));
                }
                return workItem;
            })
        };

        /**
         * @description star workItem.
         * @param workItem
         * @param ignoreMessage
         */
        self.starWorkItem = function (workItem, ignoreMessage) {
            var wobNumber = workItem.getInfo().wobNumber;
            return $http
                .put(urlService.inboxWF + '/star', [wobNumber])
                .then(function (result) {
                    if (!ignoreMessage) {
                        if (result.data.rs[wobNumber]) {
                            workItem.setStar(true);
                            toast.success(langService.get("star_specific_success").change({name: workItem.getTranslatedName()}));
                        } else {
                            toast.error(langService.get('something_happened_when_update_starred'));
                        }
                    }
                    return workItem;
                })
        };
        /**
         * @description unStart workItem.
         * @param workItem
         * @param ignoreMessage
         */
        self.unStarWorkItem = function (workItem, ignoreMessage) {
            var wobNumber = workItem.getInfo().wobNumber;
            return $http
                .put(urlService.inboxWF + '/un-star', [wobNumber])
                .then(function (result) {
                    if (!ignoreMessage) {
                        if (result.data.rs[wobNumber]) {
                            workItem.setStar(false);
                            toast.success(langService.get("unstar_specific_success").change({name: workItem.getTranslatedName()}));
                        } else {
                            toast.error(langService.get('something_happened_when_update_starred'));
                        }
                    }
                    return workItem;
                });
        };
        /**
         * @description star bulk workflowItems,
         * @param workItems
         * @param ignoreMessage
         */
        self.starBulkWorkItems = function (workItems, ignoreMessage) {
            var wobNumbers = _.map(workItems, function (item) {
                return item.getInfo().wobNumber;
            });
            return $http
                .put(urlService.inboxWF + '/star', wobNumbers)
                .then(function (result) {
                    var failureCollection = [];
                    _.map(result.data.rs, function (value, index) {
                        if (!value)
                            failureCollection.push(workItems[index]);
                    });
                    if (!ignoreMessage) {
                        if (failureCollection.length === workItems.length) {
                            toast.error(langService.get("failed_star_selected"));
                        } else if (failureCollection.length) {
                            generator.generateFailedBulkActionRecords('star_success_except_following', _.map(failureCollection, function (workItem) {
                                return workItem.getTranslatedName();
                            }));
                        } else {
                            toast.success(langService.get("selected_star_success"));
                        }
                    }
                    return workItems;
                });
        };
        /**
         * @description un-star bulk workflow items.
         * @param workItems
         * @param ignoreMessage
         */
        self.unStarBulkWorkItems = function (workItems, ignoreMessage) {
            var wobNumbers = _.map(workItems, function (item) {
                return item.getInfo().wobNumber;
            });
            return $http
                .put(urlService.inboxWF + '/un-star', wobNumbers)
                .then(function (result) {
                    var failureCollection = [];
                    _.map(result.data.rs, function (value, index) {
                        if (!value)
                            failureCollection.push(workItems[index]);
                    });
                    if (!ignoreMessage) {
                        if (failureCollection.length === workItems.length) {
                            toast.error(langService.get("failed_unstar_selected"));
                        } else if (failureCollection.length) {
                            generator.generateFailedBulkActionRecords('unstar_success_except_following', _.map(failureCollection, function (workItem) {
                                return workItem.getTranslatedName();
                            }));
                        } else {
                            toast.success(langService.get("selected_unstar_success"));
                        }
                    }
                    return workItems;
                });
        };
        /**
         * @description terminate work item.
         * @param workItem
         * @param $event
         * @param ignoreMessage
         */
        self.terminateWorkItem = function (workItem, $event, ignoreMessage) {
            var info = workItem.getInfo();
            return self.showReasonDialog('terminate_reason', $event)
                .then(function (reason) {
                    return $http
                        .put(urlService.userInboxActions + "/" + info.documentClass + "/terminate/wob-num", {
                            first: info.wobNumber,
                            second: reason
                        })
                        .then(function () {
                            if (!ignoreMessage) {
                                toast.success(langService.get("terminate_specific_success").change({name: workItem.getTranslatedName()}));
                            }
                            return workItem;
                        });
                });

        };

        self.terminateWorkItemBehindScene = function (wobNumber, documentClass, reason) {
            return $http
                .put(urlService.userInboxActions + "/" + documentClass.toLowerCase() + "/terminate/wob-num", {
                    first: wobNumber,
                    second: reason
                })
                .then(function () {
                    return true;
                })
                .catch(function (error) {
                    return false;
                });
        };

        /**
         * @description terminate bulk workItems.
         * @param workItems
         * @param $event
         * @param ignoreMessage
         * @returns {*}
         */
        self.terminateBulkWorkItem = function (workItems, $event, ignoreMessage) {
            // if the selected workItem has just one record.
            if (workItems.length === 1)
                return self.terminateWorkItem(workItems[0], $event);
            return self
                .showReasonBulkDialog('terminate_reason', workItems, $event)
                .then(function (workItems) {
                    var items = _.map(workItems, function (workItem) {
                        return {
                            first: workItem.getWobNumber(),
                            second: workItem.reason
                        };
                    });
                    var wfName = 'outgoing';
                    return $http
                        .put((urlService.userInboxActions + "/" + wfName.toLowerCase() + "/terminate/bulk"), items)
                        .then(function (result) {
                            return _bulkMessages(result, workItems, ignoreMessage, 'failed_terminate_selected', 'selected_terminate_success', 'following_records_failed_to_terminate');
                        });
                })
        };


        /**
         * @description Return work item.
         * @param workItem
         * @param $event
         * @param ignoreMessage
         */
        self.returnWorkItem = function (workItem, $event, ignoreMessage) {
            var info = workItem.getInfo();
            return self.showReasonDialog('return_reason', $event)
                .then(function (reason) {
                    return $http
                        .put(urlService.departmentInboxes + "/return", {
                            workObjectNumber: info.wobNumber,
                            comment: reason,
                            vsId: info.vsId
                        })
                        .then(function () {
                            if (!ignoreMessage) {
                                toast.success(langService.get("return_specific_success").change({name: workItem.getNames()}));
                            }
                            return workItem;
                        });
                });

        };
        /**
         * @description return bulk workItems.
         * @param workItems
         * @param $event
         * @param ignoreMessage
         * @returns {*}
         */
        self.returnBulkWorkItem = function (workItems, $event, ignoreMessage) {
            // if the selected workItem has just one record.
            if (workItems.length === 1)
                return self.returnWorkItem(workItems[0], $event);
            return self
                .showReasonBulkDialog('return_reason', workItems, $event)
                .then(function (workItems) {
                    var items = _.map(workItems, function (workItem) {
                        var info = workItem.getInfo();
                        return {
                            workObjectNumber: info.wobNumber,
                            comment: workItem.reason,
                            vsId: info.vsId
                        };
                    });

                    return $http
                        .put((urlService.departmentInboxes + '/return/bulk'), items)
                        .then(function (result) {
                            return _bulkMessages(result, workItems, ignoreMessage, 'failed_return_selected', 'selected_return_success', 'return_success_except_following');
                        });
                })
        };

        /**
         * @description Reject Correspondence.
         * @param correspondence
         * @param $event
         * @param ignoreMessage
         */
        self.rejectCorrespondence = function (correspondence, $event, ignoreMessage) {
            var info = correspondence.getInfo();
            return self.showReasonDialog('reject_reason', $event)
                .then(function (reason) {
                    var url = 'outgoings';
                    if (info.documentClass === 'incoming')
                        url = 'incomings';
                    else if (info.documentClass === 'internal')
                        url = 'internals';
                    return $http
                        .put(urlService[url] + '/reject', {
                            first: info.vsId,
                            second: reason
                        })
                        .then(function () {
                            if (!ignoreMessage) {
                                toast.success(langService.get("reject_specific_success").change({name: correspondence.getNames()}));
                            }
                            return correspondence;
                        });
                });
        };
        /**
         * @description reject bulk correspondence.
         * @param correspondences
         * @param $event
         * @param ignoreMessage
         * @returns {*}
         */
        self.rejectBulkCorrespondences = function (correspondences, $event, ignoreMessage) {
            // if the selected correspondences has just one record.
            if (correspondences.length === 1)
                return self.rejectCorrespondence(correspondences[0], $event);
            return self
                .showReasonBulkDialog('reject_reason', correspondences, $event)
                .then(function (correspondences) {
                    var items = _.map(correspondences, function (correspondence) {
                        var info = correspondence.getInfo();
                        return {
                            first: info.vsId,
                            second: correspondence.reason
                        };
                    });
                    var info = correspondences[0].getInfo();
                    return $http
                        .put(_createUrlSchema(null, info.documentClass, ['reject', 'bulk'].join('/')), items)
                        .then(function (result) {
                            return _bulkMessages(result, correspondences, ignoreMessage, 'failed_reject_selected', 'reject_success', 'reject_success_except_following');
                        });
                })
        };

        /**
         * @description  open reason dialog
         * @param dialogTitle
         * @param $event
         * @returns {promise|*}
         */
        self.showReasonDialog = function (dialogTitle, $event) {
            return dialog
                .showDialog({
                    templateUrl: cmsTemplate.getPopup('reason'),
                    controller: 'reasonPopCtrl',
                    controllerAs: 'ctrl',
                    bindToController: true,
                    targetEvent: $event,
                    locals: {
                        title: dialogTitle
                    },
                    resolve: {
                        comments: function (userCommentService) {
                            'ngInject';
                            return userCommentService.getUserComments()
                                .then(function (result) {
                                    return _.filter(result, 'status');
                                });
                        }
                    }
                });
        };
        /**
         * @description open bulk reason.
         * @param dialogTitle
         * @param workItems
         * @param $event
         */
        self.showReasonBulkDialog = function (dialogTitle, workItems, $event) {
            return dialog
                .showDialog({
                    templateUrl: cmsTemplate.getPopup('reason-bulk'),
                    controller: 'reasonBulkPopCtrl',
                    controllerAs: 'ctrl',
                    targetEvent: $event,
                    bindToController: true,
                    locals: {
                        workItems: workItems,
                        title: dialogTitle
                    },
                    resolve: {
                        comments: function (userCommentService) {
                            'ngInject';
                            return userCommentService.getUserComments()
                                .then(function (result) {
                                    return _.filter(result, 'status');
                                });
                        }
                    }
                });
        };
        /**
         * @description add correspondence to favorites.
         * @param correspondence
         * @param ignoreMessage
         */
        self.addCorrespondenceToFavorite = function (correspondence, ignoreMessage) {
            var info = correspondence.getInfo();
            return $http
                .post((urlService.favoriteDocuments), {
                    documentVSId: info.vsId,
                    applicationUserId: employeeService.getEmployee().id
                })
                .then(function (result) {
                    var message = {};
                    if (result.data.hasOwnProperty('ec') && errorCode.checkIf(result, 'DUPLICATE_ENTRY')) {
                        message = {status: false, message: "add_to_favorite_duplicate_record", method: 'error'};
                    } else {
                        message = {status: true, message: "add_to_favorite_success", method: 'success'};
                    }
                    if (!ignoreMessage) {
                        toast[message.method](langService.get(message.message));
                    }
                    return correspondence;
                })
        };

        /**
         * @description add bulk documents to favorites.
         * @param correspondences
         * @param ignoreMessage
         */
        self.addBulkCorrespondenceToFavorite = function (correspondences, ignoreMessage) {
            /*if (correspondences.length === 1)
             return self.addCorrespondenceToFavorite(correspondences[0], ignoreMessage);
             return $http
             .post((urlService.favoriteDocuments + '/bulk'), _.map(correspondences, function (item) {
             var info = item.getInfo();
             return {
             documentVSId: info.vsId,
             applicationUserId: employeeService.getEmployee().id
             }
             }))
             .then(function (result) {
             return _bulkMessages(result, correspondences, ignoreMessage, 'failed_add_selected_to_favorite', 'add_to_favorite_documents_success', 'add_to_favorite_documents_success_except_following');
             });*/
        };

        /**
         * @description remove correspondence from favorites.
         * @param correspondence
         * @param ignoreMessage
         */
        self.deleteCorrespondenceFromFavorite = function (correspondence, ignoreMessage) {
            var vsId = correspondence.getInfo().vsId;
            return $http
                .delete(urlService.favoriteDocuments + '/vsid/' + vsId)
                .then(function () {
                    if (!ignoreMessage)
                        toast.success(langService.get("remove_from_favorite_specific_success").change({name: correspondence.getTranslatedName()}));
                    return correspondence;
                });
        };

        /**
         * @description delete bulk correspondence from favorites.
         * @param correspondences
         * @param ignoreMessage
         */
        self.deleteBulkCorrespondenceFromFavorite = function (correspondences, ignoreMessage) {
            var bulkVsIds = correspondences[0].hasOwnProperty('vsId') ? _.map(correspondences, 'vsId') : correspondences;
            return $http({
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                url: urlService.favoriteDocuments + '/vsid/bulk',
                data: bulkVsIds
            }).then(function (result) {
                return _bulkMessages(result, correspondences, ignoreMessage, 'failed_remove_selected_from_favorite', 'remove_from_favorite_documents_success', 'remove_from_favorite_documents_success_except_following');
            });
        };
        /**
         * @description show folder dialog
         * @param workItems
         * @param folders
         * @param $event
         * @param showInbox
         * @returns {promise|*}
         */
        self.showFolderDialog = function (workItems, folders, $event, showInbox) {
            workItems = angular.isArray(workItems) ? workItems : [workItems];
            return dialog
                .showDialog({
                    templateUrl: cmsTemplate.getPopup('folder-tree-popup'),
                    controller: 'folderTreePopCtrl',
                    controllerAs: 'ctrl',
                    targetEvent: $event,
                    locals: {
                        folders: folders,
                        workItems: workItems,
                        showInbox: showInbox
                    }
                });
        };
        /**
         * @description add work item to folders
         * @param workItem
         * @param $event
         * @param showInbox
         * @returns {promise|*}
         */
        self.showAddWorkItemToFolder = function (workItem, $event, showInbox) {
            var defer = $q.defer();
            userFolderService.getUserFolders()
                .then(function (result) {
                    defer.resolve(result);
                });
            return defer.promise.then(function (folders) {
                if (!folders.length) {
                    toast.info(langService.get('no_folder_for_user'));
                    return false;
                } else {
                    return self.showFolderDialog(workItem, folders, $event, showInbox);
                }
            });
        };
        /**
         * @description add bulk work items to folders.
         * @param workItems
         * @param $event
         * @param showInbox
         * @returns {promise|*}
         */
        self.showAddBulkWorkItemsToFolder = function (workItems, $event, showInbox) {
            var defer = $q.defer();
            userFolderService.getUserFolders()
                .then(function (result) {
                    defer.resolve(result);
                });
            return defer.promise.then(function (folders) {
                if (!folders.length) {
                    toast.info(langService.get('no_folder_for_user'));
                    return false;
                } else {
                    return self.showFolderDialog(workItems, folders, $event, showInbox);
                }
            });
        };
        /**
         * @description the
         * @param workItems
         * @param folder
         * @returns {Promise}
         */
        self.commonAddToFolder = function (workItems, folder) {
            var wobNumbers = _.map(workItems, function (item) {
                return item.getInfo().wobNumber;
            });
            return $http
                .put(urlService.userInbox + '/folder', {
                    first: folder.hasOwnProperty('id') ? folder.id : folder,
                    second: wobNumbers
                });
        };
        /**
         * @description add workItem to folder
         * @param workItems
         * @param folder
         * @param ignoreMessage
         * @returns {Promise<any>}
         */
        self.addWorkItemToFolder = function (workItems, folder, ignoreMessage) {
            if (!folder.status) {
                toast.error(langService.get('folder_deactivated'));
                return $q.reject();
            }

            return self.commonAddToFolder(workItems, folder)
                .then(function (result) {
                    var info = workItems[0].getInfo();
                    if (!ignoreMessage) {
                        if (result.data.rs[info.wobNumber]) {
                            toast.success(langService.get('inbox_add_to_folder_specific_success').change({
                                name: info.title,
                                folder: folder.getTranslatedName()
                            }));
                        } else {
                            toast.success(langService.get('inbox_failed_add_to_folder_selected'));
                        }
                    }
                    return workItems
                });
        };
        /**
         * @description add bulk workItems to folders
         * @param workItems
         * @param folder
         * @param ignoreMessage
         * @returns {Promise<any>}
         */
        self.addBulkWorkItemsToFolder = function (workItems, folder, ignoreMessage) {
            if (workItems.length === 1)
                return self.addWorkItemToFolder(workItems, folder, ignoreMessage);
            return self.commonAddToFolder(workItems, folder).then(/**
             * @param result
             */
            function (result) {
                return _bulkMessages(result, workItems, ignoreMessage, 'inbox_failed_add_to_folder_selected', 'add_to_folder_success', 'add_to_folder_success_except_following');
            });
        };

        /**
         * @description open dialog for export workItem.
         * @param workItem
         * @param $event
         * @param resend
         * @param g2gData optional prameter
         * @returns {promise|*}
         */
        self.openExportCorrespondenceDialog = function (workItem, $event, resend, g2gData) {
            return dialog
                .showDialog({
                    targetEvent: $event,
                    templateUrl: cmsTemplate.getPopup('ready-to-export-option'),
                    controller: 'readyToExportOptionPopCtrl',
                    controllerAs: 'ctrl',
                    locals: {
                        readyToExport: workItem,
                        resend: resend,
                        g2gData: g2gData
                    },
                    resolve: {
                        sites: function (correspondenceService) {
                            'ngInject';
                            return correspondenceService
                                .loadCorrespondenceSites(workItem);
                        },
                        entityTypes: function (entityTypeService) {
                            'ngInject';
                            return entityTypeService
                                .loadEntityTypes();
                        }
                    }
                });
        };

        /**
         * @description open dialog for bulk export workItem.
         * @param workItems
         * @param $event
         * @param resend
         * @returns {promise|*}
         */
        self.openExportBulkCorrespondenceDialog = function (workItems, $event, resend) {
            return dialog
                .showDialog({
                    targetEvent: $event,
                    templateUrl: cmsTemplate.getPopup('bulk-export-option'),
                    controller: 'bulkExportOptionPopCtrl',
                    controllerAs: 'ctrl',
                    locals: {
                        workItems: workItems,
                        resend: resend
                    }
                });
        };

        /**
         * @description resend the workItem again to correspondences sites
         * @param workItem
         * @param resendOptions
         * @param g2gData
         */
        self.resendCorrespondenceWorkItem = function (workItem, resendOptions, g2gData) {
            var regular = !resendOptions.isSelective();
            resendOptions = !regular ? generator.interceptSendInstance('PartialExportSelective', resendOptions) : generator.interceptSendInstance('ReadyToExportOption', resendOptions);
            var resendModel = {
                type: regular,
                regularExport: regular ? resendOptions : {},
                selectiveExport: regular ? {} : resendOptions.prepareResendModel()
            };
            if (g2gData)
                return self.resendG2GCorrespondence(resendModel, g2gData);

            var info = workItem.getInfo();
            return $http
                .put(urlService.departmentInboxes + "/" + info.vsId + "/resend/" + info.wobNumber, resendModel)
                .then(function () {
                    return workItem;
                });
        };
        /**
         * @description resend g2g from return queue.
         * @param resendOptions
         * @param g2gData
         * @return {*}
         */
        self.resendG2GCorrespondence = function (resendOptions, g2gData) {
            return $http.put(urlService.g2gInbox + 'resend/' + g2gData.isInternalG2G(), {
                first: generator.interceptSendInstance('G2GMessagingHistory', g2gData),
                second: resendOptions
            }).then(function (result) {
                return result.data.rs;
            });
        };
        /**
         * @description resend the bulk workItems again to correspondences sites
         * @param workItems
         */
        self.resendBulkCorrespondenceWorkItems = function (workItems) {
            var regular, resendOptions, resendModels = [];
            for (var i = 0; i < workItems.length; i++) {
                resendOptions = workItems[i].exportType === 1 ? workItems[i].model : workItems[i].partialExportList;
                regular = !resendOptions.isSelective();
                delete resendOptions.ATTACHMENT_LINKED_DOCS;
                resendOptions = !regular ? generator.interceptSendInstance('PartialExportSelective', resendOptions) : resendOptions;
                resendModels.push({
                    vsId: workItems[i].getInfo().vsId,
                    wobNum: workItems[i].getInfo().wobNumber,
                    resendOptions: {
                        type: regular,
                        regularExport: regular ? resendOptions : {},
                        selectiveExport: regular ? {} : resendOptions.prepareResendModel()
                    }
                });
            }

            return $http
                .put(urlService.departmentInboxes + "/resend/bulk", resendModels)
                .then(function (result) {
                    return _bulkMessages(result, workItems, false, 'failed_resend_selected', 'selected_resend_success', 'following_records_failed_to_resend');
                });
        };
        /**
         * @description send the document to ready to export archive.
         * @param workItem
         * @param ignoreMessage
         */
        self.sendToCentralArchive = function (workItem, ignoreMessage) {
            var info = workItem.getInfo();
            return $http
                .put(_createCorrespondenceWFSchema([info.documentClass, 'vsid', info.vsId, 'wob-num', info.wobNumber, 'to-ready-export-central-archive ']))
                .then(function () {
                    if (!ignoreMessage) {
                        toast.success(langService.get('sent_to_the_central_archive_success'));
                    }
                    return workItem;
                });
        };
        /**
         * @description to export workItem
         * @param workItem
         * @param $event
         * @param checkCentralArchive
         * @param ignoreMessage
         * @returns {promise|*}
         */
        self.exportCorrespondence = function (workItem, $event, checkCentralArchive, ignoreMessage) {
            return checkCentralArchive ? (workItem.exportViaArchive() ? self.sendToCentralArchive(workItem, ignoreMessage) : self.openExportCorrespondenceDialog(workItem, $event)) : self.openExportCorrespondenceDialog(workItem, $event);
        };
        /**
         * @description load central archive workItems
         */
        self.loadCentralArchiveWorkItems = function () {
            return $http
                .get(urlService.departmentWF + '/ready-to-export-central-archive?optional-fields=fromRegOU')
                .then(function (result) {
                    return generator.interceptReceivedCollection('WorkItem', generator.generateCollection(result.data.rs, WorkItem));
                });
        };
        /**
         * @description return from central archive to actual organization.
         * @param workItem
         * @param $event
         * @param ignoreMessage
         */
        self.centralArchiveReturn = function (workItem, $event, ignoreMessage) {
            var info = workItem.getInfo();
            return self
                .showReasonDialog('return_reason', $event)
                .then(function (comment) {
                    return $http
                        .put(_createCorrespondenceWFSchema(['outgoing/return/to-ready-export-central-archive']), new CommentModel({
                            vsid: info.vsId,
                            wobNum: info.wobNumber,
                            comments: comment
                        }))
                        .then(function (result) {
                            if (!ignoreMessage) {
                                if (result.data.rs) {
                                    toast.success(langService.get("return_specific_success").change({name: workItem.getTranslatedName()}));
                                } else {
                                    toast.error(langService.get("failed_return_selected"));
                                }
                            }
                            return workItem;
                        });
                });
        };
        /**
         * @description return bulk from central archive
         * @param workItems
         * @param $event
         * @param ignoreMessage
         */
        self.centralArchiveReturnBulk = function (workItems, $event, ignoreMessage) {
            if (workItems.length === 1)
                return self.centralArchiveReturn(workItems[0], $event, ignoreMessage);
            return self
                .showReasonBulkDialog('return_reason', workItems, $event)
                .then(function (workItems) {
                    return $http
                        .put(_createCorrespondenceWFSchema(['outgoing/bulk/return/to-ready-export-central-archive']), _.map(workItems, function (item) {
                            var info = item.getInfo();
                            return (new CommentModel({
                                vsid: info.vsId,
                                wobNum: info.wobNumber,
                                comments: item.reason
                            }))
                        }))
                        .then(function (result) {
                            return _bulkMessages(result, workItems, ignoreMessage, 'failed_return_selected', 'selected_return_success', 'return_success_except_following');
                        });
                });
        };
        /**
         * @description approv
         * @param workItem
         * @param signature
         * @param isComposite
         * @param ignoreMessage
         */
        self.approveCorrespondence = function (workItem, signature, isComposite, ignoreMessage) {
            var info = workItem.getInfo();
            var sign = (new SignDocumentModel()).setSignature(workItem, signature).setIsComposite(isComposite);
            return $http
                .put(_createUrlSchema(null, info.documentClass, 'authorize'), sign)
                .then(function (result) {
                    if (!ignoreMessage) {
                        if (result.data.rs) {
                            toast.success(langService.get('sign_specific_success').change({name: workItem.getTranslatedName()}));
                        } else {
                            toast.error(langService.get('something_happened_when_sign'));
                        }
                    }
                    return result.data.rs;
                })
                .catch(function (error) {
                    errorCode.checkIf(error, 'AUTHORIZE_FAILED', function () {
                        dialog.errorMessage(langService.get('authorize_failed'))
                    })
                })
        };
        /**
         * @description to display dialog to select signature .
         * @param workItem
         * @param $event
         * @param ignoreMessage
         * @returns {Promise<any>}
         */
        self.showApprovedDialog = function (workItem, $event, ignoreMessage) {
            return applicationUserSignatureService
                .getApplicationUserSignatures(employeeService.getEmployee().id)
                .then(function (signatures) {
                    if (signatures && signatures.length === 1) {
                        return workItem.isComposite() ? dialog
                            .confirmMessage(langService.get('document_is_composite'))
                            .then(function () {
                                return self.approveCorrespondence(workItem, signatures[0], true, ignoreMessage);
                            })
                            .catch(function () {
                                return self.approveCorrespondence(workItem, signatures[0], false, ignoreMessage);
                            }) : self.approveCorrespondence(workItem, signatures[0], false, ignoreMessage);
                    } else if (signatures && signatures.length > 1) {
                        return dialog
                            .showDialog({
                                targetEvent: $event,
                                templateUrl: cmsTemplate.getPopup('signature'),
                                controller: 'signaturePopCtrl',
                                controllerAs: 'ctrl',
                                locals: {
                                    workItem: workItem,
                                    signatures: signatures
                                }
                            });
                    } else {
                        dialog.alertMessage(langService.get('no_signature_available'));
                        return $q.reject(langService.get('no_signature_available'));
                    }
                });
        };
        /**
         * @description to check if the correspondence has already workItem or before launch again.
         * @param vsId
         */
        self.checkWorkFlowForVsId = function (vsId) {
            return $http.get(_createUrlSchema(null, null, ['common/check-active-tasks/vsid', vsId].join('/'))).then(function (result) {
                return result.data.rs;
            });
        };
        /**
         * @description load workItems By filter Id.
         * @param filter
         */
        self.loadWorkItemsByFilterID = function (filter) {
            var id = filter.hasOwnProperty('id') ? filter.id : filter;
            return $http
                .get([urlService.inboxWF, 'filtered-mails', id].join('/') + '?optional-fields=registeryOu')
                .then(function (result) {
                    return generator.interceptReceivedCollection('WorkItem', generator.generateCollection(result.data.rs, WorkItem));
                });
        };

        self.loadRelatedThingsForCorrespondence = function (correspondence) {
            var info = correspondence.getInfo();
            return $http
                .get(_createUrlSchema(null, info.documentClass, ['related-objects', info.vsId].join('/')))
                .then(function (result) {
                    result = result.data.rs;

                    result.relatedDocs = self.interceptReceivedCollectionBasedOnEachDocumentClass(result.linkedDocs);
                    return {
                        ATTACHMENTS: generator.interceptReceivedCollection('Attachment', generator.generateCollection(result.linkedAttachments, Attachment)),
                        RELATED_BOOKS: result.relatedDocs,
                        RELATED_OBJECTS: generator.interceptReceivedCollection('LinkedObject', generator.generateCollection(result.linkedObjects, LinkedObject))
                    };
                })
        };
        /**
         * @description display the PartialExport dialog to select the correspondence sites.
         * @param correspondence
         * @param $event
         * @param ignoreMessage
         */
        self.showPartialExportDialog = function (correspondence, $event, ignoreMessage) {
            return dialog
                .showDialog({
                    templateUrl: cmsTemplate.getPopup('partial-export'),
                    controller: 'partialExportPopCtrl',
                    controllerAs: 'ctrl',
                    targetEvent: $event,
                    locals: {
                        correspondence: correspondence,
                        ignoreMessage: ignoreMessage
                    },
                    resolve: {
                        sites: function (correspondenceService) {
                            'ngInject';
                            return correspondenceService.loadCorrespondenceSites(correspondence);
                        },
                        entityTypes: function (entityTypeService) {
                            'ngInject';
                            return entityTypeService
                                .loadEntityTypes();
                        }
                    }
                });
        };

        self.partialExportCorrespondence = function (correspondence, partialExport, ignoreMessage) {
            var info = correspondence.getInfo(), partialExportSites,
                // details = partialExport.getDetails(),
                // url = _createUrlSchema(null, info.documentClass, ['book', info.vsId, details.url].join('/'));
                url = _createUrlSchema(null, info.documentClass, ['vsid', info.vsId, 'partial', 'to-ready-export'].join('/'));
            partialExportSites = generator.interceptSendInstance(['PartialExport'], partialExport);

            return $http
                .put(url, new Pair({
                    first: partialExportSites.sitesToList,
                    second: partialExportSites.sitesCCList
                }))
                .then(function () {
                    if (!ignoreMessage) {
                        toast.success(langService.get('export_success'));
                    }
                    return correspondence;
                });
        };

        /**
         * @description to view correspondence workItem
         */
        /*self.viewCorrespondenceWorkItemNew = function (info, actions, disableProperties, disableCorrespondence, department, readyToExport, approvedQueue, departmentIncoming) {
            return $http.get(approvedQueue ? _createCorrespondenceWFSchema([info.documentClass, 'approved-queue', 'wob-num', info.wobNumber]) : _createWorkItemSchema(info, department, readyToExport))
                .then(function (result) {
                    return generator.interceptReceivedInstance('GeneralStepElementView', generator.generateInstance(result.data.rs, GeneralStepElementView));
                })
                .then(function (generalStepElementView) {
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
                            actions: actions.gridActions,
                            workItem: generalStepElementView,
                            readyToExport: readyToExport,
                            disableProperties: disableProperties,
                            disableCorrespondence: disableCorrespondence,
                            disableEverything: departmentIncoming,
                            popupNumber: generator.getPopupNumber(),
                            fullScreen: true,
                            viewerActions: actions.viewerActions
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
        };*/

        /**
         * @description to view correspondence workItem
         */
        self.viewCorrespondenceReturnedWorkItem = function (info, actions, disableProperties, disableCorrespondence) {
            return $http.get(urlService.departmentWF + '/returned/' + info.wobNumber)
                .then(function (result) {
                    return generator.interceptReceivedInstance('GeneralStepElementView', generator.generateInstance(result.data.rs, GeneralStepElementView));
                })
                .then(function (generalStepElementView) {
                    generator.addPopupNumber();
                    return dialog.showDialog({
                        templateUrl: cmsTemplate.getPopup('view-correspondence'),
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
                            disableProperties: disableProperties,
                            disableCorrespondence: disableCorrespondence,
                            disableEverything: false,
                            popupNumber: generator.getPopupNumber()
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
                            generator.removePopupNumber();
                            return true;
                        })
                        .catch(function () {
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

        self.setManagerService = function (service) {
            managerService = service;
            return this
        };

        self.setStorageManager = function (service) {
            correspondenceStorageService = service;
            return this;
        };
        /**
         * @description load thumbnails for any correspondence/workItem
         * @param correspondence
         * @return {PromiseLike<T> | Promise<T> | *}
         */
        self.loadDocumentThumbnails = function (correspondence) {
            var info = correspondence.getInfo();
            return $http
                .get(_createUrlSchema(null, info.documentClass, 'thubmnails/vsid/' + info.vsId))
                .then(function (result) {
                    var data = result.data.rs;
                    var images = _.filter(_.map(data, function (item, key) {
                        return item !== null ? (new ImageThumbnail(item)).setVsId(key).setMainIfEqual(info.vsId) : null;
                    }), function (item) {
                        return item !== null
                    });
                    // return the images with the sorted type [0] is the main document image and the remaining the attachments.
                    return [].concat(_.filter(images, function (item) {
                        return item.isMainDocument();
                    })).concat(_.filter(images, function (item) {
                        return !item.isMainDocument();
                    }));
                });
        };
        /**
         * @description open word in desktop application.
         * @param correspondence
         * @return {Promise}
         */
        self.editWordInDesktop = function (correspondence) {
            var info = correspondence.getInfo();
            var url = urlService
                .desktopEdit
                .replace('{base_url}', urlService.BASE)
                .replace('{mode}', 0)
                .replace('{type}', 'docx')
                .replace('{vsId}', info.vsId)
                .replace('{subject}', encodeURIComponent(info.title))
                .replace('{token}', tokenService.getToken())
                .replace('{documentClass}', info.documentClass);
            return $http.get(url, {
                excludeLoading: true
            });
        };

        /**
         * @description open word in desktop application.
         * @param correspondence
         * @return {Promise}
         */
        self.viewWordInDesktop = function (correspondence) {
            var info = correspondence.getInfo();
            var url = urlService
                .desktopEdit
                .replace('{base_url}', urlService.BASE)
                .replace('{mode}', 1)
                .replace('{type}', 'docx')
                .replace('{vsId}', info.vsId)
                .replace('{subject}', encodeURIComponent(info.title))
                .replace('{token}', tokenService.getToken())
                .replace('{documentClass}', info.documentClass);
            return $http.get(url, {
                excludeLoading: true
            });
        };
        /**
         * @description load document versions
         * @param correspondence
         * @return {*}
         */
        self.loadDocumentVersions = function (correspondence) {
            var info = correspondence.getInfo();
            return $http
                .get(_createUrlSchema(null, info.documentClass, 'versions/' + info.vsId))
                .then(function (result) {
                    result = generator.generateCollection(result.data.rs, _getModel(info.documentClass));
                    return generator.interceptReceivedCollection('CorrespondenceVersion', result);
                });
        };
        /**
         * view specific version for the document
         * @param correspondence
         * @param allowDuplicateAction
         * @param $event
         * @return {promise|*}
         */
        self.viewSpecificCorrespondenceVersion = function (correspondence, allowDuplicateAction, $event) {
            return dialog
                .showDialog({
                    templateUrl: cmsTemplate.getPopup('versions'),
                    controller: 'versionPopCtrl',
                    controllerAs: 'ctrl',
                    targetEvent: $event,
                    locals: {
                        correspondence: correspondence,
                        allowDuplicateAction: allowDuplicateAction
                    },
                    resolve: {
                        versions: function () {
                            return self.loadDocumentVersions(correspondence);
                        }
                    }
                }).then(function (result) {
                    return allowDuplicateAction ? self.displayDuplicateOption(result.correspondence, $event)
                        .then(function (duplicateOption) {
                            return self.duplicateCorrespondenceVersion(result.correspondence, duplicateOption, result.correspondence.majorVersionNumber)
                        }) : result;
                });
        };
        /**
         * @description deuplicate correspondence from current/specific version
         * @param correspondence
         * @param duplicateOption
         * @param majorVersion
         * @return {*}
         */
        self.duplicateCorrespondenceVersion = function (correspondence, duplicateOption, majorVersion) {
            delete duplicateOption.ATTACHMENT_LINKED_DOCS;
            var info = correspondence.getInfo();
            return $http
                .put(_createUrlSchema(null, info.documentClass, 'duplicate/vsid/' + info.vsId + (typeof majorVersion !== 'undefined' ? '/major-version-number/' + majorVersion : '')), duplicateOption)
                .then(function (result) {
                    result.data.rs.metaData = generator.interceptReceivedInstance(['Correspondence', _getModelName(info.documentClass), 'View' + _getModelName(info.documentClass)], generator.generateInstance(result.data.rs.metaData, _getModel(info.documentClass)));
                    result.data.rs.metaData.docStatus = 2; // by default
                    return correspondenceStorageService.storeCorrespondence('duplicate', result.data.rs);
                }).catch(function (error) {
                    return errorCode.checkIf(error, 'FAIL_DUPLICATION', function () {
                        dialog.errorMessage(langService.get('fail_to_duplicate').change({name: info.title}));
                        return $q.reject('fail_to_duplicate');
                    });
                });
        };
        /**
         * @description display duplicate options
         * @param correspondence
         * @param $event
         * @return {promise|*}
         */
        self.displayDuplicateOption = function (correspondence, $event) {
            return dialog
                .showDialog({
                    templateUrl: cmsTemplate.getPopup('duplicate-options'),
                    controller: 'duplicateOptionPopCtrl',
                    targetEvent: $event,
                    controllerAs: 'ctrl',
                    locals: {
                        correspondence: correspondence
                    }
                });
        };
        /**
         * @description duplicate current version from correspondence.
         * @param correspondence
         * @param $event
         * @return {*}
         */
        self.duplicateCurrentCorrespondenceVersion = function (correspondence, $event) {
            return self.displayDuplicateOption(correspondence, $event)
                .then(function (duplicateOption) {
                    return self.duplicateCorrespondenceVersion(correspondence, duplicateOption);
                });
        };

        self.duplicateSpecificCorrespondenceVersion = function (correspondence, $event) {
            return self.viewSpecificCorrespondenceVersion(correspondence, true, $event);
        };

        self.updateContentInformation = function (correspondence, contentInformation) {
            var info = correspondence.getInfo();
            return $http.post(_createUrlSchema(info.vsId, info.documentClass, 'with-content-view-url'), contentInformation).then(function (result) {
                return result.data.rs;
            });
        };

        self.unlockWorkItem = function (workItem, ignoreMessage, $event) {
            if (ignoreMessage) {
                return _unlockWorkItem(workItem, ignoreMessage, true)
            } else {
                var confirmMsg = langService.get('unlock_confirmation_msg').change({
                    user: workItem.getLockingUserInfo().getTranslatedName(),
                    date: workItem.getLockingInfo().lockingTime
                });
                confirmMsg += '<br />' + langService.get('unlock_note_msg').change({user: workItem.getLockingUserInfo().getTranslatedName()});
                confirmMsg += '<br />' + langService.get('confirm_continue_message');
                return dialog.confirmMessage(confirmMsg).then(function () {
                    return _unlockWorkItem(workItem, ignoreMessage);
                });
            }
        };

        var _unlockWorkItem = function (workItem, ignoreMessage, checkLocker) {
            var info = workItem.getInfo();
            return $http.put(urlService.departmentInboxes + '/un-lock/wob-num/' + info.wobNumber + (checkLocker ? ("?check-locker=" + checkLocker) : ''))
                .then(function (result) {
                    result = result.data.rs;
                    if (!ignoreMessage) {
                        if (result) {
                            toast.success(langService.get('unlock_specific_success').change({name: info.title}));
                        } else {
                            toast.error(langService.get('unlock_specific_fail').change({name: info.title}));
                        }
                    }
                    return result;
                }).catch(function (error) {
                    if (!ignoreMessage)
                        toast.error(langService.get('unlock_specific_fail').change({name: info.title}));
                    return false;
                });
        };

        self.unlockBulkWorkItems = function (workItems, $event) {
            return dialog.confirmMessage('confirm unlock').then(function () {
                var items = _.map(workItems, function (workItem) {
                    return workItem.getInfo().wobNumber;
                });
                return $http
                    .put(urlService.departmentInboxes + '/un-lock/bulk', items)
                    .then(function (result) {
                        return _bulkMessages(result, workItems, false, 'failed_unlock_selected', 'selected_unlock_success', 'unlock_success_except_following');
                    });
            })
        };
        /**
         * @description update correspondence site for incoming document.
         * @param correspondence
         */
        self.saveIncomingCorrespondenceSite = function (correspondence) {
            var info = correspondence.getInfo();
            return $http
                .put(_createUrlSchema(info.vsId, info.documentClass, 'correspondence-site'), correspondence.getSiteInformation())
                .then(function () {
                    return correspondence;
                });
        };

        /**
         * @description get error message
         * @returns {string}
         */
        self.getTranslatedError = function (error) {
            var errorObj = error.data.eo;
            return langService.current === 'ar' ? errorObj.arName : errorObj.enName;
        };

        self.printData = function (correspondences, headers, title) {
            var data = self.prepareExportedData(correspondences, headers, title), defer = $q.defer(),
                urlTypeMap = {
                    pdf: {
                        url: urlService.exportToPdf,
                        type: 'pdf',
                        text: 'PDF',
                        id: 1
                    },
                    excel: {
                        url: urlService.exportToExcel,
                        type: 'excel',
                        text: 'EXCEL',
                        id: 2
                    }
                };

            dialog.confirmThreeButtonMessage(langService.get('select_file_type_to_print_download'), '', urlTypeMap.pdf.text, urlTypeMap.excel.text, null, null, false)
                .then(function (result) {
                    if (result.button === urlTypeMap.pdf.id) {
                        defer.resolve(urlTypeMap.pdf);
                    } else if (result.button === urlTypeMap.excel.id) {
                        defer.resolve(urlTypeMap.excel);
                    }
                });
            return defer.promise.then(function (exportOption) {
                var errorMessage = langService.get('error_export_to_file').change({format: (exportOption.type === 'excel' ? 'EXCEL' : 'PDF')});
                return $http.post(exportOption.url, data)
                    .then(function (result) {
                        var physicalPath = result.data.rs;
                        if (!physicalPath) {
                            toast.error(errorMessage);
                            return $q.reject(errorMessage)
                        } else {
                            return $http.get(physicalPath, {
                                responseType: 'blob'
                            }).then(function (result) {
                                return {
                                    url: window.URL.createObjectURL(result.data),
                                    blob: result.data,
                                    physicalPath: physicalPath
                                };
                            });
                        }
                    })
                    .then(function (file) {
                        var oldIframe = document.getElementById('iframe-print');
                        oldIframe ? oldIframe.parentNode.removeChild(oldIframe) : null;

                        if (exportOption.type === 'excel') {
                            window.open(file.physicalPath, '_blank');
                            return;
                        }

                        if (helper.browser.isIE()) {
                            window.navigator.msSaveOrOpenBlob(file.blob);
                        } else if (helper.browser.isFirefox()) {
                            window.open(file.physicalPath, '_blank');
                        } else {
                            var iframe = document.createElement('iframe');
                            iframe.id = 'iframe-print';
                            iframe.onload = function (ev) {
                                iframe.contentWindow.focus();
                                iframe.contentWindow.print();

                            };
                            iframe.src = file.url;
                            document.body.appendChild(iframe);
                        }
                    })
                    .catch(function () {
                        toast.error(errorMessage);
                    });
            });
        };

        self.prepareExportedData = function (correspondences, tableHeaders, title) {
            var correspondence = correspondences[0],
                exportedData = correspondence.getExportedData(),
                correspondencesCount = correspondences.length,
                data = {
                    data: new Array(correspondencesCount),
                    headerNames: [],
                    headerText: title ? title : ''
                },
                headersCount = tableHeaders.length;

            for (var i = 0; i < headersCount; i++) {
                var exportedLabel = tableHeaders[i];
                if (!exportedData.hasOwnProperty(exportedLabel))
                    continue;
                // to put the column header
                data.headerNames.push(langService.get(exportedLabel));

                for (var x = 0; x < correspondencesCount; x++) {
                    if (!angular.isArray(data.data[x])) {
                        data.data[x] = [];
                    }
                    data.data[x].push(typeof exportedData[exportedLabel] === 'function' ? exportedData[exportedLabel].call(correspondences[x]) : correspondences[x][exportedData[exportedLabel]]);
                }
            }

            return data;
        };

        self.quickReceiveBulkCorrespondence = function (workItems, ignoreMessage) {
            var wobNumbers = _.map(workItems, 'generalStepElm.workObjectNumber');
            return $http
                .put(urlService.departmentInboxes + '/receive-quick/bulk', wobNumbers)
                .then(function (result) {
                    return _bulkMessages(result, workItems, ignoreMessage, 'failed_to_receive', 'quick_received_success', '');
                });
        };
        /**
         * edit after return from g2g
         * @param g2gMessagingHistory
         * @return {Outgoing}
         */
        self.editAfterReturnFromG2G = function (g2gMessagingHistory) {
            var documentClass = 'outgoing';
            return $http
                .put(urlService.g2gInbox + 'vsid/' + g2gMessagingHistory.refDocId + '/' + g2gMessagingHistory.isInternalG2G() + '/export/edit')
                .then(function (result) {
                    result.data.rs.metaData = generator.interceptReceivedInstance(['Correspondence', _getModelName(documentClass), 'View' + _getModelName(documentClass)], generator.generateInstance(result.data.rs.metaData, _getModel(documentClass)));
                    return result.data.rs;
                });
        };

        $timeout(function () {
            CMSModelInterceptor.runEvent('correspondenceService', 'init', self);
        }, 100);
    });
};
