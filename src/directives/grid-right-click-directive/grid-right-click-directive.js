module.exports = function (app) {
    app.directive('gridRightClickDirective', function ($parse, $compile, $timeout, _, $window, gridService) {
        'ngInject';
        return function (scope, element, attrs) {
            var cursorLeft, cursorTop, sideBar, sideBarVisibleInitially = false, sideBarWidth, parentRow,
                gridActionRowClass = '', subLeft, subTop;
            element.bind('contextmenu', function (event) {
                var $target = $(event.target),
                    tagName = event.target.tagName.toLowerCase();
                gridActionRowClass = '';

                // if there is no model provide to the directive throw an exception to log.
                if (!attrs.model) {
                    throw Error('PLEASE ADD MODEL ATTRIBUTE TO THE DIRECTIVE');
                }

                // if the selected length more than one item OR If 1 record is selected and not right click on same element, don't complete the process to open the menu.
               if (Number(attrs['selectedLength']) > 1 || (Number(attrs['selectedLength']) === 1 && $target.parents('tr.md-selected').length === 0)) {
                    return;
                }

                /*
                * If right click on column(td)
                * OR
                * If right click on element(anchor or div or span) inside (td) and clicked element has parent td with class "subject" or "td-data"
                * */
                if (// If right click on td
                    (tagName === "td"
                        //Or if right click on span(or anchor tag or div) and it has parent with class "subject" or "td-data"
                        || ((tagName === 'a' || tagName === 'div' || tagName === 'span')
                            && ($target.parents("td.subject").length > 0 || $target.parents("td.td-data").length > 0))
                    )
                ) {
                    /*var left, top, subLeft, subTop;*/
                    scope.$apply(function () {
                        event.preventDefault();
                        parentRow = $target.parents('tr')[0];
                        if (angular.element('#grid-menu-container').length)
                            angular.element('#grid-menu-container').remove();

                        var wrapper = angular.element('<div />', {id: 'grid-menu-container'});
                        element.parents('tbody').prepend(wrapper);
                        var currentMenuContainer = angular.element('<div />', {id: 'current-menu-container'});
                        wrapper.append(currentMenuContainer);

                        var positions = currentMenuContainer.offset();
                        var left = angular.copy(event.clientX - positions.left - 18);
                        var top = angular.copy(event.clientY - positions.top - 13);

                        if (!cursorLeft && !cursorTop) {
                            cursorLeft = angular.copy(event.clientX);
                            cursorTop = angular.copy(event.clientY);
                        }

                        // gridActionRowClass is the unique number
                        // It is set as class of parent row and passed to gridActionsDirective.
                        // When menu opens, we will find the row by class=gridActionRowClass and highlight it.
                        // When menu with main-context-menu or main-shortcut-menu class is closed, the (gridActionRowClass, background-grid-action) classes will be removed.
                        gridActionRowClass = gridService.getUniqueIdentifier();
                        if (parentRow) {
                            parentRow.classList.add(gridActionRowClass);
                        }
                        var menu = angular.element('<grid-actions-directive />', {
                            'context-actions': attrs.contextMenuActions ? attrs.contextMenuActions : 'ctrl.contextMenuActions',
                            'model': attrs.model,
                            'actions-direction': gridService.gridActionOptions.direction.context,
                            'grid-action-row-class': gridActionRowClass
                        });
                        menu.css({
                            position: 'absolute',
                            left: left,
                            top: top
                        });
                        currentMenuContainer.append($compile(menu)(scope));

                        $timeout(function () {
                            menu.find('.menu-handler').click();

                            /*sideBar = angular.element('#main-sidebar');
                            sideBarWidth = angular.copy(parseInt(sideBar.width(), 10));
                            sideBarVisibleInitially = angular.copy(sideBar.hasClass('gt-small'));

                            angular.element($window).bind('resize', function () {
                                handleResizeEnd();
                            });
                            // manual call for digest as resize is outside of angular scope
                            scope.$digest();*/
                        });
                    });
                }
            });

            var handleResizeEnd = _.debounce(function () {

                sideBar = angular.element('#main-sidebar');
                sideBarWidth = angular.copy(parseInt(sideBar.width(), 10));

                var newLeft, menuVisibleNow = sideBar.hasClass('gt-small');
                //console.log('sidebar width ', sideBarWidth);
                if ((menuVisibleNow && sideBarVisibleInitially) || (!menuVisibleNow && !sideBarVisibleInitially)) {
                    newLeft = cursorLeft;
                } else if (menuVisibleNow && !sideBarVisibleInitially) {
                    newLeft = cursorLeft + sideBarWidth;
                } else if (!menuVisibleNow && sideBarVisibleInitially) {
                    newLeft = cursorLeft - sideBarWidth;
                }

                var contextMenu = angular.element('.context-menu').parent();
                if (contextMenu && contextMenu.length) {
                    contextMenu.css({
                        left: newLeft + 'px',
                        top: cursorTop + 'px'
                    });
                }
            }, 500);
        };


    });
};
