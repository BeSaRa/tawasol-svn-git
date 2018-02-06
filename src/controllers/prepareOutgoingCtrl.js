module.exports = function (app) {
    app.controller('prepareOutgoingCtrl', function (lookupService,
                                                    prepareOutgoingService,
                                                    prepareOutgoings,
                                                    $q,
                                                    langService,
                                                    toast,
                                                    dialog,
                                                    generator,
                                                    counterService,
                                                    viewDocumentService,
                                                    managerService,
                                                    validationService,
                                                    employeeService,
                                                    $timeout,
                                                    contextHelpService,
                                                    viewTrackingSheetService,
                                                    broadcastService,
                                                    ResolveDefer,
                                                    correspondenceService) {
        'ngInject';
        var self = this;

        self.controllerName = 'prepareOutgoingCtrl';
        self.currentEmployee = employeeService.getEmployee();
        self.progress = null;

        contextHelpService.setHelpTo('outgoing-prepare');
        /**
         * @description All prepare outgoing mails
         * @type {*}
         */
        self.prepareOutgoings = prepareOutgoings;

        /**
         * @description Contains the selected prepare outgoing mails
         * @type {Array}
         */
        self.selectedPrepareOutgoings = [];

        /**
         * @description Contains options for grid configuration
         * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
         */
        self.grid = {
            limit: 5, // default limit
            page: 1, // first page
            //order: 'arName', // default sorting order
            order: '', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return (self.prepareOutgoings.length + 21);
                    }
                }
            ]
        };

        /**
         * @description Replaces the record in grid after update
         * @param record
         */
        self.replaceRecord = function (record) {
            var index = _.findIndex(self.prepareOutgoings, {'id': record.id});
            if (index > -1)
                self.prepareOutgoings.splice(index, 1, record);
        };

        /**
         * @description Reload the grid of prepare outgoing mail
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadPrepareOutgoings = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;
            return prepareOutgoingService
                .loadPrepareOutgoings()//self.currentEmployee.defaultOUID
                .then(function (result) {
                    counterService.loadCounters();
                    self.prepareOutgoings = result;
                    self.selectedPrepareOutgoings = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    return result;
                });
        };

        /**
         * @description Remove single prepare outgoing mail
         * @param prepareOutgoing
         * @param $event
         * @param defer
         */
        self.removePrepareOutgoing = function (prepareOutgoing, $event, defer) {
            //console.log('remove prepare outgoing mail : ', prepareOutgoing);
            prepareOutgoingService
                .controllerMethod
                .prepareOutgoingRemove(prepareOutgoing, $event)
                .then(function () {
                    self.reloadPrepareOutgoings(self.grid.page)
                        .then(function(){
                            new ResolveDefer(defer)
                        });
                });
        };

        /**
         * @description Remove multiple selected prepare outgoing mails
         * @param $event
         */
        self.removeBulkPrepareOutgoings = function ($event) {
            //console.log('remove prepare outgoing mails bulk : ', self.selectedPrepareOutgoings);
            prepareOutgoingService
                .controllerMethod
                .prepareOutgoingRemoveBulk(self.selectedPrepareOutgoings, $event)
                .then(function () {
                    self.reloadPrepareOutgoings(self.grid.page);
                });
        };

        self.editProperties = function (prepareOutgoing, $event) {
            // properties to preserve from override.
            var properties = [
                'attachments',
                'linkedEntities',
                'documentComments',
                'linkedDocs',
                'sitesInfoTo',
                'sitesInfoCC'
            ];

            managerService
                .manageDocumentProperties(prepareOutgoing.vsId, prepareOutgoing.docClassName, prepareOutgoing.docSubject, $event)
                .then(function (document) {
                    prepareOutgoing = generator.preserveProperties(properties, prepareOutgoing, document);
                    self.reloadPrepareOutgoings(self.grid.page);
                })
                .catch(function (document) {
                    prepareOutgoing = generator.preserveProperties(properties, prepareOutgoing, document);
                    self.reloadPrepareOutgoings(self.grid.page);
                });
        };

        /**
         * @description Send prepare outgoing to draft
         * @param prepareOutgoing
         * @param $event
         * @param defer
         */
        self.sendToDraft = function (prepareOutgoing, $event, defer) {
            prepareOutgoingService
                .sendToDraftPrepareOutgoing(prepareOutgoing)
                .then(function (result) {
                    self.reloadPrepareOutgoings(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('sent_to_draft_success').change({name: prepareOutgoing.documentTitle}));
                            new ResolveDefer(defer);
                        });
                })
        };

        /**
         * @description View Tracking Sheet
         * @param prepareOutgoing
         * @param params
         * @param $event
         */
        self.viewTrackingSheet = function (prepareOutgoing, params, $event) {
            viewTrackingSheetService
                .controllerMethod
                .viewTrackingSheetPopup(prepareOutgoing, params, $event).then(function (result) {

            });
        };

        /**
         * @description Manage document tags for prepare outgoing
         * @param prepareOutgoing
         * @param $event
         */
        self.manageTags = function (prepareOutgoing, $event) {
            managerService.manageDocumentTags(prepareOutgoing.vsId, prepareOutgoing.docClassName, prepareOutgoing.docSubject, $event)
                .then(function (tags) {
                    prepareOutgoing.tags = tags;
                })
                .catch(function (tags) {
                    prepareOutgoing.tags = tags;
                });
        };

        /**
         * @description Manage document comments for prepare outgoing
         * @param prepareOutgoing
         * @param $event
         */
        self.manageComments = function (prepareOutgoing, $event) {
            managerService.manageDocumentComments(prepareOutgoing.vsId, prepareOutgoing.docSubject, $event)
                .then(function (documentComments) {
                    prepareOutgoing.documentComments = documentComments;
                })
                .catch(function (documentComments) {
                    prepareOutgoing.documentComments = documentComments;
                });
        };

        /**
         * @description Manage document attachments for prepare outgoing
         * @param prepareOutgoing
         * @param $event
         */
        self.manageAttachments = function (prepareOutgoing, $event) {
            //console.log('manage attachments');
            managerService.manageDocumentAttachments(prepareOutgoing.vsId, prepareOutgoing.docClassName, prepareOutgoing.docSubject, $event)
                .then(function (attachments) {
                    prepareOutgoing.attachments = attachments;
                })
                .catch(function (attachments) {
                    prepareOutgoing.attachments = attachments;
                });
        };

        /**
         * @description Manage document entities for prepare outgoing
         * @param prepareOutgoing
         * @param $event
         */
        self.manageEntities = function (prepareOutgoing, $event) {
            console.log('manage entities : ', prepareOutgoing);
            managerService
                .manageDocumentEntities(prepareOutgoing.vsId, prepareOutgoing.docClassName, prepareOutgoing.docSubject, $event);
        };

        self.manageLinkedDocuments = function (prepareOutgoing, $event) {
            var info = prepareOutgoing.getInfo();
            return managerService.manageDocumentLinkedDocuments(info.vsId, info.documentClass);
        };
        self.security = function (prepareOutgoing, $event) {
            console.log('security : ', prepareOutgoing);
        };

        /**
         * @description Add content to the prepare outgoing document
         * @param prepareOutgoing
         * @param $event
         * @param defer
         */
        self.createContent = function (prepareOutgoing, $event, defer) {
            managerService.manageDocumentContent(prepareOutgoing.vsId, prepareOutgoing.docClassName, prepareOutgoing.docSubject, $event)
                .then(function () {
                    self.reloadPrepareOutgoings(self.grid.page)
                        .then(function(){
                            new ResolveDefer(defer);
                        });
                })
        };

        /**
         * @description Open document for prepare outgoing
         * @param prepareOutgoing
         * @param $event
         */
        self.openOutgoing = function (prepareOutgoing, $event) {
            //console.log('open prepare outgoing : ', prepareOutgoing);
            if (!prepareOutgoing.hasContent()) {
                dialog.alertMessage(langService.get('content_not_found'));
                return;
            }
            if(!employeeService.hasPermissionTo('VIEW_DOCUMENT')){
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            correspondenceService.viewCorrespondence(prepareOutgoing, self.gridActions);
            return;
        };

        /**
         * @description Manage destinations for prepare outgoing
         * @param prepareOutgoing
         * @param $event
         */
        self.manageDestinations = function (prepareOutgoing, $event) {
            managerService.manageDocumentCorrespondence(prepareOutgoing.vsId, prepareOutgoing.docClassName, prepareOutgoing.docSubject, $event);
        };

        /**
         * @description broadcast selected organizations and workflow groups
         * @param prepareOutgoing
         * @param $event
         */
        self.broadcast = function (prepareOutgoing, $event) {
            broadcastService
                .controllerMethod
                .broadcastSend(prepareOutgoing, $event)
                .then(function () {
                    self.reloadPrepareOutgoings(self.grid.page);
                })
                .catch(function () {
                    self.reloadPrepareOutgoings(self.grid.page);
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
         * @description export book
         */
        self.exportBook = function (model, $event) {
            console.log(model);
        };

        /**
         * @description Array of actions that can be performed on grid
         * @type {[*]}
         */
        self.gridActions = [
            {
                type: 'action',
                icon: 'information-variant',
                text: 'grid_action_document_info',
                shortcut: false,
                showInView: false,
                checkShow: self.checkToShowAction,
                submenu: [
                    {
                        type: 'info',
                        checkShow: self.checkToShowAction

                    }],
                class: "action-green"
            },
            {
                type: 'separator',
                checkShow: self.checkToShowAction,
                showInView: false
            },
            // Remove
            {
                type: 'action',
                icon: 'delete',
                text: 'grid_action_remove',
                shortcut: true,
                callback: self.removePrepareOutgoing,
                class: "action-green",
                checkShow: self.checkToShowAction
            },
            // Edit outgoing properties
            {
                type: 'action',
                icon: 'pencil',
                text: 'grid_action_edit_outgoing_properties',
                shortcut: true,
                showInView: false,
                permissionKey: "EDIT_OUTGOING_PROPERTIES",
                callback: self.editProperties,
                class: "action-green",
                checkShow: self.checkToShowAction
            },
            // Send to draft (Send to draft without content is not allowed and if you add content, document will automatically go to review queue)
            /*{
                type: 'action',
                icon: 'send',
                text: 'grid_action_send_to_draft',
                shortcut: true,
                callback: self.sendToDraft,
                class: "action-green",
                hide: true,
                checkShow: self.checkToShowAction
            },*/
            {
                type: 'separator',
                checkShow: self.checkToShowAction
            },
            // Export
            {
                type: 'action',
                icon: 'export',
                text: 'grid_action_export',
                shortcut: true,
                callback: self.exportBook,
                class: "action-red",
                hide: true,
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
                submenu: viewTrackingSheetService.getViewTrackingSheetOptions(self.checkToShowAction, self.viewTrackingSheet, 'grid')
            },
            // Manage
            {
                type: 'action',
                icon: 'settings',
                text: 'grid_action_manage',
                shortcut: false,
                showInView: false,
                checkShow: self.checkToShowAction,
                submenu: [
                    {
                        type: 'action',
                        icon: 'tag',
                        text: 'grid_action_tags',
                        shortcut: false,
                        callback: self.manageTags,
                        class: "action-green",
                        checkShow: self.checkToShowAction
                    },
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
                    {
                        type: 'action',
                        icon: 'attachment',
                        text: 'grid_action_attachments',
                        shortcut: true,
                        callback: self.manageAttachments,
                        class: "action-green",
                        checkShow: self.checkToShowAction
                    },
                    {
                        type: 'action',
                        icon: 'pencil-box-outline',
                        text: 'grid_action_entities',
                        shortcut: false,
                        callback: self.manageEntities,
                        class: "action-green",
                        checkShow: self.checkToShowAction
                    },
                    {
                        type: 'action',
                        icon: 'file-document',
                        text: 'grid_action_linked_documents',
                        shortcut: false,
                        callback: self.manageLinkedDocuments,
                        class: "action-green",
                        //hide: true,
                        checkShow: self.checkToShowAction
                    },
                    {
                        type: 'action',
                        icon: 'stop',
                        text: 'grid_action_destinations',
                        shortcut: false,
                        callback: self.manageDestinations,
                        permissionKey: "MANAGE_DESTINATIONS",
                        hide: false,
                        class: "action-yellow",
                        checkShow: self.checkToShowAction
                    }
                ]
            },
            // Security
            {
                type: 'action',
                icon: 'security',
                text: 'grid_action_security',
                shortcut: false,
                callback: self.security,
                class: "action-red",
                hide: true,
                checkShow: self.checkToShowAction
            },
            // Create Content
            {
                type: 'action',
                icon: 'plus',
                text: 'grid_action_create_content',
                shortcut: true,
                callback: self.createContent,
                class: "action-green",
                showInView: false,
                checkShow: function(action, model){
                    return self.checkToShowAction(action, model) && !model.hasContent();
                }
            },
            // Open
            {
                type: 'action',
                icon: 'book-open-variant',
                text: 'grid_action_open',
                shortcut: false,
                callback: self.openOutgoing,
                showInView: false,
                class: "action-green",
                permissionKey: 'VIEW_DOCUMENT',
                checkShow: function (action, model) {
                    //If no content or no view document permission, hide the button
                    return self.checkToShowAction(action, model) && model.hasContent();
                }
            },
            // Broadcast
            {
                type: 'action',
                icon: 'send',
                text: 'grid_action_broadcast',
                shortcut: false,
                hide: true,
                callback: self.broadcast,
                class: 'action-green',
                checkShow: function (action, model) {
                    return self.checkToShowAction(action, model) && (model.addMethod || model.approvers !== null);
                }
            }
        ];

        /**
         * @description View document
         * @param prepareOutgoing
         * @param $event
         */
        self.viewDocument = function (prepareOutgoing, $event) {
            //console.log("view prepareOutgoing", prepareOutgoing);
            if (!prepareOutgoing.hasContent()) {
                dialog.alertMessage(langService.get('content_not_found'));
                return;
            }
            if(!employeeService.hasPermissionTo('VIEW_DOCUMENT')){
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }

            correspondenceService.viewCorrespondence(prepareOutgoing, self.gridActions);
            return;

        };
    });
};