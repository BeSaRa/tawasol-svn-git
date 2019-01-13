module.exports = function (app) {
    app.service('dynamicMenuItemService', function (urlService, toast, langService, cmsTemplate, dialog, $http, $q, generator, DynamicMenuItem, _) {
        'ngInject';
        var self = this;
        self.serviceName = 'dynamicMenuItemService';
        self.dynamicMenuItems = [];
        /**
         * @description Load the document types from server.
         * @returns {Promise|dynamicMenuItems}
         */
        self.loadDynamicMenuItems = function () {
            return $http.get(urlService.dynamicMenuItems).then(function (result) {
                self.dynamicMenuItems = generator.generateCollection(result.data.rs, DynamicMenuItem, self._sharedMethods);
                self.dynamicMenuItems = generator.interceptReceivedCollection('DynamicMenuItem', self.dynamicMenuItems);
                return self.dynamicMenuItems;
            });
        };
        /**
         * @description load sub dynamic menu item for given menu item id.
         * @param parentDynamicMenuItemId
         * @return {*}
         */
        self.loadSubDynamicMenuItems = function (parentDynamicMenuItemId) {
            parentDynamicMenuItemId = parentDynamicMenuItemId.hasOwnProperty('id') ? parentDynamicMenuItemId.id : parentDynamicMenuItemId;
            return $http.get(urlService.dynamicMenuItems + '/childs/' + parentDynamicMenuItemId).then(function (result) {
                var dynamicMenuItems = generator.generateCollection(result.data.rs, DynamicMenuItem, self._sharedMethods);
                return generator.interceptReceivedCollection('DynamicMenuItem', dynamicMenuItems);
            });
        };
        /**
         * @description load prent dynamic menu items.
         * @return {*}
         */
        self.loadParentDynamicMenuItems = function () {
            return $http.get(urlService.dynamicMenuItems + '/parents').then(function (result) {
                self.dynamicMenuItems = generator.generateCollection(result.data.rs, DynamicMenuItem, self._sharedMethods);
                self.dynamicMenuItems = generator.interceptReceivedCollection('DynamicMenuItem', self.dynamicMenuItems);
                return self.dynamicMenuItems;
            });
        };
        /**
         * @description Get document types from self.dynamicMenuItems if found and if not load it from server again.
         * @returns {Promise|dynamicMenuItems}
         */
        self.getDynamicMenuItems = function () {
            return self.dynamicMenuItems.length ? $q.when(self.dynamicMenuItems) : self.loadDynamicMenuItems();
        };

        /**
         * @description Contains methods for CRUD operations for document types
         */
        self.controllerMethod = {
            dynamicMenuItemAddSub: function (parentMenuItem, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        template: cmsTemplate.getPopup('sub-dynamic-menu-item'),
                        controller: 'subDynamicMenuItemPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: false,
                            parentMenuItem: parentMenuItem,
                            dynamicMenuItem: new DynamicMenuItem(
                                {
                                    parent: parentMenuItem.id,
                                    itemOrder: generator.createNewID(parentMenuItem.children, 'itemOrder'),
                                    isGlobal: parentMenuItem.isGlobal,
                                    menuType: parentMenuItem.menuType
                                })
                        }
                    });
            },
            dynamicMenuItemEditSub: function (parentMenuItem, dynamicMenuItem, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        template: cmsTemplate.getPopup('sub-dynamic-menu-item'),
                        controller: 'subDynamicMenuItemPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: true,
                            dynamicMenuItem: dynamicMenuItem,
                            parentMenuItem: parentMenuItem
                        }
                    });
            },
            /**
             * @description Opens popup to add new document type
             * @param $event
             */
            dynamicMenuItemAdd: function ($event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        template: cmsTemplate.getPopup('dynamic-menu-item'),
                        controller: 'dynamicMenuItemPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            tabIndex: 0,
                            editMode: false,
                            dynamicMenuItem: new DynamicMenuItem(
                                {
                                    itemOrder: generator.createNewID(self.dynamicMenuItems, 'itemOrder')
                                })
                        }
                    });
            },
            /**
             * @description Opens popup to edit document type
             * @param dynamicMenuItem
             * @param $event
             * @param tabIndex
             */
            dynamicMenuItemEdit: function (dynamicMenuItem, $event, tabIndex) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        template: cmsTemplate.getPopup('dynamic-menu-item'),
                        controller: 'dynamicMenuItemPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: true,
                            dynamicMenuItem: dynamicMenuItem,
                            tabIndex: tabIndex
                        }
                    });
            },
            /**
             * @description Show confirm box and delete bulk document type
             * @param dynamicMenuItem
             * @param $event
             */
            dynamicMenuItemDelete: function (dynamicMenuItem, $event) {
                return dialog
                    .confirmMessage(langService.get('confirm_delete').change({name: dynamicMenuItem.getNames()}), null, null, $event)
                    .then(function () {
                        return self.deleteDynamicMenuItem(dynamicMenuItem)
                            .then(function () {
                                toast.success(langService.get("delete_specific_success").change({name: dynamicMenuItem.getNames()}));
                                return true;
                            });
                    });
            },
            /**
             * @description Show confirm box and delete bulk document types
             * @param dynamicMenuItems
             * @param $event
             */
            dynamicMenuItemDeleteBulk: function (dynamicMenuItems, $event) {
                return dialog
                    .confirmMessage(langService.get('confirm_delete_selected_multiple'), null, null, $event || null)
                    .then(function () {
                        return self.deleteBulkDynamicMenuItems(dynamicMenuItems)
                            .then(function (result) {
                                var response = false;
                                if (result.length === dynamicMenuItems.length) {
                                    toast.error(langService.get("failed_delete_selected"));
                                    response = false;
                                } else if (result.length) {
                                    generator.generateFailedBulkActionRecords('delete_success_except_following', _.map(result, function (dynamicMenuItem) {
                                        return dynamicMenuItem.getNames();
                                    }));
                                    response = true;
                                } else {
                                    toast.success(langService.get("delete_success"));
                                    response = true;
                                }
                                return response;
                            });
                    });
            }
        };

        /**
         * @description Add new document type
         * @param dynamicMenuItem
         * @return {Promise|DynamicMenuItem}
         */
        self.addDynamicMenuItem = function (dynamicMenuItem) {
            return $http
                .post(urlService.dynamicMenuItems,
                    generator.interceptSendInstance('DynamicMenuItem', dynamicMenuItem))
                .then(function () {
                    return dynamicMenuItem;
                });
        };
        /**
         * @description Update the given document type.
         * @param dynamicMenuItem
         * @return {Promise|DynamicMenuItem}
         */
        self.updateDynamicMenuItem = function (dynamicMenuItem) {
            return $http
                .put(urlService.dynamicMenuItems,
                    generator.interceptSendInstance('DynamicMenuItem', dynamicMenuItem))
                .then(function () {

                    return dynamicMenuItem;
                });
        };

        /**
         * @description Delete given document type.
         * @param dynamicMenuItem
         * @return {Promise|null}
         */
        self.deleteDynamicMenuItem = function (dynamicMenuItem) {
            var id = dynamicMenuItem.hasOwnProperty('id') ? dynamicMenuItem.id : dynamicMenuItem;
            return $http.delete((urlService.dynamicMenuItems + '/' + id));
        };

        /**
         * @description Delete bulk document types.
         * @param dynamicMenuItems
         * @return {Promise|null}
         */
        self.deleteBulkDynamicMenuItems = function (dynamicMenuItems) {
            var bulkIds = dynamicMenuItems[0].hasOwnProperty('id') ? _.map(dynamicMenuItems, 'id') : dynamicMenuItems;
            return $http({
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                url: urlService.dynamicMenuItems + '/bulk',
                data: bulkIds
            }).then(function (result) {
                result = result.data.rs;
                var failureCollection = [];
                _.map(result, function (value, key) {
                    if (!value)
                        failureCollection.push(Number(key));
                });
                return _.filter(dynamicMenuItems, function (dynamicMenuItem) {
                    return (failureCollection.indexOf(dynamicMenuItem.id) > -1);
                });
            });
        };

        /**
         * @description Get document type by dynamicMenuItemId
         * @param dynamicMenuItemId
         * @returns {DynamicMenuItem|undefined} return DynamicMenuItem Model or undefined if not found.
         */
        self.getDynamicMenuItemById = function (dynamicMenuItemId) {
            dynamicMenuItemId = dynamicMenuItemId instanceof DynamicMenuItem ? dynamicMenuItemId.id : dynamicMenuItemId;
            return _.find(self.dynamicMenuItems, function (dynamicMenuItem) {
                return Number(dynamicMenuItem.id) === Number(dynamicMenuItemId)
            });
        };
        /**
         * @description Get document type by lookupKey
         * @returns {DynamicMenuItem|undefined} return DynamicMenuItem Model or undefined if not found.
         * @param lookupKey
         */
        self.getDynamicMenuItemByLookupKey = function (lookupKey) {
            lookupKey = lookupKey instanceof DynamicMenuItem ? lookupKey.lookupKey : lookupKey;
            return _.find(self.dynamicMenuItems, function (dynamicMenuItem) {
                return Number(dynamicMenuItem.lookupKey) === Number(lookupKey)
            });
        };

        /**
         * @description Activate document type
         * @param dynamicMenuItem
         */
        self.activateDynamicMenuItem = function (dynamicMenuItem) {
            return $http
                .put((urlService.dynamicMenuItems + '/activate/' + dynamicMenuItem.id))
                .then(function () {
                    return dynamicMenuItem;
                });
        };

        /**
         * @description Deactivate document type
         * @param dynamicMenuItem
         */
        self.deactivateDynamicMenuItem = function (dynamicMenuItem) {
            return $http
                .put((urlService.dynamicMenuItems + '/deactivate/' + dynamicMenuItem.id))
                .then(function () {
                    return dynamicMenuItem;
                });
        };

        /**
         * @description Activate bulk document types
         * @param dynamicMenuItems
         */
        self.activateBulkDynamicMenuItems = function (dynamicMenuItems) {
            var bulkIds = dynamicMenuItems[0].hasOwnProperty('id') ? _.map(dynamicMenuItems, 'id') : dynamicMenuItems;
            return $http
                .put((urlService.dynamicMenuItems + '/activate/bulk'), bulkIds)
                .then(function () {
                    return dynamicMenuItems;
                });
        };

        /**
         * @description Deactivate bulk of document types
         * @param dynamicMenuItems
         */
        self.deactivateBulkDynamicMenuItems = function (dynamicMenuItems) {
            var bulkIds = dynamicMenuItems[0].hasOwnProperty('id') ? _.map(dynamicMenuItems, 'id') : dynamicMenuItems;
            return $http
                .put((urlService.dynamicMenuItems + '/deactivate/bulk'), bulkIds)
                .then(function () {
                    return dynamicMenuItems;
                });
        };

        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param dynamicMenuItem
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicateDynamicMenuItem = function (dynamicMenuItem, editMode) {
            var dynamicMenuItemsToFilter = self.dynamicMenuItems;
            if (editMode) {
                dynamicMenuItemsToFilter = _.filter(dynamicMenuItemsToFilter, function (dynamicMenuItemToFilter) {
                    return dynamicMenuItemToFilter.id !== dynamicMenuItem.id;
                });
            }
            return _.some(_.map(dynamicMenuItemsToFilter, function (existingDynamicMenuItem) {
                return existingDynamicMenuItem.arName === dynamicMenuItem.arName
                    || existingDynamicMenuItem.enName.toLowerCase() === dynamicMenuItem.enName.toLowerCase();
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };
        /**
         * @description create the shred method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteDynamicMenuItem, self.updateDynamicMenuItem);


    });
};
