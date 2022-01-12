module.exports = function (app) {
    app.service('correspondenceService', function (urlService,
                                                   $http,
                                                   PSPDFKit,
                                                   ImageThumbnail,
                                                   FollowUpFolder,
                                                   cmsTemplate,
                                                   tokenService,
                                                   PDFService,
                                                   AnnotationType,
                                                   Pair,
                                                   downloadService,
                                                   helper,
                                                   $state,
                                                   CommentModel,
                                                   CMSModelInterceptor,
                                                   employeeService,
                                                   $timeout,
                                                   loadingIndicatorService,
                                                   authenticationService,
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
                                                   $stateParams,
                                                   DocumentLink,
                                                   SmsLog,
                                                   rootEntity,
                                                   FollowupBook,
                                                   FollowupBookCriteria,
                                                   FollowupAction,
                                                   encryptionService,
                                                   AdminResultRelation,
                                                   TawasolStamp,
                                                   CorrespondenceView,
                                                   TawasolDocument,
                                                   ManualDeliveryReport,
                                                   SequentialWFResult) {
        'ngInject';
        var self = this, managerService, correspondenceStorageService;
        self.serviceName = 'correspondenceService';
        // make inherits from parent Model (Correspondence)
        util.inherits(Outgoing, Correspondence);
        util.inherits(Internal, Correspondence);
        util.inherits(Incoming, Correspondence);
        util.inherits(General, Correspondence);
        util.inherits(CorrespondenceView, Correspondence);
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
        // follow up
        util.inherits(FollowupBookCriteria, FollowupBook);
        // tawasol stamp
        util.inherits(TawasolStamp, TawasolDocument);
        // admin result relation
        util.inherits(AdminResultRelation, Information);
        // SequentialWFResult
        util.inherits(SequentialWFResult, Information);


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

        self.docClassIds = {
            outgoing: 0,
            incoming: 1,
            internal: 2,
            Outgoing: 0,
            Incoming: 1,
            Internal: 2
        };

        self.screenLookups = {
            outgoing: {},
            incoming: {},
            internal: {},
            general: {}
        };

        self.documentEditModes = {
            desktopOfficeOnline: 0,
            officeOnline: 1,
            desktop: 2
        };

        self.siteTypesStartsMap = {
            INTERNAL: 1,
            EXTERNAL: 2,
            G2G: 3
        };

        self.urlServiceByDocumentClass = {
            outgoing: urlService.outgoings,
            incoming: urlService.incomings,
            internal: urlService.internals
        };

        self.authorizeStatus = {
            NOT_AUTHORIZED: {text: 'NOT_AUTHROIZED', value: 0},
            FULLY_AUTHORIZED: {text: 'FULLY_AUTHORIZED', value: 1},
            PARTIALLY_AUTHORIZED: {text: 'PARIALLY_AUTHORIZED', value: 2},
            INTERNAL_PERSONAL: {text: 'INTERNAL_PERSONAL', value: 3},
            SAME_USER_AUTHORIZED: {text: 'SAME_USER_AUTHORIZED', value: 4}
        };

        var merge = {
                classifications: {
                    model: OUClassification,
                    merge: 'ouClassifications',
                    property: 'classification',
                    actualModel: Classification
                },
                documentFiles: {
                    model: OUDocumentFile,
                    merge: 'ouDocumentFiles',
                    property: 'file',
                    actualModel: DocumentFile
                },
                distributionList: {
                    model: OUDistributionList,
                    merge: 'ouDistributionList',
                    property: 'distributionList',
                    actualModel: DistributionList
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
            } else if (correspondence.hasOwnProperty('correspondence')) {
                documentClass = self.getCorrespondenceInformation(correspondence.correspondence).documentClass;
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

        function _getPriorityLevel(correspondence) {
            var priorityLevel = null;
            if (correspondence.hasOwnProperty('generalStepElm') && correspondence.generalStepElm) { /* WorkItem */
                priorityLevel = correspondence.generalStepElm.priorityLevel;
            } else if (correspondence.hasOwnProperty('priorityLevel')) { /* Event History */
                priorityLevel = correspondence.priorityLevel;
            }
            /*in case of G2G*/
            else if (correspondence.hasOwnProperty('correspondence')) {
                if (correspondence.hasOwnProperty('prioretyLevel')) {
                    priorityLevel = correspondence.correspondence.prioretyLevel;
                } else {
                    priorityLevel = correspondence.correspondence.priorityLevel;
                }
            } else {  /* Correspondence */
                priorityLevel = correspondence.priorityLevel;
            }
            return priorityLevel;
        }

        function _getSecurityLevel(correspondence) {
            var securityLevel = null;
            if (correspondence.hasOwnProperty('generalStepElm') && correspondence.generalStepElm) { /* WorkItem */
                securityLevel = correspondence.generalStepElm.securityLevel;
            } else if (correspondence.hasOwnProperty('securityLevel')) { /* Event History */
                securityLevel = correspondence.securityLevel;
            }
            /*in case of G2G*/
            else if (correspondence.hasOwnProperty('correspondence')) {
                securityLevel = correspondence.correspondence.securityLevel;
            } else {  /* Correspondence */
                securityLevel = correspondence.securityLevel;
            }
            return securityLevel;
        }

        function _getHasActiveSeqWF(correspondence) {
            if (correspondence.hasActiveSeqWF && typeof correspondence.hasActiveSeqWF === 'function') {
                return correspondence.hasActiveSeqWF();
            }
            return false;
        }

        function _getSignatureCount(correspondence) {
            if (correspondence.hasOwnProperty('generalStepElm')) {
                return correspondence.generalStepElm.signaturesCount;
            } else if (correspondence.hasOwnProperty('stepElm')) {
                return correspondence.stepElm.signaturesCount;
            } else if (correspondence.hasOwnProperty('signaturesCount')) {
                return correspondence.signaturesCount;
            }
            return 0;
        }

        function _getAuthorizeByAnnotation(correspondence) {
            if (correspondence.hasOwnProperty('generalStepElm')) {
                return !!correspondence.generalStepElm.authorizeByAnnotation;
            } else if (correspondence.hasOwnProperty('stepElm')) {
                return !!correspondence.stepElm.authorizeByAnnotation;
            } else if (correspondence.hasOwnProperty('correspondence')) {
                return !!correspondence.correspondence.authorizeByAnnotation;
            } else if (correspondence.hasOwnProperty('authorizeByAnnotation')) {
                return !!correspondence.authorizeByAnnotation;
            }
            return false;
        }

        function _getIsOfficial(correspondence) {
            if (correspondence.hasOwnProperty('generalStepElm')) {
                return !!correspondence.generalStepElm.isOfficial;
            } else if (correspondence.hasOwnProperty('stepElm')) {
                return !!correspondence.stepElm.isOfficial;
            } else if (correspondence.hasOwnProperty('correspondence')) {
                return !!correspondence.correspondence.isOfficial;
            } else if (correspondence.hasOwnProperty('isOfficial')) {
                return !!correspondence.isOfficial;
            }
            return false;
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
            var dc = _getDocumentClass(correspondence);
            return new CorrespondenceInfo({
                documentClass: dc,
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
                editByDeskTop: _getEditInDesktop(correspondence),
                docClassId: self.docClassIds[dc],
                priorityLevel: _getPriorityLevel(correspondence),
                securityLevel: _getSecurityLevel(correspondence),
                isAttachment: false,
                hasActiveSeqWF: _getHasActiveSeqWF(correspondence),
                signaturesCount: _getSignatureCount(correspondence),
                authorizeByAnnotation: _getAuthorizeByAnnotation(correspondence),
                isOfficial: _getIsOfficial(correspondence)
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
         * @description Search Linked Person by Criteria
         * @param criteria
         * @returns {*}
         */
        self.searchLinkedPersonByCriteria = function (criteria) {
            return $http.post((urlService.linkedPerson + '/criteria'),
                (generator.interceptSendCollection('LinkedObject', criteria))
            ).then(function (result) {
                return generator.generateCollection(result.data.rs, LinkedObject);
            });
        };

        /**
         * @description make an update for given correspondence.
         * @param correspondence
         * @param withoutCheck
         * @return {Promise|Correspondence}
         */
        self.updateCorrespondence = function (correspondence, withoutCheck) {
            var route = 'metadata';
            var info = correspondence.getInfo();
            var queryString = '', queryStringValues = [];

            // to check weather incoming reference no already exists
            if (!withoutCheck && info.documentClass === 'incoming') {
                queryStringValues.push('with-check=true');
            }
            if (!!correspondence.userCommentForSave) {
                queryStringValues.push('userComments=' + correspondence.userCommentForSave);
            }
            delete correspondence.userCommentForSave;
            if (queryStringValues.length > 0) {
                queryString += '?' + queryStringValues.join('&');
            }

            route += queryString;

            return $http
                .put(_createUrlSchema(null, correspondence.docClassName, route),
                    generator.interceptSendInstance(['Correspondence', _getModelName(correspondence.docClassName)], correspondence)
                )
                .then(function () {
                    return (generator.generateInstance(correspondence, _getModel(correspondence.docClassName)));
                }).catch(function (error) {
                    if (errorCode.checkIf(error, 'ERROR_SAVE_DOC_ALREADY_MODIFIED_BY_OTHER_USER') === true) {
                        dialog.infoMessage(langService.get('error_save_document_already_modified_by_other_user'));
                        return $q.reject(error);
                    }
                    return $q.reject(error);
                });
        };

        /**
         * @description  add correspondence
         * @param correspondence
         * @param skipCheck
         * @return {Promise|Correspondence}
         */
        self.createCorrespondence = function (correspondence, skipCheck) {
            var route = correspondence.docStatus === 3 ? 'draft' : 'metadata';
            var info = correspondence.getInfo();
            if (correspondence.contentFile) {
                //route = 'draft';
                if (correspondence.addMethod === 0)
                    correspondence.signaturesCount = 1;
            }

            // to check whether incoming reference no already exists
            if (!skipCheck && info.documentClass === 'incoming') {
                route += '?with-check=true';
            }
            return $http
                .post(_createUrlSchema(correspondence.vsId, correspondence.docClassName, route),
                    generator.interceptSendInstance(['Correspondence', _getModelName(correspondence.docClassName)], correspondence)
                )
                .then(function (result) {
                    correspondence.vsId = result.data.rs;
                    return generator.generateInstance(correspondence, _getModel(correspondence.docClassName));
                })
                .catch(function (error) {
                    if (errorCode.checkIf(error, 'ERROR_SAVE_DOC_ALREADY_MODIFIED_BY_OTHER_USER') === true) {
                        dialog.infoMessage(langService.get('error_save_document_already_modified_by_other_user'));
                        return $q.reject(error);
                    }
                    return $q.reject(error);
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
                    if (errorCode.checkIf(error, 'ERROR_SAVE_DOC_ALREADY_MODIFIED_BY_OTHER_USER') === true) {
                        dialog.infoMessage(langService.get('error_save_document_already_modified_by_other_user'));
                        return $q.reject(error);
                    }
                    if (errorCode.checkIf(error, 'ERROR_MISSING_REQUIRED_TEMPLATE_FIELDS') === true) {
                        dialog.errorMessage(self.getTranslatedError(error));
                        return $q.reject(error);
                    }
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
            var route = 'full-with-template';
            var queryString = '', queryStringValues = [];

            if (!!correspondence.userCommentForSave) {
                queryStringValues.push('userComments=' + correspondence.userCommentForSave);
            }
            delete correspondence.userCommentForSave;
            if (queryStringValues.length > 0) {
                queryString += '?' + queryStringValues.join('&');
            }

            route += queryString;

            // BeSaRa: just for NHRC and after that i will remove it and should make it from backend team.
            return $http.put(_createUrlSchema(null, correspondence.docClassName, route), book)
                .then(function (result) {
                    correspondence.vsId = result.data.rs;
                    return generator.generateInstance(correspondence, _getModel(correspondence.docClassName));
                }).catch(function (error) {
                    if (errorCode.checkIf(error, 'ERROR_SAVE_DOC_ALREADY_MODIFIED_BY_OTHER_USER') === true) {
                        dialog.infoMessage(langService.get('error_save_document_already_modified_by_other_user'));
                        return $q.reject(error);
                    }
                    if (errorCode.checkIf(error, 'ERROR_MISSING_REQUIRED_TEMPLATE_FIELDS') === true) {
                        dialog.errorMessage(self.getTranslatedError(error));
                        return $q.reject(error);
                    }
                    return $q.reject(self.getTranslatedError(error));
                });
        };

        /**
         * @description create to replay given correspondence.
         * @param correspondence
         * @param vsId
         * @return {Promise|Correspondence}
         */
        self.addCreateReplyCorrespondence = function (correspondence, vsId) {
            var sourceDocClass = $stateParams.sourceDocClass,
                url = urlService.correspondence + '/' + correspondence.docClassName.toLowerCase() + '/create-reply-metadata/' + sourceDocClass + '/' + vsId;

            return $http.post(url, generator.interceptSendInstance(['Correspondence', _getModelName(correspondence.docClassName)], correspondence))
                .then(function (result) {
                    correspondence.vsId = result.data.rs;
                    return generator.generateInstance(correspondence, _getModel(correspondence.docClassName));
                }).catch(function (error) {
                    return $q.reject(self.getTranslatedError(error));
                });
        };

        /**
         * @description create to reply Correspondence with content .
         * @param correspondence
         * @param information
         * @param vsId
         */
        self.addCreateReplyCorrespondenceWithContent = function (correspondence, information, vsId) {
            var book = _createCorrespondenceStructure(correspondence, information),
                sourceDocClass = $stateParams.sourceDocClass,
                url = urlService.correspondence + '/' + correspondence.docClassName.toLowerCase() + '/create-reply-full/' + sourceDocClass + '/' + vsId;

            return $http.post(url, book)
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
         * @param content
         */
        self.saveDocumentContentFile = function (correspondence, content) {
            if (correspondence.hasVsId()) {
                // if data is imported from external source
                if (correspondence.externalImportData) {
                    return self.saveDocumentContentFileFromExternalSource(correspondence);
                }
                var form = new FormData();
                form.append('content', content ? content : correspondence.contentFile);
                return $http.post(_createUrlSchema(correspondence.vsId, correspondence.docClassName, 'content'), form, {
                    headers: {
                        'Content-Type': undefined
                    }
                })
                    .then(function (result) {
                        correspondence.vsId = result.data.rs;
                        return generator.generateInstance(correspondence, _getModel(correspondence.docClassName));
                    }).catch(function (error) {
                        if (errorCode.checkIf(error, 'ERROR_UPLOAD_FILE') === true) {
                            dialog.errorMessage(langService.get('file_with_size_extension_not_allowed'));
                            return $q.reject(error);
                        }
                        return $q.reject(self.getTranslatedError(error));
                    });
            }
        };
        /**
         * @description add content file into document from external source.
         * @param correspondence
         */
        self.saveDocumentContentFileFromExternalSource = function (correspondence) {
            if (correspondence.hasVsId()) {
                var url = _createUrlSchema(correspondence.vsId, correspondence.docClassName, 'user-ext-import-store/content')
                    + '?sourceId=' + correspondence.externalImportData.sourceId
                    + '&paramValue=' + correspondence.externalImportData.identifier
                    + '&isOfficial=' + correspondence.isOfficial;

                return $http.put(url, {})
                    .then(function (result) {
                        correspondence.vsId = result.data.rs;
                        return generator.generateInstance(correspondence, _getModel(correspondence.docClassName));
                    }).catch(function (error) {
                        if (errorCode.checkIf(error, 'ERROR_UPLOAD_FILE') === true) {
                            dialog.errorMessage(langService.get('file_with_size_extension_not_allowed'));
                            return $q.reject(error);
                        }
                        return $q.reject(self.getTranslatedError(error));
                    });
            }
        };
        /**
         * @description update content for annotated document
         * @param correspondence
         * @param content
         * @param annotationType
         * @return {*}
         */
        self.updateContentByAnnotation = function (correspondence, content, annotationType) {
            if (!annotationType) {
                annotationType = 0;
            }
            var form = new FormData();
            form.append('content', content ? content : correspondence.contentFile);
            form.append('annotationType', annotationType);
            return $http.post(_createUrlSchema(correspondence.vsId, correspondence.docClassName, 'annotation/content'), form, {
                headers: {
                    'Content-Type': undefined
                }
            })
                .then(function (result) {
                    return result.data.rs;
                }).catch(function (error) {
                    if (errorCode.checkIf(error, 'ERROR_UPLOAD_FILE') === true) {
                        dialog.errorMessage(langService.get('file_with_size_extension_not_allowed'));
                        return $q.reject(error);
                    }
                    return $q.reject(self.getTranslatedError(error));
                });
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
         * @param isAdminSearch
         */
        self.correspondenceSearch = function (correspondence, isAdminSearch) {
            var searchType = 'general',
                info = correspondence.getInfo();
            if (correspondence.docClassName.toLowerCase() !== 'correspondence') {
                searchType = info.documentClass;
            }
            var url = urlService.searchDocument.change({searchType: searchType}),
                criteria;
            criteria = generator.interceptSendInstance('Search' + _getModelName(searchType), correspondence);
            criteria = _checkPropertyConfiguration(criteria, lookupService.getPropertyConfigurations(info.documentClass));
            if (isAdminSearch) {
                url = url + '?isAdmin=' + isAdminSearch
            }
            return $http
                .post(url, generator.interceptSendInstance('SearchCriteria', criteria))
                .then(function (result) {
                    return generator.interceptReceivedCollection(['Correspondence', _getModelName(searchType)], generator.generateCollection(result.data.rs, _getModel(searchType)))
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
         * @param isSearchScreen
         */
        self.loadCorrespondenceLookups = function (documentClass, isSearchScreen) {
            documentClass = documentClass.toLowerCase();
            var url = urlService.correspondenceLookups.replace('{{documentClass}}', documentClass);
            if (isSearchScreen) {
                url = url + '?asSearch=true';
            }
            return $http.get(url)
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
         * @param parentLookup
         * @returns {*}
         */
        self.prepareLookupHierarchy = function (lookups, parentLookup) {
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

                // if parent is empty and children exists
                // parentLookup is used just to initialize new model array to make a parent array
                if (!lookups[key].length && children.length && parentLookup) {
                    parentLookup = parentLookup.hasOwnProperty('id') ? parentLookup.id : parentLookup;
                    var mappedModel = {};
                    mappedModel[value.property] = new value.actualModel({id: parentLookup});
                    lookups[key] = [new value.model(mappedModel)];
                }
                // set children for lookups
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
                    appUserOUID: workItem.appUserOUID,
                    fromUserOUID: employeeService.getEmployee().getOUID()
                })
                .then(function (result) {
                    return result.data.rs;
                })
                .catch(function (error) {
                    return errorCode.showErrorDialog(error, null, generator.getTranslatedError(error));
                });
        };
        /**
         * @description transfer bulk workItems.
         * @param workItems
         */
        self.transferBulkWorkItems = function (workItems) {
            return $http
                .put(urlService.userInbox + '/reassign/bulk', _.map(workItems, function (workItem) {
                    return {
                        wobNum: workItem.getInfo().wobNumber,
                        comment: workItem.comment,
                        user: workItem.user,
                        appUserOUID: workItem.appUserOUID,
                        fromUserOUID: employeeService.getEmployee().getOUID()
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
                            $timeout(function () {
                                WinPrint.close();
                            }, 100)
                        });
                    }
                },
                locals: {
                    title: correspondence.getInfo().title
                },
                resolve: {
                    loadBarcode: function () {
                        'ngInject';
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
         * @param currentFollowedUpOu
         * @param currentFollowedUpUser
         * @param $event
         * @param allowedMaxLength
         */
        self.openTransferDialog = function (workItems, currentFollowedUpOu, currentFollowedUpUser, $event, allowedMaxLength) {
            return dialog
                .showDialog({
                    templateUrl: cmsTemplate.getPopup('transfer-mail'),
                    controller: 'transferMailPopCtrl',
                    controllerAs: 'ctrl',
                    targetEvent: $event,
                    locals: {
                        workItems: workItems,
                        currentFollowedUpOu: currentFollowedUpOu,
                        currentFollowedUpUser: currentFollowedUpUser,
                        allowedMaxLength: allowedMaxLength || 200
                    },
                    resolve: {
                        organizations: function (distributionWFService) {
                            'ngInject';
                            return distributionWFService
                                .loadDistWorkflowOrganizations('organizations')
                                .then(function (result) {
                                    return result;
                                })
                                .catch(function (error) {
                                    return [];
                                })
                        },
                        comments: function (userCommentService) {
                            'ngInject';
                            return userCommentService.loadUserCommentsForDistribution();
                        }
                    }
                })
                .then(function (workItems) {
                    var promise;
                    if (!angular.isArray(workItems)) {
                        promise = self.transferSingleWorkItem(workItems);
                    } else {
                        promise = self.transferBulkWorkItems(workItems);
                    }
                    return promise;
                });
        };
        /**
         * @description open comment dialog for workItem reason.
         * @returns {promise|*}
         */
        self.openCommentDialog = function (allowedMaxLength) {
            return dialog
                .showDialog({
                    templateUrl: cmsTemplate.getPopup('reason'),
                    controller: 'reasonPopCtrl',
                    controllerAs: 'ctrl',
                    bindToController: true,
                    locals: {
                        justReason: true,
                        title: 'select_reason',
                        allowedMaxLength: allowedMaxLength || 200
                    },
                    resolve: {
                        comments: function (userCommentService) {
                            'ngInject';
                            return userCommentService.loadUserCommentsForDistribution();
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
         * @description Loads the correspondence for create reply.
         * @param sourceDocClass
         * @param targetDocClass
         * @param wobNumber
         * @param vsId
         * @param createAsAttachment
         * @param versionNumber
         */
        self.createReplyForDocument = function (sourceDocClass, targetDocClass, wobNumber, vsId, createAsAttachment, versionNumber) {
            var data = new FollowupAction({
                createAsAttachment: createAsAttachment,
                sourceClassId: self.docClassIds[sourceDocClass.toLowerCase()],
                destClassId: self.docClassIds[targetDocClass.toLowerCase()],
                wobNum: wobNumber || '', // wobNum will be sent if create reply from inbox
                vsId: vsId, // vsId will be sent always
                versionNumber: versionNumber || null
            });

            return $http
                .put(urlService.correspondence + '/incoming/create-replay', data)
                .then(function (result) {
                    return generator.interceptReceivedInstance(['Correspondence', _getModelName(targetDocClass), 'CreateReply'], generator.generateInstance(result.data.rs, _getModel(targetDocClass)));
                }).catch(function (error) {
                    if (error && errorCode.checkIf(error, 'WORK_ITEM_NOT_FOUND') === true) {
                        if (wobNumber) {
                            dialog.errorMessage(langService.get('work_item_not_found').change({wobNumber: wobNumber}));
                        } else {
                            dialog.errorMessage(langService.get('no_records_found'));
                        }
                        return $q.reject(false);
                    }
                    return $q.reject(error);
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
                        site.followupEndDate = correspondence.followupEndDate;
                        return site;
                    });
                    result.data.rs.second = _.map(result.data.rs.second, function (site) {
                        site.docClassName = info.documentClass;
                        site.followupEndDate = correspondence.followupEndDate;
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
                    if (correspondence.defaultModeIfEditing) {
                        result.data.rs.metaData.defaultModeIfEditing = correspondence.defaultModeIfEditing;
                    }
                    return result.data.rs;
                })
                .then(function (result) {
                    result.content.viewURL = $sce.trustAsResourceUrl(result.content.viewURL);
                    if (result.content.hasOwnProperty('editURL') && result.content.editURL) {
                        result.content.editURL = $sce.trustAsResourceUrl(result.content.editURL);
                    }
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
                            pageName: 'none',
                            reloadCallback: undefined
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
                    if (errorCode.checkIf(error, 'ITEM_LOCKED') === true) {
                        dialog.infoMessage(generator.getBookLockMessage(null, error));
                        return $q.reject('itemLocked');
                    } else if (errorCode.checkIf(error, 'DOCUMENT_HAS_BEEN_DELETED') === true) {
                        dialog.errorMessage(langService.get('document_has_been_deleted'));
                        return $q.reject('documentDeleted');
                    }
                    return $q.reject(error);

                });
        };

        /**
         * @description view deleted correspondence
         * @param correspondence
         * @param actions
         * @param viewOnly
         * @returns {*}
         */
        self.viewDeletedCorrespondence = function (correspondence, actions, viewOnly) {
            var info = typeof correspondence.getInfo === 'function' ? correspondence.getInfo() : _createInstance(correspondence).getInfo();


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
                            workItem: false,
                            disableProperties: true,
                            disableCorrespondence: true,
                            popupNumber: generator.getPopupNumber(),
                            disableEverything: true,
                            pageName: 'none',
                            reloadCallback: undefined
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
                            popupNumber: generator.getPopupNumber(),
                            reloadCallback: undefined
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
                                pageName: 'none',
                                reloadCallback: undefined
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
                            pageName: 'none',
                            reloadCallback: undefined
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
                    if (result.content.hasOwnProperty('editURL') && result.content.editURL) {
                        result.content.editURL = $sce.trustAsResourceUrl(result.content.editURL);
                    }
                    return dialog.showDialog({
                        templateUrl: cmsTemplate.getPopup('view-document-readonly'),
                        controller: 'viewDocumentReadOnlyPopCtrl',
                        controllerAs: 'ctrl',
                        bindToController: true,
                        escapeToCancel: false,
                        locals: {
                            document: result.metaData,
                            content: result.content,
                            typeOfDoc: 'linked-doc'
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
            var url,
                g2gItemCopy = angular.copy(g2gItem),
                isInternal = g2gItem.isInternalG2G();
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
                    if (model.toLowerCase() === 'g2g') {
                        metaData = generator.interceptReceivedInstance(['Correspondence', 'Incoming', 'ViewIncoming'], generator.generateInstance(metaData, Incoming));
                    } else {
                        metaData = generator.interceptReceivedInstance(['Correspondence', 'Outgoing', 'ViewOutgoing'], generator.generateInstance(metaData, Outgoing));
                    }
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
                    if (result.content.hasOwnProperty('editURL') && result.content.editURL) {
                        result.content.editURL = $sce.trustAsResourceUrl(result.content.editURL);
                    }
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
         * @description open side view document
         * @param replyTo (attachment or linked document)
         * @param viewUrl
         * @param typeOfDoc
         */
        self.openSideViewDocument = function (replyTo, viewUrl, typeOfDoc) {
            var info = typeof replyTo.getInfo === 'function' ? replyTo.getInfo() : _createInstance(replyTo).getInfo();
            var url = typeOfDoc === 'attachment' ?
                _createUrlSchema(info.vsId, info.documentClass, 'attachment/with-content') :
                _createUrlSchema(info.vsId, info.documentClass, 'with-content');

            return $http.get(url)
                .then(function (result) {
                    var documentClass = result.data.rs.metaData.classDescription;
                    result.data.rs.metaData = typeOfDoc === 'attachment' ?
                        generator.generateInstance(result.data.rs.metaData, Attachment) :
                        generator.interceptReceivedInstance(['Correspondence', _getModelName(documentClass), 'View' + _getModelName(documentClass)], generator.generateInstance(result.data.rs.metaData, _getModel(documentClass)));
                    return result.data.rs;
                })
                .then(function (result) {
                    generator.addPopupNumber();
                    result.content.viewURL = $sce.trustAsResourceUrl(result.content.viewURL);
                    if (result.content.hasOwnProperty('editURL') && result.content.editURL) {
                        result.content.editURL = $sce.trustAsResourceUrl(result.content.editURL);
                    }
                    return dialog.showDialog({
                        templateUrl: cmsTemplate.getPopup('view-document-side-view'),
                        controller: 'viewDocumentSideViewPopCtrl',
                        controllerAs: 'ctrl',
                        bindToController: true,
                        escapeToCancel: false,
                        locals: {
                            document: result.metaData,
                            content: result.content,
                            viewUrl: viewUrl,
                            typeOfDoc: typeOfDoc
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
         * to use it just inside edit after approved.
         * @param information
         * @param justView
         * @returns {promise|*}
         */
        self.openCorrespondenceEditor = function (information, justView) {
            return dialog.showDialog({
                templateUrl: cmsTemplate.getPopup('view-correspondence'),
                controller: 'viewCorrespondencePopCtrl',
                controllerAs: 'ctrl',
                bindToController: true,
                escapeToCancel: false,
                locals: {
                    correspondence: false,
                    content: information,
                    popupNumber: generator.getPopupNumber(),
                    editMode: !justView,
                    reloadCallback: undefined
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
                    /*errorCode.checkIf(error, 'G2G_USER_NOT_AUTHENTICATED', function () {
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
                    });*/
                    return errorCode.showErrorDialog(error);
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

        self.broadcasting = function (broadcast, correspondence, broadcastToAll) {
            var info = correspondence.getInfo(), url = [info.documentClass, 'vsid', info.vsId, 'broadcast'];
            // workItem =>  /vsid/{vsid}/wob-num/{wobNum}/broadcast
            // correspondence => /vsid/{vsid}/broadcast
            if (info.isWorkItem()) {
                url.splice(-1, 0, 'wob-num', info.wobNumber);
            }

            var requestBody = generator.interceptSendInstance('Broadcast', broadcast);
            if (broadcastToAll) {
                requestBody = {broadcastToAll: broadcastToAll, action: requestBody.action}
            }

            return $http.put(_createCorrespondenceWFSchema(url), requestBody)
                .then(function (result) {
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
                            return organizationService.loadOrganizationChildren(employeeService.getEmployee().getRegistryOUID(), false);
                        },
                        actions: function (employeeService) {
                            'ngInject';
                            return employeeService.getEmployee().loadMyWorkflowActions();
                        },
                        workflowGroups: function (broadcastService) {
                            'ngInject';
                            return broadcastService.loadWorkflowGroups();
                        },
                        jobTitles: function (jobTitleService) {
                            'ngInject';
                            return jobTitleService.getJobTitles();
                        },
                        ranks: function (rankService) {
                            'ngInject';
                            return rankService.getRanks();
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

        function _launchCorrespondence(correspondence, $event, action, tab, isDeptIncoming, isDeptSent, fromSimplePopup, predefinedActionMembers, reloadCallback) {
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
                        isDeptIncoming: isDeptIncoming,
                        isDeptSent: isDeptSent,
                        fromSimplePopup: fromSimplePopup,
                        predefinedActionMembers: predefinedActionMembers,
                        fromQuickSend: (predefinedActionMembers && predefinedActionMembers.length > 0),
                        reloadCallback: reloadCallback
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
                            return userCommentService.loadUserCommentsForDistribution();
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
         * @param fromSimplePopup
         * @param predefinedActionMembers
         * @param reloadCallback
         * @returns {promise|*}
         */
        self.launchCorrespondenceWorkflow = function (correspondence, $event, action, tab, isDeptIncoming, isDeptSent, fromSimplePopup, predefinedActionMembers, reloadCallback) {
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
                                    return result.hasSite() ? _launchCorrespondence(correspondence, $event, action, tab, isDeptIncoming, isDeptSent, fromSimplePopup, predefinedActionMembers, reloadCallback) : null;
                                })
                        })
                } else {
                    return _launchCorrespondence(correspondence, $event, action, tab, isDeptIncoming, isDeptSent, fromSimplePopup, predefinedActionMembers, reloadCallback);
                }
            }
            return _launchCorrespondence(correspondence, $event, action, tab, isDeptIncoming, isDeptSent, fromSimplePopup, predefinedActionMembers, reloadCallback);

        };


        /**
         * @description
         * @param record
         * @param action
         * @param $event
         * @param defaultReplyToIdentifier
         * @returns {promise|*}
         */
        self.replySimple = function (record, $event, action, defaultReplyToIdentifier) {
            action = action || 'reply';
            var errorMessage = [];
            return dialog
                .showDialog({
                    templateUrl: cmsTemplate.getPopup('reply-simple'),
                    controller: 'replySimplePopCtrl',
                    controllerAs: 'ctrl',
                    targetEvent: $event,
                    locals: {
                        record: record,
                        actionKey: action,
                        errorMessage: errorMessage,
                        dialogTitle: langService.get('reply'),
                        defaultReplyToIdentifier: defaultReplyToIdentifier
                    },
                    resolve: {
                        comments: function (userCommentService) {
                            'ngInject';
                            return userCommentService.loadUserCommentsForDistribution();
                        },
                        workflowActions: function (workflowActionService) {
                            'ngInject';
                            return workflowActionService.loadCurrentUserWorkflowActions()
                        },
                        replyOn: function (distributionWFService, manageLaunchWorkflowService) {
                            'ngInject';
                            if (manageLaunchWorkflowService.isValidLaunchData()) {
                                return manageLaunchWorkflowService.getLaunchSelectedItems()[0];
                            }
                            return distributionWFService
                                .loadSenderUserForWorkItem(record);

                        },
                        managers: function (employeeService, WFUser) {
                            'ngInject';
                            if (!employeeService.getEmployee().canSendToManagers())
                                return [];

                            return $http.get(urlService.distributionWFManagers).then(function (result) {
                                return generator.generateCollection(result.data.rs, WFUser);
                            }).catch(function (e) {
                                return [];
                            });
                        },
                        organizationGroups: function (distributionWFService) {
                            'ngInject';
                            return distributionWFService
                                .loadDistWorkflowOrganizations('organizations')
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
            var defer = $q.defer();
            if (!workItem.hasActiveSeqWF()) {
                defer.resolve(true);
            } else {
                dialog.confirmMessage(langService.get('confirm_terminate_seq_wf'))
                    .then(function () {
                        defer.resolve(true);
                    })
            }
            return defer.promise.then(function () {
                return self.showReasonDialog('terminate_reason', $event)
                    .then(function (reason) {
                        var info = workItem.getInfo();
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
            if (workItems.length === 1) {
                return self.terminateWorkItem(workItems[0], $event);
            }

            var selectedItems = angular.copy(workItems),
                defer = $q.defer(),
                recordsInSeqWF = _.filter(selectedItems, function (item) {
                    return item.hasActiveSeqWF();
                }),
                recordsNotInSeqWF = _.filter(selectedItems, function (item) {
                    return !item.hasActiveSeqWF();
                });

            if (recordsInSeqWF.length === 0) {
                defer.resolve(selectedItems);
            } else {
                if (recordsInSeqWF.length === selectedItems.length) {
                    dialog.confirmMessage(langService.get('confirm_terminate_seq_wf'))
                        .then(function () {
                            defer.resolve(recordsInSeqWF);
                        })
                } else {
                    var buttonsMap = {
                        terminate: {
                            id: 1,
                            key: 'terminate',
                            langKey: 'terminate'
                        },
                        skipAndTerminate: {
                            id: 2,
                            key: 'skipAndTerminate',
                            langKey: 'skip_and_terminate'
                        }
                    };

                    dialog.confirmThreeButtonMessage(langService.get('confirm_terminate_selected_some_seq_wf'), '', langService.get(buttonsMap.terminate.langKey), langService.get(buttonsMap.skipAndTerminate.langKey), false, null, false)
                        .then(function (result) {
                            if (result.button === buttonsMap.skipAndTerminate.id) {
                                defer.resolve(recordsNotInSeqWF);
                            } else if (result.button === buttonsMap.terminate.id) {
                                defer.resolve(selectedItems);
                            }
                        });
                }
            }

            return defer.promise.then(function (itemsToTerminate) {
                return self
                    .showReasonBulkDialog('terminate_reason', itemsToTerminate, $event)
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
                                return _bulkMessages(result, itemsToTerminate, ignoreMessage, 'failed_terminate_selected', 'selected_terminate_success', 'following_records_failed_to_terminate');
                            });
                    })
            });
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
         * @param saveButtonKey
         * @param reasonText
         * @param allowedMaxLength
         * @returns {promise|*}
         */
        self.showReasonDialog = function (dialogTitle, $event, saveButtonKey, reasonText, allowedMaxLength) {
            return dialog
                .showDialog({
                    templateUrl: cmsTemplate.getPopup('reason'),
                    controller: 'reasonPopCtrl',
                    controllerAs: 'ctrl',
                    bindToController: true,
                    targetEvent: $event,
                    locals: {
                        title: dialogTitle,
                        saveButtonKey: saveButtonKey,
                        reasonText: reasonText || '',
                        allowedMaxLength: allowedMaxLength || 200
                    },
                    resolve: {
                        comments: function (userCommentService) {
                            'ngInject';
                            return userCommentService.loadUserCommentsForDistribution();
                        }
                    }
                });
        };
        /**
         * @description open bulk reason.
         * @param dialogTitle
         * @param workItems
         * @param $event
         * @param allowedMaxLength
         */
        self.showReasonBulkDialog = function (dialogTitle, workItems, $event, allowedMaxLength) {
            return dialog
                .showDialog({
                    templateUrl: cmsTemplate.getPopup('reason-bulk'),
                    controller: 'reasonBulkPopCtrl',
                    controllerAs: 'ctrl',
                    targetEvent: $event,
                    bindToController: true,
                    locals: {
                        workItems: workItems,
                        title: dialogTitle,
                        allowedMaxLength: allowedMaxLength || 200
                    },
                    resolve: {
                        comments: function (userCommentService) {
                            'ngInject';
                            return userCommentService.loadUserCommentsForDistribution();
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
                        entityTypes: function (entityTypeService) {
                            'ngInject';
                            return entityTypeService
                                .loadEntityTypes();
                        },
                        prepareExport: function () {
                            'ngInject';
                            return self.prepareExportedDataFromBackend(workItem)
                        }
                    }
                });
        };
        /**
         * @description open dialog for export workItem.
         * @param g2gItem
         * @param $event
         * @returns {promise|*}
         */
        self.openExportNewCorrespondenceDialog = function (g2gItem, $event) {
            return dialog
                .showDialog({
                    targetEvent: $event,
                    templateUrl: cmsTemplate.getPopup('ready-to-export-option'),
                    controller: 'readyToExportOptionPopCtrl',
                    controllerAs: 'ctrl',
                    locals: {
                        readyToExport: {},
                        resend: true,
                        g2gData: g2gItem
                    },
                    resolve: {
                        entityTypes: function (entityTypeService) {
                            'ngInject';
                            return entityTypeService
                                .loadEntityTypes();
                        },
                        prepareExport: function () {
                            'ngInject';
                            return self.prepareExportedNewDataFromBackend(g2gItem.g2gActionID)
                        }
                    }
                });
        };

        self.resendG2GItemNew = function (g2gActionID) {
            return $http.get(urlService.resendG2GKuwait.replace('{g2gActionID}', g2gActionID)).then(function (result) {
                return result.data.rs;
            })
        };

        self.prepareExportedDataFromBackend = function (workItem) {
            var info = workItem.getInfo();
            return $http.get(urlService.correspondence + '/' + info.documentClass + '/vsid/' + info.vsId + '/prepare-export')
                .then(function (result) {
                    result.data.rs.sitesitesToList = _.map(result.data.rs.sitesitesToList, function (site) {
                        site.docClassName = info.documentClass;
                        return site;
                    });
                    result.data.rs.sitesCCList = _.map(result.data.rs.sitesCCList, function (site) {
                        site.docClassName = info.documentClass;
                        return site;
                    });
                    result.data.rs.sitesitesToList = generator.interceptReceivedCollection('Site', generator.generateCollection(result.data.rs.sitesitesToList, Site));
                    result.data.rs.sitesCCList = generator.interceptReceivedCollection('Site', generator.generateCollection(result.data.rs.sitesCCList, Site));
                    result.data.rs.linkedDocList = self.interceptReceivedCollectionBasedOnEachDocumentClass(result.data.rs.linkedDocList);
                    return result.data.rs;
                })
        };

        self.prepareExportedNewDataFromBackend = function (g2gActionId) {
            return $http.get(urlService.resendG2GKuwait.replace('{g2gActionID}', g2gActionId))
                .then(function (result) {
                    result.data.rs.sitesitesToList = _.map(result.data.rs.sitesitesToList, function (site) {
                        site.docClassName = 'Outgoing';
                        return site;
                    });
                    result.data.rs.sitesCCList = _.map(result.data.rs.sitesCCList, function (site) {
                        site.docClassName = 'Outgoing';
                        return site;
                    });
                    result.data.rs.sitesitesToList = generator.interceptReceivedCollection('Site', generator.generateCollection(result.data.rs.sitesitesToList, Site));
                    result.data.rs.sitesCCList = generator.interceptReceivedCollection('Site', generator.generateCollection(result.data.rs.sitesCCList, Site));
                    return result.data.rs;
                })
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

        self.prepareExportedBulkData = function (vsIds) {
            return $http.put(urlService.correspondence + '/outgoing/bulk/prepare-export', vsIds)
                .then(function (result) {
                    var vsIdObject = {};
                    _.map(result.data.rs, function (item, key) {
                        vsIdObject[key] = {};
                        item.sitesitesToList = _.map(item.sitesitesToList, function (site) {
                            site.docClassName = 'outgoing';
                            return site;
                        });
                        item.sitesCCList = _.map(item.sitesCCList, function (site) {
                            site.docClassName = 'outgoing';
                            return site;
                        });
                        item.sitesitesToList = generator.interceptReceivedCollection('Site', generator.generateCollection(item.sitesitesToList, Site));
                        item.sitesCCList = _.map(generator.interceptReceivedCollection('Site', generator.generateCollection(item.sitesCCList, Site)), function (site) {
                            site.ccVerion = true;
                            return site;
                        });
                        vsIdObject[key] = [].concat(item.sitesitesToList, item.sitesCCList);
                    });
                    return vsIdObject;
                })
        };

        self.exportBulkWorkItemsDialog = function (workItems, $event) {
            return dialog
                .showDialog({
                    targetEvent: $event,
                    templateUrl: cmsTemplate.getPopup('export-bulk-work-items'),
                    controller: 'exportBulkWorkItemsPopCtrl',
                    controllerAs: 'ctrl',
                    locals: {
                        workItems: workItems
                    },
                    resolve: {
                        exportedData: function () {
                            'ngInject';
                            var vsIds = _.map(workItems, 'generalStepElm.vsId');
                            return self.prepareExportedBulkData(vsIds);
                        }
                    }
                })
        };

        self.exportBulkWorkItems = function (workItems, options) {
            var items = _.map(workItems, function (item) {
                var info = item.getInfo();
                return {first: info.vsId, second: info.wobNumber};
            });
            return $http.put(urlService.correspondenceWF + '/outgoing/bulk/export', {data: items, options: options})
                .then(function () {
                    return workItems;
                }).catch(function (error) {
                    if (errorCode.checkIf(error, 'CANNOT_EXPORT_MORE_THAN_FIFTY_ATTACHMENTS_OR_LINKED_DOCUMENTS_TO_G2G') === true) {
                        dialog.errorMessage(generator.getTranslatedError(error));
                    }
                })
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
                resendOptions = workItems[i].isGroupExport ? workItems[i].model : workItems[i].partialExportList;
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
         * @description approve the workItem
         * @param workItem
         * @param signature
         * @param pinCode
         * @param isComposite
         * @param ignoreMessage
         * @param additionalData
         * @param ignoreValidateMultiSignature
         * @param exportedData
         */
        self.approveCorrespondence = function (workItem, signature, pinCode, isComposite, ignoreMessage, additionalData, ignoreValidateMultiSignature, exportedData) {
            var defer = $q.defer();
            if (additionalData && workItem.isWorkItem()) {
                additionalData.preApproveAction(null, true, true)
                    .then(function (result) {
                        defer.resolve(result);
                    })
            } else {
                defer.resolve('noSaveRequired');
            }
            return defer.promise.then(function (changesSaved) {
                if (changesSaved === 'savedBeforeApprove' || changesSaved === 'noSaveRequired') {
                    var info = workItem.getInfo();
                    var sign = (new SignDocumentModel())
                        .setSignature(workItem, signature)
                        .setIsComposite(isComposite)
                        .setPinCode(pinCode ? encryptionService.encrypt(pinCode) : null)
                        .setValidateMultiSignature(!ignoreValidateMultiSignature)
                        .setComments(generator.getNormalizedValue(exportedData, 'comments') || null)
                        .setDueDate(generator.getNormalizedValue(exportedData, 'exportDate') || null);

                    return $http
                        .put(_createUrlSchema(null, info.documentClass, 'authorize'), sign)
                        .then(function (result) {
                            if (result.data.rs === self.authorizeStatus.SAME_USER_AUTHORIZED.text) {
                                return _handleSameUserAuthorize()
                                    .then(function (sameUserAuthorizeResult) {
                                        if (sameUserAuthorizeResult === 'AUTHORIZE_CANCELLED') {
                                            return sameUserAuthorizeResult;
                                        } else {
                                            return self.approveCorrespondence(workItem, signature, pinCode, isComposite, ignoreMessage, null, true, exportedData)
                                                .catch(function (error) {
                                                    errorCode.checkIf(error, 'AUTHORIZE_FAILED', function () {
                                                        dialog.errorMessage(langService.get('authorize_failed'))
                                                    });
                                                    errorCode.checkIf(error, 'NOT_ENOUGH_CERTIFICATES', function () {
                                                        dialog.errorMessage(langService.get('certificate_missing'))
                                                    });
                                                    errorCode.checkIf(error, 'PIN_CODE_NOT_MATCH', function () {
                                                        dialog.errorMessage(langService.get('pincode_not_match'))
                                                    });
                                                    errorCode.checkIf(error, 'WORK_ITEM_NOT_FOUND', function () {
                                                        dialog.errorMessage(langService.get('work_item_not_found').change({wobNumber: info.wobNumber}));
                                                    });
                                                    return $q.resolve(error);
                                                });
                                        }
                                    });
                            } else {
                                if (!ignoreMessage) {
                                    if (result.data.rs) {
                                        toast.success(langService.get('sign_specific_success').change({name: workItem.getTranslatedName()}));
                                    } else {
                                        toast.error(langService.get('something_happened_when_sign'));
                                    }
                                }
                                return result.data.rs;
                            }
                        })
                        .catch(function (error) {
                            errorCode.checkIf(error, 'AUTHORIZE_FAILED', function () {
                                dialog.errorMessage(langService.get('authorize_failed'))
                            });
                            errorCode.checkIf(error, 'NOT_ENOUGH_CERTIFICATES', function () {
                                dialog.errorMessage(langService.get('certificate_missing'))
                            });
                            errorCode.checkIf(error, 'PIN_CODE_NOT_MATCH', function () {
                                dialog.errorMessage(langService.get('pincode_not_match'))
                            });
                            errorCode.checkIf(error, 'WORK_ITEM_NOT_FOUND', function () {
                                dialog.errorMessage(langService.get('work_item_not_found').change({wobNumber: info.wobNumber}));
                            });
                            return $q.reject(error);
                        })
                }
            })
        };

        function _handleSameUserAuthorize(workItem, signature, pinCode, isComposite, ignoreMessage, preSaveCallback, ignoreValidateMultiSignature) {
            return dialog.confirmMessage(langService.get('confirm_authorize_same_user').change({user: employeeService.getEmployee().getTranslatedName()}))
                .then(function () {
                    return $q.resolve('AUTHORIZE_SKIP_SAME_USER_CHECK');
                })
                .catch(function () {
                    return $q.resolve('AUTHORIZE_CANCELLED');
                })
        }

        /**
         * @description to display dialog to select signature .
         * @param workItem
         * @param $event
         * @param ignoreMessage
         * @param additionalData
         * @param exportData
         * @returns {Promise<any>}
         */
        self.showApprovedDialog = function (workItem, $event, ignoreMessage, additionalData, exportData) {
            return applicationUserSignatureService
                .loadApplicationUserSignatures(employeeService.getEmployee().id)
                .then(function (signatures) {
                    if (!signatures || signatures.length === 0) {
                        dialog.alertMessage(langService.get('no_signature_available'));
                        return $q.reject(langService.get('no_signature_available'));
                    } else {
                        var pinCodeRequired = rootEntity.getGlobalSettings().isDigitalCertificateEnabled() && employeeService.getEmployee().hasPinCodePrompt();
                        if (signatures.length === 1) {
                            var pinCodeDefer = $q.defer();
                            if (!pinCodeRequired) {
                                pinCodeDefer.resolve('PINCODE_NOT_REQUIRED');
                            } else {
                                dialog
                                    .showDialog({
                                        targetEvent: $event,
                                        templateUrl: cmsTemplate.getPopup('pincode'),
                                        controller: 'pinCodePopCtrl',
                                        controllerAs: 'ctrl'
                                    })
                                    .then(function (result) {
                                        result ? pinCodeDefer.resolve(result) : pinCodeDefer.reject('PINCODE_MISSING');
                                    })
                                    .catch(function () {
                                        pinCodeDefer.reject('PINCODE_MISSING');
                                    });
                            }

                            return pinCodeDefer.promise.then(function (pinCode) {
                                if (pinCode === 'PINCODE_NOT_REQUIRED') {
                                    pinCode = null;
                                }
                                var isComposite = workItem.isWorkItem() ? workItem.isComposite() : workItem.isCompositeSites();
                                if (isComposite) {
                                    return dialog
                                        .confirmMessage(langService.get('document_is_composite'))
                                        .then(function () {
                                            return self.approveCorrespondence(workItem, signatures[0], pinCode, true, ignoreMessage, additionalData, false, exportData);
                                        })
                                        .catch(function () {
                                            return self.approveCorrespondence(workItem, signatures[0], pinCode, false, ignoreMessage, additionalData, false, exportData);
                                        })
                                } else {
                                    return self.approveCorrespondence(workItem, signatures[0], pinCode, false, ignoreMessage, additionalData, false, exportData);
                                }
                            });
                        } else if (signatures && signatures.length > 1) {
                            return dialog
                                .showDialog({
                                    targetEvent: $event,
                                    templateUrl: cmsTemplate.getPopup('signature'),
                                    controller: 'signaturePopCtrl',
                                    controllerAs: 'ctrl',
                                    locals: {
                                        workItem: workItem,
                                        signatures: signatures,
                                        additionalData: additionalData,
                                        ignoreMessage: ignoreMessage,
                                        pinCodeRequired: pinCodeRequired,
                                        exportData: exportData
                                    }
                                });
                        }
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
                            viewerActions: actions.viewerActions,
                            reloadCallback:undefined
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
                            popupNumber: generator.getPopupNumber(),
                            reloadCallback: undefined
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
         * @param officeOnlineCallback
         * @return {Promise}
         */
        self.editWordInDesktop = function (correspondence, officeOnlineCallback) {
            var info = correspondence.getInfo();
            var url = urlService
                .desktopEdit
                .replace('{base_url}', urlService.BASE)
                .replace('{mode}', 0)
                .replace('{type}', 'docx')
                .replace('{vsId}', info.vsId)
                .replace('{subject}', encodeURIComponent(info.title))
                .replace('{token}', tokenService.getToken())
                .replace('{documentClass}', info.documentClass)
                .replace('{entityIdentifier}', rootEntity.getRootEntityIdentifier())
                .replace('{currentOuId}', employeeService.getEmployee().getOUID());
            return $http.get(url, {
                excludeLoading: true
            }).catch(function (error) {
                    if (error.xhrStatus === 'error' && error.status === -1) {
                        _handleMissingEditInDesktop(correspondence, officeOnlineCallback);
                    }
                    return $q.reject(error);
                }
            );
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
                .replace('{documentClass}', info.documentClass)
                .replace('{entityIdentifier}', rootEntity.getRootEntityIdentifier())
                .replace('{currentOuId}', employeeService.getEmployee().getOUID());
            return $http.get(url, {
                excludeLoading: true
            });
        };

        /**
         * @description Opens dialog to confirm next action if edit in desktop fails to open
         * @param record
         * @param officeOnlineCallback
         * @returns {*}
         */
        var _handleMissingEditInDesktop = function (record, officeOnlineCallback) {
            var defer = $q.defer(),
                buttonsMap = {
                    button1: {
                        id: 1,
                        key: 'desktop',
                        langKey: 'try_again'
                    },
                    button2: {
                        id: 2,
                        key: 'officeOnline',
                        officeOnlineCallback: officeOnlineCallback,
                        langKey: 'edit_in_office_online'
                    }
                };

            dialog.confirmThreeButtonMessage(langService.get('missing_edit_in_desktop_tool_contact_admin'), '', langService.get(buttonsMap.button1.langKey), langService.get(buttonsMap.button2.langKey), false, null, false)
                .then(function (result) {
                    if (result.button === buttonsMap.button1.id) {
                        defer.resolve(buttonsMap.button1);
                    } else if (result.button === buttonsMap.button2.id) {
                        defer.resolve(buttonsMap.button2);
                    }
                });
            return defer.promise.then(function (button) {
                if (button.key === 'officeOnline') {
                    if (button.hasOwnProperty('officeOnlineCallback') && typeof button.officeOnlineCallback !== 'undefined' && button.officeOnlineCallback !== null) {
                        officeOnlineCallback();
                    } else {
                        record.editCorrespondenceInOfficeOnline();
                    }
                } else if (button.key === 'desktop') {
                    record.editCorrespondenceInDesktop(officeOnlineCallback);
                }

                /*if (button.hasOwnProperty('officeOnlineCallback') && typeof button.officeOnlineCallback !== 'undefined' && button.officeOnlineCallback !== null) {
                    button.officeOnlineCallback();
                } else {
                    record[button.callback]();
                }*/
            });
        };

        /**
         * @description open popup with document in office online edit mode.
         * @param correspondence
         */
        self.editDocumentInOfficeOnline = function (correspondence) {
            var info = correspondence.getInfo();
            self.loadCorrespondenceByVsIdClass(info.vsId, info.documentClass)
                .then(function (result) {
                    result.openInEditMode = true;
                    result.defaultModeIfEditing = self.documentEditModes.officeOnline;
                    self.viewCorrespondence(result, [], true, true);
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
                            'ngInject';
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
                    toast.success(langService.get("quick_received_success"));
                    //return _bulkMessages(result, workItems, ignoreMessage, 'failed_to_receive', 'quick_received_success', 'following_records_failed_to_quick_receive');
                    return result.data.rs;
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
                })
                .catch(function (error) {
                    //dialog.errorMessage(langService.get('error_messages'));
                    /*errorCode.checkIf(error, 'CANNOT_EDIT_AFTER_EXPORT_BECAUSE_RECEIVED_BY_ONE_SITE', function () {
                        dialog.errorMessage(langService.get('can_not_edit_after_export_because_received_by_one_site'));
                    });*/
                    return errorCode.showErrorDialog(error);
                });
        };
        /**
         * @description recall and forward for g2g Kuwait
         * @param g2gActionID
         * @returns {*}
         */
        self.recallAndForwardG2G = function (g2gActionID) {
            var documentClass = 'outgoing';
            return $http
                .get(urlService.recallAndForward.replace('{g2gActionID}', g2gActionID))
                .then(function (result) {
                    result.data.rs.metaData = generator.interceptReceivedInstance(['Correspondence', _getModelName(documentClass), 'View' + _getModelName(documentClass)], generator.generateInstance(result.data.rs.metaData, _getModel(documentClass)));
                    return result.data.rs;
                })
                .catch(function (error) {
                    return errorCode.showErrorDialog(error);
                });
        };

        self.viewCorrespondenceSites = function (correspondence, recordType, $event) {
            var info = correspondence.getInfo();
            if (info.documentClass === 'internal')
                return;

            if (recordType && recordType.toLowerCase() === 'g2g') {
                return dialog.showDialog({
                    templateUrl: cmsTemplate.getPopup('manage-grid-correspondence-sites'),
                    controller: 'manageGridCorrespondenceSitesPopCtrl',
                    targetEvent: $event || false,
                    controllerAs: 'ctrl',
                    bindToController: true,
                    escapeToClose: false,
                    locals: {
                        documentSubject: info.title,
                        type: recordType.toLowerCase(),
                        correspondence: correspondence.correspondence,
                        sites: []
                    }
                });
            } else if (recordType && recordType.toLowerCase() === 'g2gmessaginghistory') {
                return dialog.showDialog({
                    templateUrl: cmsTemplate.getPopup('manage-grid-correspondence-sites'),
                    controller: 'manageGridCorrespondenceSitesPopCtrl',
                    targetEvent: $event || false,
                    controllerAs: 'ctrl',
                    bindToController: true,
                    escapeToClose: false,
                    locals: {
                        documentSubject: info.title,
                        type: recordType.toLowerCase(),
                        correspondence: correspondence,
                        sites: []
                    }
                });
            } else {
                var defer = $q.defer();
                return dialog.showDialog({
                    templateUrl: cmsTemplate.getPopup('manage-grid-correspondence-sites'),
                    controller: 'manageGridCorrespondenceSitesPopCtrl',
                    targetEvent: $event || false,
                    controllerAs: 'ctrl',
                    bindToController: true,
                    escapeToClose: false,
                    locals: {
                        fromDialog: true,
                        vsId: info.vsId,
                        documentClass: info.documentClass,
                        documentSubject: info.title
                    },
                    resolve: {
                        correspondence: function () {
                            'ngInject';
                            return self
                                .loadCorrespondenceByVsIdClass(info.vsId, info.documentClass)
                                .then(function (correspondence) {
                                    defer.resolve(correspondence);
                                    return correspondence;
                                });
                        },
                        sites: function () {
                            'ngInject';
                            if (info.documentClass.toLowerCase() === 'incoming') {
                                return [];
                            }
                            return defer.promise.then(function (correspondence) {
                                return self
                                    .loadCorrespondenceSites(correspondence)
                            });
                        }
                    }
                });
            }
        };

        /**
         * @description Opens the send sms dialog
         * @param correspondence
         * @param receivingUser
         * @param $event
         * @returns {promise}
         */
        self.openSendSMSDialog = function (correspondence, receivingUser, $event) {
            var info = correspondence.getInfo();
            return dialog.showDialog({
                templateUrl: cmsTemplate.getPopup('send-sms'),
                controllerAs: 'ctrl',
                eventTarget: $event || null,
                bindToController: true,
                controller: 'sendSmsPopCtrl',
                locals: {
                    record: correspondence
                },
                resolve: {
                    linkedEntities: function () {
                        'ngInject';
                        return self.getLinkedEntitiesByVsIdClass(info.vsId, info.documentClass);
                    },
                    smsTemplates: function (smsTemplateService) {
                        'ngInject';
                        /* No need to load application users as we will not use sms template subscribers */
                        return smsTemplateService.loadActiveSmsTemplates(true);
                    },
                    mobileNumber: function (applicationUserService) {
                        'ngInject';
                        if (!receivingUser) {
                            return null;
                        }
                        if (employeeService.isCurrentApplicationUser(receivingUser)) {
                            return generator.getNormalizedValue(receivingUser, 'mobile');
                        }

                        return applicationUserService.loadApplicationUserById(receivingUser)
                            .then(function (appUser) {
                                return (!!appUser ? generator.getNormalizedValue(appUser, 'mobile') : null);
                            });
                    }
                }
            })
        };


        /**
         * @description open send document url dialog
         * @param correspondence
         * @param $event
         * @returns {promise}
         */
        self.openSendDocumentURLDialog = function (correspondence, $event) {
            return dialog.showDialog({
                templateUrl: cmsTemplate.getPopup('send-document-link'),
                controllerAs: 'ctrl',
                eventTarget: $event || null,
                controller: 'sendDocumentLinkPopCtrl',
                locals: {
                    correspondence: correspondence
                },
                resolve: {
                    documentLink: function () {
                        'ngInject';
                        return self.getDocumentLinkWithSubscribers(correspondence)
                            .then(function (result) {
                                return result;
                            });
                    }
                }
            });
        };

        self.getDocumentLinkWithSubscribers = function (correspondence) {
            var info = correspondence.getInfo();
            var employee = employeeService.getEmployee();

            var route = "/user-id/" + employee.id + "/ouid/" + employee.getOUID() + "/vsid/" + info.vsId;
            return $http.get(urlService.documentLink + route)
                .then(function (result) {
                    result = generator.generateInstance(result.data.rs, DocumentLink);
                    result = result.id ? generator.interceptReceivedInstance('DocumentLink', result) : result;
                    return result;
                })
        };

        self.sendDocumentLink = function (documentLink, correspondence) {
            return (documentLink.hasOwnProperty('id') && documentLink.id) ? self.updateDocumentLink(documentLink, correspondence) : self.addDocumentLink(documentLink, correspondence);
        };

        /**
         * @description add document link
         * @param documentLink
         * @param correspondence
         * @returns {*}
         */
        self.addDocumentLink = function (documentLink, correspondence) {
            var info = correspondence.getInfo();
            documentLink.docSubject = info.title;
            documentLink.vsid = info.vsId;
            documentLink.docClassId = info.docClassId;

            return $http.post(urlService.documentLink,
                generator.interceptSendInstance('DocumentLink', documentLink))
                .then(function (result) {
                    return result.data.rs;
                });
        };

        /**
         * @description update document link
         * @param documentLink
         * @param correspondence
         * @returns {*}
         */
        self.updateDocumentLink = function (documentLink, correspondence) {
            var info = correspondence.getInfo();
            documentLink.docSubject = info.title;

            return $http.put(urlService.documentLink,
                generator.interceptSendInstance('DocumentLink', documentLink))
                .then(function (result) {
                    return result.data.rs;
                })/*.catch(function (error) {
                    if (errorCode.checkIf(error, 'FAILED_DUE_TO_LINKED_OBJECT') === true) {
                        dialog.errorMessage(langService.get('cannot_delete_subscriber_he_opened_book'));
                        return $q.reject(error);
                    }
                    return errorCode.showErrorDialog(error);
                })*/;
        };

        /**
         * @description Delete document link subscriber
         * @param subscriberId
         * @returns {*}
         */
        self.deleteDocumentLinkSubscriber = function (subscriberId) {
            subscriberId = subscriberId.hasOwnProperty('id') ? subscriberId.id : subscriberId;
            return $http.delete(urlService.documentLink + '/delete-subscriber/' + subscriberId)
                .then(function (result) {
                    return result.data.rs;
                })/*.catch(function (error) {
                    if (errorCode.checkIf(error, 'FAILED_DUE_TO_LINKED_OBJECT') === true) {
                        dialog.errorMessage(langService.get('cannot_delete_subscriber_he_opened_book'));
                        return $q.reject(error);
                    }
                    return errorCode.showErrorDialog(error);
                })*/;
        };

        /**
         * @description Delete bulk document link subscribers
         * @param subscribers
         * @returns {*}
         */
        self.deleteBulkDocumentLinkSubscriber = function (subscribers) {
            /*var subscriberIds = _.map(subscribers, 'id');
            return $http
                .put((urlService.documentLink + "/bulk"), subscriberIds)
                .then(function (result) {
                    return generator.getBulkActionResponse(result, subscribers, false, 'failed_delete_selected', 'delete_success', 'delete_success_except_following');
                });*/
        };

        self.loadUserLinks = function (userId, ouId) {
            return $http
                .get((urlService.documentLink + '/user-id/' + userId + '/ouid/' + ouId))
                .then(function (result) {
                    return generator.interceptReceivedCollection('DocumentLink', generator.generateCollection(result.data.rs, DocumentLink));
                });
        };

        self.openUserLinksPopup = function ($event) {
            var employee = employeeService.getEmployee();
            return dialog
                .showDialog({
                    templateUrl: cmsTemplate.getPopup('user-links'),
                    controller: 'userLinksPopupCtrl',
                    controllerAs: 'ctrl',
                    resolve: {
                        userLinks: function () {
                            'ngInject';
                            return self.loadUserLinks(employee.id, employee.getOUID());
                        }
                    }
                })
        };

        /**
         * @description gets the parsed sms template to display as sms message
         * @param correspondence
         * @param smsObject
         * @returns {*}
         */
        self.parseSMSTemplate = function (correspondence, smsObject) {
            var info = correspondence.getInfo(),
                url = urlService.correspondence + '/' + info.documentClass + '/' + info.vsId + '/template/' + smsObject.smsTemplate,
                smsObjectCopy = angular.copy(smsObject);

            if (smsObjectCopy.linkedEntity) {
                smsObjectCopy.linkedEntity = generator.interceptSendInstance('LinkedObject', smsObjectCopy.linkedEntity);
                // adding dummy property for backend purpose only
                smsObjectCopy.destinationName = smsObjectCopy.linkedEntity.getTranslatedName();
            }
            return $http.put(url, smsObjectCopy.linkedEntity || {})
                .then(function (result) {
                    return result.data.rs;
                })
        };

        /**
         * @description Sends the sms to the given mobile number
         * @param correspondence
         * @param smsObject
         * @returns {*}
         */
        self.sendSMSMessage = function (correspondence, smsObject) {
            var info = correspondence.getInfo(),
                smsObjectCopy = angular.copy(smsObject),
                url = urlService.correspondence + '/' + info.documentClass + '/' + info.vsId + '/send-sms';

            if (smsObjectCopy.linkedEntity)
                smsObjectCopy.linkedEntity = generator.interceptSendInstance('LinkedObject', smsObjectCopy.linkedEntity);

            var model = new SmsLog({
                smsTemplateId: smsObject.smsTemplate,
                destinationName: smsObjectCopy.linkedEntity ? smsObjectCopy.linkedEntity.getTranslatedName() : '',
                mobileNo: smsObjectCopy.mobileNumber,
                message: smsObjectCopy.message
            });

            return $http.post(url, model)
                .then(function (result) {
                    return result.data.rs;
                })
        };

        /**
         * @description Archive the given correspondence
         * @param correspondence
         */
        self.archiveCorrespondence = function (correspondence) {
            var info = correspondence.getInfo(),
                url = urlService.outgoings;
            if (info.documentClass === 'incoming')
                url = urlService.incomings;
            else if (info.documentClass === 'internal')
                url = urlService.internals;
            return $http
                .put(url + '/' + info.vsId + '/archive')
                .then(function () {
                    toast.success(langService.get("archive_specific_success").change({name: correspondence.getTranslatedName()}));
                    return correspondence;
                });
        };

        /**
         * @description archive bulk correspondence.
         * @param correspondences
         * @param $event
         * @param ignoreMessage
         * @returns {*}
         */
        self.archiveBulkCorrespondences = function (correspondences, $event, ignoreMessage) {
            // if the selected correspondences has just one record.
            if (correspondences.length === 1)
                return self.archiveCorrespondence(correspondences[0], $event);
            else {
                var info = correspondences[0].getInfo(),
                    url = urlService.outgoings;
                if (info.documentClass === 'incoming')
                    url = urlService.incomings;
                else if (info.documentClass === 'internal')
                    url = urlService.internals;

                var vsIds = _.map(correspondences, function (correspondence) {
                    return correspondence.getInfo().vsId;
                });
                return $http
                    .put((url + '/archive/bulk'), vsIds)
                    .then(function (result) {
                        return _bulkMessages(result, correspondences, ignoreMessage, 'failed_archive_selected', 'archive_success', 'archive_success_except_following');
                    });
            }
        };
        /**
         * @description load correspondence by g2gActionID
         * @param g2gActionID
         * @returns {*}
         */
        self.loadG2GCorrespondenceByG2GActionID = function (g2gActionID) {
            return $http
                .get(urlService.g2gCorrespondenceByActionID.replace('{g2gActionID}', g2gActionID))
                .then(function (result) {
                    var model = generator.generateInstance(result.data.rs, _getModel('Outgoing'));
                    return generator.interceptReceivedInstance(['Correspondence', _getModelName('Outgoing')], model);
                });
        };

        /**
         *@description open send fax dialog
         * @param record
         * @param $event
         */
        self.openSendFaxDialog = function (record, $event) {
            var info = record.getInfo(),
                defer = $q.defer();

            return dialog.showDialog({
                templateUrl: cmsTemplate.getPopup('send-fax'),
                controllerAs: 'ctrl',
                targetEvent: $event || false,
                bindToController: true,
                controller: 'sendFaxPopCtrl',
                escapeToClose: false,
                resolve: {
                    correspondence: function () {
                        'ngInject';
                        return self.loadCorrespondenceByVsIdClass(info.vsId, info.documentClass)
                            .then(function (result) {
                                defer.resolve(result);
                                return result;
                            });
                    },
                    sites: function (configurationService) {
                        'ngInject';
                        return defer.promise.then(function (correspondence) {
                            if (info.documentClass.toLowerCase() === 'incoming') {
                                // filter external sites only
                                return _.filter([correspondence.site], function (site) {
                                    return configurationService.CORRESPONDENCE_SITES_TYPES_LOOKUPS.indexOf(Number(site.subSiteId.toString().substring(0, 1))) === -1;
                                });
                            } else if (info.documentClass.toLowerCase() === 'outgoing') {
                                return self.loadCorrespondenceSites(correspondence)
                                    .then(function (result) {
                                        // filter external sites only
                                        return _.filter(result.first.concat(result.second), function (site) {
                                            return configurationService.CORRESPONDENCE_SITES_TYPES_LOOKUPS.indexOf(site.siteCategory) === -1;
                                        });
                                    });

                            } else {
                                return [];
                            }
                        });
                    }
                }
            })
        };


        /**
         *@description open send email reminder dialog
         * @param record
         * @param $event
         */
        self.openSendEmailReminderDialog = function (record, $event) {
            return dialog.showDialog({
                templateUrl: cmsTemplate.getPopup('send-email-reminder'),
                controllerAs: 'ctrl',
                targetEvent: $event || false,
                bindToController: true,
                controller: 'sendEmailReminderPopCtrl',
                escapeToClose: false,
                locals: {
                    correspondence: record.getInfo()
                }
            })
        };
        /**
         * @description send fax
         * @param document
         * @param sitesInfoTo
         * @param exportOptions
         * @returns {*}
         */
        self.sendFax = function (document, sitesInfoTo, exportOptions) {
            var vsId = document.hasOwnProperty('vsId') ? document.vsId : document,
                info = document.getInfo();

            var sitesTo = {
                first: exportOptions,
                second: generator.interceptSendCollection('Site', sitesInfoTo)
            };

            return $http
                .post(_createUrlSchema(vsId, info.documentClass, 'send-fax'), sitesTo)
                .then(function (result) {
                    return result.data.rs;
                });
        };

        /**
         * @description Opens the icn archive options popup
         * @param correspondence
         * @param $event
         * @returns {promise}
         */
        self.openIcnArchiveOptionsDialog = function (correspondence, $event) {
            return dialog
                .showDialog({
                    controller: 'icnArchiveOptionsPopCtrl',
                    templateUrl: cmsTemplate.getPopup('icn-archive-options'),
                    controllerAs: 'ctrl',
                    targetEvent: $event,
                    locals: {
                        correspondence: correspondence
                    },
                    resolve: {
                        icnEntryTemplates: function (dynamicMenuItemService) {
                            'ngInject';
                            return dynamicMenuItemService.loadUserMenuItemsByMenuType(dynamicMenuItemService.dynamicMenuItemsTypes.icnEntryTemplate)
                                .then(function (result) {
                                    return _.filter(result, function (menu) {
                                        return !!menu.menuItem.status;
                                    })
                                });
                        },
                        employeesLinkedEntity: function (correspondenceService) {
                            'ngInject';
                            var info = correspondence.getInfo();
                            if (!info.vsId) {
                                return [];
                            }

                            return correspondenceService.getLinkedEntitiesByVsIdClass(info.vsId, info.documentClass).then(function (linkedEntities) {
                                return linkedEntities.filter(linkedEntity => linkedEntity.isEmployeeType());
                            });
                        },
                    }
                });
        };

        /**
         * @description Opens the dialog with icn entry template form
         * @param correspondence
         * @param options
         * @param entryTemplate
         * @param isBulkEmployees
         * @param $event
         * @returns {promise}
         */
        self.icnArchiveCorrespondence = function (correspondence, options, entryTemplate, isBulkEmployees, $event) {
            var info = correspondence.getInfo(),
                archiveIcnUrl = urlService.correspondence + '/' + info.documentClass + '/' + info.vsId + '/archive-icn',
                menuItem = entryTemplate.hasOwnProperty('menuItem') ? entryTemplate.menuItem : entryTemplate,
                userData = authenticationService.getUserData();

            var entryTemplateUrl = menuItem && menuItem.hasOwnProperty('url') ? menuItem.url : menuItem;
            if (rootEntity.returnRootEntity().rootEntity && isBulkEmployees) {
                archiveIcnUrl = archiveIcnUrl + '?bulk=' + true;
            }
            return $http.put(archiveIcnUrl, options)
                .then(function (result) {
                    //var variables = '%2C:docId%2C:vsId%2C:refVsId%2C:locale'.change({
                    var variables = ['', 'docId', 'vsId', 'refVsId', 'username', 'password', 'locale'].join('%2C:').change({
                        vsId: result.data.rs.vsId, // icn plugin will use to fetch content
                        docId: result.data.rs.id,
                        refVsId: result.data.rs.refVSID, // icn plugin will use to fetch metadata(vsId of original document)
                        locale: langService.current,
                        username: encodeURIComponent(userData.username),
                        password: encodeURIComponent(userData.password)
                    });
                    entryTemplateUrl = entryTemplateUrl.replace('&mimeType', variables + '&mimeType');
                    return isBulkEmployees ? $q.resolve('icnArchiveSuccess') : _showICNArchiveDialog(correspondence, entryTemplateUrl, $event)
                });
        };

        var _showICNArchiveDialog = function (correspondence, entryTemplateUrl, $event) {
            return dialog
                .showDialog({
                    controller: 'icnArchivePopCtrl',
                    templateUrl: cmsTemplate.getPopup('icn-archive'),
                    controllerAs: 'ctrl',
                    bindToController: true,
                    targetEvent: $event,
                    locals: {
                        correspondence: correspondence,
                        entryTemplateUrl: entryTemplateUrl
                    }
                });
        };

        self.getBlobFromUrl = function (url, returnPromise) {
            return $http.get(url, {
                responseType: 'blob'
            }).then(function (result) {
                return generator.changeBlobToTrustedUrl(result.data, returnPromise);
            });
        };

        /**
         * @description Get the blob url to display as pdf if slow connection mode is enabled for user
         * @param viewURL
         * @param returnPromise
         * @param escapeEmployeeCheck
         * @returns {Promise|*}
         */
        self.overrideViewUrl = function (viewURL, returnPromise, escapeEmployeeCheck) {
            if (!escapeEmployeeCheck && employeeService.getEmployee().isSlowConnectionMode()) {
                return self.getBlobFromUrl(viewURL, returnPromise);
            } else {
                if (returnPromise) {
                    return $q.resolve(viewURL);
                }
                return viewURL;
            }
        };

        /**
         * @description Returns the action/state name if security level can be enabled.
         * Otherwise returns null
         * @returns {*}
         */
        self.getSecurityLevelEnabledActionByScreenName = function () {
            var currentStateName = $state.current.name,
                action = null;
            if (currentStateName.indexOf('review') !== -1) {
                action = "review";
            } else if (currentStateName.indexOf('user-inbox') !== -1) {
                action = "user-inbox";
            } else if (currentStateName.indexOf('search-screen') !== -1) {
                action = "search-screen";
            }
            return action;
        };

        self.updateDocumentVersion = function (document) {
            var info = document.getInfo();
            return $http.get(urlService.correspondenceCommon + '/version-info/' + info.vsId)
                .then(function (result) {
                    document.setMajorVersionNumber(result.data.rs.first);
                    document.setMinorVersionNumber(result.data.rs.second);
                    return document;
                });
        };

        /**
         * @description Ends the document's all correspondence sites follow up
         * @param record
         * @param $event
         * @param ignoreMessage
         */
        self.endCorrespondenceFollowup = function (record, $event, ignoreMessage) {
            var info = record.getInfo(),
                defer = $q.defer();
            if (info.documentClass === 'outgoing') {
                var message = langService.get('msg_end_followup') + '<br />' + langService.get('confirm_continue_message');
                dialog.confirmMessage(message)
                    .then(function () {
                        defer.resolve(true)
                    })
            } else if (info.documentClass === 'incoming') {
                defer.resolve(true);
            } else {
                return $q.reject('ACTION_NOT_ALLOWED');
            }
            return defer.promise.then(function () {
                return self.showReasonDialog('terminate_reason', $event)
                    .then(function (reason) {
                        return $http
                            .put(urlService.correspondence + "/" + info.documentClass + "/" + info.vsId + "/terminate-followup", reason)
                            .then(function (result) {
                                if (!result.data.rs) {
                                    return "FAILED_TERMINATE_FOLLOWUP";
                                }
                                if (!ignoreMessage) {
                                    toast.success(langService.get("follow_up_ended_successfully"));
                                }
                                return record;
                            });
                    })
                    .catch(function (error) {
                        return $q.reject(false);
                    });
            }).catch(function (error) {
                return $q.reject(false);
            })
        };

        /**
         *
         * @param correspondence
         * @param $event
         * @returns {*}
         */
        self.deleteCorrespondence = function (correspondence, $event) {
            var info = correspondence.getInfo();
            return dialog.confirmMessage(langService.get('confirm_remove').change({name: correspondence.getNames()}), null, null, $event)
                .then(function () {
                    return $http
                        .put(self.urlServiceByDocumentClass[info.documentClass] + '/' + info.vsId + '/remove')
                        .then(function (result) {
                            toast.success(langService.get("remove_specific_success").change({name: correspondence.getNames()}));
                            return true;
                        }).catch(function (error) {
                            if (errorCode.checkIf(error, 'G2G_RECALL_FAILED') === true) {
                                return dialog.errorMessage(self.getTranslatedError(error));
                            }

                            return errorCode.showErrorDialog(error);
                        });
                });
        };

        /**
         * @description get deleted documents
         * @returns {*}
         */
        self.loadDeletedDocumentsByDocumentClass = function (documentClass) {
            var employee = employeeService.getEmployee();
            return $http.get(self.urlServiceByDocumentClass[documentClass] + '/ou/' + employee.getOUID() + '/removed')
                .then(function (result) {
                    self.deletedDocuments = self.interceptReceivedCollectionBasedOnEachDocumentClass(result.data.rs);
                    return self.deletedDocuments;
                });
        };

        /**
         * @description Remove Permanently Correspondence
         * @param correspondence
         * @param $event
         */
        self.removePermanentlyCorrespondence = function (correspondence, $event) {
            return dialog.confirmMessage(langService.get('confirm_remove_permanently').change({name: correspondence.getNames()}), null, null, $event)
                .then(function () {
                    var info = correspondence.getInfo(),
                        url = urlService.outgoings;
                    if (info.documentClass === 'incoming')
                        url = urlService.incomings;
                    else if (info.documentClass === 'internal')
                        url = urlService.internals;
                    return $http
                        .delete(url + '/' + info.vsId + '/delete-permanent')
                        .then(function () {
                            toast.success(langService.get("remove_specific_success").change({name: correspondence.getTranslatedName()}));
                            return correspondence;
                        }).catch(function (error) {
                            if (errorCode.checkIf(error, 'G2G_RECALL_FAILED') === true) {
                                return dialog.errorMessage(self.getTranslatedError(error));
                            }

                            return errorCode.showErrorDialog(error);
                        });
                });
        };

        /**
         * @description Remove Bulk Permanently Correspondences
         * @param correspondences
         * @param $event
         * @param ignoreMessage
         */
        self.removePermanentlyBulkCorrespondences = function (correspondences, $event, ignoreMessage) {
            // if the selected correspondences has just one record.
            if (correspondences.length === 1) {
                return self.removePermanentlyCorrespondence(correspondences[0], $event);
            } else {
                return dialog
                    .confirmMessage(langService.get('confirm_remove_permanently_selected_multiple'), null, null, $event || null)
                    .then(function () {
                        var info = correspondences[0].getInfo(),
                            url = urlService.outgoings;
                        if (info.documentClass === 'incoming')
                            url = urlService.incomings;
                        else if (info.documentClass === 'internal')
                            url = urlService.internals;

                        var bulkIds = _.map(correspondences, function (correspondence) {
                            return correspondence.getInfo().vsId;
                        });
                        return $http({
                            method: 'DELETE',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            url: url + '/delete-permanent/bulk',
                            data: bulkIds
                        }).then(function (result) {
                            return _bulkMessages(result, correspondences, ignoreMessage, 'failed_remove_selected', 'remove_success', 'remove_success_except_following');
                        });
                    });
            }

        };

        self.openQuickSendDialog = function (record, defaultTab, action, isDeptIncoming, isDeptSent, fromLaunchPopup, $event) {
            var normalCorrespondence = false;
            if (!isDeptSent) {
                normalCorrespondence = angular.isArray(record) ? !record[0].isWorkItem() : !record.isWorkItem();
            }
            var count = angular.isArray(record) ? record.length : 1;
            if (normalCorrespondence) {
                var sitesValidation = self.validateBeforeSend(record);
                if (sitesValidation.length && sitesValidation.length === count && count === 1) {
                    var info = record.getInfo();
                    return dialog
                        .confirmMessage(langService.get('no_sites_cannot_send'), 'add', 'cancel', $event)
                        .then(function () {
                            return managerService
                                .manageDocumentCorrespondence(info.vsId, info.documentClass, info.title, $event)
                                .then(function (result) {
                                    return result.hasSite() ? _quickSendDialog(record, defaultTab, action, isDeptIncoming, isDeptSent, fromLaunchPopup, $event) : null;
                                })
                        })
                } else {
                    return _quickSendDialog(record, defaultTab, action, isDeptIncoming, isDeptSent, fromLaunchPopup, $event);
                }
            }
            return _quickSendDialog(record, defaultTab, action, isDeptIncoming, isDeptSent, fromLaunchPopup, $event);
        };

        function _quickSendDialog(record, defaultTab, action, isDeptIncoming, isDeptSent, fromLaunchPopup, $event) {
            return dialog
                .showDialog({
                    templateUrl: cmsTemplate.getPopup('quick-send-document'),
                    controller: 'quickSendDocumentPopCtrl',
                    controllerAs: 'ctrl',
                    targetEvent: $event,
                    locals: {
                        record: record,
                        defaultTab: defaultTab,
                        action: action,
                        isDeptIncoming: isDeptIncoming,
                        isDeptSent: isDeptSent,
                        fromLaunchPopup: fromLaunchPopup || false
                    },
                    resolve: {
                        predefinedActions: function (predefinedActionService) {
                            'ngInject';
                            return predefinedActionService.loadActivePredefinedActionsForUserAsDistWF();
                        }
                    }
                })
        }

        self.authorizeCorrespondenceByAnnotation = function (correspondence, signatureModel, content) {
            var formData = new FormData(), info = correspondence.getInfo();
            formData.append('entity', angular.toJson(signatureModel));
            formData.append('content', content);
            return $http
                .post(urlService.authorizeDocumentByAnnotation.change({documentClass: info.documentClass}), formData, {
                    headers: {
                        'Content-Type': undefined
                    }
                })
                .then(function (result) {
                    return result.data.rs;
                });

        };

        self.annotateCorrespondence = function (correspondence, annotationType, attachedBook, sequentialWF, generalStepElementView) {
            var info = correspondence.getInfo();
            return downloadService
                .downloadContentWithWaterMark(correspondence, annotationType)
                .then(function (blob) {
                    var fr = new FileReader();
                    return $q(function (resolve, reject) {
                        fr.onloadend = function () {
                            resolve(PDFService.openPDFViewer(fr.result, correspondence, annotationType, attachedBook, sequentialWF, generalStepElementView));
                        };
                        fr.readAsArrayBuffer(blob);
                    });
                }).then(function (result) {
                    if (result === AnnotationType.SIGNATURE) {
                        return self.annotateCorrespondence(correspondence, AnnotationType.SIGNATURE, attachedBook, sequentialWF, generalStepElementView);
                    }
                    return result;
                });

        };

        self.openLaunchSeqWFDialog = function (record, $event) {
            return dialog
                .showDialog({
                    templateUrl: cmsTemplate.getPopup('launch-sequential-workflow'),
                    controller: 'launchSequentialWorkflowPopCtrl',
                    controllerAs: 'ctrl',
                    targetEvent: $event,
                    locals: {
                        record: record
                    },
                    resolve: {
                        sequentialWorkflows: function (sequentialWorkflowService, employeeService) {
                            'ngInject';
                            return sequentialWorkflowService
                                .loadSequentialWorkflowsByRegOuDocClassActive(employeeService.getEmployee().getRegistryOUID(), record.getInfo().docClassId);
                        }
                    }
                });
        };
        /**
         * @description get Document Classifier Information BJ
         * @param content
         * @return {*}
         */
        self.getBJClassifierInformation = function (content) {
            var formData = new FormData();
            formData.append('content', content);
            return $http.post(urlService.BJClassifier, formData, {
                headers: {
                    'Content-Type': undefined
                }
            }).then(function (result) {
                var securityLevels = lookupService.returnLookups(lookupService.securityLevel);
                var userSecurityLevels = generator.getSelectedCollectionFromResult(securityLevels, employeeService.getEmployee().organization.archiveSecurityLevels, 'lookupKey');
                var securityLevelsIds = _.map(userSecurityLevels, 'lookupKey');
                return securityLevelsIds.indexOf(result.data.rs) !== -1 ? $q.resolve(userSecurityLevels[securityLevelsIds.indexOf(result.data.rs)]) : $q.reject(result.data.rs);
            });
        };

        self.isInternalSite = function (subSiteId) {
            if (!subSiteId) {
                return false;
            }
            return _.startsWith(('' + subSiteId).toString(), self.siteTypesStartsMap.INTERNAL);
        };

        self.isExternalSite = function (subSiteId) {
            if (!subSiteId) {
                return false;
            }
            return _.startsWith(('' + subSiteId).toString(), self.siteTypesStartsMap.EXTERNAL);
        };

        self.isG2GSite = function (subSiteId) {
            if (!subSiteId) {
                return false;
            }
            return _.startsWith(('' + subSiteId).toString(), self.siteTypesStartsMap.G2G);
        };

        self.innovationSearch = function (criteria) {
            return $http.post(
                _createUrlSchema(null, null, 'search/azure-cognitive'),
                generator.interceptSendInstance('AzureSearchCriteria', criteria)
            ).then(function (result) {
                result.data.rs.first = self.interceptReceivedCollectionBasedOnEachDocumentClass(result.data.rs.first);
                // result.data.rs.second = generator.interceptReceivedInstance('', result.data.rs.second);
                return result.data.rs;
            });
        }

        self.innovationAutoComplete = function (text) {
            return $http.get(
                _createUrlSchema(null, null, 'search/azure-cognitive-auto-complete'),
                {
                    params: {criteria: text}
                }
            ).then(function (result) {
                return result.data.rs.value;
            }).catch(function (error) {
                if (errorCode.checkIf(error, 'SEARCH_OPERATION_FAILED') === true) {
                    toast.error(langService.get('max_length').change({length: 30}));
                    return $q.reject(error);
                }
            })
        }

        self.isLimitedCentralUnitAccess = function (correspondence) {
            if (!correspondence) { //|| !correspondence.hasVsId()
                return false;
            }

            var isLimitedCentralUnitAccessEnabled = rootEntity.getGlobalSettings().isLimitedCentralUnitAccessEnabled();
            var info = correspondence.getInfo();
            var securityLevel = (info.securityLevel.hasOwnProperty('lookupKey')) ? info.securityLevel.lookupKey : info.securityLevel;

            // if security level normal or not enabled from global settings
            if (info.documentClass === "internal" || securityLevel === 1 || !isLimitedCentralUnitAccessEnabled) {
                return false;
            }

            var isCentralArchive = employeeService.getEmployee().inCentralArchive();
            var currentOUId = employeeService.getEmployee().getOUID();
            var ouId = _getDocumentOuId(correspondence);

            return isCentralArchive && ouId && ouId !== currentOUId;
        }

        function _getDocumentOuId(correspondence) {
            var ouId = "";
            if (correspondence.hasOwnProperty('generalStepElm') && correspondence.generalStepElm && correspondence.isWorkItem()) { /* WorkItem */
                ouId = correspondence.generalStepElm.ou;
            } else if (correspondence.hasOwnProperty('ouId') && correspondence.ouId) { /* EventHistory */
                ouId = correspondence.ouId;
            } else {  /* Correspondence */
                ouId = correspondence.ou;
            }
            return ouId;
        }

        self.sendEmailReminder = function (info, reason) {
            return $http.put(urlService.reminderEmail + '/' + info.id, reason)
                .then(function (result) {
                    return result.data.rs;
                });
        }

        /***
         * @description get email items by (action,source,web num)
         * @param items
         * @param stateParams
         * @returns {boolean|*}
         */
        self.getEmailItemByWobNum = function (items, stateParams) {
            var action = stateParams.action, source = stateParams.source,
                wobNumber = stateParams['wob-num'], item;

            if (action && action === 'open' && source && source === 'email' && wobNumber) {
                item = _.find(items, function (workItem) {
                    return workItem.generalStepElm.workObjectNumber === wobNumber;
                });

                return !item ? (dialog.errorMessage(langService.get('work_item_not_found').change({
                    wobNumber: wobNumber
                })).then(function () {
                    return false;
                })) : item;
            }
            return false;
        }

        /***
         * @description get email items by (action,source,vsid)
         * @param items
         * @param stateParams
         * @returns {boolean|*}
         */
        self.getEmailItemByVsId = function (items, stateParams) {
            var action = stateParams.action, source = stateParams.source,
                vsid = stateParams['vsid'], item;

            if (action && action === 'open' && source && source === 'email' && vsid) {
                item = _.find(items, function (workItem) {
                    return workItem.generalStepElm.vsId === vsid;
                });

                return !item ? (dialog.errorMessage(langService.get('work_item_not_found').change({
                    wobNumber: vsid
                })).then(function () {
                    return false;
                })) : item;
            }
            return false;
        }

        /**
         * @description Load the returned central archive items from server.
         * @returns {Promise|returnedArchiveItems}
         */
        self.loadReturnedCentralArchive = function () {
            return $http.get(urlService.returnedArchive).then(function (result) {
                return self.interceptReceivedCollectionBasedOnEachDocumentClass(result.data.rs);
            }).catch(function (error) {
                return [];
            });
        };

        /**
         * @description Return work item To Central Archive.
         * @param workItem
         * @param $event
         * @param ignoreMessage
         */
        self.returnWorkItemToCentralArchive = function (workItem, $event, ignoreMessage) {
            var info = workItem.getInfo();
            return self.showReasonDialog('return_reason', $event)
                .then(function (reason) {
                    return $http
                        .put(urlService.departmentInboxes + "/return-to-central-archive", {
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
         *
         * @param correspondence
         * @param $event
         * @returns {*}
         */
        self.openManualDeliveryReportDialog = function (correspondence, $event) {
            return dialog.showDialog({
                templateUrl: cmsTemplate.getPopup('manual-delivery-report'),
                controller: 'manualDeliveryReportPopCtrl',
                controllerAs: 'ctrl',
                bindToController: true,
                locals: {
                    correspondence: correspondence
                },
                resolve: {
                    manualDeliveryReports: function () {
                        'ngInject';
                        return self.getManualDeliveryReport(correspondence);
                    }
                }
            });
        }

        self.getManualDeliveryReport = function (correspondence) {
            var info = correspondence.getInfo();
            return $http.get(urlService.messagingHistory + '/manual/vsid/' + info.vsId)
                .then(function (result) {
                    var model = generator.generateCollection(result.data.rs, ManualDeliveryReport);
                    return generator.interceptReceivedCollection('ManualDeliveryReport', model);
                });
        }

        self.addManualDeliveryReport = function (correspondence, manualDelivery) {
            var info = correspondence.getInfo();
            return $http.put(urlService.messagingHistory + '/manual/vsid/' + info.vsId,
                generator.interceptSendCollection('ManualDeliveryReport', manualDelivery))
                .then(function (result) {
                    return result.data.rs;
                }).catch(function (error) {
                    return false;
                })
        }

        $timeout(function () {
            CMSModelInterceptor.runEvent('correspondenceService', 'init', self);
        }, 100);

    });
};
