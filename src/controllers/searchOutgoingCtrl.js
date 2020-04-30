module.exports = function (app) {
    app.controller('searchOutgoingCtrl', function (lookupService,
                                                   langService,
                                                   viewDocumentService,
                                                   ResolveDefer,
                                                   searchOutgoingService,
                                                   Organization,
                                                   $q,
                                                   _,
                                                   $filter,
                                                   OutgoingSearch,
                                                   propertyConfigurations,
                                                   validationService,
                                                   generator,
                                                   $state,
                                                   rootEntity,
                                                   managerService,
                                                   contextHelpService,
                                                   organizationService,
                                                   toast,
                                                   viewTrackingSheetService,
                                                   downloadService,
                                                   employeeService,
                                                   dialog,
                                                   gridService,
                                                   counterService,
                                                   correspondenceService,
                                                   favoriteDocumentsService,
                                                   mailNotificationService,
                                                   registryOrganizations,
                                                   approvers,
                                                   userSubscriptionService,
                                                   printService,
                                                   ignoreHelp,
                                                   $timeout) {
        'ngInject';
        var self = this;
        self.controllerName = 'searchOutgoingCtrl';
        contextHelpService.setHelpTo('search-outgoing' , ignoreHelp);
        // employee service to check the permission in html
        self.employeeService = employeeService;

        self.searchOutgoing = new OutgoingSearch({dummySearchDocClass: 'outgoing'});
        self.searchOutgoingModel = angular.copy(self.searchOutgoing);
        self.emptyResults = false;

        self.approvers = approvers;
        self.propertyConfigurations = propertyConfigurations;

        self.loadSubOrganizations = false;

        if (!self.employeeService.hasPermissionTo('SEARCH_IN_ALL_OU')) {
            self.searchOutgoing.registryOU = self.employeeService.getEmployee().getRegistryOUID();
            self.searchOutgoing.ou = self.employeeService.getEmployee().getOUID();
            self.loadSubOrganizations = true;
        } else {
            self.searchOutgoing.registryOU = self.employeeService.getEmployee().getRegistryOUID();
            self.loadSubOrganizations = true;
        }
        /**
         * @description Get the dynamic required fields
         */
        self.getSearchOutgoingRequiredFields = function () {
            var requiredFields = _.map(_.filter(self.propertyConfigurations, function (propertyConfiguration) {
                return propertyConfiguration.isMandatory;
            }), 'symbolicName');
            requiredFields.push('year');
            return requiredFields;
        };

        self.requiredFieldsSearchOutgoing = self.getSearchOutgoingRequiredFields();

        self.validateLabelsSearchOutgoing = {};

        //self.registryOrganizations = employeeService.isCentralArchive() ? angular.copy(centralArchives) : angular.copy(organizationService.getAllRegistryOrganizations());
        self.registryOrganizations = registryOrganizations;

        /**
         * @description Checks if the field is mandatory
         * @param fieldName
         * @param langKey
         * @returns {Array}
         */
        self.dynamicRequired = function (fieldName, langKey) {
            if (self.requiredFieldsSearchOutgoing.indexOf(fieldName) > -1) {
                var obj = {};
                obj[fieldName] = langKey;
                if (!_.some(self.validateLabelsSearchOutgoing, obj)) {
                    self.validateLabelsSearchOutgoing[fieldName] = langKey;
                }
                return true;
            }
            return false;
        };


        /**
         * @description Checks the required fields validation
         * @param model
         * @returns {Array}
         */
        self.checkRequiredFieldsSearchOutgoing = function (model) {
            var required = self.requiredFieldsSearchOutgoing, result = [];
            _.map(required, function (property) {
                var propertyValueToCheck = model[property];
                if (!generator.validRequired(propertyValueToCheck))
                    result.push(property);
            });
            return [];
        };


        self.dynamicValidations = {
            'Integer': {type: 'number', message: langService.get('numberonly')},
            'String': {type: 'ALL', message: ''}
        };

        /**
         * @description Check the type of value allowed in the field
         * @param fieldName
         * @param typeOrMessage
         * @returns {*}
         */
        self.dynamicType = function (fieldName, typeOrMessage) {
            var dataType = _.find(self.propertyConfigurations, function (propertyConfiguration) {
                return propertyConfiguration.symbolicName.toLowerCase() === fieldName.toLowerCase();
            }).dataType;
            return self.dynamicValidations[dataType][typeOrMessage];
        };

        /**
         * @description Contains the selected tab name
         * @type {string}
         */
        self.selectedTabName = "search";
        self.selectedTab = 0;

        /**
         * @description Set the current tab name
         * @param tabName
         */
        self.setCurrentTab = function (tabName) {
            self.selectedTabName = tabName;
        };

        self.showResults = false;

        /**
         * @description All application users
         * @type {*}
         */
        self.searchedOutgoingDocuments = [];

        /**
         * @description Contains the selected search results
         * @type {Array}
         */
        self.selectedSearchedOutgoingDocuments = [];

        function _mapResultToAvoidCorrespondenceCheck(result) {
            return _.map(result, function (item) {
                // this workaround to display the correspondence has at least one site.
                item.sitesInfoTo = [true];
                return item;
            });
        }

        /**
         * @description Search the document on basis of search criteria
         */
        self.search = function () {
            validationService
                .createValidation('SEARCH_OUTGOING')
                .addStep('check_required', true, self.checkRequiredFieldsSearchOutgoing, self.searchOutgoing, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabelsSearchOutgoing[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .validate()
                .then(function () {
                    searchOutgoingService
                        .searchOutgoingDocuments(self.searchOutgoing, self.propertyConfigurations)
                        .then(function (result) {
                            self.searchOutgoingModel = angular.copy(self.searchOutgoing);
                            self.showResults = true;
                            self.selectedTab = 1;
                            self.searchedOutgoingDocuments = _mapResultToAvoidCorrespondenceCheck(result);
                            self.selectedSearchedOutgoingDocuments = [];
                        })
                        .catch(function (error) {

                        });
                })
                .catch(function () {

                });
        };

        /**
         * @description Resets the document search criteria
         * @param form
         */
        self.resetFilters = function (form) {
            self.searchOutgoing = new OutgoingSearch({dummySearchDocClass: 'outgoing'});
            self.emptyResults = true;
            form.$setUntouched();
            $timeout(function () {
                self.searchOutgoingModel = angular.copy(self.searchOutgoing);
            });
        };

        /**
         * @description Saves the search criteria
         */
        self.saveSearch = function () {
            console.log('save search');
        };

        self.globalSetting = rootEntity.returnRootEntity().settings;
        /**
         * @description Contains options for grid configuration
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         */
        self.grid = {
            progress: null,
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.search.outgoing) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.search.outgoing, self.searchedOutgoingDocuments),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.search.outgoing, limit);
            },
            filter: {search: {}},
            truncateSubject: gridService.getGridSubjectTruncateByGridName(gridService.grids.search.outgoing),
            setTruncateSubject: function ($event) {
                gridService.setGridSubjectTruncateByGridName(gridService.grids.search.outgoing, self.grid.truncateSubject);
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
            self.searchedOutgoingDocuments = $filter('orderBy')(self.searchedOutgoingDocuments, self.grid.order);
        };

        /**
         * @description Reload the grid of searched outgoing documents
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadSearchedOutgoingDocument = function (pageNumber) {
            var defer = $q.defer();
            self.grid.progress = defer.promise;
            return searchOutgoingService
                .searchOutgoingDocuments(self.searchOutgoingModel, self.propertyConfigurations)
                .then(function (result) {
                    counterService.loadCounters();
                    self.searchedOutgoingDocuments = _mapResultToAvoidCorrespondenceCheck(result);
                    self.selectedSearchedOutgoingDocuments = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    self.getSortedData();
                    return result;
                });
        };

        /**
         * @description add selected items to the favorite documents
         * @param $event
         */
        self.addToFavoriteBulk = function ($event) {
            favoriteDocumentsService.controllerMethod
                .favoriteDocumentAddBulk(self.selectedSearchedOutgoingDocuments, $event)
                .then(function (result) {
                    self.reloadSearchedOutgoingDocument(self.grid.page);
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
                    self.reloadSearchedOutgoingDocument(self.grid.page);
                    new ResolveDefer(defer);
                });
        };

        /**
         * @description add an item to the favorite documents
         * @param searchedOutgoingDocument
         * @param $event
         */
        self.addToFavorite = function (searchedOutgoingDocument, $event) {
            favoriteDocumentsService.controllerMethod
                .favoriteDocumentAdd(searchedOutgoingDocument.getInfo().vsId, $event)
                .then(function (result) {
                    if (result.status) {
                        toast.success(langService.get("add_to_favorite_specific_success").change({
                            name: searchedOutgoingDocument.getTranslatedName()
                        }));
                    } else {
                        dialog.alertMessage(langService.get(result.message));
                    }
                });
        };

        /**
         * @description Launch distribution workflow for outgoing item
         * @param searchedOutgoingDocument
         * @param $event
         */
        self.launchDistributionWorkflow = function (searchedOutgoingDocument, $event) {
            if (!searchedOutgoingDocument.hasContent()) {
                dialog.alertMessage(langService.get("content_not_found"));
                return;
            }
            // we can launch the document if the document not in inbox
            if (searchedOutgoingDocument.docStatus !== 22) {
                return searchedOutgoingDocument.launchWorkFlow($event, null, 'favorites');
            }

            // if the document status === 22 we should check if the document have active workflow
            searchedOutgoingDocument.launchWorkFlowAndCheckExists($event, null, 'favorites')
                .then(function () {
                    self.reloadSearchedOutgoingDocument(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                        });
                });
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
         * @param searchedOutgoingDocument
         * @param $event
         */
        self.printBarcode = function (searchedOutgoingDocument, $event) {
            searchedOutgoingDocument.barcodePrint($event);
        };

        self.addDocumentTask = function (correspondence, $event) {
            correspondence.createDocumentTask($event)
        };


        /**
         * @description View Tracking Sheet
         * @param searchedOutgoingDocument
         * @param params
         * @param $event
         */
        self.viewTrackingSheet = function (searchedOutgoingDocument, params, $event) {
            viewTrackingSheetService
                .controllerMethod
                .viewTrackingSheetPopup(searchedOutgoingDocument, params, $event).then(function (result) {
            });
        };

        /**
         * @description manage tag for searched outgoing document
         * @param searchedOutgoingDocument
         * @param $event
         */
        self.manageTags = function (searchedOutgoingDocument, $event) {
            managerService.manageDocumentTags(searchedOutgoingDocument.vsId, searchedOutgoingDocument.docClassName, searchedOutgoingDocument.docSubject, $event)
                .then(function (tags) {
                    searchedOutgoingDocument.tags = tags;
                })
                .catch(function (tags) {
                    searchedOutgoingDocument.tags = tags;
                });
        };

        /**
         * @description manage comments for searched outgoing document
         * @param searchedOutgoingDocument
         * @param $event
         */
        self.manageComments = function (searchedOutgoingDocument, $event) {
            managerService.manageDocumentComments(searchedOutgoingDocument.vsId, searchedOutgoingDocument.docSubject, $event)
                .then(function (documentComments) {
                    searchedOutgoingDocument.documentComments = documentComments;
                })
                .catch(function (documentComments) {
                    searchedOutgoingDocument.documentComments = documentComments;
                });
        };

        /**
         * @description manage tasks for searched outgoing document
         * @param searchedOutgoingDocument
         * @param $event
         */
        self.manageTasks = function (searchedOutgoingDocument, $event) {
            console.log('manage tasks for searched outgoing document : ', searchedOutgoingDocument);
        };

        /**
         * @description manage attachments for searched outgoing document
         * @param searchedOutgoingDocument
         * @param $event
         */
        self.manageAttachments = function (searchedOutgoingDocument, $event) {
            searchedOutgoingDocument.manageDocumentAttachments($event)
                .then(function () {
                    self.reloadSearchedOutgoingDocument(self.grid.page);
                })
                .catch(function () {
                    self.reloadSearchedOutgoingDocument(self.grid.page);
                });
        };

        /**
         * @description manage linked documents for searched outgoing document
         * @param searchedOutgoingDocument
         * @param $event
         */
        self.manageLinkedDocuments = function (searchedOutgoingDocument, $event) {
            var info = searchedOutgoingDocument.getInfo();
            return managerService.manageDocumentLinkedDocuments(info.vsId, info.documentClass)
                .then(function () {
                    self.reloadSearchedOutgoingDocument(self.grid.page);
                })
                .catch(function () {
                    self.reloadSearchedOutgoingDocument(self.grid.page);
                });
        };

        /**
         * @description Manage Linked Entities
         * @param searchedOutgoingDocument
         * @param $event
         */
        self.manageLinkedEntities = function (searchedOutgoingDocument, $event) {
            managerService
                .manageDocumentEntities(searchedOutgoingDocument.vsId, searchedOutgoingDocument.docClassName, searchedOutgoingDocument.docSubject, $event);
        };


        /**
         * @description Destinations
         * @param searchedOutgoingDocument
         * @param $event
         */
        self.manageDestinations = function (searchedOutgoingDocument, $event) {
            searchedOutgoingDocument.manageDocumentCorrespondence($event)
                .then(function () {
                    self.reloadSearchedOutgoingDocument(self.grid.page);
                });
        };

        /**
         * @description download main document for searched outgoing document
         * @param searchedOutgoingDocument
         * @param $event
         */
        self.downloadMainDocument = function (searchedOutgoingDocument, $event) {
            downloadService.controllerMethod
                .mainDocumentDownload(searchedOutgoingDocument.vsId);
        };

        /**
         * @description download composite document for searched outgoing document
         * @param searchedOutgoingDocument
         * @param $event
         */
        self.downloadCompositeDocument = function (searchedOutgoingDocument, $event) {
            downloadService.controllerMethod
                .compositeDocumentDownload(searchedOutgoingDocument.vsId);
        };

        /**
         * @description download selected document
         * @param searchedOutgoingDocument
         * @param $event
         */
        self.downloadSelected = function (searchedOutgoingDocument, $event) {
            downloadService.openSelectedDownloadDialog(searchedOutgoingDocument, $event);
        };

        /**
         * @description merge and download
         * @param searchedOutgoingDocument
         */
        self.mergeAndDownloadFullDocument = function (searchedOutgoingDocument) {
            downloadService.mergeAndDownload(searchedOutgoingDocument);
        };

        /**
         * @description send link to document for searched outgoing document
         * @param searchedOutgoingDocument
         * @param $event
         */
        self.sendLinkToDocumentByEmail = function (searchedOutgoingDocument, $event) {
            downloadService.getMainDocumentEmailContent(searchedOutgoingDocument.getInfo().vsId);
        };

        /**
         * @description send composite document as attachment for searched outgoing document
         * @param searchedOutgoingDocument
         * @param $event
         */
        self.sendCompositeDocumentAsAttachmentByEmail = function (searchedOutgoingDocument, $event) {
            downloadService.getCompositeDocumentEmailContent(searchedOutgoingDocument.getInfo().vsId);
        };


        /**
         * @description send main document fax for searched outgoing document
         * @param searchedOutgoingDocument
         * @param $event
         */
        self.sendMainDocumentFax = function (searchedOutgoingDocument, $event) {
            searchedOutgoingDocument.openSendFaxDialog($event);
        };

        /**
         * @description send sms for searched outgoing document
         * @param searchedOutgoingDocument
         * @param $event
         * @param defer
         */
        self.sendSMS = function (searchedOutgoingDocument, $event, defer) {
            searchedOutgoingDocument.openSendSMSDialog($event)
                .then(function (result) {
                    new ResolveDefer(defer);
                });
        };

        /**
         * @description Send Document Link
         * @param searchedOutgoingDocument
         * @param $event
         */
        self.sendDocumentLink = function (searchedOutgoingDocument, $event) {
            searchedOutgoingDocument.openSendDocumentURLDialog($event);
        };

        /**
         * @description get link for searched outgoing document
         * @param searchedOutgoingDocument
         * @param $event
         */
        self.getLink = function (searchedOutgoingDocument, $event) {
            viewDocumentService.loadDocumentViewUrlWithOutEdit(searchedOutgoingDocument.vsId).then(function (result) {
                dialog.successMessage(langService.get('link_message').change({result: result}), null, null, null, null, true);
                return true;
            });
        };

        /**
         * @description create copy for searched outgoing document
         * @param searchedOutgoingDocument
         * @param $event
         */
        self.createCopy = function (searchedOutgoingDocument, $event) {
            console.log('create copy for searched outgoing document : ', searchedOutgoingDocument);
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
                        self.reloadSearchedOutgoingDocument(self.grid.page)
                            .then(function () {
                                new ResolveDefer(defer);
                            });
                    }
                });
        };


        var checkIfEditCorrespondenceSiteAllowed = function (model, checkForViewPopup) {
            var info = model.getInfo();
            var hasPermission = employeeService.hasPermissionTo("MANAGE_DESTINATIONS");
            var allowed = hasPermission && info.docStatus < 25;
            if (checkForViewPopup)
                return !(allowed);
            return allowed;
        };

        /**
         * @description Preview document
         * @param searchedOutgoingDocument
         * @param $event
         */
        self.previewDocument = function (searchedOutgoingDocument, $event) {
            if (!searchedOutgoingDocument.hasContent()) {
                dialog.alertMessage(langService.get('content_not_found'));
                return;
            }
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            correspondenceService.viewCorrespondence(searchedOutgoingDocument, self.gridActions, true, checkIfEditCorrespondenceSiteAllowed(searchedOutgoingDocument, true))
                .then(function () {
                    //return self.reloadSearchedOutgoingDocument(self.grid.page);
                })
                .catch(function () {
                    // return self.reloadSearchedOutgoingDocument(self.grid.page);
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
            correspondence.viewFromQueue(self.gridActions, 'searchOutgoing', $event)
                .then(function () {
                    //   return self.reloadSearchedOutgoingDocument(self.grid.page);
                })
                .catch(function () {
                    //  return self.reloadSearchedOutgoingDocument(self.grid.page);
                });
        };

        self.viewInDeskTop = function (workItem) {
            return correspondenceService.viewWordInDesktop(workItem);
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
                    $state.go('app.outgoing.add', {
                        vsId: info.vsId,
                        action: 'duplicateVersion',
                        wobNum: info.wobNum
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
                    $state.go('app.outgoing.add', {
                        vsId: info.vsId,
                        action: 'duplicateVersion',
                        wobNum: info.wobNum
                    });
                });
        };

        /**
         * @description do broadcast for workItem.
         */
        self.broadcast = function (correspondence, $event, defer) {
            correspondence
                .correspondenceBroadcast()
                .then(function () {
                    self.reloadSearchedOutgoingDocument(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                            new ResolveDefer(defer);
                        })
                })
        };
        /**
         * @description Partial Export
         * @param correspondence
         * @param $event
         * @param defer
         */
        self.partialExportCallback = function (correspondence, $event, defer) {
            correspondence
                .partialExport($event)
                .then(function () {
                    self.reloadSearchedOutgoingDocument(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                            new ResolveDefer(defer);
                        })
                });
        };

        self.printResult = function ($event) {
            var printTitle = langService.get("search_module_search_results") + " " + langService.get("from") + " " + generator.convertDateToString(self.searchOutgoing.docDateFrom) +
                " " + langService.get("to") + " " + generator.convertDateToString(self.searchOutgoing.docDateTo);

            var headers = ['label_serial',
                'subject',
                'priority_level',
                'label_document_type',
                'creator',
                'created_on',
                'correspondence_sites'];

            printService
                .printData(self.searchedOutgoingDocuments, headers, printTitle);

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
                        gridName: 'search-outgoing'
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
                        hide: false,
                        callback: self.viewInDeskTop,
                        class: "action-green",
                        permissionKey: 'VIEW_DOCUMENT',
                        showInView: false,
                        checkShow: function (action, model) {
                            var info = model.getInfo();
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
                    }
                ]
            },
            // Export /*NOT NEEDED AS DISCUSSED WITH HUSSAM*/
            /* {
             type: 'action',
             icon: 'export',
             text: 'grid_action_export',
             shortcut: true,
             callback: self.exportSearchOutgoingDocument,
             class: "action-green",
             checkShow: function (action, model) {
             //If document is paper outgoing and unapproved/partially approved, show the button.
             return model.docStatus < 24 && model.addMethod === 1;
             }
             },*/
            // Partial Export
            {
                type: 'action',
                icon: 'backburger',
                text: 'grid_action_partial_export',
                shortcut: false,
                permissionKey: 'PARTIAL_EXPORT',
                callback: self.partialExportCallback,
                class: "action-green",
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    // When document is EXPORTED or PARTIALLY_EXPORTED, show partial export button.
                    return (info.docStatus === 25 || info.docStatus === 26) && (model.registryOU === employeeService.getEmployee().getRegistryOUID()) && !model.isPrivateSecurityLevel();
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
                    return !model.needApprove() && (model.getSecurityLevelLookup().lookupKey !== 4);
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
                    return (!model.needApprove() || info.isPaper);
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
                subMenu: viewTrackingSheetService.getViewTrackingSheetOptions('grid', gridService.grids.search.outgoing)
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
                        //hide:true,
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
                checkShow: function (action, model) {
                    return gridService.checkToShowMainMenuBySubMenu(action, model);
                },
                permissionKey: [
                    "DOWNLOAD_MAIN_DOCUMENT",
                    "DOWNLOAD_COMPOSITE_BOOK" //Composite Document
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
                    // no follow up status = 0 (need reply)
                    return !model.getSiteFollowupStatus() && !model.getSiteFollowupEndDate()// && model.getSiteMaxFollowupDate();
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
                            return !info.isPaper;
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
    });
};
