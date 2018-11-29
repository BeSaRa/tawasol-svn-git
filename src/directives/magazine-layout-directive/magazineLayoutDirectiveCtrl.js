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

        self.filterActionsByProperty = function (model, actions, propertyKey, propertyValue, listOfActions) {
            var flatActions = listOfActions ? listOfActions : [];
            for (var i = 0; i < actions.length; i++) {
                var mainAction = actions[i];
                if (mainAction.hasOwnProperty(propertyKey) && mainAction[propertyKey] === propertyValue && mainAction.checkShow(mainAction, model)) {
                    flatActions.push(mainAction);
                }
                if (mainAction.hasOwnProperty('subMenu') && mainAction.subMenu.length && mainAction.checkShow(mainAction, model)) {
                    self.filterActionsByProperty(model, mainAction.subMenu, propertyKey, propertyValue, flatActions);
                }
            }
            // the returned flat actions for the viewer
            return flatActions;
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

        self.sortingOptions = [
            {
                column: 'serial_asc',
                text: function () {
                    return langService.get('inbox_serial') + ' - '+ langService.get('ascending')
                },
                value: function () {
                    return 'generalStepElm.docFullSerial'
                }
            },
            {
                column: 'serial_desc',
                text: function () {
                    return langService.get('inbox_serial') + ' - '+ langService.get('descending')
                },
                value: function () {
                    return '-generalStepElm.docFullSerial'
                }
            },
            {
                column: 'subject_asc',
                text: function () {
                    return langService.get('subject') + ' - '+ langService.get('ascending')
                },
                value: function () {
                    return 'generalStepElm.docSubject'
                }
            },
            {
                column: 'subject_desc',
                text: function () {
                    return langService.get('subject') + ' - '+ langService.get('descending')
                },
                value: function () {
                    return '-generalStepElm.docSubject'
                }
            },
            {
                column: 'receivedDate_asc',
                text: function () {
                    return langService.get('received_date') + ' - '+ langService.get('ascending')
                },
                value: function () {
                    return 'generalStepElm.receivedDate'
                }
            },
            {
                column: 'receivedDate_desc',
                text: function () {
                    return langService.get('received_date') + ' - '+ langService.get('descending')
                },
                value: function () {
                    return '-generalStepElm.receivedDate'
                }
            },
            {
                column: 'action_asc',
                text: function () {
                    return langService.get('action') + ' - '+ langService.get('ascending')
                },
                value: function () {
                    return 'generalStepElm.action'
                }
            },
            {
                column: 'action_desc',
                text: function () {
                    return langService.get('action') + ' - '+ langService.get('descending')
                },
                value: function () {
                    return '-generalStepElm.action'
                }
            },
            {
                column: 'sender_asc',
                text: function () {
                    return langService.get('sender') + ' - '+ langService.get('ascending')
                },
                value: function () {
                    return 'generalStepElm.sender'
                }
            },
            {
                column: 'sender_desc',
                text: function () {
                    return langService.get('sender') + ' - '+ langService.get('descending')
                },
                value: function () {
                    return '-generalStepElm.sender'
                }
            },
            {
                column: 'dueDate_asc',
                text: function () {
                    return langService.get('due_date') + ' - '+ langService.get('ascending')
                },
                value: function () {
                    return 'generalStepElm.dueDate'
                }
            },
            {
                column: 'dueDate_desc',
                text: function () {
                    return langService.get('due_date') + ' - '+ langService.get('descending')
                },
                value: function () {
                    return '-generalStepElm.dueDate'
                }
            },
            {
                column: 'correspondenceSites_asc',
                text: function () {
                    return langService.get('correspondence_sites') + ' - '+ langService.get('ascending')
                },
                value: function () {
                    return self.getSortingKey('mainSiteSubSiteString', 'Information')
                }
            },
            {
                column: 'correspondenceSites_desc',
                text: function () {
                    return langService.get('correspondence_sites') + ' - '+ langService.get('descending')
                },
                value: function () {
                    return  '-' + self.getSortingKey('mainSiteSubSiteString', 'Information')
                }
            }
        ];

        self.getSortedMagazineData = function () {
            self.sortOrder = self.sortOrder && self.sortOrder.hasOwnProperty('value') ? self.sortOrder.value() : self.sortOrder;
            self.sortingCallback(self.sortOrder);
        }

    });
};