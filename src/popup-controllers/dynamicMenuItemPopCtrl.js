module.exports = function (app) {
    app.controller('dynamicMenuItemPopCtrl', function (dynamicMenuItemService,
                                                       _,
                                                       editMode,
                                                       toast,
                                                       errorCode,
                                                       lookupService,
                                                       validationService,
                                                       gridService,
                                                       generator,
                                                       tabIndex,
                                                       layoutService,
                                                       dialog,
                                                       langService,
                                                       dynamicMenuItem) {
        'ngInject';
        var self = this;
        self.controllerName = 'dynamicMenuItemPopCtrl';
        self.editMode = editMode;
        self.dynamicMenuItem = angular.copy(dynamicMenuItem);
        self.model = angular.copy(dynamicMenuItem);

        // selected children
        self.selectedChildrenDynamicMenuItems = [];

        self.tabIndex = tabIndex;

        self.menuTypes = lookupService.returnLookups(lookupService.menuItemType);

        self.dynamicMenuItems = dynamicMenuItemService.dynamicMenuItems;

        self.statusServices = {
            'activate': dynamicMenuItemService.activateBulkDynamicMenuItems,
            'deactivate': dynamicMenuItemService.deactivateBulkDynamicMenuItems,
            'true': dynamicMenuItemService.activateDynamicMenuItem,
            'false': dynamicMenuItemService.deactivateDynamicMenuItem
        };

        self.grid = {
            limit: gridService.getGridPagingLimitByGridName(gridService.grids.administration.dynamicMenuItem) || 5, // default limit
            page: 1, // first page
            order: '', // default sorting order
            limitOptions: gridService.getGridLimitOptions(gridService.grids.administration.dynamicMenuItem, self.dynamicMenuItem.children),
            pagingCallback: function (page, limit) {
                gridService.setGridPagingLimitByGridName(gridService.grids.administration.dynamicMenuItem, limit);
            }
        };

        self.validateLabels = {
            arName: 'arabic_name',
            enName: 'english_name',
            lookupStrKey: 'document_class',
            itemOrder: 'item_order',
            menuType: 'menu_item_type'
        };

        /**
         * @description Save the dynamic menu
         */
        self.saveDynamicMenuItem = function () {
            if (self.editMode) {
                self.editDynamicMenuItemFromCtrl();
            } else {
                self.addDynamicMenuItemFromCtrl();
            }
        };

        /**
         * @description Add new dynamic menu item
         */
        self.addDynamicMenuItemFromCtrl = function () {
            validationService
                .createValidation('ADD_DYNAMIC_MENU')
                .addStep('check_required', true, generator.checkRequiredFields, self.dynamicMenuItem, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_duplicate', true, dynamicMenuItemService.checkDuplicateDynamicMenuItem, [self.dynamicMenuItem, false], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .addStep('checkItemOrder', true, generator.checkDuplicateItemOrder, [self.dynamicMenuItem, self.dynamicMenuItems, false], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('item_order_duplicated'));
                })
                .validate()
                .then(function () {
                    dynamicMenuItemService
                        .addDynamicMenuItem(self.dynamicMenuItem)
                        .then(function () {
                            dialog.hide(self.dynamicMenuItem);
                        });
                })
                .catch(function () {

                });
        };

        /**
         * @description Edit document type
         */
        self.editDynamicMenuItemFromCtrl = function () {
            validationService
                .createValidation('EDIT_DYNAMIC_MENU')
                .addStep('check_required', true, generator.checkRequiredFields, self.dynamicMenuItem, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .addStep('check_duplicate', true, dynamicMenuItemService.checkDuplicateDynamicMenuItem, [self.dynamicMenuItem, true], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('name_duplication_message'));
                })
                .addStep('checkItemOrder', true, generator.checkDuplicateItemOrder, [self.dynamicMenuItem, self.dynamicMenuItems, true], function (result) {
                    return !result;
                }, true)
                .notifyFailure(function () {
                    toast.error(langService.get('item_order_duplicated'));
                })
                .validate()
                .then(function () {
                    dynamicMenuItemService
                        .updateDynamicMenuItem(self.dynamicMenuItem)
                        .then(function () {
                            dialog.hide(self.dynamicMenuItem);
                        });
                })
                .catch(function (result) {
                   // console.log(result);
                });
        };

        /**
         * @description Close the popup
         */
        self.closeDynamicMenuItemPopupFromCtrl = function () {
            dialog.cancel();
        };
        self.resetModel = function () {
            generator.resetFields(self.dynamicMenuItem, self.model);
        };
        /**
         * @description load sub menu items
         */
        self.reloadSubDynamicMenuItems = function () {
            return self.dynamicMenuItem.loadSubDynamicMenuItems()
                .then(function () {
                    return layoutService.loadLandingPage();
                });
        };
        /**
         * @description add submenu item for current dynamic menu item.
         * @param $event
         */
        self.addSubDynamicMenuItem = function ($event) {
            dynamicMenuItemService
                .controllerMethod
                .dynamicMenuItemAddSub(self.dynamicMenuItem, $event)
                .then(function (result) {
                    self.reloadSubDynamicMenuItems()
                        .then(function () {
                            toast.success(langService.get('add_success').change({name: result.getNames()}));
                        });
                });
        };

        /**
         * @description Change the status of document type
         * @param dynamicMenuItem
         */
        self.changeStatusDynamicMenuItem = function (dynamicMenuItem) {
            self.statusServices[dynamicMenuItem.status](dynamicMenuItem)
                .then(function () {
                    layoutService.loadLandingPage();
                    toast.success(langService.get('status_success'));
                })
                .catch(function () {
                    dynamicMenuItem.status = !dynamicMenuItem.status;
                    dialog.errorMessage(langService.get('something_happened_when_update_status'));
                });
        };

        /**
         * @description Change the status of selected document types
         * @param status
         */
        self.changeStatusBulkDynamicMenuItems = function (status) {
            self.statusServices[status](self.selectedChildrenDynamicMenuItems)
                .then(function () {
                    self.selectedChildrenDynamicMenuItems = [];
                    self.reloadSubDynamicMenuItems()
                        .then(function () {
                            toast.success(langService.get('selected_status_updated'));
                        });
                });
        };

        /**
         * @description Delete single document type
         * @param dynamicMenuItem
         * @param $event
         */
        self.removeDynamicMenuItem = function (dynamicMenuItem, $event) {
            dynamicMenuItemService
                .controllerMethod
                .dynamicMenuItemDelete(dynamicMenuItem, $event)
                .then(function () {
                    self.reloadSubDynamicMenuItems(self.grid.page);
                })
                .catch(function (error) {
                    errorCode.checkIf(error, 'CAN_NOT_DELETE_LOOKUP', function () {
                        dialog.errorMessage(langService.get('cannot_delete_lookup').change({
                            lookup: langService.get('label_document_type'),
                            used: langService.get('other_places')
                        }), null, null, $event);
                    });
                });
        };

        /**
         * @description Delete multiple selected document types
         * @param $event
         */
        self.removeBulkDynamicMenuItems = function ($event) {
            dynamicMenuItemService
                .controllerMethod
                .dynamicMenuItemDeleteBulk(self.selectedChildrenDynamicMenuItems, $event)
                .then(function () {
                    self.reloadSubDynamicMenuItems(self.grid.page);
                });
        };

        self.releaseSelected = function () {
            self.selectedChildrenDynamicMenuItems = [];
        };

        /**
         * @description Opens dialog for edit document type
         * @param dynamicMenuItem
         * @param $event
         */
        self.openEditDynamicMenuItemDialog = function (dynamicMenuItem, $event) {
            dynamicMenuItemService
                .controllerMethod
                .dynamicMenuItemEditSub(self.dynamicMenuItem, dynamicMenuItem, $event)
                .then(function (result) {
                    self.reloadSubDynamicMenuItems(self.grid.page)
                        .then(function () {
                            toast.success(langService.get('edit_success').change({name: result.getNames()}));
                        });
                });
        };
    });
};
