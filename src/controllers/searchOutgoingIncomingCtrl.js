module.exports = function (app) {
    app.controller('searchOutgoingIncomingCtrl', function (lookupService,
                                                           langService,
                                                           ResolveDefer,
                                                           viewDocumentService,
                                                           organizations,
                                                           searchOutgoingIncomingService,
                                                           $q,
                                                           _,
                                                           $filter,
                                                           OutgoingIncomingSearch,
                                                           propertyConfigurations,
                                                           validationService,
                                                           generator,
                                                           //rootEntity,
                                                           managerService,
                                                           contextHelpService,
                                                           toast,
                                                           viewTrackingSheetService,
                                                           downloadService,
                                                           distributionWorkflowService,
                                                           counterService,
                                                           employeeService,
                                                           correspondenceService,
                                                           $state,
                                                           dialog,
                                                           mailNotificationService,
                                                           favoriteDocumentsService,
                                                           gridService
    ) {
        'ngInject';
        var self = this;
        self.controllerName = 'searchOutgoingIncomingCtrl';
        contextHelpService.setHelpTo('search-outgoing-incoming');

        // employee service to check the permission in html
        self.employeeService = employeeService;

        self.searchOutgoingIncoming = new OutgoingIncomingSearch({dummySearchDocClass: 'outgoingIncoming'});
        self.searchOutgoingIncomingModel = angular.copy(self.searchOutgoingIncoming);

        self.propertyConfigurations = propertyConfigurations;
        self.emptyResults = false;
        /**
         * @description Get the dynamic required fields
         */
        self.getSearchOutgoingIncomingRequiredFields = function () {
            var requiredFields = _.map(_.filter(self.propertyConfigurations, function (propertyConfiguration) {
                return propertyConfiguration.isMandatory;
            }), 'symbolicName');
            requiredFields.push('year');
            return requiredFields;
        };

        self.requiredFieldsSearchOutgoingIncoming = self.getSearchOutgoingIncomingRequiredFields();

        self.validateLabelsSearchOutgoingIncoming = {};


        /**
         * @description Checks if the field is mandatory
         * @param fieldName
         * @param langKey
         * @returns {Array}
         */
        self.dynamicRequired = function (fieldName, langKey) {
            if (self.requiredFieldsSearchOutgoingIncoming.indexOf(fieldName) > -1) {
                var obj = {};
                obj[fieldName] = langKey;
                if (!_.some(self.validateLabelsSearchOutgoingIncoming, obj)) {
                    self.validateLabelsSearchOutgoingIncoming[fieldName] = langKey;
                }
                return true;
            }
            return false;
        };
        /*
                // in case of central archive.
                self.registryOrganizations = centralArchives;

                self.isSearchByRegOU = true;
                self.getTranslatedYesNo = function (fieldName) {
                    return self[fieldName] ? langService.get('yes') : langService.get('no');
                };

                self.ouToggleDefaultDisabled = false;
                self.regOuToggleDefaultDisabled = false;

                self.checkRegOuToggleDisabled = function () {
                    if (employeeService.isCentralArchive()) {
                        return self.searchOutgoingOutgoingIncoming.ou;
                    }
                    return false;
                };

                self.checkOuToggleDisabled = function () {
                    if (employeeService.isCentralArchive()) {
                        return self.isSearchByRegOU;
                    }
                    return false;
                };

                self.changeRegOuToggle = function () {
                    if (!self.isSearchByRegOU) {
                        self.searchOutgoingOutgoingIncoming.regOu = null;
                    }
                };

                self.changeOuToggle = function () {
                    /!*self.isSearchByRegOU = false;
                     self.searchOutgoingOutgoingIncoming.regOu = null;*!/
                };*/

        /**
         * @description Checks the required fields validation
         * @param model
         * @returns {Array}
         */
        self.checkRequiredFieldsSearchOutgoingIncoming = function (model) {
            var required = self.requiredFieldsSearchOutgoingIncoming, result = [];
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
        self.searchedOutgoingIncomingDocuments = [];

        self.progress = null;
        /**
         * @description Contains the selected search results
         * @type {Array}
         */
        self.selectedSearchedOutgoingIncomingDocuments = [];

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

        function _incomingCorrespondence(correspondence) {
            correspondence.mainSiteId = true;
            return correspondence;
        }

        function _outgoingCorrespondence(correspondence) {
            correspondence.sitesInfoTo = [true];
            return correspondence;
        }


        /**
         * @description Search the document on basis of search criteria
         */
        self.search = function ($event) {
            /*if(self.isSearchByRegOU){
                if(!employeeService.isCentralArchive()){
                    self.searchOutgoingOutgoingIncoming.registryOU = employeeService.getCurrentOUApplicationUser().ouRegistryID;
                }
            }
            else{
                self.searchOutgoingOutgoingIncoming.registryOU = null;
            }*/

            validationService
                .createValidation('SEARCH_OUTGOING_INCOMING')
                .addStep('check_required', true, self.checkRequiredFieldsSearchOutgoingIncoming, self.searchOutgoingIncoming, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabelsSearchOutgoingIncoming[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .validate()
                .then(function () {
                    searchOutgoingIncomingService
                        .searchOutgoingIncomingDocuments(self.searchOutgoingIncoming, self.propertyConfigurations)
                        .then(function (result) {
                            self.searchOutgoingIncomingModel = angular.copy(self.searchOutgoingIncoming);
                            self.showResults = true;
                            self.selectedTab = 1;
                            self.searchedOutgoingIncomingDocuments = _mapResultToAvoidCorrespondenceCheck(result);
                            self.selectedSearchedOutgoingIncomingDocuments = [];
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
            self.searchOutgoingIncoming = new OutgoingIncomingSearch();
            self.searchOutgoingIncomingModel = angular.copy(self.searchOutgoingIncoming);
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

        //self.globalSetting = rootEntity.returnRootEntity().settings;
        /**
         * @description Contains options for grid configuration
         * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
         */
        self.grid = {
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.search.outgoingIncoming) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.search.outgoingIncoming, self.searchedOutgoingIncomingDocuments),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.search.outgoingIncoming, limit);
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
            self.searchedOutgoingIncomingDocuments = $filter('orderBy')(self.searchedOutgoingIncomingDocuments, self.grid.order);
        };

        /**
         * @description Reload the grid of searched outgoing incoming documents
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadSearchedOutgoingIncomingDocument = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;
            return searchOutgoingIncomingService
                .searchOutgoingIncomingDocuments(self.searchOutgoingIncomingModel, self.propertyConfigurations)
                .then(function (result) {
                    counterService.loadCounters();
                    self.searchedOutgoingIncomingDocuments = _mapResultToAvoidCorrespondenceCheck(result);
                    self.selectedSearchedOutgoingIncomingDocuments = [];
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
                .favoriteDocumentAddBulk(self.selectedSearchedOutgoingIncomingDocuments, $event)
                .then(function (result) {
                    self.reloadSearchedOutgoingIncomingDocument(self.grid.page);
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
                    }
                    else {
                        dialog.alertMessage(langService.get(result.message));
                    }
                });
        };

        /**
         * @description Create Reply
         * @param correspondence
         * @param $event
         */
        self.createReply = function (correspondence, $event) {
            var info = correspondence.getInfo();
            dialog.hide();
            $state.go('app.outgoing.add', {vsId: info.vsId, action: 'reply'});
        };

        /**
         * @description Launch distribution workflow for internal item
         * @param correspondence
         * @param $event
         */

        self.launchDistributionWorkflow = function (correspondence, $event) {
            if (!correspondence.hasContent()) {
                dialog.alertMessage(langService.get("content_not_found"));
                return;
            }

            correspondence.launchWorkFlowAndCheckExists($event, null, 'favorites')
                .then(function () {
                    self.reloadSearchedOutgoingIncomingDocument(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                        });
                });
        };

        /**
         * @description Print Barcode
         * @param correspondence
         * @param $event
         */
        self.printBarcode = function (correspondence, $event) {
            correspondence.barcodePrint($event);
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
         * @description manage tag for searched document
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
         * @description manage comments for searched document
         * @param correspondence
         * @param $event
         */
        self.manageComments = function (correspondence, $event) {
            managerService.manageDocumentComments(correspondence.vsId, correspondence.docSubject, $event)
                .then(function (documentComments) {
                    correspondence.documentComments = documentComments;
                })
                .catch(function (documentComments) {
                    correspondence.documentComments = documentComments;
                });
        };

        /**
         * @description manage tasks for searched  document
         * @param correspondence
         * @param $event
         */
        self.manageTasks = function (correspondence, $event) {
            console.log('manage tasks for searched document : ', correspondence);
        };

        /**
         * @description manage attachments for searched document
         * @param correspondence
         * @param $event
         */
        self.manageAttachments = function (correspondence, $event) {
            correspondence.manageDocumentAttachments($event)
                .then(function () {
                    self.reloadSearchedOutgoingIncomingDocument(self.grid.page);
                })
                .catch(function () {
                    self.reloadSearchedOutgoingIncomingDocument(self.grid.page);
                });
        };

        /**
         * @description manage linked documents for searched document
         * @param correspondence
         * @param $event
         */
        self.manageLinkedDocuments = function (correspondence, $event) {
            var info = correspondence.getInfo();
            return managerService.manageDocumentLinkedDocuments(info.vsId, info.documentClass)
                .then(function () {
                    self.reloadSearchedOutgoingIncomingDocument(self.grid.page);
                }).catch(function () {
                    self.reloadSearchedOutgoingIncomingDocument(self.grid.page);
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
                    self.reloadSearchedOutgoingIncomingDocument(self.grid.page);
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
         * @description download main document for searched document
         * @param correspondence
         * @param $event
         */
        self.downloadMainDocument = function (correspondence, $event) {
            downloadService.controllerMethod
                .mainDocumentDownload(correspondence.vsId);
        };

        /**
         * @description download composite document for searched document
         * @param correspondence
         * @param $event
         */
        self.downloadCompositeDocument = function (correspondence, $event) {
            downloadService.controllerMethod
                .compositeDocumentDownload(correspondence.vsId);
        };

        /**
         * @description send link to document for searched document
         * @param correspondence
         * @param $event
         */
        self.sendLinkToDocumentByEmail = function (correspondence, $event) {
            downloadService.getMainDocumentEmailContent(correspondence.getInfo().vsId);
        };

        /**
         * @description send composite document as attachment for searched document
         * @param correspondence
         * @param $event
         */
        self.sendCompositeDocumentAsAttachmentByEmail = function (correspondence, $event) {
            downloadService.getCompositeDocumentEmailContent(correspondence.getInfo().vsId);
        };

        /**
         * @description send main document fax for searched document
         * @param correspondence
         * @param $event
         */
        self.sendMainDocumentFax = function (correspondence, $event) {
            console.log('send main document fax for searched document : ', correspondence);
        };

        /**
         * @description send sms for searched document
         * @param correspondence
         * @param $event
         */
        self.sendSMS = function (correspondence, $event) {
            console.log('send sms for searched document : ', correspondence);
        };

        /**
         * @description get link for searched document
         * @param correspondence
         * @param $event
         */
        self.getLink = function (correspondence, $event) {
            viewDocumentService.loadDocumentViewUrlWithOutEdit(correspondence.vsId).then(function (result) {
                //var docLink = "<a target='_blank' href='" + result + "'>" + result + "</a>";
                dialog.successMessage(langService.get('link_message').change({result: result}));
                return true;
            });
        };

        /**
         * @description subscribe for searched document
         * @param correspondence
         * @param $event
         */
        self.subscribe = function (correspondence, $event) {
            console.log('subscribe for searched document : ', correspondence);
        };

        /**
         * @description create copy for searched document
         * @param correspondence
         * @param $event
         */
        self.createCopy = function (correspondence, $event) {
            console.log('create copy for searched document : ', correspondence);
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
            correspondenceService.viewCorrespondence(correspondence, self.gridActions, true, checkIfEditCorrespondenceSiteAllowed(correspondence, true))
                .then(function () {
                    return self.reloadSearchedOutgoingIncomingDocument(self.grid.page);
                })
                .catch(function () {
                    return self.reloadSearchedOutgoingIncomingDocument(self.grid.page);
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
            correspondence.viewFromQueue(self.gridActions, 'searchOutgoingIncoming', $event)
                .then(function () {
                    return self.reloadSearchedOutgoingIncomingDocument(self.grid.page);
                })
                .catch(function (error) {
                    return self.reloadSearchedOutgoingIncomingDocument(self.grid.page);
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
                    $state.go('app.' + info.documentClass.toLowerCase() + '.add', {
                        vsId: info.vsId,
                        action: 'duplicateVersion',
                        workItem: info.wobNum
                    });
                });
        };

        /**
         * @description Check if action will be shown on grid or not
         * @param action
         * @param model
         * @returns {boolean}
         */
        self.checkToShowAction = function (action, model) {
            var hasPermission = true;
            if (action.hasOwnProperty('permissionKey')) {
                if (typeof action.permissionKey === 'string') {
                    hasPermission = employeeService.hasPermissionTo(action.permissionKey);
                }
                else if (angular.isArray(action.permissionKey) && action.permissionKey.length) {
                    if (action.hasOwnProperty('checkAnyPermission')) {
                        hasPermission = employeeService.getEmployee().hasAnyPermissions(action.permissionKey);
                    }
                    else {
                        hasPermission = employeeService.getEmployee().hasThesePermissions(action.permissionKey);
                    }
                }
            }
            return (!action.hide) && hasPermission;
        };

        /**
         * @description do broadcast for correspondence.
         */
        self.broadcast = function (correspondence, $event, defer) {
            correspondence
                .correspondenceBroadcast()
                .then(function () {
                    self.reloadSearchedOutgoingIncomingDocument(self.grid.page)
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
                        checkShow: self.checkToShowAction,
                        gridName: 'search-outgoing-incoming'
                    }
                ],
                class: "action-green",
                checkShow: self.checkToShowAction
            },
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
                    //If no content or no view document permission, hide the button
                    return self.checkToShowAction(action, model) && model.hasContent();
                }
            },
            // Separator
            {
                type: 'separator',
                checkShow: self.checkToShowAction,
                showInView: false
            },
            // Add To Favorite
            {
                type: 'action',
                icon: 'star',
                text: 'grid_action_add_to_favorite',
                permissionKey: "MANAGE_FAVORITE",
                shortcut: false,
                callback: self.addToFavorite,
                class: "action-green",
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    return self.checkToShowAction(action, model) && info.docStatus >= 22;
                }
            },
            // Open
            {
                type: 'action',
                icon: 'book-open-variant',
                text: 'grid_action_open',
                shortcut: false,
                showInView: false,
                callback: self.viewDocument,
                class: "action-green",
                permissionKey: 'VIEW_DOCUMENT',
                checkShow: function (action, model) {
                    //If no content or no view document permission, hide the button
                    return self.checkToShowAction(action, model) && model.hasContent();
                }
            },
            // Create Reply
            {
                type: 'action',
                icon: 'pen',
                text: 'grid_action_create_reply',
                shortcut: false,
                permissionKey: 'CREATE_REPLY',
                callback: self.createReply,
                class: "action-green",
                //hide: true, //TODO: Need service from Issawi
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    return self.checkToShowAction(action, model) && info.documentClass === 'incoming';
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
                    var info = model.getInfo();
                    return self.checkToShowAction(action, model)
                        && (info.isPaper || (!info.isPaper && info.docStatus >= 24));
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
                    return self.checkToShowAction(action, model) && (!model.needApprove() || model.hasDocumentClass('incoming')) && (model.getSecurityLevelLookup().lookupKey !== 4);
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
                    return self.checkToShowAction(action, model)
                        && (info.documentClass === "incoming" || ((info.documentClass === "outgoing" || info.documentClass === 'internal') && (!model.needApprove() || info.isPaper)));
                }
            },
            // View Tracking Sheet
            {
                type: 'action',
                icon: 'eye',
                text: 'grid_action_view_tracking_sheet',
                shortcut: false,
                permissionKey: "VIEW_DOCUMENT'S_TRACKING_SHEET",
                checkShow: self.checkToShowAction,
                subMenu: viewTrackingSheetService.getViewTrackingSheetOptions(self.checkToShowAction, self.viewTrackingSheet, 'grid')
            },
            // Manage
            {
                type: 'action',
                icon: 'settings',
                text: 'grid_action_manage',
                shortcut: false,
                checkShow: self.checkToShowAction,
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
                        checkShow: self.checkToShowAction
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
                        checkShow: self.checkToShowAction
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
                        checkShow: self.checkToShowAction
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
                        checkShow: self.checkToShowAction
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
                        checkShow: self.checkToShowAction
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
                        checkShow: self.checkToShowAction
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
                            return self.checkToShowAction(action, model) && checkIfEditCorrespondenceSiteAllowed(model, false);
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
                checkShow: self.checkToShowAction,
                permissionKey: [
                    "DOWNLOAD_MAIN_DOCUMENT",
                    "" //Composite Document permission not available in database
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
                        checkShow: self.checkToShowAction
                    },
                    // Composite Document
                    {
                        type: 'action',
                        icon: 'file-document',
                        text: 'grid_action_composite_document',
                        shortcut: false,
                        callback: self.downloadCompositeDocument,
                        class: "action-green",
                        checkShow: self.checkToShowAction
                    }
                ]
            },
            // Send
            {
                type: 'action',
                icon: 'send',
                text: 'grid_action_send',
                shortcut: false,
                checkShow: self.checkToShowAction,
                permissionKey: [
                    "SEND_LINK_TO_THE_DOCUMENT_BY_EMAIL",
                    "SEND_COMPOSITE_DOCUMENT_BY_EMAIL",
                    "SEND_DOCUMENT_BY_FAX",
                    "SEND_SMS"
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
                        checkShow: self.checkToShowAction
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
                        checkShow: self.checkToShowAction
                    },
                    // Main Document Fax
                    {
                        type: 'action',
                        icon: 'fax',
                        text: 'grid_action_main_document_fax',
                        shortcut: false,
                        hide: true,
                        permissionKey: "SEND_DOCUMENT_BY_FAX",
                        callback: self.sendMainDocumentFax,
                        class: "action-red",
                        checkShow: self.checkToShowAction
                    },
                    // SMS
                    {
                        type: 'action',
                        icon: 'message',
                        text: 'grid_action_send_sms',
                        shortcut: false,
                        hide: true,
                        permissionKey: "SEND_SMS",
                        callback: self.sendSMS,
                        class: "action-red",
                        checkShow: self.checkToShowAction
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
                hide: false,
                checkShow: self.checkToShowAction
            },
            // Subscribe
            {
                type: 'action',
                icon: 'bell-plus',
                text: 'grid_action_subscribe',
                shortcut: false,
                callback: self.subscribe,
                class: "action-red",
                hide: true,
                checkShow: self.checkToShowAction
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
                checkShow: self.checkToShowAction
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
                checkShow: self.checkToShowAction
            },
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
                    return self.checkToShowAction(action, model) && (info.documentClass === 'outgoing' || info.documentClass === 'internal') && !info.isPaper;
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
                checkShow: self.checkToShowAction
            }
        ];
    });
};