module.exports = function (app) {
    app.controller('searchIncomingCtrl', function (lookupService,
                                                   langService,
                                                   ResolveDefer,
                                                   viewDocumentService,
                                                   organizations,
                                                   searchIncomingService,
                                                   organizationService,
                                                   $q,
                                                   $filter,
                                                   Organization,
                                                   _,
                                                   IncomingSearch,
                                                   propertyConfigurations,
                                                   validationService,
                                                   generator,
                                                   rootEntity,
                                                   managerService,
                                                   contextHelpService,
                                                   toast,
                                                   viewTrackingSheetService,
                                                   downloadService,
                                                   counterService,
                                                   employeeService,
                                                   correspondenceService,
                                                   $state,
                                                   dialog,
                                                   mailNotificationService,
                                                   gridService,
                                                   favoriteDocumentsService,
                                                   centralArchives,
                                                   userSubscriptionService,
                                                   printService) {
        'ngInject';
        var self = this;
        self.controllerName = 'searchIncomingCtrl';
        contextHelpService.setHelpTo('search-incoming');

        // employee service to check the permission in html
        self.employeeService = employeeService;

        self.searchIncoming = new IncomingSearch({dummySearchDocClass: 'incoming'});
        self.searchIncomingModel = angular.copy(self.searchIncoming);

        self.propertyConfigurations = propertyConfigurations;
        self.emptyResults = false;


        self.loadSubOrganizations = false;

        if (!self.employeeService.hasPermissionTo('SEARCH_IN_ALL_OU')) {
            self.searchIncoming.registryOU = self.employeeService.getEmployee().getRegistryOUID();
            self.searchIncoming.ou = self.employeeService.getEmployee().getOUID();
            self.loadSubOrganizations = true;
        }
        /**
         * @description Get the dynamic required fields
         */
        self.getSearchIncomingRequiredFields = function () {
            var requiredFields = _.map(_.filter(self.propertyConfigurations, function (propertyConfiguration) {
                return propertyConfiguration.isMandatory;
            }), 'symbolicName');
            requiredFields.push('year');
            return requiredFields;
        };

        self.requiredFieldsSearchIncoming = self.getSearchIncomingRequiredFields();

        self.validateLabelsSearchIncoming = {};

        self.registryOrganizations = employeeService.isCentralArchive() ? angular.copy(centralArchives) : angular.copy(organizationService.getAllRegistryOrganizations());

        /**
         * @description Checks if the field is mandatory
         * @param fieldName
         * @param langKey
         * @returns {Array}
         */
        self.dynamicRequired = function (fieldName, langKey) {
            if (self.requiredFieldsSearchIncoming.indexOf(fieldName) > -1) {
                var obj = {};
                obj[fieldName] = langKey;
                if (!_.some(self.validateLabelsSearchIncoming, obj)) {
                    self.validateLabelsSearchIncoming[fieldName] = langKey;
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
        self.checkRequiredFieldsSearchIncoming = function (model) {
            var required = self.requiredFieldsSearchIncoming, result = [];
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
        self.searchedIncomingDocuments = [];

        self.progress = null;
        /**
         * @description Contains the selected search results
         * @type {Array}
         */
        self.selectedSearchedIncomingDocuments = [];

        function _mapResultToAvoidCorrespondenceCheck(result) {
            return _.map(result, function (item) {
                item.mainSiteId = true;
                return item;
            });
        }


        /**
         * @description Search the document on basis of search criteria
         */
        self.search = function ($event) {
            /*if(self.isSearchByRegOU){
                if(!employeeService.isCentralArchive()){
                    self.searchIncoming.registryOU = employeeService.getCurrentOUApplicationUser().ouRegistryID;
                }
            }
            else{
                self.searchIncoming.registryOU = null;
            }*/

            validationService
                .createValidation('SEARCH_INCOMING')
                .addStep('check_required', true, self.checkRequiredFieldsSearchIncoming, self.searchIncoming, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabelsSearchIncoming[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .validate()
                .then(function () {
                    searchIncomingService
                        .searchIncomingDocuments(self.searchIncoming, self.propertyConfigurations)
                        .then(function (result) {
                            self.searchIncomingModel = angular.copy(self.searchIncoming);
                            self.showResults = true;
                            self.selectedTab = 1;
                            self.searchedIncomingDocuments = _mapResultToAvoidCorrespondenceCheck(result);
                            self.selectedSearchedIncomingDocuments = [];
                        })
                        .catch(function (error) {

                        });
                })
                .catch(function (e) {

                });
        };

        /**
         * @description Resets the document search criteria
         * @param form
         * @param $event
         */
        self.resetFilters = function (form, $event) {
            self.searchIncoming = new IncomingSearch();
            self.searchIncomingModel = angular.copy(self.searchIncoming);
            self.emptyResults = true;
            form.$setUntouched();
        };

        /**
         * @description Saves the search criteria
         * @param form
         * @param $event
         */
        self.saveSearch = function (form, $event) {

        };

        self.printResult = function ($event) {
            var printTitle = langService.get("search_module_search_results") + " " + langService.get("from") + " " + generator.convertDateToString(self.searchIncoming.docDateFrom) +
                " " + langService.get("to") + " " + generator.convertDateToString(self.searchIncoming.docDateTo);

            var headers = ['label_serial',
                'subject',
                'priority_level',
                'label_document_type',
                'creator',
                'created_on',
                'correspondence_sites'];

            printService
                .printData(self.searchedIncomingDocuments, headers, printTitle);

        };


        self.globalSetting = rootEntity.returnRootEntity().settings;
        /**
         * @description Contains options for grid configuration
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         */
        self.grid = {
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.search.incoming) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.search.incoming, self.searchedIncomingDocuments),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.search.incoming, limit);
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
            self.searchedIncomingDocuments = $filter('orderBy')(self.searchedIncomingDocuments, self.grid.order);
        };

        /**
         * @description Reload the grid of searched incoming documents
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadSearchedIncomingDocument = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;
            return searchIncomingService
                .searchIncomingDocuments(self.searchIncomingModel, self.propertyConfigurations)
                .then(function (result) {
                    counterService.loadCounters();
                    self.searchedIncomingDocuments = _mapResultToAvoidCorrespondenceCheck(result);
                    self.selectedSearchedIncomingDocuments = [];
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
                .favoriteDocumentAddBulk(self.selectedSearchedIncomingDocuments, $event)
                .then(function (result) {
                    self.reloadSearchedIncomingDocument(self.grid.page);
                });
        };


        /**
         * @description add an item to the favorite documents
         * @param searchedIncomingDocument
         * @param $event
         */
        self.addToFavorite = function (searchedIncomingDocument, $event) {
            favoriteDocumentsService.controllerMethod
                .favoriteDocumentAdd(searchedIncomingDocument.getInfo().vsId, $event)
                .then(function (result) {
                    if (result.status) {
                        toast.success(langService.get("add_to_favorite_specific_success").change({
                            name: searchedIncomingDocument.getTranslatedName()
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
                    self.reloadSearchedIncomingDocument(self.grid.page);
                    new ResolveDefer(defer);
                });
        };

        /*
         /!**
         * @description Export searched incoming document
         * @param searchedIncomingDocument
         * @param $event
         * @type {[*]}
         *!/
         self.exportSearchIncomingDocument = function (searchedIncomingDocument, $event) {
         //console.log('export searched incoming document : ', searchedIncomingDocument);
         searchIncomingService
         .exportSearchIncoming(searchedIncomingDocument, $event)
         .then(function (result) {
         self.reloadSearchedIncomingDocument(self.grid.page)
         .then(function () {
         toast.success(langService.get('export_success'));
         });
         });
         };*/


        /**
         * @description Launch distribution workflow for incoming item
         * @param searchedIncomingDocument
         * @param $event
         */
        self.launchDistributionWorkflow = function (searchedIncomingDocument, $event) {
            if (!searchedIncomingDocument.hasContent()) {
                dialog.alertMessage(langService.get("content_not_found"));
                return;
            }
            searchedIncomingDocument.launchWorkFlow($event, null, 'favorites')
                .then(function () {
                    self.reloadSearchedIncomingDocument(self.grid.page)
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
         * @param searchedIncomingDocument
         * @param $event
         */
        self.printBarcode = function (searchedIncomingDocument, $event) {
            searchedIncomingDocument.barcodePrint($event);
        };

        /**
         * @description View Tracking Sheet
         * @param searchedIncomingDocument
         * @param params
         * @param $event
         */
        self.viewTrackingSheet = function (searchedIncomingDocument, params, $event) {
            viewTrackingSheetService
                .controllerMethod
                .viewTrackingSheetPopup(searchedIncomingDocument, params, $event).then(function (result) {
            });
        };

        /**
         * @description manage tag for searched incoming document
         * @param searchedIncomingDocument
         * @param $event
         */
        self.manageTags = function (searchedIncomingDocument, $event) {
            managerService.manageDocumentTags(searchedIncomingDocument.vsId, searchedIncomingDocument.docClassName, searchedIncomingDocument.docSubject, $event)
                .then(function (tags) {
                    searchedIncomingDocument.tags = tags;
                })
                .catch(function (tags) {
                    searchedIncomingDocument.tags = tags;
                });
        };

        /**
         * @description manage comments for searched incoming document
         * @param searchedIncomingDocument
         * @param $event
         */
        self.manageComments = function (searchedIncomingDocument, $event) {
            managerService.manageDocumentComments(searchedIncomingDocument.vsId, searchedIncomingDocument.docSubject, $event)
                .then(function (documentComments) {
                    searchedIncomingDocument.documentComments = documentComments;
                })
                .catch(function (documentComments) {
                    searchedIncomingDocument.documentComments = documentComments;
                });
        };

        /**
         * @description manage tasks for searched incoming document
         * @param searchedIncomingDocument
         * @param $event
         */
        self.manageTasks = function (searchedIncomingDocument, $event) {
            console.log('manage tasks for searched incoming document : ', searchedIncomingDocument);
        };

        /**
         * @description manage attachments for searched incoming document
         * @param searchedIncomingDocument
         * @param $event
         */
        self.manageAttachments = function (searchedIncomingDocument, $event) {
            searchedIncomingDocument.manageDocumentAttachments($event).then(function () {
                self.reloadSearchedIncomingDocument(self.grid.page)
            }).catch(function () {
                self.reloadSearchedIncomingDocument(self.grid.page);
            });
        };

        /**
         * @description manage linked documents for searched incoming document
         * @param searchedIncomingDocument
         * @param $event
         */
        self.manageLinkedDocuments = function (searchedIncomingDocument, $event) {
            var info = searchedIncomingDocument.getInfo();
            return managerService.manageDocumentLinkedDocuments(info.vsId, info.documentClass)
                .then(function () {
                    self.reloadSearchedIncomingDocument(self.grid.page);
                })
                .catch(function () {
                    self.reloadSearchedIncomingDocument(self.grid.page);
                });
        };

        /**
         * @description Manage Linked Entities
         * @param searchedIncomingDocument
         * @param $event
         */
        self.manageLinkedEntities = function (searchedIncomingDocument, $event) {
            managerService
                .manageDocumentEntities(searchedIncomingDocument.vsId, searchedIncomingDocument.docClassName, searchedIncomingDocument.docSubject, $event);
        };

        /**
         * @description Destinations
         * @param searchedIncomingDocument
         * @param $event
         */
        self.manageDestinations = function (searchedIncomingDocument, $event) {
            managerService.manageDocumentCorrespondence(searchedIncomingDocument.vsId, searchedIncomingDocument.docClassName, searchedIncomingDocument.docSubject, $event)
        };

        /**
         * @description download main document for searched incoming document
         * @param searchedIncomingDocument
         * @param $event
         */
        self.downloadMainDocument = function (searchedIncomingDocument, $event) {
            downloadService.controllerMethod
                .mainDocumentDownload(searchedIncomingDocument.vsId);
        };

        /**
         * @description download composite document for searched incoming document
         * @param searchedIncomingDocument
         * @param $event
         */
        self.downloadCompositeDocument = function (searchedIncomingDocument, $event) {
            downloadService.controllerMethod
                .compositeDocumentDownload(searchedIncomingDocument.vsId);
        };

        /**
         * @description send link to document for searched incoming document
         * @param searchedIncomingDocument
         * @param $event
         */
        self.sendLinkToDocumentByEmail = function (searchedIncomingDocument, $event) {
            downloadService.getMainDocumentEmailContent(searchedIncomingDocument.getInfo().vsId);
        };

        /**
         * @description send composite document as attachment for searched incoming document
         * @param searchedIncomingDocument
         * @param $event
         */
        self.sendCompositeDocumentAsAttachmentByEmail = function (searchedIncomingDocument, $event) {
            downloadService.getCompositeDocumentEmailContent(searchedIncomingDocument.getInfo().vsId);
        };


        /**
         * @description send main document fax for searched incoming document
         * @param searchedIncomingDocument
         * @param $event
         */
        self.sendMainDocumentFax = function (searchedIncomingDocument, $event) {
            searchedIncomingDocument.openSendFaxDialog($event);
        };

        /**
         * @description send sms for searched incoming document
         * @param searchedIncomingDocument
         * @param $event
         * @param defer
         */
        self.sendSMS = function (searchedIncomingDocument, $event, defer) {
            searchedIncomingDocument.openSendSMSDialog($event)
                .then(function (result) {
                    new ResolveDefer(defer);
                });
        };

        /**
         * @description Send Document Link
         * @param searchedIncomingDocument
         * @param $event
         */
        self.sendDocumentLink = function (searchedIncomingDocument, $event) {
            searchedIncomingDocument.openSendDocumentURLDialog($event);
        };

        /**
         * @description get link for searched incoming document
         * @param searchedIncomingDocument
         * @param $event
         */
        self.getLink = function (searchedIncomingDocument, $event) {
            viewDocumentService.loadDocumentViewUrlWithOutEdit(searchedIncomingDocument.vsId).then(function (result) {
                //var docLink = "<a target='_blank' href='" + result + "'>" + result + "</a>";
                dialog.successMessage(langService.get('link_message').change({result: result}), null, null, null, null, true);
                return true;
            });
        };

        /**
         * @description create copy for searched incoming document
         * @param searchedIncomingDocument
         * @param $event
         */
        self.createCopy = function (searchedIncomingDocument, $event) {
            console.log('create copy for searched incoming document : ', searchedIncomingDocument);
        };

        /**
         * @description Create Reply
         * @param correspondence
         * @param $event
         * @param defer
         */
        self.createReplyIncoming = function (correspondence, $event, defer) {
            correspondence.createReply($event, defer)
                .then(function (result) {
                    new ResolveDefer(defer);
                });
            /*var info = correspondence.getInfo();
            dialog.hide();
            $state.go('app.outgoing.add', {vsId: info.vsId, action: 'reply'});*/
        };

        var checkIfEditCorrespondenceSiteAllowed = function (model, checkForViewPopup) {
            var hasPermission = employeeService.hasPermissionTo("MANAGE_DESTINATIONS");
            if (checkForViewPopup)
                return !(hasPermission);
            return hasPermission;
        };

        /**
         * @description Preview document
         * @param searchedIncomingDocument
         * @param $event
         */
        self.previewDocument = function (searchedIncomingDocument, $event) {
            if (!searchedIncomingDocument.hasContent()) {
                dialog.alertMessage(langService.get('content_not_found'));
                return;
            }
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            correspondenceService.viewCorrespondence(searchedIncomingDocument, self.gridActions, true, checkIfEditCorrespondenceSiteAllowed(searchedIncomingDocument, true))
                .then(function () {
                    //  return self.reloadSearchedIncomingDocument(self.grid.page);
                })
                .catch(function () {
                    //   return self.reloadSearchedIncomingDocument(self.grid.page);
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
            correspondence.viewFromQueue(self.gridActions, 'searchIncoming', $event)
                .then(function () {
                    //  return self.reloadSearchedIncomingDocument(self.grid.page);
                })
                .catch(function (error) {
                    // return self.reloadSearchedIncomingDocument(self.grid.page);
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
                    $state.go('app.incoming.add', {
                        vsId: info.vsId,
                        action: 'duplicateVersion',
                        workItem: info.wobNum
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
                    self.reloadSearchedIncomingDocument(self.grid.page)
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
                        gridName: 'search-incoming'
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
                        text: 'grid_action_icn_archive',
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
             callback: self.exportSearchIncomingDocument,
             class: "action-green",
             checkShow: function (action, model) {
                            return true;
                        }
             },*/
            // Create Reply
            {
                type: 'action',
                icon: 'pen',
                text: 'grid_action_create_reply',
                shortcut: false,
                permissionKey: 'CREATE_REPLY',
                callback: self.createReplyIncoming,
                class: "action-green",
                checkShow: function (action, model) {
                    return true;
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
                    return (model.getSecurityLevelLookup().lookupKey !== 4);
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
                    return true;
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
                subMenu: viewTrackingSheetService.getViewTrackingSheetOptions('grid', gridService.grids.search.incoming)
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
                        class: "action-green",
                        permissionKey: "MANAGE_LINKED_ENTITIES",
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
                        permissionKey: "SEND_DOCUMENT_BY_FAX",
                        callback: self.sendMainDocumentFax,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return true;
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
                    "DUPLICATE_BOOK_FROM_VERSION"
                ],
                checkAnyPermission: true,
                subMenu: [
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
