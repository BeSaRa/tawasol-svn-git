module.exports = function (app) {
    app.directive('accordionTitle', function ($compile, $rootScope, $timeout, $window, $location, $anchorScroll) {
        'ngInject';
        var labelCollapse = false;

        function _setLabelCollapse(value) {
            labelCollapse = value;
        }

        return {
            restrict: 'E',
            require: '^accordionDirective',
            scope: {
                onSelect: '&?',
                disableCollapse: '='
            },
            compile: function (tElement, attrs) {
                var content = tElement.contents().detach();
                var wrapper = angular.element('<div class="outline-none cursor-pointer " ng-click="toggleAccordion($event , index , \'labelCollapse\')"></div>');
                var btn = angular.element('<a aria-label="Toggle Collapse" ng-click="toggleAccordion($event , index)" class="md-icon-button"><md-icon md-svg-icon="arrow-{{active ? \'up\' : \'down\'}}-bold-circle-outline"></md-icon></a>');

                content = angular.element('<span flex></span>').append(content);

                wrapper
                    .addClass('accordion-title')
                    .attr('layout', 'row')
                    .attr('layout-align', 'start center');

                return function postLink(scope, element, attrs, ctrl) {

                    scope.index = ctrl.getAccordionElementIndex(element);
                    scope.active = false;
                    ctrl.pushScopeTitle(scope);

                    $timeout(function () {
                        scope.active = element.parents('accordion-item').hasClass('active');
                    });

                    function toggleContent() {
                        scope.active = !scope.active;
                        element
                            .parent('accordion-item')
                            .find('accordion-content')
                            .slideToggle('fast');
                    }

                    scope.toggleAccordion = function ($event, index, label) {
                        $event.stopPropagation();
                        var labelCollapse = element
                            .parents('accordion-directive')
                            .data('labelCollapse');

                        if (!label) {
                            toggleContent();
                        } else if (labelCollapse) {
                            toggleContent();
                        }
                    };

                    if (!scope.disableCollapse)
                        $compile(wrapper.append(btn))(scope);

                    wrapper.append($compile(content)(ctrl.scope));
                    element.append(wrapper);

                    scope.$watch('disableCollapse', function (value) {
                        if (value) {
                            wrapper.removeClass('cursor-pointer');
                        } else {
                            wrapper.addClass('cursor-pointer');
                        }
                    })
                }
            }
        }
    })
};