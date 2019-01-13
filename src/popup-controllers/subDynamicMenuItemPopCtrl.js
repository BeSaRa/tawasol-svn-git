module.exports = function (app) {
    app.controller('subDynamicMenuItemPopCtrl', function (dynamicMenuItemService,
                                                          _,
                                                          editMode,
                                                          toast,
                                                          DynamicMenuItem,
                                                          lookupService,
                                                          parentMenuItem,
                                                          validationService,
                                                          gridService,
                                                          generator,
                                                          dialog,
                                                          langService,
                                                          dynamicMenuItem) {
        'ngInject';
        var self = this;
        self.controllerName = 'subDynamicMenuItemPopCtrl';
        self.editMode = editMode;
        self.dynamicMenuItem = angular.copy(dynamicMenuItem);
        self.model = angular.copy(dynamicMenuItem);
        self.fullScreen = false;

        self.relatedFields = [
            'menuType',
            'isGlobal'
        ];

        self.parentMenuItem = parentMenuItem;
        // selected children
        self.selectedChildrenDynamicMenuItems = [];

        self.menuTypes = lookupService.returnLookups(lookupService.menuItemType);

        self.dynamicMenuItems = parentMenuItem.dynamicMenuItems;

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
            itemOrder: 'item_order',
            menuType: 'menu_item_type',
            isGlobal: 'global'
        };

        self.checkValidFieldsRelatedToParent = function () {
            var fields = [];
            _.map(self.relatedFields, function (field) {
                self.dynamicMenuItem[field] !== self.parentMenuItem[field] ? fields.push(field) : null;
            });
            return fields;
        };

        /**
         * @description Add new document type
         */
        self.addDynamicMenuItemFromCtrl = function () {
            validationService
                .createValidation('ADD_DOCUMENT_TYPE')
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
                .addStep('check_validate_fields', true, self.checkValidFieldsRelatedToParent, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
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
                .createValidation('EDIT_DOCUMENT_TYPE')
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
                .addStep('check_validate_fields', true, self.checkValidFieldsRelatedToParent, function (result) {
                    return !result.length;
                })
                .notifyFailure(function (step, result) {
                    var labels = _.map(result, function (label) {
                        return self.validateLabels[label];
                    });
                    generator.generateErrorFields('check_this_fields', labels);
                })
                .validate()
                .then(function () {
                    dynamicMenuItemService
                        .updateDynamicMenuItem(self.dynamicMenuItem)
                        .then(function () {
                            dialog.hide(self.dynamicMenuItem);
                        });
                })
                .catch(function () {

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
         * @description toggle full screen button.
         */
        self.fullScreenToggle = function () {
            self.fullScreen = !self.fullScreen;
        };
        /**
         * @description load sub menu items
         */
        self.reloadSubDynamicMenuItems = function () {
            self.dynamicMenuItem.loadSubDynamicMenuItems();
        };
    });
};
