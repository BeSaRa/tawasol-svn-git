module.exports = function (app) {
    app.controller('searchGeneralCtrl', function (lookupService,
                                                  langService,
                                                  ResolveDefer,
                                                  viewDocumentService,
                                                  organizations,
                                                  searchGeneralService,
                                                  $q,
                                                  GeneralSearch,
                                                  propertyConfigurations,
                                                  validationService,
                                                  generator,
                                                  rootEntity,
                                                  managerService,
                                                  contextHelpService,
                                                  toast,
                                                  viewTrackingSheetService,
                                                  downloadService,
                                                  DocumentStatus,
                                                  employeeService,
                                                  counterService,
                                                  distributionWorkflowService,
                                                  correspondenceService,
                                                  dialog,
                                                  mailNotificationService,
                                                  favoriteDocumentsService//,
                                                  //centralArchives
    ) {
        'ngInject';

        var self = this;
        self.controllerName = 'searchGeneralCtrl';
        contextHelpService.setHelpTo('search-general');
        // employee service to check the permission in html
        self.employeeService = employeeService;

        self.searchGeneral = new GeneralSearch();
        self.searchGeneralModel = angular.copy(self.searchGeneral);

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
                        return self.searchGeneral.ou;
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
                        self.searchGeneral.regOu = null;
                    }
                };

                self.changeOuToggle = function () {
                    /!*self.isSearchByRegOU = false;
                     self.searchGeneral.regOu = null;*!/
                };*/

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
            form.$setUntouched();
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
         * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
         */
        self.grid = {
            limit: 5, //self.globalSetting.searchAmount, // default limit
            page: 1, // first page
            //order: 'arName', // default sorting order
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    /*label: self.globalSetting.searchAmountLimit.toString(),
                     value: function () {
                     return self.globalSetting.searchAmountLimit
                     }*/
                    label: langService.get('all'),
                    value: function () {
                        return (self.searchedGeneralDocuments.length + 21);
                    }
                }
            ],
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
                    self.searchedGeneralDocuments = result;
                    self.selectedSearchedGeneralDocuments = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
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
                    }
                    else {
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
         * @description Launch distribution workflow for internal item
         * @param searchedGeneralDocument
         * @param $event
         */

        self.launchDistributionWorkflow = function (searchedGeneralDocument, $event) {
            if (!searchedGeneralDocument.hasContent()) {
                dialog.alertMessage(langService.get("content_not_found"));
                return;
            }

            searchedGeneralDocument.launchWorkFlowAndCheckExists($event, null, 'favorites')
                .then(function () {
                    self.reloadSearchedGeneralDocuments(self.grid.page)
                        .then(function () {
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                        });
                });
            // return dialog.confirmMessage(langService.get('confirm_launch_new_distribution_workflow'))
            //     .then(function () {
            //         /*distributionWorkflowService
            //          .controllerMethod
            //          .distributionWorkflowSend(searchedGeneralDocument, false, false, null, "internal", $event)
            //          .then(function (result) {
            //          self.reloadSearchedGeneralDocuments(self.grid.page);
            //          })
            //          .catch(function (result) {
            //          self.reloadSearchedGeneralDocuments(self.grid.page);
            //          });*/
            //         searchedGeneralDocument.launchWorkFlow($event, 'forward', 'favorites')
            //             .then(function () {
            //                 self.reloadSearchedGeneralDocuments(self.grid.page);
            //             });
            //     });
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
            searchedGeneralDocument.manageDocumentAttachments($event);
        };

        /**
         * @description manage linked documents for searched general document
         * @param searchedGeneralDocument
         * @param $event
         */
        self.manageLinkedDocuments = function (searchedGeneralDocument, $event) {
            var info = searchedGeneralDocument.getInfo();
            return managerService.manageDocumentLinkedDocuments(info.vsId, info.documentClass);
        };

        /**
         * @description Manage Linked Entities
         * @param searchedGeneralDocument
         * @param $event
         */
        self.manageLinkedEntities = function (searchedGeneralDocument, $event) {
            managerService
                .manageDocumentEntities(searchedGeneralDocument.vsId, searchedGeneralDocument.docClassName, searchedGeneralDocument.docSubject, $event);
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
            downloadService.getMainDocumentEmailContent(searchedGeneralDocument.vsId).then(function (result) {
                dialog.successMessage(langService.get('right_click_and_save_link_as') + langService.get('download_message_file').change({
                    result: result,
                    filename: 'Tawasol.msg'
                }));
                return true;
            });
        };

        /**
         * @description send composite document as attachment for searched general document
         * @param searchedGeneralDocument
         * @param $event
         */
        self.sendCompositeDocumentAsAttachmentByEmail = function (searchedGeneralDocument, $event) {
            downloadService.getCompositeDocumentEmailContent(searchedGeneralDocument.vsId).then(function (result) {
                dialog.successMessage(langService.get('right_click_and_save_link_as') + langService.get('download_message_file').change({
                    result: result,
                    filename: 'Tawasol.msg'
                }));
                return true;
            });
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


        self.viewDocument = function (searchedGeneralDocument, $event) {
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
         * @description Check if action will be shown on grid or not
         * @param action
         * @param model
         * @returns {boolean}
         */
        self.checkToShowAction = function (action, model) {
            /*if (action.hasOwnProperty('permissionKey'))
             return !action.hide && employeeService.hasPermissionTo(action.permissionKey);
             return (!action.hide);*/

            if (action.hasOwnProperty('permissionKey')) {
                if (typeof action.permissionKey === 'string') {
                    return (!action.hide) && employeeService.hasPermissionTo(action.permissionKey);
                }
                else if (angular.isArray(action.permissionKey)) {
                    if (!action.permissionKey.length) {
                        return (!action.hide);
                    }
                    else {
                        var hasPermissions = _.map(action.permissionKey, function (key) {
                            return employeeService.hasPermissionTo(key);
                        });
                        return (!action.hide) && !(_.some(hasPermissions, function (isPermission) {
                            return isPermission !== true;
                        }));
                    }
                }
            }
            return (!action.hide);
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
            //Open
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
            {
                type: 'action',
                icon: 'bullhorn',
                text: 'grid_action_broadcast',
                shortcut: false,
                hide: false,
                permissionKey: 'BROADCAST_DOCUMENT',
                callback: self.broadcast,
                checkShow: function (action, model) {
                    return self.checkToShowAction(action, model) && (!model.needApprove() || model.hasDocumentClass('incoming'));
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
                        permissionKey:"MANAGE_LINKED_DOCUMENTS",
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
                        permissionKey:"SEND_DOCUMENT_BY_FAX",
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
            }
        ];
    });
};