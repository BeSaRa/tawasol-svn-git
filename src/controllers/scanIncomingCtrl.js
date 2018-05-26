module.exports = function (app) {
    app.controller('scanIncomingCtrl', function (lookupService,
                                                 scanIncomingService,
                                                 scanIncomings,
                                                 $q,
                                                 langService,
                                                 toast,
                                                 dialog,
                                                 employeeService,
                                                 managerService,
                                                 viewTrackingSheetService,
                                                 broadcastService,
                                                 generator,
                                                 contextHelpService,
                                                 ResolveDefer) {
        'ngInject';
        var self = this;

        self.controllerName = 'scanIncomingCtrl';
        self.currentEmployee = employeeService.getEmployee();
        self.progress = null;

        contextHelpService.setHelpTo('incoming-scan');

        /**
         * @description All scan incomings
         * @type {*}
         */
        self.scanIncomings = scanIncomings;

        /**
         * @description Contains the selected scan incomings
         * @type {Array}
         */
        self.selectedScanIncomings = [];

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
                        return (self.scanIncomings.length + 21);
                    }
                }
            ]
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
         * @description Reload the grid of scan incoming
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadScanIncomings = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;
            return scanIncomingService
                .loadScanIncomings()
                .then(function (result) {
                    self.scanIncomings = result;
                    self.selectedScanIncomings = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    return result;
                });
        };

        /**
         * @description Delete single scan incoming
         * @param scanIncoming
         * @param $event
         * @param defer
         */
        self.removeScanIncoming = function (scanIncoming, $event, defer) {
            scanIncomingService
                .controllerMethod
                .scanIncomingRemove(scanIncoming, $event)
                .then(function () {
                    self.reloadScanIncomings(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        })
                    ;
                });
        };

        /**
         * @description Delete multiple selected scan incomings
         * @param $event
         */
        self.removeBulkScanIncomings = function ($event) {
            scanIncomingService
                .controllerMethod
                .scanIncomingRemoveBulk(self.selectedScanIncomings, $event)
                .then(function () {
                    self.reloadScanIncomings(self.grid.page);
                });
        };

        /**
         * @description Change the status of scan incoming
         * @param scanIncoming
         */
        self.changeStatusScanIncoming = function (scanIncoming) {
            self.statusServices[scanIncoming.status](scanIncoming)
                .then(function () {
                    toast.success(langService.get('status_success'));
                })
                .catch(function () {
                    scanIncoming.status = !scanIncoming.status;
                    dialog.errorMessage(langService.get('something_happened_when_update_status'));
                })
        };

        /**
         * @description Change the status of selected scan incomings
         * @param status
         */
        self.changeStatusBulkScanIncomings = function (status) {
            self.statusServices[status](self.selectedScanIncomings)
                .then(function () {
                    self.reloadScanIncomings(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('selected_status_updated'));
                        });
                });
        };

        /**
         * @description Edit incoming properties
         * @param scanIncoming
         * @param $event
         */
        self.editProperties = function (scanIncoming, $event) {
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
                .manageDocumentProperties(scanIncoming.vsId, scanIncoming.docClassName, scanIncoming.docSubject, $event)
                .then(function (document) {
                    scanIncoming = generator.preserveProperties(properties, scanIncoming, document);
                    self.reloadScanIncomings(self.grid.page);
                })
                .catch(function (document) {
                    scanIncoming = generator.preserveProperties(properties, scanIncoming, document);
                    self.reloadScanIncomings(self.grid.page);
                });
        };

        /**
         * @description View Tracking Sheet
         * @param scanIncoming
         * @param params
         * @param $event
         */
        self.viewTrackingSheet = function (scanIncoming, params, $event) {
            //console.log('view tracking sheet', scanIncoming);
            viewTrackingSheetService
                .controllerMethod
                .viewTrackingSheetPopup(scanIncoming, params, $event).then(function (result) {

            });
        };

        /**
         * @description Manage document tags for scan incoming
         * @param scanIncoming
         * @param $event
         */
        self.manageTags = function (scanIncoming, $event) {
            managerService.manageDocumentTags(scanIncoming.vsId, scanIncoming.classDescription, scanIncoming.docSubject, $event)
                .then(function (tags) {
                    scanIncoming.tags = tags;
                })
                .catch(function (tags) {
                    scanIncoming.tags = tags;
                });
        };

        /**
         * @description Manage document comments for scan incoming
         * @param scanIncoming
         * @param $event
         */
        self.manageComments = function (scanIncoming, $event) {
            console.log('manage comments', scanIncoming);
            managerService.manageDocumentComments(scanIncoming.vsId, scanIncoming.docSubject, $event)
                .then(function (documentComments) {
                    scanIncoming.documentComments = documentComments;
                })
                .catch(function (documentComments) {
                    scanIncoming.documentComments = documentComments;
                });
        };

        /**
         * @description Manage document attachments for scan incoming
         * @param scanIncoming
         * @param $event
         */
        self.manageAttachments = function (scanIncoming, $event) {
            managerService.manageDocumentAttachments(scanIncoming.vsId, scanIncoming.classDescription, scanIncoming.docSubject, $event)
                .then(function (attachments) {
                    scanIncoming = attachments;
                })
                .catch(function (attachments) {
                    scanIncoming = attachments;
                });
        };

        /**
         * @description Manage document entities for scan incoming
         * @param scanIncoming
         * @param $event
         */
        self.manageEntities = function (scanIncoming, $event) {
            //console.log('manage entities : ', scanIncoming);
            managerService
                .manageDocumentEntities(scanIncoming.vsId, scanIncoming.classDescription, scanIncoming.docSubject, $event);
        };

        /**
         * @description Manage document's linked documents for scan incoming
         * @param scanIncoming
         * @param $event
         */
        self.manageLinkedDocuments = function (scanIncoming, $event) {
            //console.log('manage linked documents : ', scanIncoming);
            var info = scanIncoming.getInfo();
            return managerService.manageDocumentLinkedDocuments(info.vsId, info.documentClass);
        };

        /**
         * @description Destinations
         * @param scanIncoming
         * @param $event
         */
        self.manageDestinations = function (scanIncoming, $event) {
            managerService.manageDocumentCorrespondence(scanIncoming.vsId, scanIncoming.docClassName, scanIncoming.docSubject, $event)
        };

        /**
         * @description document security for scan incoming
         * @param scanIncoming
         * @param $event
         */
        self.security = function (scanIncoming, $event) {
            console.log('manage security : ', scanIncoming);
        };

        /**
         * @description Add content to the scan incoming document
         * @param scanIncoming
         * @param $event
         */
        self.createContent = function (scanIncoming, $event, defer) {
            managerService.manageDocumentContent(scanIncoming.vsId, scanIncoming.docClassName, scanIncoming.docSubject, $event)
                .then(function () {
                    self.reloadScanIncomings(self.grid.page)
                        .then(function(){
                            new ResolveDefer(defer);
                        });
                })
        };

        /**
         * @description broadcast selected organizations and workflow groups
         * @param scanIncoming
         * @param $event
         */
        self.broadcast = function (scanIncoming, $event) {
            broadcastService
                .controllerMethod
                .broadcastSend(scanIncoming, $event)
                .then(function () {
                    self.reloadScanIncomings(self.grid.page);
                })
                .catch(function () {
                    self.reloadScanIncomings(self.grid.page);
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
                subMenu: [
                    {
                        type: 'info',
                        checkShow: self.checkToShowAction,
                        gridName: 'incoming-scan'

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
                callback: self.removeScanIncoming,
                class: "action-green",
                checkShow: self.checkToShowAction
            },
            // Edit incoming properties
            {
                type: 'action',
                icon: 'pencil',
                text: 'grid_action_edit_incoming_properties',
                shortcut: true,
                permissionKey: "EDIT_INCOMING’S_PROPERTIES",
                callback: self.editProperties,
                showInView: false,
                class: "action-green",
                checkShow: self.checkToShowAction
            },
            {
                type: 'separator',
                checkShow: self.checkToShowAction,
                showInView: false
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
                    // Attachments
                    {
                        type: 'action',
                        icon: 'attachment',
                        text: 'grid_action_attachments',
                        shortcut: true,
                        callback: self.manageAttachments,
                        class: "action-green",
                        checkShow: self.checkToShowAction
                    },
                    // Entities
                    {
                        type: 'action',
                        icon: 'pencil-box-outline',
                        text: 'grid_action_entities',
                        shortcut: false,
                        callback: self.manageEntities,
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
                    // Destinations
                    {
                        type: 'action',
                        icon: 'stop',
                        text: 'grid_action_destinations',
                        shortcut: false,
                        callback: self.manageDestinations,
                        permissionKey: "MANAGE_DESTINATIONS",
                        class: "action-green",
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
            // Broadcast
            {
                type: 'action',
                icon: 'bullhorn',
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
    });
};