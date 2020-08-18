module.exports = function (app) {
    app.controller('gridContextMenuDirectiveCtrl', function ($scope, $element, $attrs,
                                                             $mdPanel, $q, _,
                                                             $timeout,
                                                             LangWatcher,
                                                             gridService,
                                                             organizationService,
                                                             cmsTemplate,
                                                             $rootScope,
                                                             generator) {
        'ngInject';
        var self = this, targetTagName, targetElement = null, gridActionRowClass = '',
            panelCloseReasons = {
                CLICK_OUTSIDE: 'clickOutsideToClose',
                ESCAPE: 'escapeToClose',
                ACTION_PROCESSED: 'actionProcessed',
                ACTION_CHANGED: 'actionChanged',
                MOUSE_LEAVE: 'onmouseleave'
            };

        self.controllerName = 'gridContextMenuDirectiveCtrl';

        function _isGridContextMenu() {
            return !$attrs.contextMenuType || $attrs.contextMenuType.toLowerCase() === 'grid';
        }

        function _isMagazineContextMenu() {
            return $attrs.contextMenuType && $attrs.contextMenuType.toLowerCase() === 'magazine';
        }

        function _resetTarget() {
            targetTagName = null;
            targetElement = null;
        }

        var handleContextMenu = _.debounce(function ($event) {
            self.record = _getRecord();
            if (!self.record) {
                return false;
            }
            _openContextMenu($event);
        }, 100);

        function handlePreventDefault($event) {
            if ((_isGridContextMenu() && !_isValidGridContextMenu($event)) || (_isMagazineContextMenu() && !_isValidMagazineContextMenu($event))) {
                _resetTarget();
                return null;
            } else {
                $event.preventDefault();
            }
        }

        $element.on('contextmenu', handlePreventDefault);
        $element.on('contextmenu', handleContextMenu);


        /**
         * @description Opens the context menu on grid row if its valid
         * @param $event
         * @private
         */
        function _openContextMenu($event) {
            if (!targetElement || !_isValidSelectedLength($event))
                return;

            self.contextMenuActions = $scope.$eval($attrs.gridContextMenuDirective, $scope.$parent);
            var parentRow = _getParentRow(targetElement);

            _highlightParentRow(parentRow);

            var position = $mdPanel.newPanelPosition()
                .relativeTo(angular.element($event.target))
                .addPanelPosition($mdPanel.xPosition.ALIGN_END, $mdPanel.yPosition.BELOW);

            var menuRef = $mdPanel.open({
                id: 'contextPanel_' + 0,
                attachTo: angular.element(document.body),
                position: position,
                templateUrl: cmsTemplate.getDirective('grid-context-menu-template'),
                controller: 'gridContextMenuPanelCtrl',
                controllerAs: 'ctrl',
                locals: {
                    record: self.record,
                    contextActions: angular.copy(self.contextMenuActions)
                },
                openFrom: $event,
                onCloseSuccess: function (mdPanelRef, reason) {
                    _removeHighlightParentRow(parentRow);
                },
                panelClass: 'context-menu-panel-container'
            })
                .then(function (panelReference) {
                    panelReference.panelEl.css({top: $event.clientY, left: $event.clientX});

                    document.querySelector('.menu-trigger').click();
                    var deRegister = $rootScope.$on('$mdMenuClose', function (event, element) {
                        if (element[0].id === 'context-menu-bar-menu') {
                            panelReference.close();
                            deRegister();
                        }
                    });
                });
        }

        function _isValidSelectedLength($event) {
            var selectedLength = _getSelectedLength();
            // If no selected length attribute or if the selected length more than one item, ignore context menu
            // If 1 record is selected and not right click on same element, don't complete the process to open the menu.
            if (_isGridContextMenu()) {
                return !(selectedLength === null || selectedLength > 1 || (selectedLength === 1 && $($event.target).parents('tr.md-selected').length === 0));
            } else if (_isMagazineContextMenu()) {
                return !(selectedLength === null || selectedLength > 1 || (selectedLength === 1 && $($event.target).parents('div.magazine-item.selected').length === 0));
            }
            return false;
        }

        function _getSelectedLength() {
            // if there is no "selected-length" attribute provided on row, throw an exception to log.
            if (!$attrs['selectedLength']) {
                console.error('PLEASE ADD "selected-length" ATTRIBUTE TO GRID ROW');
                return null;
            }
            return Number($attrs['selectedLength']);
        }


        function _getRecord() {
            return $scope.$eval(_isGridContextMenu() ? $attrs.mdSelect : $attrs.model);
        }

        function _getParentRow(targetElement) {
            if (!targetElement) {
                return null;
            }
            if (_isGridContextMenu()) {
                return targetElement.parents('tr').length ? targetElement.parents('tr')[0] : null;
            } else if (_isMagazineContextMenu()) {
                return targetElement.parents('div.magazine-item').length ? targetElement.parents('div.magazine-item')[0] : null;
            }
            return null;
        }

        function _isValidRecord() {
            if (_isGridContextMenu()) {
                // if there is no "md-select" attribute provided on row, throw an exception to log.
                if (!$attrs.mdSelect) {
                    console.error('PLEASE ADD "md-select" ATTRIBUTE TO GRID ROW');
                    return false;
                }
                return true;
            } else if (_isMagazineContextMenu()) {
                // if there is no "model" attribute provided on row, throw an exception to log.
                if (!$attrs.model) {
                    console.error('PLEASE ADD "model" ATTRIBUTE TO MAGAZINE ROW');
                    return false;
                }
                return true;
            }
            return false;
        }

        /**
         * @description Validates if user has right clicked on right element on grid view
         * @param $event
         * @returns {boolean}
         * @private
         */
        function _isValidGridContextMenu($event) {
            if (!_isValidRecord() || !_isValidSelectedLength($event)) {
                return false;
            }

            targetTagName = $event.target.tagName.toLowerCase();
            targetElement = $($event.target);

            // If right click on column(td) OR on element(anchor or div or span) inside (td) with class "subject" or "td-data", continue to open menu, otherwise don't complete the process to open the menu.
            if (!(targetTagName === 'td' ||
                ((targetTagName === 'a' || targetTagName === 'div' || targetTagName === 'span')
                    && (targetElement.parents("td.subject").length > 0 || targetElement.parents("td.td-data").length > 0))
            )) {
                targetTagName = '';
                targetElement = null;
                return false;
            }
            return true;
        }

        /**
         * @description Validates if user has right clicked on right element on magazine view
         * @param $event
         * @returns {boolean}
         * @private
         */
        function _isValidMagazineContextMenu($event) {
            if (!_isValidRecord() || !_isValidSelectedLength($event)) {
                return false;
            }

            targetTagName = $event.target.tagName.toLowerCase();
            targetElement = $($event.target);

            // If right click on element (md-icon or md-checkbox or indicators span or read/undread anchor) don't complete the process to open the menu.
            if (targetTagName === 'md-icon' || targetElement.parents('md-checkbox').length > 0 ||
                (targetTagName === 'span' && (targetElement.hasClass('magazine-indicator-key') || targetElement.hasClass('magazine-indicator-value'))) ||
                (targetTagName === 'a' && targetElement.hasClass('magazine-read-unread'))
            ) {
                targetTagName = '';
                targetElement = null;
                return false;
            }
            return true;
        }

        /**
         * @description Adds the classes(gridActionRowClass and background-grid-action) when grid action menu opens
         * @param actionParentRow
         * @private
         */
        function _highlightParentRow(actionParentRow) {
            if (!actionParentRow) {
                return;
            }
            // gridActionRowClass is the unique number. It is set as class of parent row.
            gridActionRowClass = gridService.getUniqueIdentifier();
            // highlight the record when action menu opens
            actionParentRow.classList.add(gridActionRowClass, 'background-grid-action');
        }

        /**
         * @description Removes the classes(gridActionRowClass and background-grid-action) when grid action menu with class (main-context-menu or main-shortcut-menu) closes
         * @param actionParentRow
         * @private
         */
        var _removeHighlightParentRow = function (actionParentRow) {
            if (!actionParentRow || !gridActionRowClass || !$(actionParentRow).hasClass('background-grid-action')) {
                return;
            }
            // When menu with main-context-menu or main-shortcut-menu class is closed, the (gridActionRowClass, background-grid-action) classes will be removed.
            actionParentRow.classList.remove('background-grid-action', gridActionRowClass);
            gridActionRowClass = '';
            actionParentRow = null;

        };


        self.disposable = function () {
            $element.off('contextmenu', handlePreventDefault);
            $element.off('contextmenu', handleContextMenu);
        };

        $scope.$on('$destroy', function (event) {
            self.disposable();
        })
    });
};
