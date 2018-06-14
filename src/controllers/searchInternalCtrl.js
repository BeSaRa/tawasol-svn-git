module.exports = function (app) {
    app.controller('searchInternalCtrl', function (lookupService,
                                                   langService,
                                                   viewDocumentService,
                                                   organizations,
                                                   ResolveDefer,
                                                   searchInternalService,
                                                   $q,
                                                   InternalSearch,
                                                   propertyConfigurations,
                                                   validationService,
                                                   generator,
                                                   rootEntity,
                                                   managerService,
                                                   contextHelpService,
                                                   toast,
                                                   viewTrackingSheetService,
                                                   downloadService,
                                                   distributionWorkflowService,
                                                   counterService,
                                                   employeeService,
                                                   correspondenceService,
                                                   dialog,
                                                   mailNotificationService,
                                                   favoriteDocumentsService,
                                                   approvers//,
                                                   //centralArchives

    ) {
        'ngInject';
        var self = this;
        self.controllerName = 'searchInternalCtrl';
        contextHelpService.setHelpTo('search-internal');
        // employee service to check the permission in html
        self.employeeService = employeeService;

        self.searchInternal = new InternalSearch();
        self.searchInternalModel = angular.copy(self.searchInternal);
        self.approvers = approvers;
        self.propertyConfigurations = propertyConfigurations;

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
                        return self.searchInternal.ou;
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
                        self.searchInternal.regOu = null;
                    }
                };

                self.changeOuToggle = function () {
                    /!*self.isSearchByRegOU = false;
                     self.searchInternal.regOu = null;*!/
                };*/

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
            /*if(self.isSearchByRegOU){
                if(!employeeService.isCentralArchive()){
                    self.searchInternal.registryOU = employeeService.getCurrentOUApplicationUser().ouRegistryID;
                }
            }
            else{
                self.searchInternal.registryOU = null;
            }*/

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
                        return (self.searchedInternalDocuments.length + 21);
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
        self.getSortingKey = function(property, modelType){
            return generator.getColumnSortingKey(property, modelType);
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
                    }
                    else {
                        dialog.alertMessage(langService.get(result.message));
                    }
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

            searchedInternalDocument.launchWorkFlowAndCheckExists($event, null, 'favorites')
                .then(function () {
                    self.reloadSearchedInternalDocuments(self.grid.page)
                        .then(function(){
                            mailNotificationService.loadMailNotifications(mailNotificationService.notificationsRequestCount);
                        });
                });

            // return dialog.confirmMessage(langService.get('confirm_launch_new_distribution_workflow'))
            //     .then(function () {
            //         /*distributionWorkflowService
            //          .controllerMethod
            //          .distributionWorkflowSend(searchedInternalDocument, false, false, null, "internal", $event)
            //          .then(function (result) {
            //          self.reloadSearchedInternalDocuments(self.grid.page);
            //          })
            //          .catch(function (result) {
            //          self.reloadSearchedInternalDocuments(self.grid.page);
            //          });*/
            //         searchedInternalDocument.launchWorkFlow($event, 'forward', 'favorites')
            //             .then(function () {
            //                 self.reloadSearchedInternalDocuments(self.grid.page);
            //             });
            //     });
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
            //console.log('manage attachments for searched internal document : ', searchedInternalDocument);
            var info = searchedInternalDocument.getInfo();
            managerService.manageDocumentAttachments(info.vsId, info.documentClass, info.title, $event)
                .then(function (attachments) {
                    searchedInternalDocument = attachments;
                })
                .catch(function (attachments) {
                    searchedInternalDocument = attachments;
                });
        };

        /**
         * @description manage linked documents for searched internal document
         * @param searchedInternalDocument
         * @param $event
         */
        self.manageLinkedDocuments = function (searchedInternalDocument, $event) {
            //console.log('manage linked documents for searched internal document : ', searchedInternalDocument);
            var info = searchedInternalDocument.getInfo();
            return managerService.manageDocumentLinkedDocuments(info.vsId, info.documentClass);
        };

        /**
         * @description manage linked entities for searched internal document
         * @param searchedInternalDocument
         * @param $event
         */
        self.manageLinkedEntities = function (searchedInternalDocument, $event) {
            //console.log('manage linked entities for searched internal document : ', searchedInternalDocument);
            managerService
                .manageDocumentEntities(searchedInternalDocument.vsId, searchedInternalDocument.docClassName, searchedInternalDocument.docSubject, $event);
        };

        /**
         * @description download main document for searched internal document
         * @param searchedInternalDocument
         * @param $event
         */
        self.downloadMainDocument = function (searchedInternalDocument, $event) {
            //console.log('download main document for searched internal document : ', searchedInternalDocument);
            downloadService.controllerMethod
                .mainDocumentDownload(searchedInternalDocument.vsId);
        };

        /**
         * @description download composite document for searched internal document
         * @param searchedInternalDocument
         * @param $event
         */
        self.downloadCompositeDocument = function (searchedInternalDocument, $event) {
            //console.log('download composite document for searched internal document : ', searchedInternalDocument);
            downloadService.controllerMethod.compositeDocumentDownload(searchedInternalDocument.vsId);
        };

        /**
         * @description send link to document for searched internal document
         * @param searchedInternalDocument
         * @param $event
         */
        self.sendLinkToDocumentByEmail = function (searchedInternalDocument, $event) {
            downloadService.getMainDocumentEmailContent(searchedInternalDocument.vsId).then(function (result) {
                dialog.successMessage(langService.get('right_click_and_save_link_as') + langService.get('download_message_file').change({
                    result: result,
                    filename: 'Tawasol.msg'
                }));
                return true;
            });
        };

        /**
         * @description send composite document as attachment for searched internal document
         * @param searchedInternalDocument
         * @param $event
         */
        self.sendCompositeDocumentAsAttachmentByEmail = function (searchedInternalDocument, $event) {
            downloadService.getCompositeDocumentEmailContent(searchedInternalDocument.vsId).then(function (result) {
                dialog.successMessage(langService.get('right_click_and_save_link_as') + langService.get('download_message_file').change({
                    result: result,
                    filename: 'Tawasol.msg'
                }));
                return true;
            });
        };



        /**
         * @description send main document fax for searched internal document
         * @param searchedInternalDocument
         * @param $event
         */
        self.sendMainDocumentFax = function (searchedInternalDocument, $event) {
            console.log('send main document fax for searched internal document : ', searchedInternalDocument);
        };

        /**
         * @description send sms for searched internal document
         * @param searchedInternalDocument
         * @param $event
         */
        self.sendSMS = function (searchedInternalDocument, $event) {
            console.log('send sms for searched internal document : ', searchedInternalDocument);
        };

        /**
         * @description get link for searched internal document
         * @param searchedInternalDocument
         * @param $event
         */
        self.getLink = function (searchedInternalDocument, $event) {
            viewDocumentService.loadDocumentViewUrlWithOutEdit(searchedInternalDocument.vsId).then(function (result) {
                //var docLink = "<a target='_blank' href='" + result + "'>" + result + "</a>";
                dialog.successMessage(langService.get('link_message').change({result: result}));
                return true;
            });
        };

        /**
         * @description subscribe for searched internal document
         * @param searchedInternalDocument
         * @param $event
         */
        self.subscribe = function (searchedInternalDocument, $event) {
            console.log('subscribe for searched internal document : ', searchedInternalDocument);
        };

        /**
         * @description create copy for searched internal document
         * @param searchedInternalDocument
         * @param $event
         */
        self.createCopy = function (searchedInternalDocument, $event) {
            console.log('create copy for searched internal document : ', searchedInternalDocument);
        };

        self.viewDocument = function (searchedInternalDocument, $event) {
            if (!searchedInternalDocument.hasContent()) {
                dialog.alertMessage(langService.get('content_not_found'));
                return;
            }
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            correspondenceService.viewCorrespondence(searchedInternalDocument, self.gridActions, true, true);
            return;
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
                    self.reloadSearchedInternalDocuments(self.grid.page)
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
                        gridName: 'search-internal'
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
             callback: self.exportSearchInternalDocument,
             hide: true,
             class: "action-yellow",
             checkShow: self.checkToShowAction
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
                checkShow: self.checkToShowAction
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
                    return self.checkToShowAction(action, model) && !model.needApprove();
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
                    return self.checkToShowAction(action, model) && (!model.needApprove() || info.isPaper);
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