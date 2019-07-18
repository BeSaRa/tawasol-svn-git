module.exports = function (app) {
    app.controller('searchInternalCtrl', function (lookupService,
                                                   langService,
                                                   viewDocumentService,
                                                   organizations,
                                                   ResolveDefer,
                                                   searchInternalService,
                                                   $q,
                                                   _,
                                                   $filter,
                                                   Organization,
                                                   InternalSearch,
                                                   propertyConfigurations,
                                                   validationService,
                                                   generator,
                                                   rootEntity,
                                                   managerService,
                                                   contextHelpService,
                                                   toast,
                                                   $state,
                                                   organizationService,
                                                   viewTrackingSheetService,
                                                   downloadService,
                                                   counterService,
                                                   employeeService,
                                                   correspondenceService,
                                                   dialog,
                                                   gridService,
                                                   mailNotificationService,
                                                   favoriteDocumentsService,
                                                   centralArchives,
                                                   approvers,
                                                   userSubscriptionService,
                                                   printService) {
        'ngInject';
        var self = this;
        self.controllerName = 'searchInternalCtrl';
        contextHelpService.setHelpTo('search-internal');
        // employee service to check the permission in html
        self.employeeService = employeeService;

        self.searchInternal = new InternalSearch({dummySearchDocClass: 'internal'});
        self.searchInternalModel = angular.copy(self.searchInternal);
        self.emptyResults = false;

        self.approvers = approvers;
        self.propertyConfigurations = propertyConfigurations;

        self.loadSubOrganizations = false;

        if (!self.employeeService.hasPermissionTo('SEARCH_IN_ALL_OU')) {
            self.searchInternal.registryOU = self.employeeService.getEmployee().getRegistryOUID();
            self.searchInternal.ou = self.employeeService.getEmployee().getOUID();
            self.loadSubOrganizations = true;
        }

        /**
         * @description Get the dynamic required fields
         */
        self.getSearchInternalRequiredFields = function () {
            var requiredFields = _.map(_.filter(self.propertyConfigurations, function (propertyConfiguration) {
                return propertyConfiguration.isMandatory;
            }), 'symbolicName');
            requiredFields.push('year');
            return requiredFields;
        };

        self.requiredFieldsSearchInternal = self.getSearchInternalRequiredFields();

        self.validateLabelsSearchInternal = {};

        self.registryOrganizations = employeeService.isCentralArchive() ? angular.copy(centralArchives) : angular.copy(organizationService.getAllRegistryOrganizations());

        /**
         * @description Checks if the field is mandatory
         * @param fieldName
         * @param langKey
         * @returns {Array}
         */
        self.dynamicRequired = function (fieldName, langKey) {
            if (self.requiredFieldsSearchInternal.indexOf(fieldName) > -1) {
                var obj = {};
                obj[fieldName] = langKey;
                if (!_.some(self.validateLabelsSearchInternal, obj)) {
                    self.validateLabelsSearchInternal[fieldName] = langKey;
                    //self.validateLabelsSearchInternal
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
        self.checkRequiredFieldsSearchInternal = function (model) {
            var required = self.requiredFieldsSearchInternal, result = [];
            _.map(required, function (property) {
                var propertyValueToCheck = model[property];
                if (!generator.validRequired(propertyValueToCheck))
                    result.push(property);
            });
            // return result;
            return [];
        };


        self.dynamicValidations = {
            'Integer': {type: 'number', message: langService.get('numberonly')},
            'String': {type: 'ALL', message: langService.get('all_validation')}
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
        self.searchedInternalDocuments = [];

        self.progress = null;
        /**
         * @description Contains the selected search results
         * @type {Array}
         */
        self.selectedSearchedInternalDocuments = [];


        /**
         * @description Search the document on basis of search criteria
         */
        self.search = function () {
            validationService
                .createValidation('SEARCH_INTERNAL')
                .addStep('check_required', true, self.checkRequiredFieldsSearchInternal, self.searchInternal, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabelsSearchInternal[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .validate()
                .then(function () {
                    searchInternalService
                        .searchInternalDocuments(self.searchInternal, self.propertyConfigurations)
                        .then(function (result) {
                            self.searchInternalModel = angular.copy(self.searchInternal);
                            self.showResults = true;
                            self.selectedTab = 1;
                            self.searchedInternalDocuments = result;
                            self.selectedSearchedInternalDocuments = [];
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
            self.searchInternal = new InternalSearch();
            self.searchInternalModel = angular.copy(self.searchInternal);
            self.emptyResults = true;
            form.$setUntouched();
        };

        /**
         * @description Saves the search criteria
         */
        self.saveSearch = function () {
            console.log('save search');
        };


        self.printResult = function ($event) {
            var printTitle = langService.get("search_module_search_results") + " " + langService.get("from") + " " + generator.convertDateToString(self.searchInternal.docDateFrom) +
                " " + langService.get("to") + " " + generator.convertDateToString(self.searchInternal.docDateTo);

            var headers = ['label_serial',
                'subject',
                'priority_level',
                'label_document_type',
                'creator',
                'created_on'];

            printService
                .printData(self.searchedInternalDocuments, headers, printTitle);

        };

        self.globalSetting = rootEntity.returnRootEntity().settings;
        /**
         * @description Contains options for grid configuration
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         */
        self.grid = {
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.search.internal) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.search.internal, self.searchedInternalDocuments),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.search.internal, limit);
            },
            filter: {search: {}}
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
            self.searchedInternalDocuments = $filter('orderBy')(self.searchedInternalDocuments, self.grid.order);
        };

        /**
         * @description Reload the grid of searched internal documents
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadSearchedInternalDocuments = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;
            return searchInternalService
                .searchInternalDocuments(self.searchInternalModel, self.propertyConfigurations)
                .then(function (result) {
                    counterService.loadCounters();
                    self.searchedInternalDocuments = result;
                    self.selectedSearchedInternalDocuments = [];
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
                .favoriteDocumentAddBulk(self.selectedSearchedInternalDocuments, $event)
                .then(function (result) {
                    self.reloadSearchedInternalDocuments(self.grid.page);
                });
        };

        /**
         * @description add an item to the favorite documents
         * @param searchedInternalDocument
         * @param $event
         */
        self.addToFavorite = function (searchedInternalDocument, $event) {
            favoriteDocumentsService.controllerMethod
                .favoriteDocumentAdd(searchedInternalDocument.getInfo().vsId, $event)
                .then(function (result) {
                    if (result.status) {
                        toast.success(langService.get("add_to_favorite_specific_success").change({
                            name: searchedInternalDocument.getTranslatedName()
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
                    self.reloadSearchedInternalDocuments(self.grid.page);
                    new ResolveDefer(defer);
                });
        };

        /* /!**
         * @description Export searched internal document
         * @param searchedInternalDocument
         * @param $event
         * @type {[*]}
         *!/
         self.exportSearchInternalDocument = function (searchedInternalDocument, $event) {
         searchInternalService
         .exportSearchInternal(searchedInternalDocument, $event)
         .then(function (result) {
         self.reloadSearchedInternalDocuments(self.grid.page)
         .then(function () {
         toast.success(langService.get('export_success'));
         });
         });
         };*/

        /**
         * @description Launch distribution workflow for internal item
         * @param searchedInternalDocument
         * @param $event
         */
        self.launchDistributionWorkflow = function (searchedInternalDocument, $event) {
            if (!searchedInternalDocument.hasContent()) {
                dialog.alertMessage(langService.get("content_not_found"));
                return;
            }

            searchedInternalDocument.launchWorkFlowAndCheckApprovedInternal($event, null, 'favorites')
                .then(function () {
                    self.reloadSearchedInternalDocuments(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                        });
                });
        };

        /**
         * @description Print Barcode
         * @param searchedInternalDocument
         * @param $event
         */
        self.printBarcode = function (searchedInternalDocument, $event) {
            searchedInternalDocument.barcodePrint($event);
        };

        /**
         * @description View Tracking Sheet
         * @param searchedInternalDocument
         * @param params
         * @param $event
         */
        self.viewTrackingSheet = function (searchedInternalDocument, params, $event) {
            viewTrackingSheetService
                .controllerMethod
                .viewTrackingSheetPopup(searchedInternalDocument, params, $event).then(function (result) {
            });
        };

        /**
         * @description manage tag for searched internal document
         * @param searchedInternalDocument
         * @param $event
         */
        self.manageTags = function (searchedInternalDocument, $event) {
            //console.log('manage tag for searched internal document : ', searchedInternalDocument);
            managerService.manageDocumentTags(searchedInternalDocument.vsId, searchedInternalDocument.docClassName, searchedInternalDocument.docSubject, $event)
                .then(function (tags) {
                    searchedInternalDocument.tags = tags;
                })
                .catch(function (tags) {
                    searchedInternalDocument.tags = tags;
                });
        };

        /**
         * @description manage comments for searched internal document
         * @param searchedInternalDocument
         * @param $event
         */
        self.manageComments = function (searchedInternalDocument, $event) {
            //console.log('manage comments for searched internal document : ', searchedInternalDocument);
            managerService.manageDocumentComments(searchedInternalDocument.vsId, searchedInternalDocument.docSubject, $event)
                .then(function (documentComments) {
                    searchedInternalDocument.documentComments = documentComments;
                })
                .catch(function (documentComments) {
                    searchedInternalDocument.documentComments = documentComments;
                });
        };

        /**
         * @description manage tasks for searched internal document
         * @param searchedInternalDocument
         * @param $event
         */
        self.manageTasks = function (searchedInternalDocument, $event) {
            console.log('manage tasks for searched internal document : ', searchedInternalDocument);
        };

        /**
         * @description manage attachments for searched internal document
         * @param searchedInternalDocument
         * @param $event
         */
        self.manageAttachments = function (searchedInternalDocument, $event) {
            searchedInternalDocument.manageDocumentAttachments($event)
                .then(function () {
                    self.reloadSearchedInternalDocuments(self.grid.page);
                })
                .catch(function () {
                    self.reloadSearchedInternalDocuments(self.grid.page);
                })
            ;
        };

        /**
         * @description manage linked documents for searched internal document
         * @param searchedInternalDocument
         * @param $event
         */
        self.manageLinkedDocuments = function (searchedInternalDocument, $event) {
            //console.log('manage linked documents for searched internal document : ', searchedInternalDocument);
            var info = searchedInternalDocument.getInfo();
            return managerService.manageDocumentLinkedDocuments(info.vsId, info.documentClass)
                .then(function () {
                    self.reloadSearchedInternalDocuments(self.grid.page);
                })
                .catch(function () {
                    self.reloadSearchedInternalDocuments(self.grid.page);
                })
                ;
        };

        /**
         * @description Manage Linked Entities
         * @param searchedInternalDocument
         * @param $event
         */
        self.manageLinkedEntities = function (searchedInternalDocument, $event) {
            managerService
                .manageDocumentEntities(searchedInternalDocument.vsId, searchedInternalDocument.docClassName, searchedInternalDocument.docSubject, $event);
        };

        /**
         * @description download main document for searched internal document
         * @param searchedInternalDocument
         * @param $event
         */
        self.downloadMainDocument = function (searchedInternalDocument, $event) {
            downloadService.controllerMethod
                .mainDocumentDownload(searchedInternalDocument.vsId);
        };

        /**
         * @description download composite document for searched internal document
         * @param searchedInternalDocument
         * @param $event
         */
        self.downloadCompositeDocument = function (searchedInternalDocument, $event) {
            downloadService.controllerMethod.compositeDocumentDownload(searchedInternalDocument.vsId);
        };

        /**
         * @description send link to document for searched internal document
         * @param searchedInternalDocument
         * @param $event
         */
        self.sendLinkToDocumentByEmail = function (searchedInternalDocument, $event) {
            downloadService.getMainDocumentEmailContent(searchedInternalDocument.getInfo().vsId);
        };

        /**
         * @description send composite document as attachment for searched internal document
         * @param searchedInternalDocument
         * @param $event
         */
        self.sendCompositeDocumentAsAttachmentByEmail = function (searchedInternalDocument, $event) {
            downloadService.getCompositeDocumentEmailContent(searchedInternalDocument.getInfo().vsId);
        };


        /**
         * @description send main document fax for searched internal document
         * @param searchedInternalDocument
         * @param $event
         */
        self.sendMainDocumentFax = function (searchedInternalDocument, $event) {
            searchedInternalDocument.openSendFaxDialog($event);
        };

        /**
         * @description send sms for searched internal document
         * @param searchedInternalDocument
         * @param $event
         * @param defer
         */
        self.sendSMS = function (searchedInternalDocument, $event, defer) {
            searchedInternalDocument.openSendSMSDialog($event)
                .then(function (result) {
                    new ResolveDefer(defer);
                });
        };

        /**
         * @description Send Document Link
         * @param searchedInternalDocument
         * @param $event
         */
        self.sendDocumentLink = function (searchedInternalDocument, $event) {
            searchedInternalDocument.openSendDocumentURLDialog($event);
        };

        /**
         * @description get link for searched internal document
         * @param searchedInternalDocument
         * @param $event
         */
        self.getLink = function (searchedInternalDocument, $event) {
            viewDocumentService.loadDocumentViewUrlWithOutEdit(searchedInternalDocument.vsId).then(function (result) {
                //var docLink = "<a target='_blank' href='" + result + "'>" + result + "</a>";
                dialog.successMessage(langService.get('link_message').change({result: result}), null, null, null, null, true);
                return true;
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
         * @description create copy for searched internal document
         * @param searchedInternalDocument
         * @param $event
         */
        self.createCopy = function (searchedInternalDocument, $event) {
            console.log('create copy for searched internal document : ', searchedInternalDocument);
        };

        /**
         * @description Preview document
         * @param searchedInternalDocument
         * @param $event
         */
        self.previewDocument = function (searchedInternalDocument, $event) {
            if (!searchedInternalDocument.hasContent()) {
                dialog.alertMessage(langService.get('content_not_found'));
                return;
            }
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            correspondenceService.viewCorrespondence(searchedInternalDocument, self.gridActions, true, true)
                .then(function () {
                    //  return self.reloadSearchedInternalDocuments(self.grid.page);
                })
                .catch(function () {
                    //  return self.reloadSearchedInternalDocuments(self.grid.page);
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
            correspondence.viewFromQueue(self.gridActions, 'searchInternal', $event)
                .then(function () {
                    // return self.reloadSearchedInternalDocuments(self.grid.page);
                })
                .catch(function () {
                    //  return self.reloadSearchedInternalDocuments(self.grid.page);
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
                    $state.go('app.internal.add', {
                        vsId: info.vsId,
                        action: 'duplicateVersion',
                        workItem: info.wobNum
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
                    $state.go('app.internal.add', {
                        vsId: info.vsId,
                        action: 'duplicateVersion',
                        workItem: info.wobNum
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
                    self.reloadSearchedInternalDocuments(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                            new ResolveDefer(defer);
                        })
                })
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
                        gridName: 'search-internal'
                    }
                ],
                class: "action-green",
                checkShow: function (action, model) {
                    return true;
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
                    return true;
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
                    ''// archive
                ],
                checkAnyPermission: true,
                checkShow: function (action, model) {
                    return true;
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
                        icon: 'star',
                        text: 'grid_action_archive',
                        callback: self.addToIcnArchive,
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
             callback: self.exportSearchInternalDocument,
             hide: true,
             class: "action-green",
             checkShow: function (action, model) {
                            return true;
                        }
             },*/
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
                subMenu: viewTrackingSheetService.getViewTrackingSheetOptions('grid', gridService.grids.search.internal)
            },
            // Manage
            {
                type: 'action',
                icon: 'settings',
                text: 'grid_action_manage',
                shortcut: false,
                checkShow: function (action, model) {
                    return true;
                },
                permissionKey: [
                    "MANAGE_DOCUMENT’S_TAGS",
                    "MANAGE_DOCUMENT’S_COMMENTS",
                    "MANAGE_TASKS",
                    "MANAGE_ATTACHMENTS",
                    "MANAGE_LINKED_DOCUMENTS",
                    "MANAGE_LINKED_ENTITIES"
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
                    return true;
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
                    return true;
                },
                permissionKey: [
                    "SEND_LINK_TO_THE_DOCUMENT_BY_EMAIL",
                    "SEND_COMPOSITE_DOCUMENT_BY_EMAIL",
                    "SEND_DOCUMENT_BY_FAX",
                    "SEND_SMS",
                    "" // document link
                ],
                checkAnyPermission: true,
                subMenu: [
                    // Link To Document By Email
                    {
                        type: 'action',
                        icon: 'link-variant',
                        text: 'grid_action_link_to_document_by_email',
                        shortcut: false,
                        permissionKey: 'SEND_LINK_TO_THE_DOCUMENT_BY_EMAIL',
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
                        callback: self.sendMainDocumentFax,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
                        },
                        permissionKey: "SEND_DOCUMENT_BY_FAX"
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
                        permissionKey: "",
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
            // Duplicate
            {
                type: 'action',
                icon: 'settings',
                text: 'grid_action_duplicate',
                shortcut: false,
                showInView: false,
                checkShow: function (action, model) {
                    return true;
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
