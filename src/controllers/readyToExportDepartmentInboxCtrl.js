module.exports = function (app) {
    app.controller('readyToExportDepartmentInboxCtrl', function (lookupService,
                                                                 readyToExportService,
                                                                 readyToExports,
                                                                 userInboxService,
                                                                 $state,
                                                                 employeeService,
                                                                 listGeneratorService,
                                                                 correspondenceStorageService,
                                                                 correspondenceService,
                                                                 $q,
                                                                 langService,
                                                                 toast,
                                                                 counterService,
                                                                 viewDocumentService,
                                                                 userFolderService,
                                                                 managerService,
                                                                 userFolders,
                                                                 contextHelpService,
                                                                 dialog,
                                                                 viewTrackingSheetService,
                                                                 broadcastService,
                                                                 downloadService,
                                                                 favoriteDocumentsService,
                                                                 ResolveDefer) {
        'ngInject';
        var self = this;
        /*
       IT WILL ALWAYS GET OUTGOING DOCUMENTS ONLY
       */

        self.controllerName = 'readyToExportDepartmentInboxCtrl';

        self.progress = null;
        self.userFolders = userFolders;
        contextHelpService.setHelpTo('department-inbox-ready-to-export');

        /**
         * @description All ready To Exports
         * @type {*}
         */
        self.readyToExports = readyToExports;

        /**
         * @description Contains the selected ready To Exports
         * @type {Array}
         */
        self.selectedReadyToExports = [];

        self.starServices = {
            'false': readyToExportService.controllerMethod.readyToExportStar,
            'true': readyToExportService.controllerMethod.readyToExportUnStar,
            'starBulk': readyToExportService.controllerMethod.readyToExportStarBulk,
            'unStarBulk': readyToExportService.controllerMethod.readyToExportUnStarBulk
        };

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
                    label: langService.get('all'),
                    value: function () {
                        return (self.readyToExports.length + 21);
                    }
                }
            ]
        };

        /**
         * @description Contains methods for CRUD operations for ready To Exports
         */
        self.statusServices = {
            'activate': readyToExportService.activateBulkReadyToExports,
            'deactivate': readyToExportService.deactivateBulkReadyToExports,
            'true': readyToExportService.activateReadyToExport,
            'false': readyToExportService.deactivateReadyToExport
        };

        /**
         * @description Opens dialog for add new ready To Export
         * @param $event
         */
        self.openAddReadyToExportDialog = function ($event) {
            readyToExportService
                .controllerMethod
                .readyToExportAdd($event)
                .then(function () {
                    self.reloadReadyToExports(self.grid.page);
                })
        };

        /**
         * @description Opens dialog for edit ready To Export
         * @param readyToExport
         * @param $event
         */
        self.openEditReadyToExportDialog = function (readyToExport, $event) {
            readyToExportService
                .controllerMethod
                .readyToExportEdit(readyToExport, $event)
                .then(function () {
                    self.reloadReadyToExports(self.grid.page);
                });
        };

        /**
         * @description Reload the grid of ready To Export
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadReadyToExports = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;
            return readyToExportService
                .loadReadyToExports()
                .then(function (result) {
                    counterService.loadCounters();
                    self.readyToExports = result;
                    self.selectedReadyToExports = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    return result;
                });
        };

        /**
         * @description Delete single ready To Export
         * @param readyToExport
         * @param $event
         * @param defer
         */
        self.removeReadyToExport = function (readyToExport, $event, defer) {
            readyToExportService
                .controllerMethod
                .readyToExportDelete(readyToExport, $event)
                .then(function () {
                    self.reloadReadyToExports(self.grid.page)
                        .then(function () {
                            new ResolveDefer(defer);
                        });
                });
        };

        /**
         * @description Delete multiple selected ready To Exports
         * @param $event
         */
        self.removeBulkReadyToExports = function ($event) {
            readyToExportService
                .controllerMethod
                .readyToExportDeleteBulk(self.selectedReadyToExports, $event)
                .then(function () {
                    self.reloadReadyToExports(self.grid.page);
                });
        };

        /**
         * @description Change the status of ready To Export
         * @param readyToExport
         */
        self.changeStatusReadyToExport = function (readyToExport) {
            self.statusServices[readyToExport.status](readyToExport)
                .then(function () {
                    toast.show(langService.get('status_success'));
                })
                .catch(function () {
                    readyToExport.status = !readyToExport.status;
                    dialog.errorMessage(langService.get('something_happened_when_update_status'));
                })
        };

        /**
         * @description Change the status of selected ready To Exports
         * @param status
         */
        self.changeStatusBulkReadyToExports = function (status) {
            self.statusServices[status](self.selectedReadyToExports).then(function () {
                self.reloadReadyToExports(self.grid.page).then(function () {
                    toast.show(langService.get('selected_status_updated'));
                });
            });
        };

        /**
         * @description Export user inbox
         * @param readyToExport
         * @param $event
         * @param defer
         */
        self.exportReadyToExport = function (readyToExport, $event, defer) {
            readyToExportService
                .controllerMethod
                .readyToExportOptions(readyToExport, $event)
                .then(function (result) {
                    self.reloadReadyToExports(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('export_success'));
                            new ResolveDefer(defer);
                        });
                })
        };

        /**
         * @description Terminate Ready To Export Bulk
         * @param $event
         */
        self.terminateReadyToExportBulk = function ($event) {
            var numberOfRecordsToTerminate = angular.copy(self.selectedReadyToExports.length);
            readyToExportService
                .controllerMethod
                .readyToExportTerminateBulk(self.selectedReadyToExports)
                .then(function () {
                    self.reloadReadyToExports(self.grid.page)
                        .then(function () {
                            if (numberOfRecordsToTerminate === 1)
                                toast.success(langService.get("selected_terminate_success"));
                        });
                });
        };

        self.exportReadyToExportBulk = function ($event) {
            console.log('exportReadyToExportBulk', self.selectedReadyToExports);
        };

        /**
         * @description Add To Folder Ready To Export Bulk
         * @param $event
         */
        self.addToFolderReadyToExportBulk = function ($event) {
            /*var itemsToAdd = _.map(self.selectedReadyToExports, 'generalStepElm.workObjectNumber');
             userFolderService
             .controllerMethod
             .addToUserFolderBulk(itemsToAdd, self.selectedReadyToExports, $event)
             .then(function (result) {
             self.reloadReadyToExports(self.grid.page);
             });*/
        };

        /**
         * @description Change the starred for Ready To Export
         * @param readyToExport
         * @param $event
         */
        self.changeReadyToExportStar = function (readyToExport, $event) {
            self.starServices[readyToExport.generalStepElm.starred](readyToExport)
                .then(function (result) {
                    if (result) {
                        self.reloadReadyToExports(self.grid.page)
                            .then(function () {
                                if (!readyToExport.generalStepElm.starred)
                                    toast.success(langService.get("star_specific_success").change({name: readyToExport.getTranslatedName()}));
                                else
                                    toast.success(langService.get("unstar_specific_success").change({name: readyToExport.getTranslatedName()}));
                            });
                    }
                    else {
                        dialog.errorMessage(langService.get('something_happened_when_update_starred'));
                    }
                })
                .catch(function () {
                    readyToExport.generalStepElm.starred = !readyToExport.generalStepElm.starred;
                    dialog.errorMessage(langService.get('something_happened_when_update_starred'));
                });
        };

        /**
         * @description Change the starred for Ready To Export Bulk
         * @param starUnStar
         * @param $event
         */
        self.changeReadyToExportStarBulk = function (starUnStar, $event) {
            self.starServices[starUnStar](self.selectedReadyToExports)
                .then(function (result) {
                    self.reloadReadyToExports(self.grid.page);
                });
        };

        /**
         * @description Terminate Ready To Export Item
         * @param readyToExport
         * @param $event
         * @param defer
         */
        self.terminateReadyToExport = function (readyToExport, $event, defer) {
            readyToExportService
                .controllerMethod
                .readyToExportTerminate(readyToExport, $event)
                .then(function () {
                    self.reloadReadyToExports(self.grid.page)
                        .then(function () {
                            toast.success(langService.get("terminate_specific_success").change({name: readyToExport.getTranslatedName()}));
                            new ResolveDefer(defer);
                        });
                });
        };


        /**
         * @description add an item to the favorite documents
         * @param readyToExport
         * @param $event
         */
        self.addToFavorite = function (readyToExport, $event) {
            favoriteDocumentsService.controllerMethod
                .favoriteDocumentAdd(readyToExport.generalStepElm.vsId, $event)
                .then(function (result) {
                        if (result.status) {
                            self.reloadReadyToExports(self.grid.page)
                                .then(function () {
                                    toast.success(langService.get("add_to_favorite_specific_success").change({
                                        name: readyToExport.getTranslatedName()
                                    }));
                                });
                        }
                        else {
                            dialog.alertMessage(langService.get(result.message));
                        }
                    }
                );
        };

        /**
         * @description Add To Folder
         * @param readyToExport
         * @param $event
         */
        self.addToFolderReadyToExport = function (readyToExport, $event) {
            /*userFolderService
             .controllerMethod
             .addToUserFolder(readyToExport.generalStepElm.workObjectNumber, readyToExport.generalStepElm.folderId, readyToExport, $event)
             .then(function (result) {
             if (result === -1) {
             toast.error(langService.get("inbox_failed_add_to_folder_selected"));
             }
             else {
             self.reloadReadyToExports(self.grid.page)
             .then(function () {
             var currentFolder = _.find(userFolderService.allUserFolders, ['id', result]);
             toast.success(langService.get("inbox_add_to_folder_specific_success").change({
             name: readyToExport.getTranslatedName(),
             folder: currentFolder.getTranslatedName()
             }));
             });
             }
             });*/
        };

        /**
         * @description Download Main Document
         * @param readyToExport
         * @param $event
         */
        self.downloadMainDocument = function (readyToExport, $event) {
            downloadService.controllerMethod
                .mainDocumentDownload(readyToExport.generalStepElm.vsId);
        };

        /**
         * @description Download Composite Document
         * @param readyToExport
         * @param $event
         */
        self.downloadCompositeDocument = function (readyToExport, $event) {
            downloadService.controllerMethod
                .compositeDocumentDownload(readyToExport.generalStepElm.vsId);
        };

        /**
         * @description Manage Tags
         * @param readyToExport
         * @param $event
         */
        self.manageTags = function (readyToExport, $event) {
            var vsId = readyToExport.hasOwnProperty('generalStepElm')
                ? (readyToExport.generalStepElm.hasOwnProperty('vsId') ? readyToExport.generalStepElm.vsId : readyToExport.generalStepElm)
                : (readyToExport.hasOwnProperty('vsId') ? readyToExport.vsId : readyToExport);
            var wfName = readyToExport.hasOwnProperty('generalStepElm')
                ? (readyToExport.generalStepElm.hasOwnProperty('workFlowName') ? readyToExport.generalStepElm.workFlowName : readyToExport.generalStepElm)
                : (readyToExport.hasOwnProperty('workFlowName') ? readyToExport.workFlowName : readyToExport);
            managerService.manageDocumentTags(vsId, wfName, readyToExport.getTranslatedName(), $event)
                .then(function () {
                    self.reloadReadyToExports(self.grid.page);
                })
                .catch(function (error) {
                    self.reloadReadyToExports(self.grid.page);
                });
        };

        /**
         * @description Manage Comments
         * @param readyToExport
         * @param $event
         */
        self.manageComments = function (readyToExport, $event) {
            //console.log('readyToExport : ', readyToExport);
            var vsId = readyToExport.hasOwnProperty('generalStepElm')
                ? (readyToExport.generalStepElm.hasOwnProperty('vsId') ? readyToExport.generalStepElm.vsId : readyToExport.generalStepElm)
                : (readyToExport.hasOwnProperty('vsId') ? readyToExport.vsId : readyToExport);
            var wfName = readyToExport.hasOwnProperty('generalStepElm')
                ? (readyToExport.generalStepElm.hasOwnProperty('workFlowName') ? readyToExport.generalStepElm.workFlowName : readyToExport.generalStepElm)
                : (readyToExport.hasOwnProperty('workFlowName') ? readyToExport.workFlowName : readyToExport);
            managerService.manageDocumentComments(vsId, wfName, $event)
                .then(function () {
                    self.reloadReadyToExports(self.grid.page);
                })
                .catch(function (error) {
                    self.reloadReadyToExports(self.grid.page);
                });
        };

        /**
         * @description Manage Tasks
         * @param readyToExport
         * @param $event
         */
        self.manageTasks = function (readyToExport, $event) {
            console.log('manageReadyToExportTasks : ', readyToExport);
        };

        /**
         * @description Manage Attachments
         * @param readyToExport
         * @param $event
         */
        self.manageAttachments = function (readyToExport, $event) {
            //console.log('manageReadyToExportAttachments : ', readyToExport);
            var vsId = readyToExport.hasOwnProperty('generalStepElm')
                ? (readyToExport.generalStepElm.hasOwnProperty('vsId') ? readyToExport.generalStepElm.vsId : readyToExport.generalStepElm)
                : (readyToExport.hasOwnProperty('vsId') ? readyToExport.vsId : readyToExport);
            var wfName = readyToExport.hasOwnProperty('generalStepElm')
                ? (readyToExport.generalStepElm.hasOwnProperty('workFlowName') ? readyToExport.generalStepElm.workFlowName : readyToExport.generalStepElm)
                : (readyToExport.hasOwnProperty('workFlowName') ? readyToExport.workFlowName : readyToExport);
            managerService.manageDocumentAttachments(vsId, wfName, readyToExport.getTranslatedName(), $event);
        };

        /**
         * @description Manage Linked Documents
         * @param readyToExport
         * @param $event
         */
        self.manageLinkedDocuments = function (readyToExport, $event) {
            //console.log('manageReadyToExportLinkedDocuments : ', readyToExport);
            var info = readyToExport.getInfo();
            managerService.manageDocumentLinkedDocuments(info.vsId, info.documentClass, "welcome");
        };

        /**
         * @description Manage Linked Entities
         * @param readyToExport
         * @param $event
         */
        self.manageLinkedEntities = function (readyToExport, $event) {
            //console.log('manageReadyToExportLinkedEntities : ', readyToExport);
            managerService
                .manageDocumentEntities(readyToExport.generalStepElm.vsId, readyToExport.generalStepElm.workFlowName, readyToExport.generalStepElm.docSubject, $event);
        };

        /**
         * @description Destinations
         * @param readyToExport
         * @param $event
         */
        self.manageDestinations = function (readyToExport, $event) {
            var info = readyToExport.getInfo();
            managerService.manageDocumentCorrespondence(info.vsId, info.documentClass, info.title, $event)
        };

        /**
         * @description View Tracking Sheet
         * @param readyToExport
         * @param params
         * @param $event
         */
        self.viewTrackingSheet = function (readyToExport, params, $event) {
            viewTrackingSheetService
                .controllerMethod
                .viewTrackingSheetPopup(readyToExport, params, $event).then(function (result) {
            });
        };

        /**
         * @description View Direct Linked Documents
         * @param readyToExport
         * @param $event
         */
        self.viewReadyToExportDirectLinkedDocuments = function (readyToExport, $event) {
            console.log('viewReadyToExportDirectLinkedDocuments : ', readyToExport);
        };

        /**
         * @description View Complete Linked Documents
         * @param readyToExport
         * @param $event
         */
        self.viewReadyToExportCompleteLinkedDocuments = function (readyToExport, $event) {
            console.log('viewReadyToExportCompleteLinkedDocuments : ', readyToExport);
        };

        /**
         * @description Edit Outgoing Content
         * @param readyToExport
         * @param $event
         */
        self.editContent = function (readyToExport, $event) {
            var info = readyToExport.getInfo();
            managerService.manageDocumentContent(info.vsId, info.workFlow, info.title, $event);
        };


        /**
         * @description Edit Outgoing Properties
         * @param readyToExport
         * @param $event
         */
        self.editProperties = function (readyToExport, $event) {
            var info = readyToExport.getInfo();
            managerService
                .manageDocumentProperties(info.vsId, info.documentClass, info.title, $event)
                .finally(function (document) {
                    self.reloadReadyToExports(self.grid.page)
                });
        };

        /**
         * @description broadcast selected organization and workflow group
         * @param readyToExport
         * @param $event
         */
        self.broadcast = function (readyToExport, $event) {
            broadcastService
                .controllerMethod
                .broadcastSend(readyToExport, $event)
                .then(function () {
                    self.reloadReadyToExports(self.grid.page);
                })
                .catch(function () {
                    self.reloadReadyToExports(self.grid.page);
                });
        };

        /**
         * @description Edit After Approve
         * @param model
         * @param $event
         */
        self.editAfterApprove = function (model, $event) {
            var info = model.getInfo(), list = listGeneratorService.createUnOrderList(),
                langKeys = ['signature_serial_will_removed', 'the_book_will_go_to_audit', 'serial_retained'];
            _.map(langKeys, function (item) {
                list.addItemToList(langService.get(item));
            });
            dialog.confirmMessage(list.getList(), null, null, $event)
                .then(function () {
                    correspondenceStorageService
                        .runEditAfter('Approved', model)
                        .then(function () {
                            $state.go('app.outgoing.add', {
                                workItem: info.wobNumber,
                                vsId: info.vsId,
                                action: 'editAfterApproved'
                            });
                        })
                        .catch(function () {
                            dialog.errorMessage(langService.get('error_messages'));
                        });
                });
        };

        /**
         * @description Print Barcode
         * @param model
         * @param $event
         */
        self.printBarcode = function (model, $event) {
            model.barcodePrint($event);
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
         * @param readyToExport
         * @param $event
         */
        self.viewDocument = function (readyToExport, $event) {
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT', true)) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            return correspondenceService.viewCorrespondence(readyToExport, self.gridActions, checkIfEditPropertiesAllowed(readyToExport, true), false, true, true)
                .then(function () {
                    self.reloadReadyToExports(self.grid.page);
                })
                .catch(function () {
                    self.reloadReadyToExports(self.grid.page);
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
                        gridName: 'department-ready-to-export'
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
                callback: self.terminateReadyToExport,
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
            // Export
            {
                type: 'action',
                icon: 'export',
                text: employeeService.getEmployee().userOrganization.centralArchive ? 'grid_action_send_to_ready_to_export' : 'grid_action_export',
                shortcut: true,
                callback: self.exportReadyToExport,
                class: "action-green",
                checkShow: self.checkToShowAction
            },
            // Print Barcode
            {
                type: 'action',
                icon: 'barcode-scan',
                text: 'content_action_print_barcode',
                shortcut: true,
                callback: self.printBarcode,
                permissionKey: "PRINT_BARCODE",
                class: "action-green",
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    return self.checkToShowAction(action, model) && (info.documentClass === "incoming" || (info.documentClass === "outgoing" && info.isPaper))
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
                showInView: false,
                permissionKey: 'VIEW_DOCUMENT',
                checkShow: function (action, model) {
                    //If no content or no view document permission, hide the button
                    return self.checkToShowAction(action, model) && model.hasContent();
                }
            },
            // Edit After Approve (Only electronic only)
            {
                type: 'action',
                icon: 'eraser-variant',
                text: 'grid_action_edit_after_approved',
                shortcut: true,
                callback: self.editAfterApprove,
                class: "action-green",
                showInView: false,
                permissionKey: "EDIT_OUTGOING_CONTENT", //TODO: Apply correct permission when added to database.
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    return self.checkToShowAction(action, model) && !info.isPaper;
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
                        hide: false,
                        checkShow: self.checkToShowAction
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
                        callback: self.viewReadyToExportDirectLinkedDocuments,
                        class: "action-red",
                        checkShow: self.checkToShowAction
                    },
                    // Complete Linked Documents
                    {
                        type: 'action',
                        icon: 'link-variant',
                        text: 'grid_action_complete_linked_documents',
                        shortcut: false,
                        callback: self.viewReadyToExportCompleteLinkedDocuments,
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
            // Edit(Paper Only)
            {
                type: 'action',
                icon: 'pencil',
                text: 'grid_action_edit',
                shortcut: false,
                showInView: false,
                checkShow: function (action, model) {
                    var info = model.getInfo();
                    var hasPermission = (employeeService.hasPermissionTo("EDIT_OUTGOING_PROPERTIES") || employeeService.hasPermissionTo("EDIT_OUTGOING_CONTENT"));
                    return self.checkToShowAction(action, model) && hasPermission && info.isPaper;// && info.docStatus < 24
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
                    // Edit properties
                    {
                        type: 'action',
                        //icon: 'pencil',
                        text: 'grid_action_properties',
                        shortcut: false,
                        callback: self.editProperties,
                        permissionKey: "EDIT_OUTGOING_PROPERTIES",
                        class: "action-green",
                        checkShow: self.checkToShowAction
                    }
                ]
            },
            // Broadcast
            {
                type: 'action',
                icon: 'send',
                text: 'grid_action_broadcast',
                shortcut: false,
                hide: true,
                callback: self.broadcast,
                checkShow: self.checkToShowAction
            }
        ];
    });
};