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
        //self.contextMenuActions = $scope.$eval($attrs.gridContextMenuDirective, $scope.$parent);

        $element.on('contextmenu', function ($event) {
            if (!_isValidContextMenu($event)) {
                return false;
            }
            $event.preventDefault();
            self.record = $scope.$eval($attrs.mdSelect);
            _openContextMenu($event);
        });

        /**
         * @description Opens the context menu on grid row if its valid
         * @param $event
         * @private
         */
        function _openContextMenu($event) {
            self.contextMenuActions = $scope.$eval($attrs.gridContextMenuDirective, $scope.$parent);
            var parentRow = targetElement.parents('tr')[0];

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
                    document.querySelector('.menu-trigger').click();
                    var deRegister = $rootScope.$on('$mdMenuClose', function (event, element) {
                        if (element[0].id === 'context-menu-bar-menu') {
                            panelReference.close();
                            //_removeHighlightParentRow(parentRow);
                            deRegister();
                        }
                    });
                });
        }

        /**
         * @description Validates if user has right clicked on right element
         * @param $event
         * @returns {boolean}
         * @private
         */
        function _isValidContextMenu($event) {
            // if there is no "md-select" attribute provided on row, throw an exception to log.
            if (!$attrs.mdSelect) {
                console.error('PLEASE ADD "md-select" ATTRIBUTE TO GRID ROW');
                return false;
            }
            //selectedLength = $scope.$eval(targetElement.parents('table').attr('ng-model'))
            // if there is no "selected-length" attribute provided on row, throw an exception to log.
            if (!$attrs['selectedLength']) {
                console.error('PLEASE ADD "selected-length" ATTRIBUTE TO GRID ROW');
                return false;
            }
            // if the selected length more than one item OR If 1 record is selected and not right click on same element, don't complete the process to open the menu.
            if (Number($attrs['selectedLength']) > 1 || (Number($attrs['selectedLength']) === 1 && $($event.target).parents('tr.md-selected').length === 0)) {
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

    });
};
