module.exports = function (app) {
    app.controller('magazineLayoutDirectiveCtrl', function ($scope,
                                                            _,
                                                            employeeService,
                                                            attachmentService,
                                                            LangWatcher,
                                                            $compile,
                                                            $timeout,
                                                            $element,
                                                            $mdMedia,
                                                            sidebarService,
                                                            langService) {
        'ngInject';
        var self = this;
        LangWatcher($scope);
        self.controllerName = 'magazineLayoutDirectiveCtrl';
        // the workItems from the parent scope
        self.workItems = [];
        // the selected workItems from the parent scope
        self.selectedWorkItems = [];
        // default disable
        self.disabled = false;
        // by default the client pagination true
        self.clientPagination = true;

        self.page = 1;

        self.paginate = function (e) {
            console.log(self.page);
        };

        self.employeeService = employeeService;


        self.isObject = function (limit) {
            return angular.isObject(limit);
        };

        self.isGreatThanSmall = function () {
            return $mdMedia('gt-sm');
        };

        self.sidebarOpend = function (sidebarCode) {
            return sidebarService.getSidebar(sidebarCode).isLockedOpen;
        };

        function _getItemPosition(item, debug) {
            if (debug) {
                console.log(self.selectedWorkItems);
                console.log(self.selectedWorkItems.indexOf(item));
            }
            return self.selectedWorkItems.indexOf(item)
        }

        function _checkSelected(item, debug) {
            return _getItemPosition(item, debug) !== -1;
        }

        /**
         * @description to check if the workItems Selected
         * @param item
         * @param debug
         * @return {*}
         */
        self.isWorkItemSelected = function (item, debug) {
            return !!_checkSelected(item, debug);
        };
        /**
         * @description to select item
         * @param item
         */
        self.selectItem = function (item) {
            self.selectedWorkItems.push(item);
        };
        /**
         * @description to deSelect item
         * @param item
         */
        self.deSelectItem = function (item) {
            if (self.isWorkItemSelected(item)) {
                self.selectedWorkItems.splice(_getItemPosition(item), 1);
            }
        };
        /**
         * @description get magazine layout element as dom element
         * @return {$element|*} dom element
         */
        self.getMagazineBody = function () {
            return self.getRootElement().find('.magazine-layout')[0];
        };
        /**
         * @description get magazine header element.
         */
        self.getHeaderElement = function () {
            return self.getRootElement().find('.top-bar-meta-data')[0];
        };
        /**
         * @description
         * @return {$element|*}
         */
        self.getRootElement = function () {
            return $element;
        };
        /**
         * @description to return current page items
         * @return {T[]}
         */
        self.getPageItems = function () {
            return Array.prototype.filter.call(self.getMagazineBody().children, function (item) {
                return !item.classList.contains('ng-leave');
            });
        };

        function _itemController(element) {
            return angular.element(element).controller('magazineItemDirective');
        }

        self.getItemsControllers = function () {
            return Array.prototype.map.call(self.getPageItems(), _itemController);
        };

        self.isSelectedAll = function () {
            var controllers = self.getItemsControllers();
            return controllers.length && controllers.every(function (ctrl) {
                return ctrl.isSelected();
            });
        };

        self.isSelectedAllow = function () {
            return self.allowSelection;
        };

        self.toggleAll = function ($event) {
            $event.preventDefault();
            self.isSelectedAll() ? self.deselectAllItems() : self.selectAllItems();
        };

        self.selectAllItems = function () {
            var controllers = self.getItemsControllers();
            controllers.length && controllers.map(function (ctrl) {
                if (!ctrl.isSelected()) {
                    ctrl.selectWorkItem();
                }
            });
        };

        self.deselectAllItems = function () {
            var controllers = self.getItemsControllers();
            controllers.length && controllers.map(function (ctrl) {
                if (ctrl.isSelected()) {
                    ctrl.deselectWorkItem();
                }
            });
        };

        function _attachSelectAllCheckBox() {
            var checkbox = angular.element('<md-checkbox>').attr({
                'aria-label': 'Select All',
                'ng-click': 'ctrl.toggleAll($event)',
                'ng-checked': 'ctrl.isSelectedAll()',
                'ng-disabled': 'ctrl.disabled',
                'class': 'select-all-check-box m0 width-20'
            });
            checkbox = angular.element('<div />', {layout: 'row', 'layout-align': 'center center'}).append(checkbox);
            angular.element(self.getHeaderElement()).prepend($compile(checkbox)($scope))
        }

        function _detachSelectAllCheckBox() {
            var checkbox = angular.element(self.getHeaderElement()).find('.top-bar-meta-data').children().get(0);
            checkbox ? checkbox.remove() : null;
        }

        $scope.$watch(self.isSelectedAllow, function (allow) {
            if (allow) {
                if (!self.selectedWorkItems || !angular.isArray(self.selectedWorkItems)) {
                    console.error('we to provide array in the selectedWorkItem attribute but you provide ' + typeof self.selectedWorkItems)
                }
                _attachSelectAllCheckBox();
            } else {
                _detachSelectAllCheckBox();
            }
        });

        /**
         * @description Checks whether to show the quick action or not
         * @param action
         * @param workItem
         * @returns {*}
         */
        self.isShowQuickAction = function (action, workItem) {
            if (action.hasOwnProperty('checkAnyPermission')) {
                return action.checkShow(action, workItem, action.checkAnyPermission);
            }
            return action.checkShow(action, workItem);
        };

        /**
         * @description Get the text of action according to selected language
         * @param action
         * @param isShortcutRequest
         */
        self.getQuickActionText = function (action, isShortcutRequest) {
            var langKey = "";
            if (action.hasOwnProperty('textCallback') && angular.isFunction(action.textCallback)) {
                return langService.get(action.textCallback(self.model));
            }

            if (angular.isFunction(action.text)) {
                if (isShortcutRequest)
                    langKey = action.text().shortcutText;
                else
                    langKey = action.text().contextText;
            }
            else {
                langKey = action.text;
            }
            return langService.get(langKey);
        };

        /**
         * @description Process the callback for the action button
         * @param action
         * @param workItem
         * @param $event
         */
        self.callbackQuickAction = function (action, workItem, $event) {
            if (action.hasOwnProperty('params') && action.params) {
                action.callback(workItem, action.params, $event);
            }
            else {
                action.callback(workItem, $event);
            }
        };

        /**
         * @description Filters the action buttons for showing/hiding shortcut actions
         * It will skip the separators
         * @param direction
         * @returns {Array}
         */
        self.filterQuickActionShortcuts = function (direction) {
            var mainAction, subAction;
            var shortcutActions = [];
            if (!!self.shortcut) {
                for (var i = 0; i < self.quickActions.length; i++) {
                    mainAction = self.quickActions[i];
                    if (mainAction.type.toLowerCase() === "action" && !mainAction.hide) {
                        /*
                        * If action has property (shortcut) and it has value = true
                        * Else if action don't has property (shortcut) or has property (shortcut) but value = false and has subMenu property with array value
                        * */
                        if (mainAction.hasOwnProperty('shortcut') && mainAction.shortcut) {
                            shortcutActions.push(mainAction);
                        }
                        else if (
                            (!mainAction.hasOwnProperty('shortcut') || (mainAction.hasOwnProperty('shortcut') && !mainAction.shortcut))
                            && (mainAction.hasOwnProperty('subMenu') && angular.isArray(mainAction.subMenu))
                        ) {
                            for (var j = 0; j < mainAction.subMenu.length; j++) {
                                subAction = mainAction.subMenu[j];

                                /*If sub menu has separator, show it in vertical only. not in horizontal*/
                                if (direction === 'vertical') {
                                    if (subAction.type.toLowerCase() === "action" && !subAction.hide
                                        && (subAction.hasOwnProperty('shortcut') && subAction.shortcut)
                                    ) {
                                        shortcutActions.push(mainAction);
                                    }
                                    else if (subAction.type.toLowerCase() === "separator" && !subAction.hide)
                                        shortcutActions.push(mainAction);
                                }
                                else if (direction === 'horizontal') {
                                    if (subAction.type.toLowerCase() === "action" && !subAction.hide && subAction.hasOwnProperty('shortcut') && subAction.shortcut) {
                                        shortcutActions.push(subAction);
                                    }
                                }
                            }
                        }
                    }
                    //skip the separators in shortcut menu
                    /*else if (mainAction.type.toLowerCase() === "separator" && !mainAction.hide) {
                        shortcutActions.push(mainAction)
                    }*/
                }
                return shortcutActions;
            }
            return self.quickActions;
        };

        self.showThumbnails = function ($event, workItem) {
            if (!angular.element($event.target).hasClass('md-truncate flex') && !angular.element($event.target).hasClass('magazine-from flex')) {
                return;
            }
            if (!workItem.isActiveThumbnails) {
                workItem.loadThumbnails().then(function () {
                    workItem.isActiveThumbnails = true;
                });
            } else {
                workItem.isActiveThumbnails = false;
            }
        };

        self.showAttachmentViewer = function (image, workItem, $event) {
            $event.stopPropagation();

            image.isMainDocument(true)
                .then(function () {

                })
                .catch(function () {
                    attachmentService.showAttachmentWithThumbnails(workItem, image, $event);
                });
        }


    });
};