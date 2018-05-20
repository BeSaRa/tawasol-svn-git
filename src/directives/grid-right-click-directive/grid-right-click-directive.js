module.exports = function (app) {
    app.directive('gridRightClickDirective', function ($parse, $compile, $timeout, $window) {
        'ngInject';
        return function (scope, element, attrs) {
            element.bind('contextmenu', function (event) {
                var tagName = event.target.tagName.toLowerCase();
                /*
                * If right click on column
                * OR
                * If right click on span and span has a parent td with class "td-data"
                * OR
                * If right click on anchor and anchor has a parent td with class "subject"
                *
                * AND
                *
                * Selected records count should be less than 2
                * */
                if (// If right click on td
                ( tagName === "td"
                    // If right click on span and span has parent with class td-data
                    || (tagName === 'span' && $(event.target).parents("td.td-data").length > 0)
                    // If right click on anchor tag and it has class subject
                    || (tagName === 'a' && $(event.target).parents("td.subject").length > 0)
                )
                // Selected records count should be less than 2
                && Number(attrs.selectedLength < 2)
                ) {//scope.$parent.ctrl.selectedPrepareOutgoings.length < 2){

                    // If no record selected
                    // OR
                    // If 1 record is selected and right click on same element.
                    if (Number(attrs.selectedLength) === 0 || (Number(attrs.selectedLength) === 1 && event.target.parentElement.classList.contains('md-selected'))) {
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
                            var left = event.clientX - positions.left - 18;
                            var top = event.clientY - positions.top - 13;

                            var menu = angular.element('<grid-actions-directive />', {
                                'grid-actions': 'ctrl.gridActions',
                                'model': attrs.model,
                                'shortcut': 'false',
                                'menu-direction': 'context'
                            });
                            menu.css({
                                position: 'absolute',
                                left: left,
                                top: top
                            });
                            currentMenuContainer.append($compile(menu)(scope));

                            $timeout(function () {
                                menu.find('.menu-handler').click();
                            });
                        });
                    }
                }
            });
        };
    });
};
