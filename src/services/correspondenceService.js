module.exports = function (app) {
    app.service('correspondenceService', function (urlService,
                                                   $http,
                                                   cmsTemplate,
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
                                                   GeneralStepElementView,
                                                   WorkItem,
                                                   toast,
                                                   General,
                                                   errorCode,
                                                   _,
                                                   Attachment) {
        'ngInject';
        var self = this;
        self.serviceName = 'correspondenceService';
        // make inherits from parent Model (Correspondence)
        util.inherits(Outgoing, Correspondence);
        util.inherits(Internal, Correspondence);
        util.inherits(Incoming, Correspondence);
        util.inherits(General, Correspondence);
        util.inherits(GeneralStepElementView, WorkItem);

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
            } else { // if notification Item
                documentClass = generator.getDocumentClassName(correspondence.docClassId);
            }
            return documentClass.toLowerCase();
        }

        /**
         * @description get correspondence title from Correspondence or WorkItem.
         * @param correspondence
         * @returns {*}
         * @private
         */
        function _getTitle(correspondence) {
            return (correspondence.hasOwnProperty('generalStepElm') && correspondence.generalStepElm)
                ? correspondence.generalStepElm.docSubject
                : correspondence.docSubject;
        }

        function _getDocumentType(correspondence) {
            var docType = "";
            if (correspondence.hasOwnProperty('generalStepElm') && correspondence.generalStepElm) { /*WorkItem */
                docType = correspondence.generalStepElm.addMethod;
            }
            else if (correspondence.hasOwnProperty('addMethod')) { /* Correspondence */
                docType = correspondence.addMethod;
            }
            return docType;

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
            }
            else if (correspondence.hasOwnProperty('documentVSID') && correspondence.documentVSID) { /* Event History */
                vsId = correspondence.documentVSID;
            }
            else {  /* Correspondence */
                vsId = correspondence.vsId;
            }
            return vsId;

            /* The ternary condition is removed and separate if else added due to the model "EventHistory" which has different structure than workItem and correspondence */
            //return correspondence.hasOwnProperty('generalStepElm') ? correspondence.generalStepElm.vsId : correspondence.vsId;
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
            return correspondence.hasOwnProperty('generalStepElm') && correspondence.generalStepElm ? correspondence.generalStepElm.workFlowName.toLowerCase() : null;
        }

        function _getWobNumber(correspondence) {
            var wobNumber = "";
            if (correspondence.hasOwnProperty('generalStepElm') && correspondence.generalStepElm) { /* WorkItem */
                wobNumber = correspondence.generalStepElm.workObjectNumber;
            }
            else if (correspondence.hasOwnProperty('wobNum') && correspondence.wobNumber) { /* EventHistory */
                wobNumber = correspondence.wobNum;
            }
            else {  /* Correspondence */
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
            }
            else if (correspondence.hasOwnProperty('docStatus') && correspondence.docStatus) {
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
            }
            else if (correspondence.hasOwnProperty('docFullSerial') && correspondence.docFullSerial) {
                docFullSerial = correspondence.docFullSerial;
            }
            /*else { // if notification Item
                documentStatus = generator.getDocumentClassName(correspondence.docClassId);
            }*/
            return docFullSerial;
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
                workFlow: _getWorkFlow(correspondence),
                wobNumber: _getWobNumber(correspondence),
                title: _getTitle(correspondence),
                isPaper: _getDocumentType(correspondence),
                docStatus: _getDocumentStatus(correspondence),
                docFullSerial: _getDocFullSerial(correspondence),
                incomingVsId: _getIncomingVsId(correspondence)
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
                    return generator.interceptReceivedCollection('LinkedObject', generator.generateCollection(result.data.rs, LinkedObject));
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
                    return generator.generateInstance(correspondence, _getModel(correspondence.docClassName), self._sharedMethods);
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
                }).concat(lookups[value.merge]);

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
         * @param lookupName
         * @returns {*}
         */
        self.getLookup = function (documentClass, lookupName, lookupKey) {
            return !(lookupKey) ? self.screenLookups[documentClass.toLowerCase()][lookupName] : _.find(self.screenLookups[documentClass.toLowerCase()][lookupName], function (item) {
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
                    comment: workItem.comment
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
                        wobNumber: workItem.getInfo().wobNumber,
                        comment: workItem.comment,
                        user: workItem.user
                    }
                }))
                .then(function (result) {
                    return result.data.rs;
                })
        };

        /**
         * @description open print barcode dialog to start print the barcode.
         * @param correspondence
         * @returns {promise|*}
         */
        self.correspondencePrintBarcode = function (correspondence, $event) {
            return dialog.showDialog({
                template: cmsTemplate.getPopup('print-barcode'),
                bindToController: true,
                controllerAs: 'ctrl',
                eventTarget: $event,
                controller: function ($element, $timeout) {
                    'ngInject';
                    this.printCorrespondenceBarcodeFromCtrl = function () {
                        var WinPrint = window.open('', '', 'left=0,top=0,width=0,height=0,toolbar=0,scrollbars=0,status=0');
                        WinPrint.document.write($element.find("#barcode-area")[0].innerHTML);
                        $timeout(function () {
                            WinPrint.print();
                            WinPrint.close();
                        });

                    }
                },
                locals: {
                    title: correspondence.getInfo().title
                },
                resolve: {
                    barcode: function () {
                        'ngInject';
                        return self.correspondenceGetBarcode(correspondence);
                    }
                }
            })
        };
        /**
         * @description open transfer dialog to select user to transfer.
         * @param workItems
         * @param $event
         */
        self.openTransferDialog = function (workItems, $event) {
            var isArray = angular.isArray(workItems);
            return dialog
                .showDialog({
                    template: cmsTemplate.getPopup('transfer-mail'),
                    controller: 'transferMailPopCtrl',
                    controllerAs: 'ctrl',
                    targetEvent: $event,
                    locals: {
                        workItems: workItems,
                        isArray: isArray
                    },
                    resolve: {
                        comments: function (userCommentService) {
                            'ngInject';
                            return userCommentService.getUserComments()
                                .then(function (result) {
                                    return _.filter(result, 'status');
                                });
                        },
                        applicationUsers: function (applicationUserService) {
                            'ngInject';
                            return applicationUserService.loadApplicationUsers();
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
                    template: cmsTemplate.getPopup('reason'),
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
        /**
         * @description send correspondence to ready to export queue.
         * @param correspondence
         */
        self.sendCorrespondenceToReadyToExport = function (correspondence) {
            var info = correspondence.getInfo();
            var parts = info.wobNumber ? ('vsid/' + info.vsId + '/wob-num/' + info.wobNumber + '/to-ready-export') : 'vsid/' + info.vsId + '/to-ready-export';
            var url = info.wobNumber ? _createUrlSchema(null, info.documentClass, parts).replace('/correspondence', '/correspondence/wf') : _createUrlSchema(null, info.documentClass, parts);
            return $http.put(url)
                .then(function (result) {
                    return result.data.rs;
                });
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
         * @param readyToExport true if the view from readyToExport department.
         * @param approvedQueue
         * @param departmentIncoming
         */
        self.viewCorrespondence = function (correspondence, actions, disableProperties, disableCorrespondence, department, readyToExport, approvedQueue, departmentIncoming) {
            var info = typeof correspondence.getInfo === 'function' ? correspondence.getInfo() : _createInstance(correspondence).getInfo();

            var workItem = info.isWorkItem() ? correspondence : false;
            var incomingWithIncomingVsId = departmentIncoming && info.incomingVsId;

            if(incomingWithIncomingVsId)
                workItem = false;
            if (workItem)
                return self.viewCorrespondenceWorkItem(info, actions, disableProperties, disableCorrespondence, department, readyToExport, approvedQueue, departmentIncoming);

            return $http.get(_createUrlSchema(incomingWithIncomingVsId ? info.incomingVsId : info.vsId, info.documentClass, 'with-content'))
                .then(function (result) {
                    result.data.rs.metaData = generator.interceptReceivedInstance(['Correspondence', _getModelName(info.documentClass), 'View' + _getModelName(info.documentClass)], generator.generateInstance(result.data.rs.metaData, _getModel(info.documentClass)));
                    return result.data.rs;
                })
                .then(function (result) {
                    result.content.viewURL = $sce.trustAsResourceUrl(result.content.viewURL);
                    return dialog.showDialog({
                        template: cmsTemplate.getPopup('view-correspondence'),
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
                            disableCorrespondence: disableCorrespondence
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
                    });
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
                    return dialog.showDialog({
                        template: cmsTemplate.getPopup('view-correspondence'),
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
                            disableEverything: departmentIncoming
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
         * @description view attachment
         * @param attachmentVsId
         * @param documentClass
         */
        self.viewAttachment = function (attachmentVsId, documentClass) {
            var vsId = attachmentVsId instanceof Attachment ? attachmentVsId.vsId : attachmentVsId;
            return $http.get(_createUrlSchema(vsId, documentClass, 'attachment/with-content'))
                .then(function (result) {
                    result.data.rs.metaData = generator.generateInstance(result.data.rs.metaData, Attachment);
                    return result.data.rs;
                })
                .then(function (attachment) {
                    attachment.content.viewURL = $sce.trustAsResourceUrl(attachment.content.viewURL);
                    return dialog.showDialog({
                        template: cmsTemplate.getPopup('view-attachments-only'),
                        controller: 'viewAttachmentsOnlyPopCtrl',
                        controllerAs: 'ctrl',
                        bindToController: true,
                        escapeToCancel: false,
                        locals: {
                            attachment: attachment.metaData,
                            content: attachment.content
                        }
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
                template: cmsTemplate.getPopup('view-correspondence'),
                controller: 'viewCorrespondencePopCtrl',
                controllerAs: 'ctrl',
                bindToController: true,
                escapeToCancel: false,
                locals: {
                    correspondence: false,
                    content: information
                }
            })
        };
        /**
         * @description receive incoming workItem.
         * @param wobNumber
         */
        self.receiveIncoming = function (wobNumber) {
            return $http
                .put((urlService.departmentWF + '/' + wobNumber + '/receive'))
                .then(function (result) {
                    result = result.data.rs;
                    result.metaData = generator.interceptReceivedInstance(['Correspondence', 'Incoming', 'ViewIncoming'], new Incoming(result.metaData));
                    return result;
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
        /**
         * @description broadcast correspondence.
         * @param correspondence
         */
        self.broadcastCorrespondence = function (correspondence, $event) {
            return dialog
                .showDialog({
                    targetEvent: $event,
                    template: cmsTemplate.getPopup('broadcast'),
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
        };


    });
};
