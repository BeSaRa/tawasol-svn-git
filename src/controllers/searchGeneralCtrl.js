module.exports = function (app) {
    app.controller('searchGeneralCtrl', function (lookupService,
                                                  langService,
                                                  ResolveDefer,
                                                  viewDocumentService,
                                                  organizations,
                                                  searchGeneralService,
                                                  $q,
                                                  _,
                                                  $filter,
                                                  GeneralSearch,
                                                  propertyConfigurations,
                                                  $state,
                                                  validationService,
                                                  generator,
                                                  rootEntity,
                                                  managerService,
                                                  organizationService,
                                                  contextHelpService,
                                                  toast,
                                                  viewTrackingSheetService,
                                                  downloadService,
                                                  DocumentStatus,
                                                  employeeService,
                                                  counterService,
                                                  Organization,
                                                  correspondenceService,
                                                  dialog,
                                                  mailNotificationService,
                                                  gridService,
                                                  favoriteDocumentsService,
                                                  centralArchives) {
        'ngInject';

        var self = this;
        self.controllerName = 'searchGeneralCtrl';
        contextHelpService.setHelpTo('search-general');
        // employee service to check the permission in html
        self.employeeService = employeeService;

        self.searchGeneral = new GeneralSearch({dummySearchDocClass: 'correspondence'});
        self.searchGeneralModel = angular.copy(self.searchGeneral);
        self.emptyResults = false;

        self.propertyConfigurations = propertyConfigurations;

        /**
         * @description Get the dynamic required fields
         */
        self.getSearchGeneralRequiredFields = function () {
            var requiredFields = _.map(_.filter(self.propertyConfigurations, function (propertyConfiguration) {
                return propertyConfiguration.isMandatory;
            }), 'symbolicName');
            requiredFields.push('year');
            requiredFields.push('year');
            return requiredFields;
        };

        self.requiredFieldsSearchGeneral = self.getSearchGeneralRequiredFields();

        self.validateLabelsSearchGeneral = {};

        self.registryOrganizations = employeeService.isCentralArchive() ? angular.copy(centralArchives) : angular.copy(organizationService.getAllRegistryOrganizations());

        self.registryOrganizations.unshift(new Organization({
            id: null,
            arName: langService.getKey('not_found', 'ar'),
            enName: langService.getKey('not_found', 'en')
        }));

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
         * @description Checks if the field is mandatory
         * @param fieldName
         * @param langKey
         * @returns {Array}
         */
        self.dynamicRequired = function (fieldName, langKey) {
            if (self.requiredFieldsSearchGeneral.indexOf(fieldName) > -1) {
                var obj = {};
                obj[fieldName] = langKey;
                if (!_.some(self.validateLabelsSearchGeneral, obj)) {
                    self.validateLabelsSearchGeneral[fieldName] = langKey;
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
        self.checkRequiredFieldsSearchGeneral = function (model) {
            var required = self.requiredFieldsSearchGeneral, result = [];
            _.map(required, function (property) {
                var propertyValueToCheck = model[property];
                if (!generator.validRequired(propertyValueToCheck))
                    result.push(property);
            });
            return [];
            //return result;
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
        self.searchedGeneralDocuments = [];

        self.progress = null;
        /**
         * @description Contains the selected search results
         * @type {Array}
         */
        self.selectedSearchedGeneralDocuments = [];


        /**
         * @description Search the document on basis of search criteria
         */
        self.search = function () {
            /*if(self.isSearchByRegOU){
                if(!employeeService.isCentralArchive()){
                    self.searchGeneral.registryOU = employeeService.getCurrentOUApplicationUser().ouRegistryID;
                }
            }
            else{
                self.searchGeneral.registryOU = null;
            }*/

            validationService
                .createValidation('SEARCH_GENERAL')
                .addStep('check_required', true, self.checkRequiredFieldsSearchGeneral, self.searchGeneral, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabelsSearchGeneral[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .validate()
                .then(function () {
                    searchGeneralService
                        .searchGeneralDocuments(self.searchGeneral, self.propertyConfigurations)
                        .then(function (result) {
                            self.searchGeneralModel = angular.copy(self.searchGeneral);
                            self.showResults = true;
                            self.selectedTab = 1;
                            self.searchedGeneralDocuments = result;
                            self.selectedSearchedGeneralDocuments = [];
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
            self.searchGeneral = new GeneralSearch();
            self.searchGeneralModel = angular.copy(self.searchGeneral);
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
            var headers = ['label_serial',
                'subject',
                'priority_level',
                'label_document_type',
                'creator',
                'created_on'];

            correspondenceService
                .printData(self.searchedGeneralDocuments, headers);

        };


        self.globalSetting = rootEntity.returnRootEntity().settings;
        /**
         * @description Contains options for grid configuration
         * @type {{limit: (*|number), page: number, order: string, limitOptions: *[], pagingCallback: pagingCallback}}
         */
        self.grid = {
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.search.general) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.search.general, self.searchedGeneralDocuments),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.search.general, limit);
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
            self.searchedGeneralDocuments = $filter('orderBy')(self.searchedGeneralDocuments, self.grid.order);
        };


        /**
         * @description Reload the grid of searched general documents
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadSearchedGeneralDocuments = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;
            return searchGeneralService
                .searchGeneralDocuments(self.searchGeneralModel, self.propertyConfigurations)
                .then(function (result) {
                    counterService.loadCounters();
                    self.searchedGeneralDocuments = _mapResultToAvoidCorrespondenceCheck(result);
                    // self.searchedGeneralDocuments = result;
                    self.selectedSearchedGeneralDocuments = [];
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
                .favoriteDocumentAddBulk(self.selectedSearchedGeneralDocuments, $event)
                .then(function (result) {
                    self.reloadSearchedGeneralDocuments(self.grid.page);
                });
        };

        /**
         * @description add an item to the favorite documents
         * @param searchedGeneralDocument
         * @param $event
         */
        self.addToFavorite = function (searchedGeneralDocument, $event) {
            favoriteDocumentsService.controllerMethod
                .favoriteDocumentAdd(searchedGeneralDocument.getInfo().vsId, $event)
                .then(function (result) {
                    if (result.status) {
                        toast.success(langService.get("add_to_favorite_specific_success").change({
                            name: searchedGeneralDocument.getTranslatedName()
                        }));
                    } else {
                        dialog.alertMessage(langService.get(result.message));
                    }
                });
        };

        /* /!**
         * @description Export searched general document
         * @param searchedGeneralDocument
         * @param $event
         * @type {[*]}
         *!/
         self.exportSearchGeneralDocument = function (searchedGeneralDocument, $event) {
         //console.log('export searched general document : ', searchedGeneralDocument);
         searchGeneralService
         .exportSearchGeneral(searchedGeneralDocument, $event)
         .then(function (result) {
         self.reloadSearchedGeneralDocuments(self.grid.page)
         .then(function () {
         toast.success(langService.get('export_success'));
         });
         });
         };*/

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
         * @param searchedGeneralDocument
         * @param $event
         */

        self.launchDistributionWorkflow = function (searchedGeneralDocument, $event) {
            if (!searchedGeneralDocument.hasContent()) {
                dialog.alertMessage(langService.get("content_not_found"));
                return;
            }

            searchedGeneralDocument
                .launchWorkFlowAndCheckExists($event, null, 'favorites')
                .then(function () {
                    self.reloadSearchedGeneralDocuments(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                        });
                });
        };

        /**
         * @description Print Barcode
         * @param searchedGeneralDocument
         * @param $event
         */
        self.printBarcode = function (searchedGeneralDocument, $event) {
            searchedGeneralDocument.barcodePrint($event);
        };

        /**
         * @description View Tracking Sheet
         * @param searchedGeneralDocument
         * @param params
         * @param $event
         */
        self.viewTrackingSheet = function (searchedGeneralDocument, params, $event) {
            viewTrackingSheetService
                .controllerMethod
                .viewTrackingSheetPopup(searchedGeneralDocument, params, $event).then(function (result) {
            });
        };

        /**
         * @description manage tag for searched general document
         * @param searchedGeneralDocument
         * @param $event
         */
        self.manageTags = function (searchedGeneralDocument, $event) {
            var info = searchedGeneralDocument.getInfo();
            managerService.manageDocumentTags(info.vsId, info.documentClass, info.title, $event)
                .then(function (tags) {
                    searchedGeneralDocument.tags = tags;
                })
                .catch(function (tags) {
                    searchedGeneralDocument.tags = tags;
                });
        };

        /**
         * @description manage comments for searched general document
         * @param searchedGeneralDocument
         * @param $event
         */
        self.manageComments = function (searchedGeneralDocument, $event) {
            managerService.manageDocumentComments(searchedGeneralDocument.vsId, searchedGeneralDocument.docSubject, $event)
                .then(function (documentComments) {
                    searchedGeneralDocument.documentComments = documentComments;
                })
                .catch(function (documentComments) {
                    searchedGeneralDocument.documentComments = documentComments;
                });
        };

        /**
         * @description manage tasks for searched general document
         * @param searchedGeneralDocument
         * @param $event
         */
        self.manageTasks = function (searchedGeneralDocument, $event) {
            console.log('manage tasks for searched general document : ', searchedGeneralDocument);
        };

        /**
         * @description manage attachments for searched general document
         * @param searchedGeneralDocument
         * @param $event
         */
        self.manageAttachments = function (searchedGeneralDocument, $event) {
            searchedGeneralDocument.manageDocumentAttachments($event)
                .then(function () {
                    self.reloadSearchedGeneralDocuments(self.grid.page);
                })
                .catch(function () {
                    self.reloadSearchedGeneralDocuments(self.grid.page);
                });
        };

        /**
         * @description manage linked documents for searched general document
         * @param searchedGeneralDocument
         * @param $event
         */
        self.manageLinkedDocuments = function (searchedGeneralDocument, $event) {
            var info = searchedGeneralDocument.getInfo();
            return managerService.manageDocumentLinkedDocuments(info.vsId, info.documentClass)
                .then(function () {
                    self.reloadSearchedGeneralDocuments(self.grid.page);
                }).catch(function () {
                    self.reloadSearchedGeneralDocuments(self.grid.page);
                });
        };

        /**
         * @description Manage Linked Entities
         * @param searchedGeneralDocument
         * @param $event
         */
        self.manageLinkedEntities = function (searchedGeneralDocument, $event) {
            searchedGeneralDocument
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
                    self.reloadSearchedGeneralDocuments(self.grid.page);
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
         * @param searchedGeneralDocument
         * @param $event
         */
        self.downloadMainDocument = function (searchedGeneralDocument, $event) {
            downloadService.controllerMethod
                .mainDocumentDownload(searchedGeneralDocument.vsId);
        };

        /**
         * @description download composite document for searched general document
         * @param searchedGeneralDocument
         * @param $event
         */
        self.downloadCompositeDocument = function (searchedGeneralDocument, $event) {
            downloadService.controllerMethod
                .compositeDocumentDownload(searchedGeneralDocument.vsId);
        };

        /**
         * @description send link to document for searched general document
         * @param searchedGeneralDocument
         * @param $event
         */
        self.sendLinkToDocumentByEmail = function (searchedGeneralDocument, $event) {
            downloadService.getMainDocumentEmailContent(searchedGeneralDocument.getInfo().vsId);
        };

        /**
         * @description send composite document as attachment for searched general document
         * @param searchedGeneralDocument
         * @param $event
         */
        self.sendCompositeDocumentAsAttachmentByEmail = function (searchedGeneralDocument, $event) {
            downloadService.getCompositeDocumentEmailContent(searchedGeneralDocument.getInfo().vsId);
        };

        /**
         * @description send main document fax for searched general document
         * @param searchedGeneralDocument
         * @param $event
         */
        self.sendMainDocumentFax = function (searchedGeneralDocument, $event) {
            console.log('send main document fax for searched general document : ', searchedGeneralDocument);
        };

        /**
         * @description send sms for searched general document
         * @param searchedGeneralDocument
         * @param $event
         */
        self.sendSMS = function (searchedGeneralDocument, $event) {
            console.log('send sms for searched general document : ', searchedGeneralDocument);
        };

        /**
         * @description get link for searched general document
         * @param searchedGeneralDocument
         * @param $event
         */
        self.getLink = function (searchedGeneralDocument, $event) {
            viewDocumentService.loadDocumentViewUrlWithOutEdit(searchedGeneralDocument.vsId).then(function (result) {
                //var docLink = "<a target='_blank' href='" + result + "'>" + result + "</a>";
                dialog.successMessage(langService.get('link_message').change({result: result}));
                return true;
            });
        };

        /**
         * @description subscribe for searched general document
         * @param searchedGeneralDocument
         * @param $event
         */
        self.subscribe = function (searchedGeneralDocument, $event) {
            console.log('subscribe for searched general document : ', searchedGeneralDocument);
        };

        /**
         * @description create copy for searched general document
         * @param searchedGeneralDocument
         * @param $event
         */
        self.createCopy = function (searchedGeneralDocument, $event) {
            console.log('create copy for searched general document : ', searchedGeneralDocument);
        };

        /**
         * @description Preview document
         * @param searchedGeneralDocument
         * @param $event
         */
        self.previewDocument = function (searchedGeneralDocument, $event) {
            if (!searchedGeneralDocument.hasContent()) {
                dialog.alertMessage(langService.get('content_not_found'));
                return;
            }
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            correspondenceService.viewCorrespondence(searchedGeneralDocument, self.gridActions, true, checkIfEditCorrespondenceSiteAllowed(searchedGeneralDocument, true))
                .then(function () {
                    return self.reloadSearchedGeneralDocuments(self.grid.page);
                })
                .catch(function () {
                    return self.reloadSearchedGeneralDocuments(self.grid.page);
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
            correspondence.viewFromQueue(self.gridActions, 'searchGeneral', $event)
                .then(function () {
                    return self.reloadSearchedGeneralDocuments(self.grid.page);
                })
                .catch(function (error) {
                    return self.reloadSearchedGeneralDocuments(self.grid.page);
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
                } else if (angular.isArray(action.permissionKey) && action.permissionKey.length) {
                    if (action.hasOwnProperty('checkAnyPermission')) {
                        hasPermission = employeeService.getEmployee().hasAnyPermissions(action.permissionKey);
                    } else {
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
                    self.reloadSearchedGeneralDocuments(self.grid.page)
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
                        gridName: 'search-general'
                    }
                ],
                class: "action-green",
                checkShow: self.checkToShowAction
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
                checkShow: self.checkToShowAction,
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
                            //If no content or no view document permission, hide the button
                            return self.checkToShowAction(action, model) && model.hasContent();
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
                            //If no content or no view document permission, hide the button
                            return self.checkToShowAction(action, model) && model.hasContent();
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
                        checkShow: self.checkToShowAction
                    }
                ]
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
             return self.checkToShowAction(action, model) && model.docStatus < 24 && info.isPaper && info.documentClass === "outgoing";
             }
             },*/
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
                        checkShow: self.checkToShowAction
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
            // Duplicate
            {
                type: 'action',
                icon: 'settings',
                text: 'grid_action_duplicate',
                shortcut: false,
                showInView: false,
                checkShow: self.checkToShowAction,
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
                ]
            }
        ];
    });
};
