module.exports = function (app) {
    app.controller('searchIntelligenceCtrl', function (registryOrganizations,
                                                       lookupService,
                                                       AzureSearchCriteria,
                                                       organizationService,
                                                       counterService,
                                                       classificationService,
                                                       Information,
                                                       rootEntity,
                                                       gridService,
                                                       ResolveDefer,
                                                       Lookup,
                                                       $filter,
                                                       langService,
                                                       printService,
                                                       $q,
                                                       generator,
                                                       employeeService,
                                                       viewTrackingSheetService,
                                                       $timeout,
                                                       correspondenceService) {
        'ngInject';
        var self = this;
        self.controllerName = 'searchIntelligenceCtrl';
        self.selectedItems = [];
        self.registryOUSearchText = '';
        self.employee = employeeService.getEmployee();
        self.sidebarStatus = false;
        self.registryOrganizations = registryOrganizations;
        // all document class for Correspondences
        self.documentClasses = lookupService.returnLookups(lookupService.documentClass);
        self.securityLevels = rootEntity.getGlobalSettings().getSecurityLevels();
        // search text for filtering mainClassification DDL
        self.mainClassificationSearchText = '';
        // mainClassifications list
        self.mainClassifications = [];
        // search text for filtering subClassification DDL
        self.subClassificationSearchText = '';
        // subClassifications list
        self.subClassifications = [];
        // old main classifications
        self.previousMainClassifications = [];
        // old sub classifications
        self.previousSubClassifications = [];

        self.documentFiles = [];

        self.results = [];

        self.selectedTab = 0;

        self.criteria = new AzureSearchCriteria();

        self.facetCriteria = (new AzureSearchCriteria()).toFacetCriteria();

        self.maxDate = new Date();

        self.facetsArray = [
            'docClassId',
            'docType',
            'mainClassification',
            'subClassification',
            'ou',
            'registryOU',
            'securityLevel'
        ];
        self.docClassId = [];
        self.securityLevel = [];
        self.docType = [];
        self.mainClassification = [];
        self.subClassification = [];
        self.registryOU = [];
        self.ou = [];

        /**
         * @description make incoming has fake site
         * @param correspondence
         * @returns {*}
         * @private
         */
        function _incomingCorrespondence(correspondence) {
            correspondence.mainSiteId = true;
            return correspondence;
        }

        /**
         * @description make outgoing has fake site
         * @param correspondence
         * @returns {*}
         * @private
         */
        function _outgoingCorrespondence(correspondence) {
            correspondence.sitesInfoTo = [true];
            return correspondence;
        }

        /**
         * to avoid correspondence sites check because we are in the search means all correspondence ahas sites
         * @param result
         * @returns {Array}
         * @private
         */
        function _mapResultToAvoidCorrespondenceCheck(result) {
            return _.map(result, function (item) {
                var docClass = item.getInfo().documentClass.toLowerCase();
                switch (docClass) {
                    case 'outgoing':
                        _outgoingCorrespondence(item);
                        break;
                    case 'incoming':
                        _incomingCorrespondence(item);
                        break;
                }
                return item;
            });
        }

        /**
         * @description fir the callback if the provider  text length equal = 0
         * @param $event
         * @param text
         * @param callback
         */
        self.setPropertiesSpaceBackIfNoLength = function ($event, text, callback) {
            var key = $event.keyCode || $event.which;
            if (!text.length && key === 8) {
                callback();
            }
        };
        /**
         * capture any event except arrows UP/DOWN allow those.
         * @param $event
         * @param enterCallback
         */
        self.allowPropagationUpDownArrows = function ($event, enterCallback) {
            var key = $event.keyCode || $event.which;
            if (key === 13 && enterCallback) {
                enterCallback($event);
                $event.stopPropagation();
            }
            var allowedKeys = [38 /* UP */, 40 /* DOWN */];
            allowedKeys.indexOf(key) === -1 ? $event.stopPropagation() : null;
        };
        /**
         * @description search for correspondences
         */
        self.search = function (ignoreFacets) {
            return correspondenceService
                .innovationSearch(self.criteria)
                .then(function (result) {
                    self.results = result.first;
                    if (!ignoreFacets)
                        self.prepareFacets(result.second);
                    if (self.results.length) {
                        self.selectedTab = 1;
                    }
                    return self.results;
                });
        }


        /**
         * @description fire after change registryOU to reload sub organizations for selected reg ou.
         */
        self.onRegistrySelectedChange = function () {
            self.criteria.ou = null;
            // load children organizations by selected regOUId
            organizationService
                .loadChildrenOrganizations(self.criteria.registryOU)
                .then(function (organizations) {
                    self.organizations = organizations;
                });
        };


        /**
         * @description to load a new sub classifications depend on selected main classification
         */
        self.onMainClassificationChanged = function () {
            if (!self.criteria.mainClassification) {
                self.criteria.subClassification = null;
                self.previousSubClassifications = [];
                return;
            }
            self.loadClassificationsByCriteria('sub', '')
                .then(function (classifications) {
                    self.subClassifications = classifications;
                });
        };

        /**
         * @description load sites by criteria
         * @param type
         * @param criteria
         * @returns {*}
         */
        self.loadClassificationsByCriteria = function (type, criteria) {
            return classificationService
                .loadClassificationsPairBySearchText(criteria, null /* self.criteria.securityIdList */, (type === 'main' ? null : self.criteria.mainClassification), true)
                .then(function (pair) {
                    type !== 'main' ? pair.first.push(self.criteria.mainClassification) : null;
                    var lookups = {classifications: pair.first, ouClassifications: pair.second},
                        classifications = correspondenceService.prepareLookupHierarchy(lookups).classifications;
                    return type === 'main' ? classifications : _.flatten(_.map(classifications, 'classification.children'));
                });
        };

        self.onSecurityLevelChange = function () {
            console.log('!! SECURITY CHANGED !!');
        }


        /**
         * @description set previousMainClassifications in case if it has length
         */
        self.setOldMainClassification = function () {
            self.previousMainClassifications.length && !self.mainClassifications.length ? self.mainClassifications = self.previousMainClassifications : null;
            self.previousMainClassifications = [];
        };
        /**
         * @description set previousSubClassifications in case if it has length
         */
        self.setOldSubClassification = function () {
            self.previousSubClassifications.length && !self.subClassifications.length ? self.subClassifications = self.previousSubClassifications : null;
            self.previousSubClassifications = [];
        };
        /**
         * @description set previousDocumentFiles in case if it has length
         */
        self.setOldDocumentFiles = function () {
            self.previousDocumentFiles.length && !self.documentFiles.length ? self.documentFiles = self.previousDocumentFiles : null;
            self.previousDocumentFiles = [];
        };

        /**
         * @description Prints the result
         * @param $event
         */
        self.printResult = function ($event) {
            var printTitle = langService.get("search_module_search_results") + " " +
                langService.get("from") + " " + generator.convertDateToString(self.criteria.fromDate) + " " +
                langService.get("to") + " " + generator.convertDateToString(self.criteria.toDate);

            var headers = [
                'label_serial',
                'subject',
                'priority_level',
                'label_document_type',
                'creator',
                'created_on'
            ];
            console.log('HERER');
            printService
                .printData(self.results, headers, printTitle);

        };

        /**
         * @description Contains options for grid configuration
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         */
        self.grid = {
            name: gridService.grids.search.general,
            progress: null,
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.search.general) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.search.general, self.results),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.search.general, limit);
            },
            filter: {search: {}},
            truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.search.general),
            setTruncateSubject: function ($event) {
                gridService.setGridSubjectTruncateByGridName(gridService.grids.search.general, self.grid.truncateSubject);
            }
        };

        /**
         * @description Get the sorting key for information or lookup model
         * @param property
         * @param modelType
         * @returns {*}
         */
        self.getSortingKey = function (property, modelType) {
            return generator.getColumnSortingKey(property, modelType);
        };

        /**
         * @description Gets the grid records by sorting
         */
        self.getSortedData = function () {
            self.results = $filter('orderBy')(self.results, self.grid.order);
        };
        /**
         * @description add selected items to the favorite documents
         * @param $event
         */
        self.addToFavoriteBulk = function ($event) {
            favoriteDocumentsService.controllerMethod
                .favoriteDocumentAddBulk(self.selectedItems, $event)
                .then(function (result) {
                    self.reloadSearchCorrespondence(self.grid.page);
                });
        };

        /**
         * @description add an item to the favorite documents
         * @param correspondence
         * @param $event
         */
        self.addToFavorite = function (correspondence, $event) {
            favoriteDocumentsService.controllerMethod
                .favoriteDocumentAdd(correspondence.getInfo().vsId, $event)
                .then(function (result) {
                    if (result.status) {
                        toast.success(langService.get("add_to_favorite_specific_success").change({
                            name: correspondence.getTranslatedName()
                        }));
                    } else {
                        dialog.alertMessage(langService.get(result.message));
                    }
                });
        };

        /**
         * @description Archive the document to icn
         * @param correspondence
         * @param $event
         * @param defer
         */
        self.addToIcnArchive = function (correspondence, $event, defer) {
            correspondence.addToIcnArchiveDialog($event)
                .then(function () {
                    self.reloadSearchCorrespondence(self.grid.page);
                    new ResolveDefer(defer);
                });
        };
        /**
         * @description Create Reply
         * @param correspondence
         * @param $event
         * @param defer
         */
        self.createReply = function (correspondence, $event, defer) {
            correspondence.createReply($event, false)
                .then(function (result) {
                    new ResolveDefer(defer);
                });
        };

        /**
         * @description Create Reply Specific version
         * @param correspondence
         * @param $event
         * @param defer
         */
        self.createReplySpecificVersion = function (correspondence, $event, defer) {
            correspondence.createReply($event, true)
                .then(function (result) {
                    new ResolveDefer(defer);
                });
        };

        /**
         * @description Launch distribution workflow for internal item
         * @param correspondence
         * @param $event
         */

        self.launchDistributionWorkflow = function (correspondence, $event) {
            var promise = null;
            if (!correspondence.hasContent()) {
                dialog.alertMessage(langService.get("content_not_found"));
                return;
            }
            correspondence.recordGridName = gridService.grids.search.general;
            // run launch for any incoming document or other documents not in the inbox
            if (correspondence.hasDocumentClass('incoming') || correspondence.docStatus !== 22) {
                promise = correspondence.launchWorkFlow($event, null, 'favorites');
            } else {
                if (correspondence.hasDocumentClass('internal')) {
                    promise = correspondence.launchWorkFlowAndCheckApprovedInternal($event, null, 'favorites');
                } else {
                    promise = correspondence.launchWorkFlowAndCheckExists($event, null, 'favorites');
                }
            }

            promise.then(function () {
                self.reloadSearchCorrespondence(self.grid.page)
                    .then(function () {
                        mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                    });
            });
        };

        /**
         * @description Launch distribution workflow with sequential workflow
         * @param record
         * @param $event
         * @param defer
         */
        self.launchSequentialWorkflow = function (record, $event, defer) {
            if (!record.hasContent()) {
                dialog.alertMessage(langService.get("content_not_found"));
                return;
            }
            record.openLaunchSequentialWorkflowDialog($event)
                .then(function () {
                    self.reloadSearchCorrespondence(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                            new ResolveDefer(defer);
                        });
                })
        };

        /**
         * @description Subscribe to actions on the workItem
         * @param correspondence
         * @param $event
         */
        self.subscribe = function (correspondence, $event) {
            userSubscriptionService.controllerMethod.openAddSubscriptionDialog(correspondence, $event);
        };

        /**
         * @description Print Barcode
         * @param correspondence
         * @param $event
         */
        self.printBarcode = function (correspondence, $event) {
            correspondence.barcodePrint($event);
        };

        self.addDocumentTask = function (correspondence, $event) {
            correspondence.createDocumentTask($event)
        };

        /**
         * @description View Tracking Sheet
         * @param correspondence
         * @param params
         * @param $event
         */
        self.viewTrackingSheet = function (correspondence, params, $event) {
            viewTrackingSheetService
                .controllerMethod
                .viewTrackingSheetPopup(correspondence, params, $event).then(function (result) {
            });
        };

        /**
         * @description manage tag for searched general document
         * @param correspondence
         * @param $event
         */
        self.manageTags = function (correspondence, $event) {
            var info = correspondence.getInfo();
            managerService.manageDocumentTags(info.vsId, info.documentClass, info.title, $event)
                .then(function (tags) {
                    correspondence.tags = tags;
                })
                .catch(function (tags) {
                    correspondence.tags = tags;
                });
        };

        /**
         * @description manage comments for searched general document
         * @param correspondence
         * @param $event
         */
        self.manageComments = function (correspondence, $event) {
            correspondence.manageDocumentComments($event)
                .then(function (documentComments) {
                    correspondence.documentComments = documentComments;
                })
                .catch(function (documentComments) {
                    correspondence.documentComments = documentComments;
                });
        };

        /**
         * @description manage tasks for searched general document
         * @param correspondence
         * @param $event
         */
        self.manageTasks = function (correspondence, $event) {
            // console.log('manage tasks for searched general document : ', correspondence);
        };

        /**
         * @description manage attachments for searched general document
         * @param correspondence
         * @param $event
         */
        self.manageAttachments = function (correspondence, $event) {
            correspondence.manageDocumentAttachments($event)
                .then(function () {
                    self.reloadSearchCorrespondence(self.grid.page);
                })
                .catch(function () {
                    self.reloadSearchCorrespondence(self.grid.page);
                });
        };

        /**
         * @description manage linked documents for searched general document
         * @param correspondence
         * @param $event
         */
        self.manageLinkedDocuments = function (correspondence, $event) {
            var info = correspondence.getInfo();
            return managerService.manageDocumentLinkedDocuments(info.vsId, info.documentClass)
                .then(function () {
                    self.reloadSearchCorrespondence(self.grid.page);
                }).catch(function () {
                    self.reloadSearchCorrespondence(self.grid.page);
                });
        };

        /**
         * @description Manage Linked Entities
         * @param correspondence
         * @param $event
         */
        self.manageLinkedEntities = function (correspondence, $event) {
            correspondence
                .manageDocumentEntities($event);
        };

        /**
         * @description Destinations
         * @param correspondence
         * @param $event
         */
        self.manageDestinations = function (correspondence, $event) {
            correspondence.manageDocumentCorrespondence($event)
                .then(function () {
                    self.reloadSearchCorrespondence(self.grid.page);
                });
        };

        var checkIfEditCorrespondenceSiteAllowed = function (model, checkForViewPopup) {
            var info = model.getInfo();
            var hasPermission = employeeService.hasPermissionTo("MANAGE_DESTINATIONS");
            var allowedByDocClass = (info.documentClass === 'outgoing') ? (info.docStatus < 25) : (info.documentClass === 'incoming');
            var allowed = (hasPermission && info.documentClass !== "internal") && allowedByDocClass;
            if (checkForViewPopup)
                return !(allowed);
            return allowed;
        };

        /**
         * @description download main document for searched general document
         * @param correspondence
         * @param $event
         */
        self.downloadMainDocument = function (correspondence, $event) {
            correspondence
                .mainDocumentDownload($event);
        };

        /**
         * @description download composite document for searched general document
         * @param correspondence
         * @param $event
         */
        self.downloadCompositeDocument = function (correspondence, $event) {
            correspondence
                .compositeDocumentDownload($event);
        };

        /**
         * @description download selected document
         * @param correspondence
         * @param $event
         */
        self.downloadSelected = function (correspondence, $event) {
            downloadService.openSelectedDownloadDialog(correspondence, $event);
        };

        /**
         * @description merge and download
         * @param correspondence
         */
        self.mergeAndDownloadFullDocument = function (correspondence) {
            downloadService.mergeAndDownload(correspondence);
        };

        /**
         * @description send link to document for searched general document
         * @param correspondence
         * @param $event
         */
        self.sendLinkToDocumentByEmail = function (correspondence, $event) {
            correspondence
                .getMainDocumentEmailContent($event);
        };

        /**
         * @description send composite document as attachment for searched general document
         * @param correspondence
         * @param $event
         */
        self.sendCompositeDocumentAsAttachmentByEmail = function (correspondence, $event) {
            correspondence
                .getCompositeDocumentEmailContent($event);
        };

        /**
         * @description send main document fax for searched general document
         * @param correspondence
         * @param $event
         */
        self.sendMainDocumentFax = function (correspondence, $event) {
            correspondence.openSendFaxDialog($event);
        };

        /**
         * @description send sms for searched general document
         * @param correspondence
         * @param $event
         * @param defer
         */
        self.sendSMS = function (correspondence, $event, defer) {
            correspondence.openSendSMSDialog($event)
                .then(function (result) {
                    new ResolveDefer(defer);
                });
        };

        /**
         * @description Send Document Link
         * @param correspondence
         * @param $event
         */
        self.sendDocumentLink = function (correspondence, $event) {
            correspondence.openSendDocumentURLDialog($event);
        };

        /**
         * @description get link for searched general document
         * @param correspondence
         * @param $event
         */
        self.getLink = function (correspondence, $event) {
            viewDocumentService.loadDocumentViewUrlWithOutEdit(correspondence.vsId).then(function (result) {
                //var docLink = "<a target='_blank' href='" + result + "'>" + result + "</a>";
                dialog.successMessage(langService.get('link_message').change({result: result}), null, null, null, null, true);
                return true;
            });
        };

        /**
         * @description create copy for searched general document
         * @param correspondence
         * @param $event
         */
        self.createCopy = function (correspondence, $event) {
            //  console.log('create copy for searched general document : ', correspondence);
        };

        /**
         * @description End followup of correspondence site
         * @param correspondence
         * @param $event
         * @param defer
         */
        self.endFollowup = function (correspondence, $event, defer) {
            correspondence.endFollowup($event)
                .then(function (result) {
                    if (result !== 'FAILED_TERMINATE_FOLLOWUP') {
                        self.reloadSearchCorrespondence(self.grid.page)
                            .then(function () {
                                new ResolveDefer(defer);
                            });
                    }
                });
        };

        /**
         * @description Change the followup status of correspondence sites
         * @param correspondence
         * @param $event
         * @param defer
         */
        self.changeFollowupStatus = function (correspondence, $event, defer) {
            correspondence.changeFollowupStatus($event)
                .then(function (result) {
                    self.reloadSearchCorrespondence(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                });
        };

        /**
         * @description Preview document
         * @param correspondence
         * @param $event
         */
        self.previewDocument = function (correspondence, $event) {
            if (!correspondence.hasContent()) {
                dialog.alertMessage(langService.get('content_not_found'));
                return;
            }
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            correspondence.getLinesHighlights(self.criteria.keyWords);
            correspondenceService.viewCorrespondence(correspondence, self.gridActions, checkIfEditPropertiesAllowed(correspondence, true), checkIfEditCorrespondenceSiteAllowed(correspondence, true))
                .then(function () {
                    return self.reloadSearchCorrespondence(self.grid.page);
                })
                .catch(function () {
                    return self.reloadSearchCorrespondence(self.grid.page);
                });
        };

        /**
         * @description View document
         * @param correspondence
         * @param $event
         */
        self.viewDocument = function (correspondence, $event) {
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }

            correspondence.getLinesHighlights(self.criteria.keyWords);
            console.log('highlights', correspondence.highlights);
            correspondence.viewFromQueue(self.gridActions, 'searchGeneral', $event)
                .then(function () {
                    return self.reloadSearchCorrespondence(self.grid.page);
                })
                .catch(function (error) {
                    return self.reloadSearchCorrespondence(self.grid.page);
                });
        };

        /**
         * @description get document versions
         * @param correspondence
         * @param $event
         * @return {*}
         */
        self.getDocumentVersions = function (correspondence, $event) {
            return correspondence
                .viewSpecificVersion(self.gridActions, $event);
        };
        /**
         * @description duplicate current version
         * @param correspondence
         * @param $event
         */
        self.duplicateCurrentVersion = function (correspondence, $event) {
            var info = correspondence.getInfo();
            return correspondence
                .duplicateVersion($event)
                .then(function () {
                    $state.go('app.' + info.documentClass.toLowerCase() + '.add', {
                        vsId: info.vsId,
                        action: 'duplicateVersion',
                        wobNum: info.wobNumber
                    });
                });
        };
        /**
         * @description duplicate specific version
         * @param correspondence
         * @param $event
         * @return {*}
         */
        self.duplicateVersion = function (correspondence, $event) {
            var info = correspondence.getInfo();
            return correspondence
                .duplicateSpecificVersion($event)
                .then(function () {
                    $state.go('app.' + info.documentClass.toLowerCase() + '.add', {
                        vsId: info.vsId,
                        action: 'duplicateVersion',
                        wobNum: info.wobNumber
                    });
                });
        };

        self.viewInDeskTop = function (workItem) {
            return correspondenceService.viewWordInDesktop(workItem);
        };

        /**
         * @description do broadcast for correspondence.
         */
        self.broadcast = function (correspondence, $event, defer) {
            correspondence
                .correspondenceBroadcast()
                .then(function () {
                    self.reloadSearchCorrespondence(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                            new ResolveDefer(defer);
                        })
                })
        };

        /**
         * @description Remove single correspondence
         * @param correspondence
         * @param $event
         * @param defer
         */
        self.removeCorrespondence = function (correspondence, $event, defer) {
            correspondenceService
                .deleteCorrespondence(correspondence, $event)
                .then(function () {
                    self.reloadSearchCorrespondence(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                            new ResolveDefer(defer);
                        });
                });
        };

        /**
         * @description annotate document
         * @param correspondence
         * @param $event
         * @param defer
         */
        self.annotateDocument = function (correspondence, $event, defer) {
            correspondence.openForAnnotation()
                .then(function () {
                    self.reloadSearchCorrespondence(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                            new ResolveDefer(defer);
                        });
                })
                .catch(function () {
                    self.reloadSearchCorrespondence(self.grid.page);
                });
        };

        var checkIfEditPropertiesAllowed = function (model, checkForViewPopup) {
            var info = model.getInfo();
            var hasPermission = false;
            if (info.documentClass === "internal") {
                //If approved internal electronic, don't allow to edit
                if (info.docStatus >= 24 && !info.isPaper)
                    hasPermission = false;
                else
                    hasPermission = employeeService.hasPermissionTo("EDIT_INTERNAL_PROPERTIES");
            } else if (info.documentClass === "incoming")
                hasPermission = employeeService.hasPermissionTo("EDIT_INCOMING’S_PROPERTIES");
            else if (info.documentClass === "outgoing") {
                // allowed to edit security level (if not exported and docRegOuId === currentLoggedInUserRegOuId). If condition satisfied, check permission
                if (info.docStatus !== 25 && employeeService.getEmployee()
                    && (generator.getNormalizedValue(model.registryOU, 'id') === employeeService.getEmployee().getRegistryOUID())) {
                    hasPermission = employeeService.hasPermissionTo("EDIT_OUTGOING_PROPERTIES");
                }
                //If approved outgoing electronic, don't allow to edit
                else if (info.docStatus >= 24 && !info.isPaper)
                    hasPermission = false;
                else
                    hasPermission = employeeService.hasPermissionTo("EDIT_OUTGOING_PROPERTIES");
            }
            if (checkForViewPopup)
                return !hasPermission || model.isBroadcasted();
            return hasPermission && !model.isBroadcasted();
        };

        /**
         * @description Edit Content
         * @param model
         * @param $event
         */
        self.editContent = function (model, $event) {
            model.manageDocumentContent($event)
                .then(function () {
                    mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                });
        };

        /**
         * @description Edit Properties
         * @param model
         * @param $event
         */
        self.editProperties = function (model, $event) {
            var info = model.getInfo();
            managerService
                .manageDocumentProperties(info.vsId, info.documentClass, info.title, $event)
                .finally(function (e) {
                    self.reloadSearchCorrespondence(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                        });

                });
        };

        /**
         * @description add Correspondence To My FollowUp
         * @param item
         */
        self.addToDirectFollowUp = function (item) {
            item.addToMyDirectFollowUp();
        };

        /**
         * @description add workItem To other user's FollowUp
         * @param item
         */
        self.addToEmployeeFollowUp = function (item) {
            item.addToUserFollowUp();
        };

        /**
         * @description Shows the steps of sequential workflow
         * @param record
         * @param $event
         */
        self.showSeqWFSteps = function (record, $event) {
            record.showSeqWFStatusSteps($event)
        };

        self.gridActions = [
            // Document Information
            {
                type: 'action',
                icon: 'information-variant',
                text: 'grid_action_document_info',
                shortcut: false,
                showInView: false,
                subMenu: [
                    {
                        type: 'info',
                        checkShow: function (action, model) {
                            return true;
                        },
                        gridName: 'search-general'
                    }
                ],
                class: "action-green",
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model);
                }
            },
            // view
            {
                type: 'action',
                icon: 'book-open-variant',
                text: 'grid_action_view',
                shortcut: false,
                callback: self.previewDocument,
                class: "action-green",
                showInView: false,
                permissionKey: [
                    'VIEW_DOCUMENT',
                    'VIEW_DOCUMENT_VERSION'
                ],
                checkAnyPermission: true,
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model);
                },
                subMenu: [
                    // Preview
                    {
                        type: 'action',
                        icon: 'book-open-variant',
                        text: 'grid_action_preview_document',
                        shortcut: false,
                        showInView: false,
                        callback: self.previewDocument,
                        class: "action-green",
                        permissionKey: 'VIEW_DOCUMENT',
                        checkShow: function (action, model) {
                            //If no content, hide the button
                            return model.hasContent();
                        }
                    },
                    // Open
                    {
                        type: 'action',
                        icon: 'book-open-page-variant',
                        text: 'grid_action_open',
                        shortcut: false,
                        showInView: false,
                        callback: self.viewDocument,
                        class: "action-green",
                        permissionKey: 'VIEW_DOCUMENT',
                        checkShow: function (action, model) {
                            //If no content, hide the button
                            return model.hasContent();
                        }
                    },
                    // show versions
                    {
                        type: 'action',
                        icon: 'animation',
                        text: 'grid_action_view_specific_version',
                        shortcut: false,
                        callback: self.getDocumentVersions,
                        permissionKey: "VIEW_DOCUMENT_VERSION",
                        class: "action-green",
                        showInView: true,
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // viewInDeskTop
                    {
                        type: 'action',
                        icon: 'monitor',
                        text: 'grid_action_view_in_desktop',
                        shortcut: false,
                        hide: true,
                        callback: self.viewInDeskTop,
                        class: "action-green",
                        permissionKey: 'VIEW_DOCUMENT',
                        showInView: false,
                        checkShow: function (action, model) {
                            var info = model.getInfo(), isAllowed = true;
                            if (model.hasActiveSeqWF()) {
                                return false;
                            }
                            if (model.isCorrespondenceApprovedBefore()) {
                                isAllowed = rootEntity.getGlobalSettings().isAllowEditAfterFirstApprove();
                            }
                            if (!isAllowed) {
                                return false;
                            }
                            return info.needToApprove();
                        }
                    }
                ]
            },
            // Separator
            {
                type: 'separator',
                checkShow: function (action, model) {
                    return true;
                },
                showInView: false
            },
            // Add To
            {
                type: 'action',
                icon: 'plus',
                text: 'grid_action_add_to',
                class: "action-green",
                permissionKey: [
                    'MANAGE_FAVORITE',
                    'ICN_ENTRY_TEMPLATE',
                    'USER_FOLLOWUP_BOOKS',
                    'ADMIN_USER_FOLLOWUP_BOOKS'
                ],
                checkAnyPermission: true,
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model);
                },
                subMenu: [
                    // Add To Favorite
                    {
                        type: 'action',
                        icon: 'star',
                        text: 'grid_action_to_favorite',
                        permissionKey: "MANAGE_FAVORITE",
                        shortcut: false,
                        callback: self.addToFavorite,
                        class: "action-green",
                        checkShow: function (action, model) {
                            var info = model.getInfo();
                            return info.docStatus >= 22;
                        }
                    },
                    // Add To ICN Archive
                    {
                        type: 'action',
                        icon: 'archive',
                        text: 'grid_action_icn_archive',
                        callback: self.addToIcnArchive,
                        class: "action-green",
                        permissionKey: 'ICN_ENTRY_TEMPLATE',
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // add to my follow up
                    {
                        type: 'action',
                        icon: 'book-search-outline',
                        text: 'grid_action_to_my_followup',
                        shortcut: true,
                        callback: self.addToDirectFollowUp,
                        permissionKey: 'USER_FOLLOWUP_BOOKS',
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // add to employee follow up
                    {
                        type: 'action',
                        icon: 'book-search-outline',
                        text: 'grid_action_to_employee_followup',
                        shortcut: true,
                        callback: self.addToEmployeeFollowUp,
                        permissionKey: 'ADMIN_USER_FOLLOWUP_BOOKS',
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    }
                ]
            },
            // Export /*NOT NEEDED AS DISCUSSED WITH HUSSAM*/
            /* {
             type: 'action',
             icon: 'export',
             text: 'grid_action_export',
             shortcut: true,
             callback: self.exportSearchGeneralDocument,
             class: "action-green",
             checkShow: function (action, model) {
             //If document is paper outgoing and unapproved/partially approved, show the button.
             var info = model.getInfo();
             return model.docStatus < 24 && info.isPaper && info.documentClass === "outgoing";
             }
             },*/
            // Create Reply
            {
                type: 'action',
                icon: 'pen',
                text: 'grid_action_create_reply',
                shortcut: false,
                callback: self.createReply,
                class: "action-green",
                checkShow: function (action, model) {
                    return model.checkCreateReplyPermission() && !model.needApprove();
                }
            },
            // Create Reply For Specific Version
            {
                type: 'action',
                icon: 'pen',
                text: 'grid_action_create_reply_specific_version',
                callback: self.createReplySpecificVersion,
                class: "action-green",
                checkShow: function (action, model) {
                    return model.checkCreateReplyPermission(true) && !model.needApprove();
                }
            },
            // Launch Distribution Workflow
            {
                type: 'action',
                icon: 'sitemap',
                text: 'grid_action_launch_distribution_workflow',
                shortcut: true,
                callback: self.launchDistributionWorkflow,
                class: "action-green",
                permissionKey: 'LAUNCH_DISTRIBUTION_WORKFLOW',
                checkShow: function (action, model) {
                    return true;
                }
            },
            // Launch Sequential Workflow
            {
                type: 'action',
                icon: gridService.gridIcons.actions.sequentialWF,
                text: 'grid_action_launch_sequential_workflow',
                callback: self.launchSequentialWorkflow,
                class: "action-green",
                permissionKey: 'LAUNCH_SEQ_WF',
                hide: true,
                checkShow: function (action, model) {
                    return rootEntity.hasPSPDFViewer() && !model.hasActiveSeqWF() && !model.isCorrespondenceApprovedBefore() && !model.isBroadcasted() && !model.isTerminatedSEQ();
                }
            },
            // View Seq WF Steps
            {
                type: 'action',
                icon: 'stairs',
                text: 'grid_action_view_seq_wf_steps',
                shortcut: false,
                callback: self.showSeqWFSteps,
                class: "action-red",
                checkShow: function (action, model) {
                    return model.hasActiveSeqWF();
                }
            },
            // Subscribe
            {
                type: 'action',
                icon: 'bell-plus',
                text: 'grid_action_subscribe',
                callback: self.subscribe,
                class: "action-green",
                hide: false,
                checkShow: function (action, model) {
                    return !model.isBroadcasted();
                }
            },
            // Broadcast
            {
                type: 'action',
                icon: 'bullhorn',
                text: 'grid_action_broadcast',
                shortcut: false,
                hide: false,
                permissionKey: 'BROADCAST_DOCUMENT',
                callback: self.broadcast,
                checkShow: function (action, model) {
                    return (!model.needApprove() || model.hasDocumentClass('incoming')) && (model.getSecurityLevelLookup().lookupKey !== 4)
                        && !model.hasActiveSeqWF();
                }
            },
            // Remove
            {
                type: 'action',
                icon: 'delete',
                text: 'grid_action_remove',
                shortcut: true,
                callback: self.removeCorrespondence,
                class: "action-green",
                checkShow: function (action, model) {
                    return model.registryOU === self.employee.getRegistryOUID() &&
                        ((model.hasDocumentClass('outgoing') && employeeService.hasPermissionTo('DELETE_OUTGOING')) ||
                            (model.hasDocumentClass('incoming') && employeeService.hasPermissionTo('DELETE_INCOMING')) ||
                            (model.hasDocumentClass('internal') && employeeService.hasPermissionTo('DELETE_INTERNAL')))
                }
            },
            // Annotate Document
            {
                type: 'action',
                icon: 'draw',
                text: 'grid_action_annotate_document',
                shortcut: true,
                callback: self.annotateDocument,
                class: "action-green",
                hide: true,
                checkShow: function (action, model) {
                    return model.userCanAnnotate() && rootEntity.hasPSPDFViewer() && employeeService.hasPermissionTo(configurationService.ANNOTATE_DOCUMENT_PERMISSION) && !model.isTerminatedSEQ();
                }
            },
            // Print Barcode
            {
                type: 'action',
                icon: 'barcode-scan',
                text: 'grid_action_print_barcode',
                shortcut: true,
                callback: self.printBarcode,
                class: "action-green",
                permissionKey: 'PRINT_BARCODE',
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    return (info.documentClass === "incoming" || ((info.documentClass === "outgoing" || info.documentClass === 'internal') && (!model.needApprove() || info.isPaper)));
                }
            },
            // View Tracking Sheet
            {
                type: 'action',
                icon: 'eye',
                text: 'grid_action_view_tracking_sheet',
                shortcut: false,
                permissionKey: "VIEW_DOCUMENT'S_TRACKING_SHEET",
                checkShow: function (action, model) {
                    return true;
                },
                subMenu: viewTrackingSheetService.getViewTrackingSheetOptions('grid', gridService.grids.search.general)
            },
            // add task
            {
                type: 'action',
                icon: 'calendar-check-outline',
                text: 'create_task',
                callback: self.addDocumentTask,
                class: "action-green",
                shortcut: true,
                checkShow: gridService.checkToShowAction
            },
            // Manage
            {
                type: 'action',
                icon: 'settings',
                text: 'grid_action_manage',
                shortcut: false,
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model);
                },
                permissionKey: [
                    "MANAGE_DOCUMENT’S_TAGS",
                    "MANAGE_DOCUMENT’S_COMMENTS",
                    "MANAGE_TASKS",
                    "MANAGE_ATTACHMENTS",
                    "MANAGE_LINKED_DOCUMENTS",
                    "MANAGE_LINKED_ENTITIES",
                    "MANAGE_DESTINATIONS"
                ],
                checkAnyPermission: true,
                showInView: false,
                subMenu: [
                    // Tags
                    {
                        type: 'action',
                        icon: 'tag',
                        text: 'grid_action_tags',
                        shortcut: false,
                        permissionKey: "MANAGE_DOCUMENT’S_TAGS",
                        callback: self.manageTags,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Comments
                    {
                        type: 'action',
                        icon: 'comment',
                        text: 'grid_action_comments',
                        shortcut: false,
                        permissionKey: "MANAGE_DOCUMENT’S_COMMENTS",
                        callback: self.manageComments,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Tasks
                    {
                        type: 'action',
                        icon: 'note-multiple',
                        text: 'grid_action_tasks',
                        shortcut: false,
                        permissionKey: "MANAGE_TASKS",
                        callback: self.manageTasks,
                        class: "action-red",
                        hide: true,
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Attachments
                    {
                        type: 'action',
                        icon: 'attachment',
                        text: 'grid_action_attachments',
                        shortcut: false,
                        permissionKey: "MANAGE_ATTACHMENTS",
                        callback: self.manageAttachments,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Linked Documents
                    {
                        type: 'action',
                        icon: 'file-document',
                        text: 'grid_action_linked_documents',
                        shortcut: false,
                        permissionKey: "MANAGE_LINKED_DOCUMENTS",
                        callback: self.manageLinkedDocuments,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Linked Entities
                    {
                        type: 'action',
                        icon: 'link-variant',
                        text: 'grid_action_linked_entities',
                        shortcut: false,
                        callback: self.manageLinkedEntities,
                        permissionKey: "MANAGE_LINKED_ENTITIES",
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Destinations
                    {
                        type: 'action',
                        icon: 'stop',
                        text: 'grid_action_destinations',
                        shortcut: false,
                        callback: self.manageDestinations,
                        permissionKey: "MANAGE_DESTINATIONS",
                        class: "action-green",
                        checkShow: function (action, model) {
                            return checkIfEditCorrespondenceSiteAllowed(model, false);
                        }
                    }
                ]
            },
            // Download
            {
                type: 'action',
                icon: 'download',
                text: 'grid_action_download',
                shortcut: false,
                showInView: true,
                showInViewOnly: true,
                checkShow: function (action, model) {
                    var isAllowed = true;
                    if (model.isCorrespondenceApprovedBefore() && model.getInfo().authorizeByAnnotation) {
                        isAllowed = rootEntity.getGlobalSettings().isAllowEditAfterFirstApprove();
                    }

                    return isAllowed && gridService.checkToShowMainMenuBySubMenu(action, model);
                },
                permissionKey: [
                    "DOWNLOAD_MAIN_DOCUMENT",
                    "DOWNLOAD_COMPOSITE_BOOK"
                ],
                checkAnyPermission: true,
                subMenu: [
                    // Main Document
                    {
                        type: 'action',
                        icon: 'file-document',
                        text: 'grid_action_main_document',
                        shortcut: false,
                        permissionKey: "DOWNLOAD_MAIN_DOCUMENT",
                        callback: self.downloadMainDocument,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Composite Document
                    {
                        type: 'action',
                        icon: 'file-document',
                        text: 'grid_action_composite_document',
                        permissionKey: 'DOWNLOAD_COMPOSITE_BOOK',
                        shortcut: false,
                        callback: self.downloadCompositeDocument,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // download selected
                    {
                        type: 'action',
                        icon: 'message',
                        text: 'selective_document',
                        permissionKey: 'DOWNLOAD_COMPOSITE_BOOK',
                        callback: self.downloadSelected,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // merge and download
                    {
                        type: 'action',
                        icon: 'message',
                        text: 'merge_and_download',
                        permissionKey: 'DOWNLOAD_COMPOSITE_BOOK',
                        callback: self.mergeAndDownloadFullDocument,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    }
                ]
            },
            // Send
            {
                type: 'action',
                icon: 'send',
                text: 'grid_action_send',
                shortcut: false,
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model);
                },
                permissionKey: [
                    "SEND_LINK_TO_THE_DOCUMENT_BY_EMAIL",
                    "SEND_COMPOSITE_DOCUMENT_BY_EMAIL",
                    "SEND_DOCUMENT_BY_FAX",
                    "SEND_SMS",
                    "SHARE_BOOK_LINK"
                ],
                checkAnyPermission: true,
                subMenu: [
                    // Link To Document By Email
                    {
                        type: 'action',
                        icon: 'link-variant',
                        text: 'grid_action_link_to_document_by_email',
                        shortcut: false,
                        permissionKey: 'SEND_COMPOSITE_DOCUMENT_BY_EMAIL',
                        callback: self.sendLinkToDocumentByEmail,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Composite Document As Attachment By Email
                    {
                        type: 'action',
                        icon: 'attachment',
                        text: 'grid_action_composite_document_as_attachment_by_email',
                        shortcut: false,
                        permissionKey: 'SEND_COMPOSITE_DOCUMENT_BY_EMAIL',
                        callback: self.sendCompositeDocumentAsAttachmentByEmail,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // Main Document Fax
                    {
                        type: 'action',
                        icon: 'fax',
                        text: 'grid_action_send_document_by_fax',
                        shortcut: false,
                        permissionKey: "SEND_DOCUMENT_BY_FAX",
                        callback: self.sendMainDocumentFax,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return model.canSendByFax();
                        }
                    },
                    // SMS
                    {
                        type: 'action',
                        icon: 'message',
                        text: 'grid_action_send_sms',
                        shortcut: false,
                        permissionKey: "SEND_SMS",
                        callback: self.sendSMS,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    },
                    // send document link
                    {
                        type: 'action',
                        icon: 'message',
                        text: 'send_document_link',
                        permissionKey: "SHARE_BOOK_LINK",
                        callback: self.sendDocumentLink,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        }
                    }
                ]
            },
            // Get Link
            {
                type: 'action',
                icon: 'link',
                text: 'grid_action_get_link',
                shortcut: false,
                permissionKey: 'GET_A_LINK_TO_THE_DOCUMENT',
                callback: self.getLink,
                class: "action-green",
                hide: true,
                checkShow: function (action, model) {
                    return true;
                }
            },
            // Create Copy
            {
                type: 'action',
                icon: 'content-copy',
                text: 'grid_action_create_copy',
                shortcut: true,
                callback: self.createCopy,
                class: "action-red",
                hide: true,
                checkShow: function (action, model) {
                    return true;
                }
            },
            // End Follow up
            {
                type: 'action',
                icon: gridService.gridIcons.actions.endFollowup,
                text: 'grid_action_end_follow_up',
                callback: self.endFollowup,
                class: "action-green",
                permissionKey: "MANAGE_DESTINATIONS",
                hide: true,
                checkShow: function (action, model) {
                    // only for outgoing/incoming
                    var info = model.getInfo();
                    if (info.documentClass === 'outgoing' || info.documentClass === 'incoming') {
                        // no follow up status = 0 (need reply)
                        return !model.getSiteFollowupStatus() && !model.getSiteFollowupEndDate()// && model.getSiteMaxFollowupDate();
                    }
                    return false;
                }
            },
            // Change Follow up Status
            {
                type: 'action',
                icon: gridService.gridIcons.actions.changeFollowup,
                text: 'grid_action_change_follow_up_status',
                callback: self.changeFollowupStatus,
                class: "action-green",
                permissionKey: "MANAGE_DESTINATIONS",
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    return info.documentClass === 'outgoing' || info.documentClass === 'incoming'
                }
            },
            // Edit
            {
                type: 'action',
                icon: 'pencil',
                text: 'grid_action_edit',
                showInView: false,
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model);
                },
                subMenu: [
                    // Content
                    {
                        type: 'action',
                        icon: 'pencil-box',
                        //text: 'grid_action_content',
                        text: function () {
                            return {
                                contextText: 'grid_action_content',
                                shortcutText: 'grid_action_edit_content'
                            };
                        },
                        callback: self.editContent,
                        class: "action-green",
                        hide: true,
                        checkShow: function (action, model) {
                            var info = model.getInfo(), isAllowed = true;
                            if (model.hasActiveSeqWF()) {
                                return false;
                            }
                            if (model.isCorrespondenceApprovedBefore()) {
                                isAllowed = rootEntity.getGlobalSettings().isAllowEditAfterFirstApprove();
                            }
                            if (!isAllowed || info.docStatus >= 24) {
                                return false;
                            }
                            var hasPermission = false;
                            if (info.documentClass === "internal")
                                hasPermission = employeeService.hasPermissionTo("EDIT_INTERNAL_CONTENT");
                            else if (info.documentClass === "incoming")
                                hasPermission = employeeService.hasPermissionTo("EDIT_INCOMING’S_CONTENT");
                            else if (info.documentClass === "outgoing") {
                                hasPermission = (info.isPaper ? employeeService.hasPermissionTo("EDIT_OUTGOING_PAPER") : employeeService.hasPermissionTo("EDIT_OUTGOING_CONTENT"));
                            }
                            return hasPermission;
                        }
                    },
                    // Properties
                    {
                        type: 'action',
                        icon: 'pencil',
                        //text: 'grid_action_properties',
                        text: function () {
                            return {
                                contextText: 'grid_action_properties',
                                shortcutText: 'grid_action_edit_properties'
                            };
                        },
                        callback: self.editProperties,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return checkIfEditPropertiesAllowed(model);
                        }
                    }
                ]
            },
            // Duplicate
            {
                type: 'action',
                icon: 'settings',
                text: 'grid_action_duplicate',
                shortcut: false,
                showInView: false,
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model);
                },
                permissionKey: [
                    "DUPLICATE_BOOK_CURRENT",
                    "DUPLICATE_BOOK_FROM_VERSION"
                ],
                checkAnyPermission: true,
                subMenu: [
                    // duplicate current version
                    {
                        type: 'action',
                        icon: 'content-copy',
                        text: 'grid_action_duplication_current_version',
                        shortcut: false,
                        callback: self.duplicateCurrentVersion,
                        class: "action-green",
                        permissionKey: 'DUPLICATE_BOOK_CURRENT',
                        showInView: true,
                        checkShow: function (action, model) {
                            var info = model.getInfo();
                            return (info.documentClass === 'outgoing' || info.documentClass === 'internal') && !info.isPaper;
                        }
                    },
                    // duplicate specific version
                    {
                        type: 'action',
                        icon: 'content-duplicate',
                        text: 'grid_action_duplication_specific_version',
                        shortcut: false,
                        callback: self.duplicateVersion,
                        class: "action-green",
                        showInView: true,
                        permissionKey: 'DUPLICATE_BOOK_FROM_VERSION',
                        checkShow: function (action, model) {
                            return true;
                        }
                    }
                ]
            }
        ];

        self.shortcutActions = gridService.getShortcutActions(self.gridActions);
        self.contextMenuActions = gridService.getContextMenuActions(self.gridActions);

        /**
         * @description Get the allowed max and min values for the serial number and values to be displayed in error
         * @param field
         * @param minOrMax
         * @returns {*}
         */
        self.getMinMaxSerialNumberValues = function (field, minOrMax) {
            if (field === 'from') {
                if (minOrMax === 'min') {
                    return {
                        value: 1,
                        errorValue: 0
                    };
                } else if (minOrMax === 'max') {
                    if (self.searchCriteria.serialNoTo) {
                        return {
                            value: Number(self.searchCriteria.serialNoTo) - 1,
                            errorValue: Number(self.searchCriteria.serialNoTo)
                        };
                    }
                }
            } else if (field === 'to') {
                if (minOrMax === 'min') {
                    if (self.searchCriteria.serialNoFrom) {
                        return {
                            value: Number(self.searchCriteria.serialNoFrom) + 1,
                            errorValue: self.searchCriteria.serialNoFrom
                        };
                    }
                    return {
                        value: 2,
                        errorValue: 1
                    }
                } else {

                }
            }
        };
        /**
         * @description to return value of fieldName in property configurations.
         * @param fieldName
         * @param property
         * @returns {*}
         */
        self.checkFieldPropertyValue = function (fieldName, property) {
            fieldName = fieldName.toLowerCase();
            return self.configurations[fieldName] && self.configurations[fieldName][property];
        };
        /**
         * @description to check status value for given field in property configurations.
         * @param fieldName
         * @returns {*}
         */
        self.checkFieldStatus = function (fieldName) {
            return self.checkFieldPropertyValue(fieldName, 'status');
        };

        self.reloadSearchCorrespondence = function (pageNumber) {
            var defer = $q.defer();
            self.grid.progress = defer.promise;
            return self.searchWithFacets()
                .then(function (result) {
                    counterService.loadCounters();
                    self.results = _mapResultToAvoidCorrespondenceCheck(result);
                    self.selectedItems = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return result;
                });
        }

        function addFacet(type, value) {
            self.facetCriteria[type].splice(0, 0, value);
        }

        function removeFacet(type, value) {
            self.facetCriteria[type].splice(self.facetCriteria[type].indexOf(value), 1);
        }

        self.facetChanged = function (type, item) {
            item.isSelected ? addFacet(type, item.value) : removeFacet(type, item.value);
            self.searchWithFacets();
        }

        self.displayFacetsSidebar = function () {
            self.sidebarStatus = !self.sidebarStatus;
        }

        /**
         * @description check if print button for current tab should display or not.
         * @returns {boolean}
         */
        self.isShowButton = function () {
            return self.results.length > 0;
        };

        self.searchWithFacets = function () {
            return correspondenceService
                .innovationSearch({...self.criteria, ...self.facetCriteria})
                .then(function (result) {
                    self.results = result.first;
                    if (self.results.length) {
                        self.selectedTab = 1;
                    }
                    return self.results;
                });
        }

        self.prepareFacets = function (facets) {
            self.facetsArray.forEach(function (facetName) {
                facets[facetName].forEach(function (facet) {
                    facet.isSelected = false;
                    facet.valueInfo = new Information(facet.valueInfo);
                });
                self[facetName] = facets[facetName];
            });
        }

        self.clearFacets = function () {
            self.facetsArray.forEach(function (facetName) {
                self[facetName].forEach(function (facet) {
                    facet.isSelected = false;
                    removeFacet(facetName, facet.value);
                });
            });
            self.searchWithFacets();
        }

        self.queryTextSearch = function () {
            return correspondenceService.innovationAutoComplete(self.criteria.keyWords);
        }

    });
};
