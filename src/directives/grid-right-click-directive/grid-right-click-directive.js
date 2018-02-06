module.exports = function (app) {
    app.directive('gridRightClickDirective', function ($parse, $compile, $timeout, $window) {
        'ngInject';
        return function (scope, element, attrs) {
            element.bind('contextmenu', function (event) {
                if ((event.target.tagName.toLowerCase() === "td"
                        || (event.target.tagName.toLowerCase() === 'span' && $(event.target).parents("td.td-data").length > 0)
                    ) && Number(attrs.selectedLength < 2)) {//scope.$parent.ctrl.selectedPrepareOutgoings.length < 2){
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
