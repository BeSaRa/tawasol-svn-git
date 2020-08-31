module.exports = function (app) {
    app.controller('quickSearchCorrespondenceCtrl', function (lookupService,
                                                              quickSearchCorrespondenceService,
                                                              quickSearchCorrespondence,
                                                              ResolveDefer,
                                                              $q,
                                                              _,
                                                              $state,
                                                              $filter,
                                                              dialog,
                                                              langService,
                                                              viewDocumentService,
                                                              toast,
                                                              managerService,
                                                              $stateParams,
                                                              viewTrackingSheetService,
                                                              downloadService,
                                                              employeeService,
                                                              correspondenceService,
                                                              favoriteDocumentsService,
                                                              mailNotificationService,
                                                              generator,
                                                              gridService,
                                                              userSubscriptionService,
                                                              printService,
                                                              rootEntity,
                                                              configurationService) {
        'ngInject';
        var self = this;

        self.controllerName = 'quickSearchCorrespondenceCtrl';

        /**
         * @description All Correspondence
         * @type {*}
         */
        self.quickSearchCorrespondence = _mapResultToAvoidCorrespondenceCheck(quickSearchCorrespondence);
        self.quickSearchCorrespondenceCopy = angular.copy(self.quickSearchCorrespondence);

        /**
         * @description Contains the selected Correspondence
         * @type {Array}
         */
        self.selectedQuickSearchCorrespondence = [];

        /**
         * @description Contains options for grid configuration
         * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
         */
        self.grid = {
            progress: null,
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.search.quick) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.search.quick, self.quickSearchCorrespondence),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.search.quick, limit);
            },
            truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.search.quick),
            setTruncateSubject: function ($event) {
                gridService.setGridSubjectTruncateByGridName(gridService.grids.search.quick, self.grid.truncateSubject);
            },
            searchColumns: {
                serial: 'docFullSerial',
                subject: 'docSubject',
                priorityLevel: function (record) {
                    return self.getSortingKey('priorityLevel', 'Lookup');
                },
                documentType: function (record) {
                    return self.getSortingKey('docType', 'DocumentType');
                },
                createdBy: function () {
                    if (self.isOverdueSearch()) {
                        return self.getSortingKey('creatorInfo', 'Information');
                    } else {
                        return 'createdBy';
                    }
                },
                createdOn: 'createdOn',
                correspondence_sites: function (record) {
                    return self.getSortingKey('mainSiteSubSiteString', 'Information');
                },
                number_of_days: 'numberOfDays'
            },
            searchText: '',
            searchCallback: function (grid) {
                self.quickSearchCorrespondence = gridService.searchGridData(self.grid, self.quickSearchCorrespondenceCopy);
            }
        };

        function _mapResultToAvoidCorrespondenceCheck(result) {
            return _.map(result, function (item) {
                switch (item.classDescription.toLowerCase()) {
                    case 'outgoing' :
                        item.sitesInfoTo = [true];
                        break;
                    case 'incoming':
                        item.mainSiteId = true;
                        break;
                }
                return item;
            });
        }

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
            self.quickSearchCorrespondence = $filter('orderBy')(self.quickSearchCorrespondence, self.grid.order);
        };

        self.isOverdueSearch = function () {
            return ($stateParams.q === 'overdueIncomingDocuments' || $stateParams.q === 'overdueOutgoingDocuments')
        };

        /**
         * @description Reload the grid of Correspondence
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadQuickSearchCorrespondence = function (pageNumber) {
            var defer = $q.defer();
            self.grid.progress = defer.promise;

            var searchJSON = {};
            searchJSON[$stateParams.key] = $stateParams.q;

            if (self.isOverdueSearch())
                return self.reloadQuickSearchOverdueCorrespondence(pageNumber, defer);

            return quickSearchCorrespondenceService
                .loadQuickSearchCorrespondence(searchJSON)
                .then(function (result) {
                    self.quickSearchCorrespondence = _mapResultToAvoidCorrespondenceCheck(result);
                    self.quickSearchCorrespondenceCopy = angular.copy(self.quickSearchCorrespondence);
                    self.selectedQuickSearchCorrespondence = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return result;
                });
        };

        self.reloadQuickSearchOverdueCorrespondence = function (pageNumber, defer) {
            var method = 'load' + generator.ucFirst($stateParams.q);
            return quickSearchCorrespondenceService[method]()
                .then(function (result) {
                    self.quickSearchCorrespondence = _mapResultToAvoidCorrespondenceCheck(result);
                    self.quickSearchCorrespondenceCopy = angular.copy(self.quickSearchCorrespondence);
                    self.selectedQuickSearchCorrespondence = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return result;
                });
        };

        self.printResult = function ($event) {
            var printTitle = langService.get("search_module_search_results");
            var headers = [];

            if (self.isOverdueSearch()) {
                headers = ['label_serial',
                    'subject',
                    'priority_level',
                    'label_document_type',
                    'creator',
                    'created_on',
                    'correspondence_sites',
                    'number_of_days'
                ];
            } else {
                headers = ['label_serial',
                    'subject',
                    'priority_level',
                    'label_document_type',
                    'created_by',
                    'created_on'
                ];
            }

            printService
                .printData(self.quickSearchCorrespondence, headers, printTitle);
        };


        /**
         * @description add an item to the favorite documents
         * @param searchedCorrespondenceDocument
         * @param $event
         */
        self.addToFavorite = function (searchedCorrespondenceDocument, $event) {
            favoriteDocumentsService.controllerMethod
                .favoriteDocumentAdd(searchedCorrespondenceDocument.getInfo().vsId, $event)
                .then(function (result) {
                    if (result.status) {
                        toast.success(langService.get("add_to_favorite_specific_success").change({
                            name: searchedCorrespondenceDocument.getTranslatedName()
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
                    self.reloadQuickSearchCorrespondence(self.grid.page);
                    new ResolveDefer(defer);
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
                    self.reloadQuickSearchCorrespondence(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                            new ResolveDefer(defer);
                        });
                })
                .catch(function () {
                    self.reloadQuickSearchCorrespondence(self.grid.page);
                });
        };

        /* /!**
          * @description Export quick searched Correspondence document
          * @param searchedCorrespondenceDocument
          * @param $event
          * @type {[*]}
          *!/
         self.exportQuickSearchCorrespondence = function (searchedCorrespondenceDocument, $event) {
             quickSearchCorrespondenceService
                 .exportQuickSearchCorrespondence(searchedCorrespondenceDocument, $event)
                 .then(function (result) {
                     self.reloadQuickSearchCorrespondence(self.grid.page)
                         .then(function () {
                             toast.success(langService.get('export_success'));
                         });
                 });
         };*/

        /**
         * @description view tracking sheet for searched Correspondence document
         * @param searchedCorrespondenceDocument
         * @param params
         * @param $event
         */
        self.viewTrackingSheet = function (searchedCorrespondenceDocument, params, $event) {
            viewTrackingSheetService
                .controllerMethod
                .viewTrackingSheetPopup(searchedCorrespondenceDocument, params, $event).then(function (result) {
            });
        };

        /**
         * @description Print Barcode
         * @param searchedCorrespondenceDocument
         * @param $event
         */
        self.printBarcode = function (searchedCorrespondenceDocument, $event) {
            searchedCorrespondenceDocument.barcodePrint($event);
        };

        /**
         * @description manage tag for searched Correspondence document
         * @param searchedCorrespondenceDocument
         * @param $event
         */
        self.manageTags = function (searchedCorrespondenceDocument, $event) {
            managerService.manageDocumentTags(searchedCorrespondenceDocument.vsId, searchedCorrespondenceDocument.classDescription, searchedCorrespondenceDocument.docSubject, $event)
                .then(function (tags) {
                    searchedCorrespondenceDocument.tags = tags;
                })
                .catch(function (tags) {
                    searchedCorrespondenceDocument.tags = tags;
                });
        };

        /**
         * @description manage comments for searched Correspondence document
         * @param searchedCorrespondenceDocument
         * @param $event
         */
        self.manageComments = function (searchedCorrespondenceDocument, $event) {
            searchedCorrespondenceDocument.manageDocumentComments($event)
                .then(function (documentComments) {
                    searchedCorrespondenceDocument.documentComments = documentComments;
                })
                .catch(function (documentComments) {
                    searchedCorrespondenceDocument.documentComments = documentComments;
                });
        };

        /**
         * @description manage tasks for searched Correspondence document
         * @param searchedCorrespondenceDocument
         * @param $event
         */
        self.manageTasks = function (searchedCorrespondenceDocument, $event) {
           // console.log('manage tasks for searched outgoing document : ', searchedCorrespondenceDocument);
        };

        /**
         * @description manage attachments for searched Correspondence document
         * @param searchedCorrespondenceDocument
         * @param $event
         */
        self.manageAttachments = function (searchedCorrespondenceDocument, $event) {
            searchedCorrespondenceDocument.manageDocumentAttachments($event);
        };

        /**
         * @description manage linked documents for searched Correspondence document
         * @param searchedCorrespondenceDocument
         * @param $event
         */
        self.manageLinkedDocuments = function (searchedCorrespondenceDocument, $event) {
            var info = searchedCorrespondenceDocument.getInfo();
            return managerService.manageDocumentLinkedDocuments(info.vsId, info.documentClass);
        };

        /**
         * @description Manage Linked Entities
         * @param searchedCorrespondenceDocument
         * @param $event
         */
        self.manageLinkedEntities = function (searchedCorrespondenceDocument, $event) {
            managerService
                .manageDocumentEntities(searchedCorrespondenceDocument.vsId, searchedCorrespondenceDocument.classDescription, searchedCorrespondenceDocument.docSubject, $event);
        };

        /**
         * @description Manage Destinations
         * @param searchedCorrespondenceDocument
         * @param $event
         */
        self.manageDestinations = function (searchedCorrespondenceDocument, $event) {
            searchedCorrespondenceDocument.manageDocumentCorrespondence($event)
                .then(function () {
                    self.reloadQuickSearchCorrespondence(self.grid.page);
                });
        };

        /**
         * @description download main document for searched Correspondence document
         * @param correspondence
         * @param $event
         */
        self.downloadMainDocument = function (correspondence, $event) {
            correspondence
                .mainDocumentDownload($event);
        };

        /**
         * @description download composite document for searched Correspondence document
         * @param correspondence
         * @param $event
         */
        self.downloadCompositeDocument = function (correspondence, $event) {
            correspondence
                .compositeDocumentDownload($event);
        };

        /**
         * @description download selected document
         * @param searchedCorrespondenceDocument
         * @param $event
         */
        self.downloadSelected = function (searchedCorrespondenceDocument, $event) {
            downloadService.openSelectedDownloadDialog(searchedCorrespondenceDocument, $event);
        };

        /**
         * @description merge and download
         * @param searchedCorrespondenceDocument
         */
        self.mergeAndDownloadFullDocument = function (searchedCorrespondenceDocument) {
            downloadService.mergeAndDownload(searchedCorrespondenceDocument);
        };

        /**
         * @description send link to document for searched Correspondence document
         * @param correspondence
         * @param $event
         */
        self.sendLinkToDocumentByEmail = function (correspondence, $event) {
            correspondence
                .getMainDocumentEmailContent($event);
        };

        /**
         * @description send composite document as attachment for searched Correspondence document
         * @param correspondence
         * @param $event
         */
        self.sendCompositeDocumentAsAttachmentByEmail = function (correspondence, $event) {
            correspondence
                .getCompositeDocumentEmailContent($event);
        };


        /**
         * @description send main document fax for searched Correspondence document
         * @param searchedCorrespondenceDocument
         * @param $event
         */
        self.sendMainDocumentFax = function (searchedCorrespondenceDocument, $event) {
            searchedCorrespondenceDocument.openSendFaxDialog($event);
        };

        /**
         * @description send sms for searched Correspondence document
         * @param searchedCorrespondenceDocument
         * @param $event
         * @param defer
         */
        self.sendSMS = function (searchedCorrespondenceDocument, $event, defer) {
            searchedCorrespondenceDocument.openSendSMSDialog($event)
                .then(function (result) {
                    new ResolveDefer(defer);
                });
        };

        /**
         * @description Send Document Link
         * @param searchedCorrespondenceDocument
         * @param $event
         */
        self.sendDocumentLink = function (searchedCorrespondenceDocument, $event) {
            searchedCorrespondenceDocument.openSendDocumentURLDialog($event);
        };

        /**
         * @description get link for searched Correspondence document
         * @param searchedCorrespondenceDocument
         * @param $event
         */
        self.getLink = function (searchedCorrespondenceDocument, $event) {
            viewDocumentService.loadDocumentViewUrlWithOutEdit(searchedCorrespondenceDocument.vsId).then(function (result) {
                //var docLink = "<a target='_blank' href='" + result + "'>" + result + "</a>";
                dialog.successMessage(langService.get('link_message').change({result: result}), null, null, null, null, true);
                return true;
            });
        };

        /**
         * @description create copy for searched Correspondence document
         * @param searchedCorrespondenceDocument
         * @param $event
         */
        self.createCopy = function (searchedCorrespondenceDocument, $event) {
           // console.log('create copy for searched outgoing document : ', searchedCorrespondenceDocument);
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
                        self.reloadQuickSearchCorrespondence(self.grid.page)
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
                    self.reloadQuickSearchCorrespondence(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                });
        };

        /**
         * @description Preview document
         * @param searchedCorrespondenceDocument
         * @param $event
         */
        self.previewDocument = function (searchedCorrespondenceDocument, $event) {
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }

            correspondenceService.viewCorrespondence(searchedCorrespondenceDocument, self.gridActions, true, true)
                .then(function () {
                    // return self.reloadQuickSearchCorrespondence(self.grid.page);
                })
                .catch(function () {
                    //  return self.reloadQuickSearchCorrespondence(self.grid.page);
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
            correspondence.viewFromQueue(self.gridActions, 'quickSearch', $event)
                .then(function () {
                    // return self.reloadQuickSearchCorrespondence(self.grid.page);
                })
                .catch(function (error) {
                    // return self.reloadQuickSearchCorrespondence(self.grid.page);
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

        /**
         * @description do broadcast for correspondence.
         */
        self.broadcast = function (correspondence, $event, defer) {
            correspondence
                .correspondenceBroadcast()
                .then(function () {
                    self.reloadQuickSearchCorrespondence(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                            new ResolveDefer(defer);
                        })
                })
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


        self.launchDistributionWorkflow = function (correspondence, $event, defer) {
            var promise = null;
            if (!correspondence.hasContent()) {
                dialog.alertMessage(langService.get("content_not_found"));
                return;
            }

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
                self.reloadQuickSearchCorrespondence(self.grid.page)
                    .then(function () {
                        mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                        new ResolveDefer(defer);
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
            record.openLaunchSequentialWorkflowDialog($event)
                .then(function () {
                    self.reloadQuickSearchCorrespondence(self.grid.page)
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
         * @description add correspondence To My FollowUp
         * @param item
         */
        self.addToDirectFollowUp = function (item) {
            item.addToMyDirectFollowUp();
        };

        /**
         * @description add correspondence To other user's FollowUp
         * @param item
         */
        self.addToEmployeeFollowUp = function (item) {
            item.addToUserFollowUp();
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
                        gridName: 'search-quick'
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
                        showInView: false,
                        shortcut: true,
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
                        showInView: false,
                        shortcut: true,
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
                    'ICN_ENTRY_TEMPLATE'
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
                 callback: self.exportQuickSearchCorrespondence,
                 class: "action-green",
                 checkShow: function (action, model) {
                     //If document is paper outgoing and unapproved/partially approved, show the button.
                     var info = model.getInfo();
                     return model.docStatus < 24 && info.isPaper && info.documentClass === "outgoing";
                 }
             },*/
            // Annotate Document
            {
                type: 'action',
                icon: 'draw',
                text: 'grid_action_annotate_document',
                shortcut: true,
                callback: self.annotateDocument,
                class: "action-green",
                checkShow: function (action, model) {
                    return model.userCanAnnotate() && rootEntity.hasPSPDFViewer() && employeeService.hasPermissionTo(configurationService.ANNOTATE_DOCUMENT_PERMISSION);
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
                checkShow: function (action, model) {
                    return rootEntity.hasPSPDFViewer() && !model.hasActiveSeqWF();
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
            // Create Reply
            {
                type: 'action',
                icon: 'pen',
                text: 'grid_action_create_reply',
                callback: self.createReply,
                class: "action-green",
                checkShow: function (action, model) {
                    return model.checkCreateReplyPermission() && !model.needApprove() && !model.isBroadcasted();
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
                    return model.checkCreateReplyPermission(true) && !model.needApprove() && !model.isBroadcasted();
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
                    return (!model.needApprove() || model.hasDocumentClass('incoming')) && (model.getSecurityLevelLookup().lookupKey !== 4);
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
                subMenu: viewTrackingSheetService.getViewTrackingSheetOptions('grid', gridService.grids.search.quick)
            },
            // View Tracking Sheet (Shortcut Only)
            {
                type: 'action',
                icon: 'eye',
                text: 'grid_action_view_tracking_sheet',
                shortcut: true,
                onlyShortcut: true,
                showInView: false,
                permissionKey: "VIEW_DOCUMENT'S_TRACKING_SHEET",
                checkShow: function (action, model) {
                    return true;
                },
                callback: self.viewTrackingSheet,
                params: ['view_tracking_sheet', 'tabs']
            },
            // Print Barcode
            {
                type: 'action',
                icon: 'barcode-scan',
                text: 'grid_action_print_barcode',
                callback: self.printBarcode,
                class: "action-green",
                permissionKey: 'PRINT_BARCODE',
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    return (info.documentClass === "incoming" || ((info.documentClass === "outgoing" || info.documentClass === 'internal') && (!model.needApprove() || info.isPaper)));
                }
            },
            // Manage
            {
                type: 'action',
                icon: 'settings',
                text: 'grid_action_manage',
                shortcut: false,
                showInView: false,
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
                        callback: self.manageDestinations,
                        permissionKey: "MANAGE_DESTINATIONS",
                        class: "action-green",
                        checkShow: function (action, model) {
                            return model.getInfo().documentClass !== 'internal';
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
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model);
                },
                permissionKey: [
                    "DOWNLOAD_MAIN_DOCUMENT",
                    "DOWNLOAD_COMPOSITE_BOOK"// Composite Document
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
                    }]
            }
        ];

        self.shortcutActions = gridService.getShortcutActions(self.gridActions);
        self.contextMenuActions = gridService.getContextMenuActions(self.gridActions);
    });
};
