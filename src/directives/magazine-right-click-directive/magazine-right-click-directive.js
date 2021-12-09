module.exports = function (app) {
    app.directive('magazineRightClickDirective', function ($compile, $timeout, gridService) {
        'ngInject';
        return function (scope, element, attrs) {
            var $element,// the clicked element.
                parentRow, gridActionRowClass = '';

            element.bind('contextmenu', function (event) {
                event.preventDefault();
                // if there is no model provide to the directive throw an exception to log.
                if (!attrs.model) {
                    throw Error('PLEASE ADD MODEL ATTRIBUTE TO THE DIRECTIVE');
                }

                // if the selected length more than one item don't complete the process to open the menu.
                var selected = scope.$eval(attrs.selectedLength);
                if (selected > 1 || (selected === 1 && !element.hasClass('selected'))) {
                    return;
                }

                $element = angular.element(event.target);
                parentRow = $element.parents('div.magazine-item')[0];

                // gridActionRowClass is the unique number
                // It is set as class of parent row and passed to gridActionsDirective.
                // When menu opens, we will find the row by class=gridActionRowClass and highlight it.
                // When menu with main-context-menu or main-shortcut-menu class is closed, the (gridActionRowClass, background-grid-action) classes will be removed.
                gridActionRowClass = gridService.getUniqueIdentifier();


                // common variables
                var
                    // parent wrapper.
                    $parentWrapper = element.parents('.magazine-layout'),
                    // event position from the screen.
                    screen = {
                        left: event.clientX,
                        top: event.clientY
                    },
                    offset = element.offset(),
                    // the current coordinates for click event from parent element offset.
                    css = {
                        left: screen.left - offset.left - 20,
                        top: screen.top - offset.top
                    },
                    // the wrapper for bind the menu.
                    wrapper = angular.element('<div />', {id: 'magazine-menu-wrapper'}),
                    // the menu directive.
                    menu = angular.element('<grid-actions-directive />', {
                        'context-actions': 'ctrl.contextMenuActions',
                        'model': attrs.model,
                        'actions-direction': gridService.gridActionOptions.direction.context,
                        'grid-action-row-class': gridActionRowClass
                    });

                // set the css for the wrapper.
                wrapper.css(css);
                // compile phase to bind the menu directive to DOM.
                $compile(wrapper.append(menu))(scope);
                // remove the old directive if found from the DOM.
                $parentWrapper.find('#magazine-menu-wrapper').remove();
                // append the wrapper to the element.
                element.append(wrapper);
                // wait ms to trigger click event for the button to open the menu.
                $timeout(function () {
                    if (parentRow) {
                        parentRow.classList.add(gridActionRowClass);
                    }
                    // prevent bubbling.
                    angular
                        .element('.menu-handler')
                        .click(function ($event) {
                            $event.stopPropagation();
                        });
                    // trigger a click button to open the menu.
                    wrapper.find('.menu-handler').click();
                });

            });
        }
    })
};
