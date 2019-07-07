module.exports = function (app) {
    app.directive('gridRightClickDirective', function ($parse, $compile, $timeout, _, $window, gridService) {
        'ngInject';
        return function (scope, element, attrs) {
            var cursorLeft, cursorTop, sideBar, sideBarVisibleInitially = false, sideBarWidth, subLeft, subTop;
            element.bind('contextmenu', function (event) {
                var $target = $(event.target),
                    tagName = event.target.tagName.toLowerCase();
                /*
                * If right click on column(td)
                * OR
                * If right click on span(or anchor or div) inside (td) and clicked element any parent td with class "subject" or "td-data"
                *
                * AND
                *
                * Selected records count should be less than 2
                * */
                if (// If right click on td
                    (tagName === "td"
                        //Or if right click on span(or anchor tag or div) and it has parent with class "subject" or "td-data"
                        || ((tagName === 'a' || tagName === 'div' || tagName === 'span')
                            && ($target.parents("td.subject").length > 0 || $target.parents("td.td-data").length > 0))
                    )
                    // Selected records count should be less than 2
                    && Number(attrs['selectedLength'] < 2)
                ) {
                    // If no record selected
                    // OR
                    // If 1 record is selected and right click on same element.
                    if (Number(attrs['selectedLength']) === 0 || (Number(attrs['selectedLength']) === 1 && event.target.parentElement.classList.contains('md-selected'))) {
                        /*var left, top, subLeft, subTop;*/
                        scope.$apply(function () {
                            event.preventDefault();
                            if (angular.element('#grid-menu-container').length)
                                angular.element('#grid-menu-container').remove();

                            var wrapper = angular.element('<div />', {id: 'grid-menu-container'});
                            //element.parents('table').parent().prepend(wrapper);
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
                            var menu = angular.element('<grid-actions-directive />', {
                                'context-actions': 'ctrl.contextMenuActions',
                                'model': attrs.model,
                                'actions-direction': gridService.gridActionOptions.direction.context
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
