module.exports = function (app) {
    app.controller('magazineLayoutDirectiveCtrl', function ($scope,
                                                            _,
                                                            employeeService,
                                                            attachmentService,
                                                            LangWatcher,
                                                            $compile,
                                                            $timeout,
                                                            gridService,
                                                            $element,
                                                            $mdMedia,
                                                            sidebarService,
                                                            langService,
                                                            generator) {
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
           // console.log(self.page);
        };

        self.employeeService = employeeService;


        self.isObject = function (limit) {
            return angular.isObject(limit);
        };

        self.isGreatThanSmall = function () {
            return $mdMedia('gt-sm');
        };

        self.sidebarOpened = function (sidebarCode) {
            return sidebarService.getSidebar(sidebarCode).isLockedOpen;
        };

        function _getItemPosition(item, debug) {
            if (debug) {
              //  console.log(self.selectedWorkItems);
             //   console.log(self.selectedWorkItems.indexOf(item));
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
            /*if (action.hasOwnProperty('checkAnyPermission')) {
                return action.checkShow(action, workItem, action.checkAnyPermission);
            }*/

            // if sticky Action is subMenu and has parent, check if parent is allowed to show
            // if parent is not allowed, subMenu will also be not allowed
            var parentAllowed = true;
            if (action.hasOwnProperty('parent'))
                parentAllowed = action.parent.checkShow(action, workItem);
            if (!parentAllowed)
                return false;

            return action.checkShow(action, workItem);
        };

        /**
         * @description Get the text of action according to selected language
         * @param action
         * @param isShortcutRequest
         * @param model
         */
        self.getQuickActionText = function (action, model, isShortcutRequest) {
            var langKey = "";
            if (action.hasOwnProperty('textCallback') && angular.isFunction(action.textCallback)) {
                return langService.get(action.textCallback(model));
            }

            if (angular.isFunction(action.text)) {
                if (isShortcutRequest)
                    langKey = action.text().shortcutText;
                else
                    langKey = action.text().contextText;
            } else {
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
            } else {
                action.callback(workItem, $event);
            }
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

        var _getSortingColumnHeaderText = function(key, isDescendingOrder){
            return langService.get(key);
            /*if (isDescendingOrder){
                return langService.get(key) + ' - ' + langService.get('descending');
            }
            return langService.get(key) + ' - ' + langService.get('ascending');*/
        };

        self.sortingOptions = [
            {
                column: 'serial_asc',
                text: function () {
                    return _getSortingColumnHeaderText('inbox_serial');
                },
                value: function () {
                    return 'generalStepElm.docFullSerial';
                },
                icon: 'arrow-up'
            },
            {
                column: 'serial_desc',
                text: function () {
                    return _getSortingColumnHeaderText('inbox_serial', true);
                },
                value: function () {
                    return '-generalStepElm.docFullSerial';
                },
                icon: 'arrow-down'
            },
            {
                column: 'subject_asc',
                text: function () {
                    return _getSortingColumnHeaderText('subject');
                },
                value: function () {
                    return 'generalStepElm.docSubject';
                },
                icon: 'arrow-up'
            },
            {
                column: 'subject_desc',
                text: function () {
                    return _getSortingColumnHeaderText('subject', true);
                },
                value: function () {
                    return '-generalStepElm.docSubject';
                },
                icon: 'arrow-down'
            },
            {
                column: 'securityLevel_asc',
                text: function () {
                    return _getSortingColumnHeaderText('security_level');
                },
                value: function () {
                    return self.getSortingKey('securityLevel', 'Information');
                },
                icon: 'arrow-up'
            },
            {
                column: 'securityLevel_desc',
                text: function () {
                    return _getSortingColumnHeaderText('security_level', true);
                },
                value: function () {
                    return '-' + self.getSortingKey('securityLevel', 'Information');
                },
                icon: 'arrow-down'
            },
            {
                column: 'receivedDate_asc',
                text: function () {
                    return _getSortingColumnHeaderText('received_date');
                },
                value: function () {
                    return 'generalStepElm.receivedDate';
                },
                icon: 'arrow-up'
            },
            {
                column: 'receivedDate_desc',
                text: function () {
                    return _getSortingColumnHeaderText('received_date', true);
                },
                value: function () {
                    return '-generalStepElm.receivedDate';
                },
                icon: 'arrow-down'
            },
            {
                column: 'action_asc',
                text: function () {
                    return _getSortingColumnHeaderText('action');
                },
                value: function () {
                    return self.getSortingKey('action', 'WorkflowAction');
                },
                icon: 'arrow-up'
            },
            {
                column: 'action_desc',
                text: function () {
                    return _getSortingColumnHeaderText('action', true);
                },
                value: function () {
                    return '-' + self.getSortingKey('action', 'WorkflowAction');
                },
                icon: 'arrow-down'
            },
            {
                column: 'sender_asc',
                text: function () {
                    return _getSortingColumnHeaderText('sender');
                },
                value: function () {
                    return self.getSortingKey('senderInfo', 'SenderInfo');
                },
                icon: 'arrow-up'
            },
            {
                column: 'sender_desc',
                text: function () {
                    return _getSortingColumnHeaderText('sender', true);
                },
                value: function () {
                    return '-' + self.getSortingKey('senderInfo', 'SenderInfo');
                },
                icon: 'arrow-down'
            },
            {
                column: 'dueDate_asc',
                text: function () {
                    return _getSortingColumnHeaderText('due_date');
                },
                value: function () {
                    return 'generalStepElm.dueDate';
                },
                icon: 'arrow-up'
            },
            {
                column: 'dueDate_desc',
                text: function () {
                    return _getSortingColumnHeaderText('due_date', true);
                },
                value: function () {
                    return '-generalStepElm.dueDate';
                },
                icon: 'arrow-down'
            },
            {
                column: 'correspondenceSites_asc',
                text: function () {
                    return _getSortingColumnHeaderText('correspondence_sites');
                },
                value: function () {
                    return self.getSortingKey('mainSiteSubSiteString', 'Information');
                },
                icon: 'arrow-up'
            },
            {
                column: 'correspondenceSites_desc',
                text: function () {
                    return _getSortingColumnHeaderText('correspondence_sites', true);
                },
                value: function () {
                    return '-' + self.getSortingKey('mainSiteSubSiteString', 'Information');
                },
                icon: 'arrow-down'
            }
        ];

        self.getSortedMagazineData = function () {
            self.sortOrder = self.sortOrder && self.sortOrder.hasOwnProperty('value') ? self.sortOrder.value() : self.sortOrder;
            self.sortingCallback(self.sortOrder);
        }

    });
};
