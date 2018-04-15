module.exports = function (app) {
    app.controller('returnedDepartmentInboxCtrl', function (lookupService,
                                                            returnedDepartmentInboxService,
                                                            returnedDepartmentInboxes,
                                                            listGeneratorService,
                                                            correspondenceStorageService,
                                                            userInboxService,
                                                            $q,
                                                            $state,
                                                            $timeout,
                                                            langService,
                                                            rootEntity,
                                                            toast,
                                                            dialog,
                                                            managerService,
                                                            viewDocumentService,
                                                            distributionWorkflowService,
                                                            contextHelpService,
                                                            counterService,
                                                            viewTrackingSheetService,
                                                            downloadService,
                                                            generator,
                                                            employeeService,
                                                            ResolveDefer,
                                                            correspondenceService,
                                                            favoriteDocumentsService) {
        'ngInject';
        var self = this;
        /*
         IT WILL ALWAYS GET OUTGOING DOCUMENTS ONLY
         */
        self.controllerName = 'returnedDepartmentInboxCtrl';

        self.progress = null;
        contextHelpService.setHelpTo('department-inbox-returned');
        // employee service to check the permission in html
        self.employeeService = employeeService;

        /**
         * @description All returned department inbox items
         * @type {*}
         */
        self.returnedDepartmentInboxes = returnedDepartmentInboxes;

        /**
         * @description Contains the selected returned department inbox items
         * @type {Array}
         */
        self.selectedReturnedDepartmentInboxes = [];
        self.globalSetting = rootEntity.returnRootEntity().settings;

        /**
         * @description Contains options for grid configuration
         * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
         */
        self.grid = {
            limit: 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    /*label: self.globalSetting.searchAmountLimit.toString(),
                     value: function () {
                     return self.globalSetting.searchAmountLimit
                     }*/
                    label: langService.get('all'),
                    value: function () {
                        return (self.returnedDepartmentInboxes.length + 21);
                    }
                }
            ]
        };

        /**
         * @description Contains methods for Star operations for returned department inbox items
         */
        self.starServices = {
            'false': returnedDepartmentInboxService.controllerMethod.returnedDepartmentInboxStar,
            'true': returnedDepartmentInboxService.controllerMethod.returnedDepartmentInboxUnStar,
            'starBulk': returnedDepartmentInboxService.controllerMethod.returnedDepartmentInboxesStarBulk,
            'unStarBulk': returnedDepartmentInboxService.controllerMethod.returnedDepartmentInboxesUnStarBulk
        };

        /**
         * @description Reload the grid of returned department inbox item
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadReturnedDepartmentInboxes = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;
            return returnedDepartmentInboxService
                .loadReturnedDepartmentInboxes()
                .then(function (result) {
                    counterService.loadCounters();
                    self.returnedDepartmentInboxes = result;
                    self.selectedReturnedDepartmentInboxes = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    return result;
                });
        };

        /**
         * @description Resend returned department inbox item
         * @param $event
         */
        self.resendBulkReturnedDepartmentInbox = function ($event) {
            returnedDepartmentInboxService
                .controllerMethod.returnedDepartmentInboxesResendBulk(self.selectedReturnedDepartmentInboxes, $event)
                .then(function () {
                    self.reloadReturnedDepartmentInboxes(self.grid.page);
                })
        };

        /**
         * @description Change the starred for returned department inbox
         * @param returnedDepartmentInbox
         * @param $event
         */
        /* self.changeStar = function (returnedDepartmentInbox, $event) {
         self.starServices[returnedDepartmentInbox.generalStepElm.starred](returnedDepartmentInbox)
         .then(function (result) {
         if (result) {
         self.reloadReturnedDepartmentInboxes(self.grid.page)
         .then(function () {
         if (!returnedDepartmentInbox.generalStepElm.starred)
         toast.success(langService.get("star_specific_success").change({name: returnedDepartmentInbox.generalStepElm.docSubject}));
         else
         toast.success(langService.get("unstar_specific_success").change({name: returnedDepartmentInbox.generalStepElm.docSubject}));
         });
         }
         else {
         dialog.errorMessage(langService.get('something_happened_when_update_starred'));
         }
         })
         .catch(function () {
         dialog.errorMessage(langService.get('something_happened_when_update_starred'));
         });
         };*/

        /**
         * @description Change the starred for returned department inboxes Bulk
         * @param starUnStar
         * @param $event
         */
        /*self.changeStarBulk = function (starUnStar, $event) {
         self.starServices[starUnStar](self.selectedReturnedDepartmentInboxes)
         .then(function (result) {
         self.reloadReturnedDepartmentInboxes(self.grid.page);
         });
         };*/


        /**
         * @description add an item to the favorite documents
         * @param followupEmployeeInbox
         * @param $event
         */
        self.addToFavorite = function (followupEmployeeInbox, $event) {
            favoriteDocumentsService.controllerMethod
                .favoriteDocumentAdd(followupEmployeeInbox.generalStepElm.vsId, $event)
                .then(function (result) {
                    if (result.status) {
                        self.reloadReturnedDepartmentInboxes(self.grid.page)
                            .then(function () {
                                toast.success(langService.get("add_to_favorite_specific_success").change({
                                    name: followupEmployeeInbox.getTranslatedName()
                                }));
                            });
                    }
                    else {
                        dialog.alertMessage(langService.get(result.message));
                    }
                });
        };


        /**
         * @description Terminate returned department inbox item
         * @param returnedDepartmentInbox
         * @param $event
         * @param defer
         */
        self.terminate = function (returnedDepartmentInbox, $event, defer) {
            /*returnedDepartmentInboxService.controllerMethod
             .returnedDepartmentInboxTerminate(returnedDepartmentInbox, $event)
             .then(function (result) {
             self.reloadReturnedDepartmentInboxes(self.grid.page)
             .then(function () {
             toast.success(langService.get("terminate_specific_success").change({name: returnedDepartmentInbox.generalStepElm.docSubject}));
             new ResolveDefer(defer);
             });
             });*/
            returnedDepartmentInboxService
                .controllerMethod
                .returnedDepartmentInboxTerminate(returnedDepartmentInbox, $event)
                .then(function () {
                    self.reloadReturnedDepartmentInboxes(self.grid.page)
                        .then(function () {
                            toast.success(langService.get("terminate_specific_success").change({name: returnedDepartmentInbox.getTranslatedName()}));
                            new ResolveDefer(defer);
                        });
                });
        };

        /**
         * @description Get Link
         * @param returnedDepartmentInbox
         * @param $event
         */
        self.getLink = function (returnedDepartmentInbox, $event) {
            console.log('get link for returned department inbox : ', returnedDepartmentInbox)
        };

        /**
         * @description Subscribe
         * @param returnedDepartmentInbox
         * @param $event
         */
        self.subscribe = function (returnedDepartmentInbox, $event) {
            console.log('subscribe for returned department inbox : ', returnedDepartmentInbox)
        };

        /**
         * @description View Tracking Sheet
         * @param returnedDepartmentInbox
         * @param params
         * @param $event
         */
        self.viewTrackingSheet = function (returnedDepartmentInbox, params, $event) {
            viewTrackingSheetService
                .controllerMethod
                .viewTrackingSheetPopup(returnedDepartmentInbox, params, $event).then(function (result) {
            });
        };

        /**
         * @description Resend returned department inbox item
         * @param returnedDepartmentInbox
         * @param $event
         * @param defer
         */
        self.resend = function (returnedDepartmentInbox, $event, defer) {
            returnedDepartmentInboxService
                .controllerMethod.returnedDepartmentInboxResend(returnedDepartmentInbox, $event)
                .then(function () {
                    self.reloadReturnedDepartmentInboxes(self.grid.page)
                        .then(function (result) {
                            toast.success(langService.get('resend_specific_success').change({name: returnedDepartmentInbox.getTranslatedName()}));
                            new ResolveDefer(defer);
                        });
                })
        };

        /**
         * @description Launch new distribution workflow for returned department inbox item
         * @param returnedDepartmentInbox
         * @param $event
         * @param defer
         */
        self.launchNewDistributionWorkflow = function (returnedDepartmentInbox, $event, defer) {

            //returnedDepartmentInbox.generalStepElm.workFlowName = Export,
            // but it need in DW popup to create URL, records will always come from Outgoing export
            returnedDepartmentInbox.generalStepElm.workFlowName = "Outgoing";

            /*distributionWorkflowService
             .controllerMethod
             .distributionWorkflowSend(returnedDepartmentInbox.generalStepElm, false, false, null, "outgoing", $event)
             .then(function (result) {
             self.reloadReturnedDepartmentInboxes(self.grid.page)
             .then(function () {
             new ResolveDefer(defer);
             })
             ;
             //self.replaceRecord(result);
             })
             .catch(function (result) {
             self.reloadReturnedDepartmentInboxes(self.grid.page);
             //self.replaceRecord(result);
             });*/
            returnedDepartmentInbox.launchWorkFlow($event, 'forward', 'favorites')
                .then(function () {
                    self.reloadReturnedDepartmentInboxes(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                });
        };

        /**
         * @description Manage Tags for returned department inbox item
         * @param returnedDepartmentInbox
         * @param $event
         */
        self.manageTags = function (returnedDepartmentInbox, $event) {
            //console.log('manageTagsReturnedDepartmentInbox', returnedDepartmentInbox);
            var vsId = returnedDepartmentInbox.hasOwnProperty('generalStepElm')
                ? (returnedDepartmentInbox.generalStepElm.hasOwnProperty('vsId') ? returnedDepartmentInbox.generalStepElm.vsId : returnedDepartmentInbox.generalStepElm)
                : (returnedDepartmentInbox.hasOwnProperty('vsId') ? returnedDepartmentInbox.vsId : returnedDepartmentInbox);
            /*var wfName = returnedDepartmentInbox.hasOwnProperty('generalStepElm')
             ? (returnedDepartmentInbox.generalStepElm.hasOwnProperty('workFlowName') ? returnedDepartmentInbox.generalStepElm.workFlowName : returnedDepartmentInbox.generalStepElm)
             : (returnedDepartmentInbox.hasOwnProperty('workFlowName') ? returnedDepartmentInbox.workFlowName : returnedDepartmentInbox);*/
            var wfName = "outgoing";
            managerService.manageDocumentTags(vsId, wfName.toLowerCase(), returnedDepartmentInbox.getTranslatedName(), $event)
                .then(function () {
                    self.reloadReturnedDepartmentInboxes(self.grid.page);
                })
                .catch(function (error) {
                    self.reloadReturnedDepartmentInboxes(self.grid.page);
                });
        };

        /**
         * @description Manage comments for returned department inbox item
         * @param returnedDepartmentInbox
         * @param $event
         */
        self.manageComments = function (returnedDepartmentInbox, $event) {
            //console.log('manageCommentsReturnedDepartmentInbox', returnedDepartmentInbox);
            var vsId = returnedDepartmentInbox.hasOwnProperty('generalStepElm')
                ? (returnedDepartmentInbox.generalStepElm.hasOwnProperty('vsId') ? returnedDepartmentInbox.generalStepElm.vsId : returnedDepartmentInbox.generalStepElm)
                : (returnedDepartmentInbox.hasOwnProperty('vsId') ? returnedDepartmentInbox.vsId : returnedDepartmentInbox);
            /*var wfName = returnedDepartmentInbox.hasOwnProperty('generalStepElm')
             ? (returnedDepartmentInbox.generalStepElm.hasOwnProperty('workFlowName') ? returnedDepartmentInbox.generalStepElm.workFlowName : returnedDepartmentInbox.generalStepElm)
             : (returnedDepartmentInbox.hasOwnProperty('workFlowName') ? returnedDepartmentInbox.workFlowName : returnedDepartmentInbox);*/
            var wfName = 'outgoing';
            managerService.manageDocumentComments(vsId, wfName, $event)
                .then(function () {
                    self.reloadReturnedDepartmentInboxes(self.grid.page);
                })
                .catch(function (error) {
                    self.reloadReturnedDepartmentInboxes(self.grid.page);
                });
        };

        /**
         * @description Manage tasks for returned department inbox item
         * @param returnedDepartmentInbox
         * @param $event
         */
        self.manageTasks = function (returnedDepartmentInbox, $event) {
            console.log('manageTasksReturnedDepartmentInbox', returnedDepartmentInbox);
        };

        /**
         * @description Manage attachments for returned department inbox item
         * @param returnedDepartmentInbox
         * @param $event
         */
        self.manageAttachments = function (returnedDepartmentInbox, $event) {
            //console.log('manageAttachmentsReturnedDepartmentInbox', returnedDepartmentInbox);
            var vsId = returnedDepartmentInbox.hasOwnProperty('generalStepElm')
                ? (returnedDepartmentInbox.generalStepElm.hasOwnProperty('vsId') ? returnedDepartmentInbox.generalStepElm.vsId : returnedDepartmentInbox.generalStepElm)
                : (returnedDepartmentInbox.hasOwnProperty('vsId') ? returnedDepartmentInbox.vsId : returnedDepartmentInbox);
            /*var wfName = returnedDepartmentInbox.hasOwnProperty('generalStepElm')
             ? (returnedDepartmentInbox.generalStepElm.hasOwnProperty('workFlowName') ? returnedDepartmentInbox.generalStepElm.workFlowName : returnedDepartmentInbox.generalStepElm)
             : (returnedDepartmentInbox.hasOwnProperty('workFlowName') ? returnedDepartmentInbox.workFlowName : returnedDepartmentInbox);*/
            var wfName = 'outgoing';
            managerService.manageDocumentAttachments(vsId, wfName.toLowerCase(), returnedDepartmentInbox.getTranslatedName(), $event);
        };

        /**
         * @description Manage linked documents for returned department inbox item
         * @param returnedDepartmentInbox
         * @param $event
         */
        self.manageLinkedDocuments = function (returnedDepartmentInbox, $event) {
            console.log('manageLinkedDocumentsReturnedDepartmentInbox', returnedDepartmentInbox);
            var info = returnedDepartmentInbox.getInfo();
            managerService.manageDocumentLinkedDocuments(info.vsId, info.documentClass, "welcome");
        };

        /**
         * @description Manage linked entities for returned department inbox item
         * @param returnedDepartmentInbox
         * @param $event
         */
        self.manageLinkedEntities = function (returnedDepartmentInbox, $event) {
            //console.log('manageLinkedEntitiesReturnedDepartmentInbox', returnedDepartmentInbox);
            var wfName = 'outgoing';
            managerService
                .manageDocumentEntities(returnedDepartmentInbox.generalStepElm.vsId, wfName.toLowerCase(), returnedDepartmentInbox.generalStepElm.docSubject, $event);
        };

        /**
         * @description Download Main Document
         * @param returnedDepartmentInbox
         * @param $event
         */
        self.downloadMainDocument = function (returnedDepartmentInbox, $event) {
            //console.log('downloadMainDocumentReturnedDepartmentInbox', returnedDepartmentInbox);
            downloadService.controllerMethod
                .mainDocumentDownload(returnedDepartmentInbox)
        };

        /**
         * @description Download Composite Document
         * @param returnedDepartmentInbox
         * @param $event
         */
        self.downloadCompositeDocument = function (returnedDepartmentInbox, $event) {
            //console.log('downloadCompositeDocumentReturnedDepartmentInbox', returnedDepartmentInbox);
            downloadService.controllerMethod
                .compositeDocumentDownload(returnedDepartmentInbox);
        };

        /**
         * @description Send Link To Document By Email
         * @param returnedDepartmentInbox
         * @param $event
         */
        self.sendLinkToDocumentByEmail = function (returnedDepartmentInbox, $event) {
            console.log('sendLinkToDocumentByEmail : ', returnedDepartmentInbox);
        };

        /**
         * @description Send composite document as attachment By Email
         * @param returnedDepartmentInbox
         * @param $event
         */
        self.sendCompositeDocumentAsAttachmentByEmail = function (returnedDepartmentInbox, $event) {
            console.log('sendCompositeDocumentAsAttachmentByEmail : ', returnedDepartmentInbox);
        };

        /**
         * @description Send SMS
         * @param returnedDepartmentInbox
         * @param $event
         */
        self.sendSMS = function (returnedDepartmentInbox, $event) {
            console.log('sendSMS : ', returnedDepartmentInbox);
        };

        /**
         * @description Send Main Document Fax
         * @param returnedDepartmentInbox
         * @param $event
         */
        self.sendMainDocumentFax = function (returnedDepartmentInbox, $event) {
            console.log('sendMainDocumentFax : ', returnedDepartmentInbox);
        };

        /**
         * @description Edit After Export
         * @param returnedDepartmentInbox
         * @param $event
         */
        self.editAfterExport = function (returnedDepartmentInbox, $event) {
            var info = returnedDepartmentInbox.getInfo(), list = listGeneratorService.createUnOrderList(),
                langKeys = ['signature_serial_will_removed', 'the_book_will_go_to_audit', 'serial_retained'];
            _.map(langKeys, function (item) {
                list.addItemToList(langService.get(item));
            });
            dialog.confirmMessage(list.getList(), null, null, $event)
                .then(function () {
                    correspondenceStorageService
                        .runEditAfter('Export', returnedDepartmentInbox)
                        .then(function () {
                            $state.go('app.outgoing.add', {
                                workItem: info.wobNumber,
                                vsId: info.vsId,
                                action: 'editAfterExport'
                            });
                        })
                        .catch(function () {
                            dialog.errorMessage(langService.get('error_messages'));
                        });

                });
        };

        /**
         * @description Edit Outgoing Content
         * @param returnedDepartmentInbox
         * @param $event
         */
        self.editContent = function (returnedDepartmentInbox, $event) {
            var info = returnedDepartmentInbox.getInfo();
            managerService.manageDocumentContent(info.vsId, 'outgoing', info.title, $event);//info.workFlow
        };

        /**
         * @description Edit Outgoing Properties
         * @param returnedDepartmentInbox
         * @param $event
         */
        self.editProperties = function (returnedDepartmentInbox, $event) {
            var info = returnedDepartmentInbox.getInfo();
            managerService
                .manageDocumentProperties(info.vsId, info.documentClass, info.title, $event)
                .finally(function (document) {
                    self.reloadReturnedDepartmentInboxes(self.grid.page)
                });
        };

        /**
         * @description Launch distribution workflow for selected draft outgoing mails
         * @param $event
         */
        self.launchDistributionWorkflowBulk = function ($event) {
            var contentNotExist = _.filter(self.selectedReturnedDepartmentInboxes, function (returnedDepartmentInbox) {
                return !returnedDepartmentInbox.hasContent();
            });
            if (contentNotExist.length > 0) {
                dialog.alertMessage(langService.get("content_not_found_bulk"));
                return;
            }

            distributionWorkflowService
                .controllerMethod
                .distributionWorkflowSendBulk(self.selectedReturnedDepartmentInboxes, "outgoing", $event)
                .then(function () {
                    self.reloadReturnedDepartmentInboxes(self.grid.page);
                })
                .catch(function () {
                    self.reloadReturnedDepartmentInboxes(self.grid.page);
                });
        };

        var checkIfEditPropertiesAllowed = function (model, checkForViewPopup) {
            var info = model.getInfo();
            var hasPermission = (employeeService.hasPermissionTo("EDIT_OUTGOING_PROPERTIES") || employeeService.hasPermissionTo("EDIT_OUTGOING_CONTENT"));
            var allowed = hasPermission && info.isPaper;// && info.docStatus < 24
            if (checkForViewPopup)
                return !allowed;
            return allowed;
        };


        /**
         * @description View document
         * @param returnedDepartmentInbox
         * @param $event
         */
        self.viewDocument = function (returnedDepartmentInbox, $event) {
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }

            var info = returnedDepartmentInbox.getInfo();
            return correspondenceService.viewCorrespondence({
                vsId: info.vsId,
                docClassName: info.documentClass
            }, self.gridActions, checkIfEditPropertiesAllowed(returnedDepartmentInbox, true), true, true);

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
         * @description Terminate User inboxes Bulk
         * @param $event
         */
        self.terminateBulk = function ($event) {
            var numberOfRecordsToTerminate = angular.copy(self.selectedReturnedDepartmentInboxes.length);
            userInboxService
                .controllerMethod
                .userInboxTerminateBulk(self.selectedReturnedDepartmentInboxes, $event)
                .then(function () {
                    $timeout(function () {
                        self.reloadReturnedDepartmentInboxes(self.grid.page)
                            .then(function () {
                                if (numberOfRecordsToTerminate === 1)
                                    toast.success(langService.get("selected_terminate_success"));
                            });
                    }, 100);
                });
        };

        /**
         * @description Array of actions that can be performed on grid
         * @type {[*]}
         */
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
                        gridName: 'department-returned'
                    }
                ],
                class: "action-green",
                checkShow: self.checkToShowAction
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
                checkShow: self.checkToShowAction
            },
            // Terminate
            {
                type: 'action',
                icon: 'stop',
                text: 'grid_action_terminate',
                shortcut: true,
                callback: self.terminate,
                class: "action-green",
                checkShow: self.checkToShowAction
            },
            // Get Link
            {
                type: 'action',
                icon: 'link',
                text: 'grid_action_get_link',
                shortcut: false,
                callback: self.getLink,
                class: "action-red",
                hide: true,
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
            // Open
            {
                type: 'action',
                icon: 'book-open-variant',
                text: 'grid_action_open',
                shortcut: true,
                callback: self.viewDocument,
                showInView: false,
                class: "action-green",
                permissionKey: 'VIEW_DOCUMENT',
                checkShow: function (action, model) {
                    //If no content or no view document permission, hide the button
                    return self.checkToShowAction(action, model) && model.hasContent();
                }
            },
            // Resend
            {
                type: 'action',
                icon: 'send',
                text: 'grid_action_resend',
                shortcut: true,
                callback: self.resend,
                class: "action-green",
                checkShow: self.checkToShowAction
            },
            // Launch New Distribution Workflow
            {
                type: 'action',
                icon: 'sitemap',
                text: 'grid_action_launch_new_distribution_workflow',
                shortcut: false,
                callback: self.launchNewDistributionWorkflow,
                class: "action-green",
                permissionKey: 'LAUNCH_DISTRIBUTION_WORKFLOW',
                hide: false, /*As discussed with Mr. Ahmed Abu Al Nassr*/
                checkShow: self.checkToShowAction
            },
            // View Tracking Sheet
            {
                type: 'action',
                icon: 'eye',
                text: 'view_tracking_sheet',
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
                showInView: false,
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
                hide: true,
                checkShow: self.checkToShowAction,
                subMenu: [
                    // Link To Document By Email
                    {
                        type: 'action',
                        icon: 'link-variant',
                        text: 'grid_action_link_to_document_by_email',
                        shortcut: false,
                        callback: self.sendLinkToDocumentByEmail,
                        class: "action-red",
                        checkShow: self.checkToShowAction
                    },
                    // Composite Document As Attachment By Email
                    {
                        type: 'action',
                        icon: 'attachment',
                        text: 'grid_action_composite_document_as_attachment_by_email',
                        shortcut: false,
                        callback: self.sendCompositeDocumentAsAttachmentByEmail,
                        class: "action-red",
                        checkShow: self.checkToShowAction
                    },
                    // SMS
                    {
                        type: 'action',
                        icon: 'message',
                        text: 'grid_action_send_sms',
                        shortcut: false,
                        permissionKey: "SEND_SMS",
                        callback: self.sendSMS,
                        class: "action-red",
                        checkShow: self.checkToShowAction
                    },
                    // Main Document Fax
                    {
                        type: 'action',
                        icon: 'attachment',
                        text: 'grid_action_main_document_fax',
                        shortcut: false,
                        callback: self.sendMainDocumentFax,
                        class: "action-red",
                        checkShow: self.checkToShowAction
                    }
                ]
            },
            //Edit After Export (Electronic Only)
            {
                type: 'action',
                icon: 'eraser-variant',
                text: 'grid_action_edit_after_export',//langKey not added yet in localization
                shortcut: false,
                showInView: false,
                class: 'action-green',
                callback: self.editAfterExport, //TODO: Service is not available yet
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    var hasPermission = (employeeService.hasPermissionTo("EDIT_OUTGOING_PROPERTIES") || employeeService.hasPermissionTo("EDIT_OUTGOING_CONTENT"));
                    return self.checkToShowAction(action, model) && hasPermission && !info.isPaper;
                }
            },
            // Edit (Paper Only)
            {
                type: 'action',
                icon: 'pencil',
                text: 'grid_action_edit',
                shortcut: false,
                showInView: false,
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    var hasPermission = (employeeService.hasPermissionTo("EDIT_OUTGOING_PROPERTIES") || employeeService.hasPermissionTo("EDIT_OUTGOING_CONTENT"));
                    return self.checkToShowAction(action, model) && hasPermission && info.isPaper;
                },
                subMenu: [
                    // Content
                    {
                        type: 'action',
                        //icon: 'link-variant',
                        text: 'grid_action_content',
                        shortcut: false,
                        callback: self.editContent,
                        permissionKey: "EDIT_OUTGOING_CONTENT",
                        class: "action-green",
                        checkShow: self.checkToShowAction
                    },
                    // Properties
                    {
                        type: 'action',
                        //icon: 'attachment',
                        text: 'grid_action_properties',
                        shortcut: false,
                        callback: self.editProperties,
                        permissionKey: "EDIT_OUTGOING_PROPERTIES",
                        class: "action-green",
                        checkShow: self.checkToShowAction
                    }
                ]
            }
        ];


    });
};