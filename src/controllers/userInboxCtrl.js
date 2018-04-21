module.exports = function (app) {
    app.controller('userInboxCtrl', function (lookupService,
                                              userInboxService,
                                              userInboxes,
                                              errorCode,
                                              $timeout,
                                              ResolveDefer,
                                              generator,
                                              userFilterService,
                                              correspondenceService,
                                              userFilters,
                                              $state,
                                              counterService,
                                              $q,
                                              langService,
                                              toast,
                                              dialog,
                                              rootEntity,
                                              viewDocumentService,
                                              managerService,
                                              distributionWorkflowService,
                                              userFolders,
                                              $window,
                                              // welcome,
                                              tokenService,
                                              contextHelpService,
                                              userFolderService,
                                              readyToExportService,
                                              viewTrackingSheetService,
                                              downloadService,
                                              employeeService,
                                              favoriteDocumentsService,
                                              Information,
                                              mailNotificationService) {
        'ngInject';
        var self = this;

        self.controllerName = 'userInboxCtrl';

        self.progress = null;
        contextHelpService.setHelpTo('user-inbox');
        var timeoutRefresh = false;

        self.langService = langService;

        self.bySender = false;


        self.changeCriteria = function () {
            var local = angular.copy(self.searchModel);

            if (self.bySender) {
                self.searchModel = {
                    senderInfo: {}
                };
                self.searchModel.senderInfo[langService.current + 'Name'] = local;
            } else {
                self.searchModel = local.hasOwnProperty('senderInfo') ? local.senderInfo[langService.current + 'Name'] : local;
            }
        };
        /**
         * @description All user inboxes
         * @type {*}
         */
        self.userInboxes = userInboxes;
        self.userFolders = userFolders;

        /**
         * @description Contains methods for Star operations for user inbox items
         */
        self.starServices = {
            'false': userInboxService.controllerMethod.userInboxStar,
            'true': userInboxService.controllerMethod.userInboxUnStar,
            'starBulk': correspondenceService.starBulkWorkItems,
            'unStarBulk': correspondenceService.unStarBulkWorkItems
        };

        /**
         * @description Contains the selected user inboxes
         * @type {Array}
         */
        self.selectedUserInboxes = [];
        self.globalSetting = rootEntity.returnRootEntity().settings;

        function _getWorkflowName(model) {
            return model.getInfo().documentClass;
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
         * @description Contains options for grid configuration
         * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
         */
        self.grid = {
            limit: 5, //self.globalSetting.searchAmount, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    /*label: self.globalSetting.searchAmountLimit.toString(),
                     value: function () {
                     return (self.globalSetting.searchAmountLimit + 5)
                     }*/
                    label: langService.get('all'),
                    value: function () {
                        return (self.userInboxes.length + 21);
                    }
                }
            ]
        };

        self.openSidebarFilter = function () {
            self.sidebarFilter = !self.sidebarFilter;
        };

        self.filterGrid = {};

        self.userFilters = userFilters;

        self.workItemsFilters = [];

        self.selectedFilter = null;

        // just for start
        function _prepareFilters() {
            self.workItemsFilters = new Array(userFilters.length);
        }

        /**
         * @description create filter
         * @param $event
         * @returns {promise|*}
         */
        self.userFilterCreate = function ($event) {
            return userFilterService
                .createUserFilterDialog($event)
                .then(function () {
                    userFilterService.loadUserFilters().then(function (result) {
                        self.userFilters = result;
                    })
                });
        };
        /**
         * @description edit filter.
         * @param filter
         * @param $event
         * @returns {*}
         */
        self.userFilterEdit = function (filter, $event) {
            return userFilterService.editUserFilterDialog(filter, $event)
        };
        /**
         * @description delete filter
         * @param filter
         * @param $index
         * @param $event
         */
        self.userFilterDelete = function (filter, $index, $event) {
            return filter.deleteFilter($event).then(function () {
                self.userFilters.splice($index, 1)
            });
        };
        /**
         * @description load filter content
         * @param filter
         * @param $index
         */
        self.selectFilter = function (filter, $index) {
            self.selectedFilter = {
                index: $index,
                filter: angular.copy(filter)
            };
            correspondenceService.loadWorkItemsByFilterID(filter).then(function (workItems) {
                self.workItemsFilters[$index] = workItems;
            });
        };
        /**
         * @description Replaces the record in grid after update
         * @param record
         */
        self.replaceRecord = function (record) {
            var index = _.findIndex(self.userInboxes, function (userInbox) {
                return userInbox.generalStepElm.vsId === record.generalStepElm.vsId;
            });
            if (index > -1)
                self.userInboxes.splice(index, 1, record);
            mailNotificationService.loadMailNotifications(5);
        };

        /**
         * @description Reload the grid of user inboxes
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadUserInboxes = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;
            if (self.selectedFilter) {
                self.selectFilter(self.selectedFilter.filter, self.selectedFilter.index);
            }

            return userInboxService
                .loadUserInboxes()
                .then(function (result) {
                    counterService.loadCounters();
                    mailNotificationService.loadMailNotifications(5);
                    self.userInboxes = result;
                    // self.starredUserInboxes = _.filter(self.userInboxes, 'generalStepElm.starred');
                    self.selectedUserInboxes = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    return result;
                });
        };

        /**
         * @description Terminate User inboxes Bulk
         * @param $event
         */
        self.terminateUserInboxBulk = function ($event) {
            //var numberOfRecordsToTerminate = angular.copy(self.selectedUserInboxes.length);
            correspondenceService
                .terminateBulkWorkItem(self.selectedUserInboxes, $event)
                .then(function () {
                    self.reloadUserInboxes(self.grid.page);
                });
        };


        self.checkIfForwardBulkAvailable = function () {
            self.itemsAlreadyBroadCasted = [];
            _.map(self.selectedUserInboxes, function (workItem) {
                if (workItem.isBroadcasted())
                    self.itemsAlreadyBroadCasted.push(workItem.generalStepElm.vsId);
            });
            return !(self.itemsAlreadyBroadCasted && self.itemsAlreadyBroadCasted.length);
        };

        /**
         * @description Launch distribution workflow for selected review outgoing mails
         * @param $event
         */
        self.forwardBulk = function ($event) {
            var selectedItems = angular.copy(self.selectedUserInboxes);
            if (!self.checkIfForwardBulkAvailable()) {
                if (self.itemsAlreadyBroadCasted.length === selectedItems.length) {
                    dialog.alertMessage(langService.get('selected_items_are_broadcasted_can_not_forward'));
                    return false;
                }
                dialog.confirmMessage(langService.get('some_items_are_broadcasted_skip_and_forward'), null, null, $event).then(function () {
                    self.selectedUserInboxes = selectedItems = _.filter(self.selectedUserInboxes, function (workItem) {
                        return self.itemsAlreadyBroadCasted.indexOf(workItem.generalStepElm.vsId) === -1;
                    });
                    if (self.selectedUserInboxes.length)
                        forwardBulk(selectedItems, $event);
                })
            }
            else {
                forwardBulk(selectedItems, $event);
            }
        };

        function forwardBulk(selectedItems, $event) {
            return correspondenceService
                .launchCorrespondenceWorkflow(selectedItems, $event, 'forward', 'favorites')
                .then(function () {
                    self.reloadUserInboxes(self.grid.page);
                });
        }


        /**
         * @description Add To Folder User inboxes Bulk
         * @param $event
         */
        self.addToFolderUserInboxBulk = function ($event) {
            return correspondenceService
                .showAddBulkWorkItemsToFolder(self.selectedUserInboxes, self.userFolders, $event, false)
                .then(function () {
                    self.reloadUserInboxes(self.grid.page);
                });
        };

        /**
         * @description Change the starred for user inbox
         * @param userInbox
         * @param $event
         */
        self.changeUserInboxStar = function (userInbox, $event) {
            userInbox.toggleStar().then(function () {
                self.reloadUserInboxes(self.grid.page);
            });
        };

        /**
         * @description Change the starred for user inboxes Bulk
         * @param starUnStar
         * @param $event
         */
        self.changeUserInboxStarBulk = function (starUnStar, $event) {
            self.starServices[starUnStar](self.selectedUserInboxes)
                .then(function () {
                    self.reloadUserInboxes(self.grid.page);
                });
        };

        /**
         * @description Terminate User Inbox Item
         * @param userInbox
         * @param $event
         * @param defer
         */
        self.terminate = function (userInbox, $event, defer) {
            userInbox
                .terminate($event)
                .then(function () {
                    new ResolveDefer(defer);
                    self.reloadUserInboxes(self.grid.page);
                });
        };

        /**
         * @description Add To Folder
         * @param userInbox
         * @param $event
         */
        self.addToFolder = function (userInbox, $event) {
            userInbox.addToFolder(self.userFolders, $event, false).then(function () {
                self.reloadUserInboxes(self.grid.page);
            });
        };

        /**
         * @description add an item to the favorite documents
         * @param userInbox
         * @param $event
         */
        self.addToFavorite = function (userInbox, $event) {
            userInbox.addToFavorite().then(function () {
                self.reloadUserInboxes(self.grid.page)
            });
        };

        /**
         * @description Create Reply
         * @param userInbox
         * @param $event
         */
        self.createReplyIncoming = function (userInbox, $event) {
            var info = userInbox.getInfo();
            dialog.hide();
            $state.go('app.outgoing.add', {workItem: info.wobNumber, action: 'reply'});
        };

        /**
         * @description Forward
         * @param userInbox
         * @param $event
         * @param defer
         */
        self.forward = function (userInbox, $event, defer) {
            userInbox.launchWorkFlow($event, 'forward', 'favorites')
                .then(function () {
                    self.reloadUserInboxes(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                });
        };

        /**
         * @description Reply user inbox
         * @param userInbox
         * @param $event
         * @param defer
         */
        self.reply = function (userInbox, $event, defer) {
            userInbox.launchWorkFlow($event, 'reply')
                .then(function () {
                    self.reloadUserInboxes(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                });
        };

        /**
         * @description Get the link of user inbox
         * @param userInbox
         * @param $event
         */
        self.getLink = function (userInbox, $event) {
            console.log('getUserInboxLink', userInbox);
        };

        /**
         * @description Subscribe
         * @param userInbox
         * @param $event
         */
        self.subscribe = function (userInbox, $event) {
            console.log('subscribeUserInbox', userInbox);
        };

        /**
         * @description Export user inbox (export to ready to export)
         * @param userInbox
         * @param $event
         * @param defer
         */
        self.sendWorkItemToReadyToExport = function (userInbox, $event, defer) {
            if (userInbox.exportViaArchive()) {
                return userInbox.exportWorkItem($event, true).then(function () {
                    self.reloadUserInboxes(self.grid.page);
                    new ResolveDefer(defer);
                });
            }
            userInbox.sendToReadyToExport().then(function () {
                self.reloadUserInboxes(self.grid.page)
                    .then(function () {
                        toast.success(langService.get('export_success'));
                        new ResolveDefer(defer);
                    });
            })
        };

        /**
         * @description View Tracking Sheet
         * @param userInbox
         * @param params
         * @param $event
         */
        self.viewTrackingSheet = function (userInbox, params, $event) {
            viewTrackingSheetService
                .controllerMethod
                .viewTrackingSheetPopup(userInbox, params, $event).then(function (result) {

            });
        };

        /**
         * @description Manage Tags
         * @param userInbox
         * @param $event
         */
        self.manageTags = function (userInbox, $event) {
            var info = userInbox.getInfo();
            managerService.manageDocumentTags(info.vsId, info.documentClass, userInbox.getTranslatedName(), $event)
                .then(function () {
                    self.reloadUserInboxes(self.grid.page);
                })
                .catch(function (error) {
                    self.reloadUserInboxes(self.grid.page);
                });
        };

        /**
         * @description Manage Comments
         * @param userInbox
         * @param $event
         */
        self.manageComments = function (userInbox, $event) {
            //var info = userInbox.getInfo();
            userInbox.manageDocumentComments($event)
                .then(function () {
                    self.reloadUserInboxes(self.grid.page);
                })
                .catch(function (error) {
                    self.reloadUserInboxes(self.grid.page);
                });
        };

        /**
         * @description Manage Tasks
         * @param userInbox
         * @param $event
         */
        self.manageTasks = function (userInbox, $event) {
            console.log('manageUserInboxTasks : ', userInbox);
        };

        /**
         * @description Manage Attachments
         * @param userInbox
         * @param $event
         */
        self.manageAttachments = function (userInbox, $event) {
            userInbox.manageDocumentAttachments($event)
                .then(function () {
                    self.reloadUserInboxes(self.grid.page);
                })
                .catch(function (error) {
                    self.reloadUserInboxes(self.grid.page);
                });
        };


        /**
         * @description Manage Linked Documents
         * @param userInbox
         * @param $event
         */
        self.manageLinkedDocuments = function (userInbox, $event) {
            userInbox.manageDocumentLinkedDocuments($event)
                .then(function () {
                    self.reloadUserInboxes(self.grid.page);
                })
                .catch(function (error) {
                    self.reloadUserInboxes(self.grid.page);
                });
        };

        /**
         * @description Manage Linked Entities
         * @param userInbox
         * @param $event
         */
        self.manageLinkedEntities = function (userInbox, $event) {
            userInbox
                .manageDocumentEntities($event);
        };

        /**
         * @description Destinations
         * @param userInbox
         * @param $event
         */
        self.manageDestinations = function (userInbox, $event) {
            userInbox.manageDocumentCorrespondence($event)
                .then(function () {
                    self.reloadUserInboxes(self.grid.page);
                });
        };

        /**
         * @description View Direct Linked Documents
         * @param userInbox
         * @param $event
         */
        self.viewDirectLinkedDocuments = function (userInbox, $event) {
            console.log('viewUserInboxDirectLinkedDocuments : ', userInbox);
        };

        /**
         * @description View Complete Linked Documents
         * @param userInbox
         * @param $event
         */
        self.viewCompleteLinkedDocuments = function (userInbox, $event) {
            console.log('viewUserInboxCompleteLinkedDocuments : ', userInbox);
        };

        /**
         * @description Download Main Document
         * @param userInbox
         * @param $event
         */
        self.downloadMainDocument = function (userInbox, $event) {
            userInbox
                .mainDocumentDownload($event);
        };

        /**
         * @description Download Composite Document
         * @param userInbox
         * @param $event
         */
        self.downloadCompositeDocument = function (userInbox, $event) {
            userInbox
                .compositeDocumentDownload($event);
        };

        /**
         * @description Send Link To Document By Email
         * @param userInbox
         * @param $event
         */
        self.sendLinkToDocumentByEmail = function (userInbox, $event) {
            console.log('sendUserInboxLinkToDocumentByEmail : ', userInbox);
        };

        /**
         * @description Send Composite Document As Attachment
         * @param userInbox
         * @param $event
         */
        self.sendCompositeDocumentAsAttachment = function (userInbox, $event) {
            console.log('sendUserInboxCompositeDocumentAsAttachment : ', userInbox);
        };

        /**
         * @description Send Composite Document As Attachment By Email
         * @param userInbox
         * @param $event
         */
        self.sendCompositeDocumentAsAttachmentByEmail = function (userInbox, $event) {
            console.log('sendUserInboxCompositeDocumentAsAttachmentByEmail : ', userInbox);
        };

        /**
         * @description Send Main Document Fax
         * @param userInbox
         * @param $event
         */
        self.sendMainDocumentFax = function (userInbox, $event) {
            console.log('sendUserInboxMainDocumentFax : ', userInbox);
        };

        /**
         * @description Send SMS
         * @param userInbox
         * @param $event
         */
        self.sendSMS = function (userInbox, $event) {
            console.log('sendUserInboxSMS : ', userInbox);
        };

        /**
         * @description Send Main Document As Attachment
         * @param userInbox
         * @param $event
         */
        self.sendMainDocumentAsAttachment = function (userInbox, $event) {
            console.log('sendUserInboxMainDocumentAsAttachment : ', userInbox);
        };

        /**
         * @description Send Link
         * @param userInbox
         * @param $event
         */
        self.sendLink = function (userInbox, $event) {
            console.log('sendUserInboxLink : ', userInbox);
        };

        /**
         * @description Sign e-Signature
         * @param userInbox
         * @param $event
         * @param defer
         */
        self.signESignature = function (userInbox, $event, defer) {
            userInbox
                .approveWorkItem($event, defer)
                .then(function (result) {
                    userInbox
                        .launchWorkFlowCondition($event, 'reply', null, true, function () {
                            return result === 'INTERNAL_PERSONAL'
                        })
                        .then(function () {
                            self.reloadUserInboxes(self.grid.page);
                        });
                    self.reloadUserInboxes(self.grid.page);
                });
        };

        /**
         * @description Sign Digital Signature
         * @param userInbox
         * @param $event
         * @param defer
         */
        self.signDigitalSignature = function (userInbox, $event, defer) {
            console.log('signUserInboxDigitalSignature : ', userInbox);
        };

        /**
         * @description Edit Content
         * @param userInbox
         * @param $event
         */
        self.editContent = function (userInbox, $event) {
            userInbox.manageDocumentContent($event);
        };

        /**
         * @description Edit Properties
         * @param userInbox
         * @param $event
         */
        self.editProperties = function (userInbox, $event) {
            var info = userInbox.getInfo();
            managerService
                .manageDocumentProperties(info.vsId, info.documentClass, info.title, $event)
                .finally(function (e) {
                    self.reloadUserInboxes(self.grid.page)
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
            }
            else if (info.documentClass === "incoming")
                hasPermission = employeeService.hasPermissionTo("EDIT_INCOMING’S_PROPERTIES");
            else if (info.documentClass === "outgoing") {
                //If approved outgoing electronic, don't allow to edit
                if (info.docStatus >= 24 && !info.isPaper)
                    hasPermission = false;
                else
                    hasPermission = employeeService.hasPermissionTo("EDIT_OUTGOING_PROPERTIES");
            }
            if (checkForViewPopup)
                return !hasPermission;
            return hasPermission && !model.isBroadcasted();
        };


        var checkIfEditCorrespondenceSiteAllowed = function (model, checkForViewPopup) {
            var info = model.getInfo();
            var hasPermission = employeeService.hasPermissionTo("MANAGE_DESTINATIONS");
            var allowed = (hasPermission && info.documentClass !== "internal");
            if (checkForViewPopup)
                return !(allowed);
            return allowed;
        };

        /**
         * @description View document
         * @param userInbox
         * @param $event
         */
        self.viewDocument = function (userInbox, $event) {
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }

            userInbox.viewInboxWorkItem(self.gridActions, checkIfEditPropertiesAllowed(userInbox, true), checkIfEditCorrespondenceSiteAllowed(userInbox, true))
                .then(function () {
                    return self.reloadUserInboxes(self.grid.page);
                })
                .catch(function () {
                    return self.reloadUserInboxes(self.grid.page);
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
         * @description do broadcast for workItem.
         */
        self.broadcast = function (userInbox, $event, defer) {
            userInbox
                .correspondenceBroadcast()
                .then(function () {
                    self.reloadUserInboxes(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        })
                })
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
                        gridName: 'user-inbox'
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
            // Add To Folder
            {
                type: 'action',
                icon: 'folder-plus',
                text: 'grid_action_add_to_folder',
                shortcut: false,
                callback: self.addToFolder,
                class: "action-green",
                checkShow: self.checkToShowAction
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
            // Create Reply
            {
                type: 'action',
                icon: 'pen',
                text: 'grid_action_create_reply',
                shortcut: false,
                callback: self.createReplyIncoming,
                class: "action-green",
                //hide: true,
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    return self.checkToShowAction(action, model) && info.documentClass === "incoming" && !model.isBroadcasted();
                }
            },
            // Forward
            {
                type: 'action',
                icon: 'share',
                text: 'grid_action_forward',
                shortcut: true,
                callback: self.forward,
                class: "action-green",
                checkShow: function (action, model) {
                    return self.checkToShowAction(action, model)
                    /*&& !model.isBroadcasted()*/ // remove the this cond. after talk  with ;
                }
            },
            // Broadcast
            {
                type: 'action',
                icon: 'bullhorn',
                text: 'grid_action_broadcast',
                shortcut: false,
                hide: false,
                callback: self.broadcast,
                checkShow: function (action, model) {
                    return self.checkToShowAction && (!model.needApprove() || model.hasDocumentClass('incoming')) && !model.isBroadcasted();
                }
            },
            // Reply
            {
                type: 'action',
                icon: 'reply',
                text: 'grid_action_reply',
                shortcut: false,
                callback: self.reply,
                class: "action-green",
                checkShow: function (action, model) {
                    return self.checkToShowAction(action, model) && !model.isBroadcasted();
                }
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
                checkShow: function (action, model) {
                    return self.checkToShowAction(action, model) && !model.isBroadcasted();
                }
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
                checkShow: function (action, model) {
                    return self.checkToShowAction(action, model) && !model.isBroadcasted();
                }
            },
            // Export (Send to ready to export)
            {
                type: 'action',
                icon: 'export',
                text: 'grid_action_send_to_ready_to_export',
                textCallback: function (model) {
                    return model.exportViaArchive() ? 'grid_action_send_to_central_archive' : 'grid_action_send_to_ready_to_export';
                },
                shortcut: true,
                callback: self.sendWorkItemToReadyToExport,
                class: "action-green",
                checkShow: function (action, model) {
                    //addMethod = 0 (Electronic/Digital) - hide the export button
                    //addMethod = 1 (Paper) - show the export button
                    var info = model.getInfo();
                    // If internal book, no export is allowed
                    // If incoming book, no addMethod will be available. So check workFlowName(if incoming) and show export button
                    return self.checkToShowAction(action, model) && info.isPaper && info.documentClass === 'outgoing' && !model.isBroadcasted() && (info.docStatus <= 22);
                    // (model.generalStepElm.addMethod && model.generalStepElm.workFlowName.toLowerCase() !== 'internal')
                    // || model.generalStepElm.workFlowName.toLowerCase() === 'incoming';

                }
            },
            // Open
            {
                type: 'action',
                icon: 'book-open-variant',
                text: 'grid_action_open',
                shortcut: true,
                callback: self.viewDocument,
                class: "action-green",
                permissionKey: 'VIEW_DOCUMENT',
                showInView: false,
                checkShow: function (action, model) {
                    //If no content or no view document permission, hide the button
                    return self.checkToShowAction(action, model) && model.hasContent();
                }
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
            // View Tracking Sheet (Quick Action Only)
            {
                type: 'action',
                icon: 'eye',
                text: 'view_tracking_sheet',
                shortcut: true,
                onlyShortcut: true,
                showInView: false,
                permissionKey: "VIEW_DOCUMENT'S_TRACKING_SHEET",
                checkShow: self.checkToShowAction,
                callback: self.viewTrackingSheet,
                params: ['view_tracking_sheet', 'tabs']
            },
            // Manage
            {
                type: 'action',
                icon: 'settings',
                text: 'grid_action_manage',
                shortcut: false,
                checkShow: self.checkToShowAction,
                showInView: false,
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
            // View
            {
                type: 'action',
                icon: 'eye',
                text: 'grid_action_view',
                shortcut: false,
                hide: true,
                checkShow: self.checkToShowAction,
                subMenu: [
                    // Direct Linked Documents
                    {
                        type: 'action',
                        icon: 'file-document',
                        text: 'grid_action_direct_linked_documents',
                        shortcut: false,
                        callback: self.viewDirectLinkedDocuments,
                        class: "action-red",
                        checkShow: self.checkToShowAction
                    },
                    // Complete Linked Documents
                    {
                        type: 'action',
                        icon: 'link-variant',
                        text: 'grid_action_complete_linked_documents',
                        shortcut: false,
                        callback: self.viewCompleteLinkedDocuments,
                        class: "action-red",
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
                checkShow: function (action, model) {
                    return self.checkToShowAction(action, model) && !model.isBroadcasted();
                },
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
                    // Composite Document
                    {
                        type: 'action',
                        icon: 'attachment',
                        text: 'grid_action_composite_document_as_attachment',
                        shortcut: false,
                        callback: self.sendCompositeDocumentAsAttachment,
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
                    // Main Document As Attachment
                    {
                        type: 'action',
                        icon: 'attachment',
                        text: 'grid_action_main_document_as_attachment',
                        shortcut: false,
                        callback: self.sendMainDocumentAsAttachment,
                        class: "action-red",
                        checkShow: self.checkToShowAction
                    },
                    // Link
                    {
                        type: 'action',
                        icon: 'link-variant',
                        text: 'grid_action_send_link',
                        shortcut: false,
                        callback: self.sendLink,
                        class: "action-red",
                        checkShow: self.checkToShowAction
                    }
                ]
            },
            // Sign(Approve)
            {
                type: 'action',
                icon: 'approval',
                text: 'grid_action_approve',//signature
                shortcut: false,
                checkShow: function (action, model) {
                    //addMethod = 0 (Electronic/Digital) - show the button
                    //addMethod = 1 (Paper) - hide the button

                    // If outgoing or internal, show the button

                    /*If document is unapproved or partially approved, show the button. If fully approved, hide the button.
                     docStatus = 24 is approved
                     */
                    var info = model.getInfo();
                    return self.checkToShowAction(action, model) && !model.isBroadcasted()
                        && !info.isPaper
                        && (info.documentClass !== 'incoming')
                        && model.needApprove()
                        && (employeeService.hasPermissionTo("ELECTRONIC_SIGNATURE") || employeeService.hasPermissionTo("DIGITAL_SIGNATURE"));
                },
                subMenu: [
                    // e-Signature
                    {
                        type: 'action',
                        //icon: 'link-variant',
                        text: 'grid_action_electronic',//e_signature
                        shortcut: false,
                        callback: self.signESignature,
                        class: "action-green",
                        permissionKey: "ELECTRONIC_SIGNATURE",
                        checkShow: self.checkToShowAction
                    },
                    // Digital Signature
                    {
                        type: 'action',
                        //icon: 'attachment',
                        text: 'grid_action_digital',//digital_signature
                        shortcut: false,
                        callback: self.signDigitalSignature,
                        class: "action-red",
                        permissionKey: "DIGITAL_SIGNATURE",
                        hide: true,
                        checkShow: self.checkToShowAction
                    }
                ]
            },
            // Edit
            {
                type: 'action',
                icon: 'pencil',
                text: 'grid_action_edit',
                shortcut: false,
                showInView: false,
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    var hasPermission = false;
                    if (info.documentClass === "internal")
                        hasPermission = ((employeeService.hasPermissionTo("EDIT_INTERNAL_PROPERTIES") && checkIfEditPropertiesAllowed(model))
                            || (employeeService.hasPermissionTo("EDIT_INTERNAL_CONTENT") && info.docStatus < 23));
                    else if (info.documentClass === "incoming")
                        hasPermission = ((employeeService.hasPermissionTo("EDIT_INCOMING’S_PROPERTIES") && checkIfEditPropertiesAllowed(model))
                            || (employeeService.hasPermissionTo("EDIT_INCOMING’S_CONTENT") && info.docStatus < 23));
                    else if (info.documentClass === "outgoing")
                        hasPermission = ((employeeService.hasPermissionTo("EDIT_OUTGOING_PROPERTIES") && checkIfEditPropertiesAllowed(model))
                            || (employeeService.hasPermissionTo("EDIT_OUTGOING_CONTENT") && info.docStatus < 23));
                    return self.checkToShowAction(action, model) && hasPermission && !model.isBroadcasted();
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
                        shortcut: false,
                        callback: self.editContent,
                        class: "action-green",
                        checkShow: function (action, model) {
                            var info = model.getInfo();
                            /*If partially approved, don't show edit content*/
                            if (info.docStatus === 23)
                                return false;
                            var hasPermission = false;
                            if (info.documentClass === "internal")
                                hasPermission = employeeService.hasPermissionTo("EDIT_INTERNAL_CONTENT");
                            else if (info.documentClass === "incoming")
                                hasPermission = employeeService.hasPermissionTo("EDIT_INCOMING’S_CONTENT");
                            else if (info.documentClass === "outgoing")
                                hasPermission = employeeService.hasPermissionTo("EDIT_OUTGOING_CONTENT");
                            return self.checkToShowAction(action, model) && hasPermission && info.docStatus < 23;
                            /*If partially or fully approved, don't show edit content*/
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
                        shortcut: false,
                        callback: self.editProperties,
                        class: "action-green",
                        checkShow: function (action, model) {
                            return self.checkToShowAction(action, model) && checkIfEditPropertiesAllowed(model);
                        }
                    }
                ]
            }
        ];

        /**
         * @description Mark item as read/unread
         * @param userInbox
         * @param $event
         */
        self.markAsReadUnread = function (userInbox, $event) {
            return userInbox.markAsReadUnread($event)
                .then(function (result) {
                    self.replaceRecord(result);
                })
        };

        self.refreshInbox = function (time) {
            $timeout(function () {
                $state.is('app.inbox.user-inbox') && self.reloadUserInboxes(self.grid.page);
            }, time)
                .then(function () {
                    $state.is('app.inbox.user-inbox') && self.refreshInbox(time);
                });
        };

        if (self.globalSetting.inboxRefreshInterval) {
            var timer = (self.globalSetting.inboxRefreshInterval * 60 * 100 * 10);
            self.refreshInbox(timer);
        }
    });
};