module.exports = function (app) {
    app.directive('magazineRightClickDirective', function ($compile, $timeout) {
        'ngInject';
        return function (scope, element, attrs) {
            element.bind('contextmenu', function (event) {
                event.preventDefault();
                // if there is no model provide to the directive throw an exception to log.
                if (!attrs.model) {
                    throw Error('PLEASE ADD MODEL ATTRIBUTE TO THE DIRECTIVE');
                }

                // common variables
                var
                    // parent wrapper.
                    $parentWrapper = element.parents('.magazine-layout'),
                    // the clicked element.
                    $element = angular.element(event.target),
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
                        'grid-actions': 'ctrl.gridActions',
                        'model': attrs.model,
                        'shortcut': 'false',
                        'menu-direction': 'context'
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
                    wrapper.find('.menu-handler').click();
                });

            });
        }
    })
};