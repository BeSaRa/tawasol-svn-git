module.exports = function (app) {
    app.controller('g2gInboxCtrl', function (lookupService,
                                             g2gInboxService,
                                             g2gInboxes,
                                             $q,
                                             langService,
                                             toast,
                                             dialog,
                                             employeeService,
                                             generator) {
        var self = this;

        self.controllerName = 'g2gInboxCtrl';

        self.progress = null;

        /**
         * @description All g2g inbox items
         * @type {*}
         */
        self.g2gInboxes = g2gInboxes;

        /**
         * @description Contains the selected g2g inbox items
         * @type {Array}
         */
        self.selectedG2gInboxes = [];

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
                        return self.g2gInboxes.length
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
        self.reloadG2gInboxes = function (pageNumber) {
            var defer = $q.defer();
            self.progress = defer.promise;
            return g2gInboxService
                .loadG2gInboxes()
                .then(function (result) {
                    self.g2gInboxes = result;
                    self.selectedG2gInboxes = [];
                    defer.resolve(true);
                    if (pageNumber)
                        self.grid.page = pageNumber;
                    return result;
                });
        };

        /**
         * @description View document
         * @param g2gInbox
         * @param $event
         */
        self.viewDocument = function (g2gInbox, $event) {
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }

            return g2gInboxService.openG2G(g2gInbox)
                .then(function (result) {
                    alert("open document");
                })
        };


        self.receiveDocument = function (g2gInbox, $event) {
            console.log('receive document', g2gInbox);
            return g2gInboxService.receiveG2G(g2gInbox)
                .then(function (result) {
                    toast.success(langService.get('success'));
                })
        };

        self.returnDocument = function (g2gInbox, $event) {
            console.log('return document', g2gInbox);
            return g2gInboxService.returnG2G(g2gInbox)
                .then(function (result) {
                    toast.success(langService.get('success'));
                })
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
                checkShow: self.checkToShowAction
            }
        ];
    });
};