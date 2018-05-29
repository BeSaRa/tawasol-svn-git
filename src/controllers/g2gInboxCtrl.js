module.exports = function (app) {
    app.controller('g2gInboxCtrl', function (lookupService,
                                             g2gInboxService,
                                             g2gItems,
                                             $q,
                                             langService,
                                             toast,
                                             dialog,
                                             employeeService,
                                             generator,
                                             correspondenceService) {
        var self = this;

        self.controllerName = 'g2gInboxCtrl';

        self.progress = null;

        /**
         * @description All g2g inbox items
         * @type {*}
         */
        self.g2gItems = g2gItems;

        /**
         * @description Contains the selected g2g inbox items
         * @type {Array}
         */
        self.selectedG2gItems = [];

        /**
         * @description Contains options for grid configuration
         * @type {{limit: number, page: number, order: string, limitOptions: [*]}}
         */
        self.grid = {
            limit: 5, // default limit
            page: 1, // first page
            order: 'arName', // default sorting order
            limitOptions: [5, 10, 20, // limit options
                {
                    label: langService.get('all'),
                    value: function () {
                        return self.g2gItems.length
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
        self.getSortingKey = function (property, modelType) {
            return generator.getColumnSortingKey(property, modelType);
        };

        /**
         * @description Reload the grid of g2g inbox item
         * @param pageNumber
         * @return {*|Promise<U>}
         */
        self.reloadG2gItems = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;
            return g2gInboxService
                .loadG2gItems()
                .then(function (result) {
                    self.g2gItems = result;
                    self.selectedG2gItems = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    return result;
                });
        };

        /**
         * @description View document
         * @param g2gItem
         * @param $event
         */
        self.viewDocument = function (g2gItem, $event) {
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }

            return correspondenceService.viewCorrespondenceG2G(g2gItem, self.gridActions, 'G2G', $event)
                .then(function (result) {
                    self.reloadG2gItems(self.grid.page);
                })
                .catch(function(error){
                    self.reloadG2gItems(self.grid.page);
                })
        };

        /**
         * @description Receive Document
         * @param g2gItem
         * @param $event
         * @returns {*}
         */
        self.receiveDocument = function (g2gItem, $event) {
            return g2gInboxService.receiveG2G(g2gItem)
                .then(function (result) {
                    self.reloadG2gItems(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('receive_specific_success').change({name: g2gItem.correspondence.docSubject}));
                        })
                })
        };

        /**
         * @description Return document
         * @param g2gItem
         * @param $event
         * @returns {*}
         */
        self.returnDocument = function (g2gItem, $event) {
            return g2gInboxService.returnG2G(g2gItem)
                .then(function (result) {
                    self.reloadG2gItems(self.grid.page)
                        .then(function () {
                            toast.success(langService.get("return_specific_success").change({name: g2gItem.correspondence.docSubject}));
                        });
                })
        };


        /**
         * @description Download Main Document
         * @param g2gItem
         * @param $event
         */
        self.downloadMainDocument = function (g2gItem, $event) {
            g2gItem
                .mainDocumentDownload($event);
        };

        /**
         * @description Download Composite Document
         * @param g2gItem
         * @param $event
         */
        self.downloadCompositeDocument = function (g2gItem, $event) {
            g2gItem
                .compositeDocumentDownload($event);
        };


        /**
         * @description Check if action will be shown on grid or not
         * @param action
         * @param model
         * @param popupActionOnly
         * @returns {boolean}
         */
        self.checkToShowAction = function (action, model, popupActionOnly) {
            if (action.hasOwnProperty('permissionKey')) {
                if (typeof action.permissionKey === 'string') {
                    if(popupActionOnly)
                        return (!action.hide && action.showInViewOnly) && employeeService.hasPermissionTo(action.permissionKey);
                    return (!action.hide && !action.showInViewOnly) && employeeService.hasPermissionTo(action.permissionKey);
                }
                else if (angular.isArray(action.permissionKey)) {
                    if (!action.permissionKey.length) {
                        if(popupActionOnly)
                            return (!action.hide && action.showInViewOnly)
                        return (!action.hide && !action.showInViewOnly);
                    }
                    else {
                        var hasPermissions = _.map(action.permissionKey, function (key) {
                            return employeeService.hasPermissionTo(key);
                        });
                        if(popupActionOnly)
                            return (!action.hide && action.showInViewOnly) && !(_.some(hasPermissions, function (isPermission) {
                                return isPermission !== true;
                            }));

                        return (!action.hide && !action.showInViewOnly) && !(_.some(hasPermissions, function (isPermission) {
                            return isPermission !== true;
                        }));
                    }
                }
            }
            if(popupActionOnly)
                return (!action.hide) && (action.showInViewOnly);
            return (!action.hide && !action.showInViewOnly);
        };

        /**
         * @description Array of actions that can be performed on grid
         * @type {[*]}
         */
        self.gridActions = [
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
                checkShow: self.checkToShowAction
            },
            // Receive
            {
                type: 'action',
                icon: 'check',
                text: 'grid_action_receive',
                shortcut: true,
                callback: self.receiveDocument,
                class: "action-green",
                //permissionKey: 'VIEW_DOCUMENT',
                showInView: true,
                showInViewOnly: true,
                checkShow: self.checkToShowAction
            },
            // Return
            {
                type: 'action',
                icon: 'undo-variant',
                text: 'grid_action_return',
                shortcut: true,
                callback: self.returnDocument,
                class: "action-green",
                //permissionKey: 'VIEW_DOCUMENT',
                showInView: true,
                showInViewOnly: true,
                checkShow: self.checkToShowAction
            },
            // Download
            {
                type: 'action',
                icon: 'download',
                text: 'grid_action_download',
                shortcut: false,
                showInViewOnly: true,
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
        ];
    });
};