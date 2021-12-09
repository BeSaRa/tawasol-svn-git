module.exports = function (app) {
    app.directive('elementSortableDirective', function (referencePlanNumberService, _, $compile, $rootScope) {
        'ngInject';
        return {
            restrict: 'A',
            link: function (scope, element) {

                $(element).sortable({
                    revert: true,
                    tolerance: 'pointer',
                    receive: function (event, ui) {
                        var elementItem = angular.copy(ui.item.data('elementItem'));
                        if (ui.item.attr('ng-if')) {
                            ui.item.removeAttr('ng-if');
                            ui.item.removeAttr('element-draggable-directive');
                            ui.item.replaceWith(referencePlanNumberService.createElementComponent(elementItem, scope.ctrl, $compile, $rootScope));
                            if (ui.item.hasClass('element-separator'))
                                scope.ctrl.addStaticTextElement(angular.copy(elementItem));

                            scope.$apply();
                        }
                    },
                    update: function (event, ui) {
                        if (!ui.item.attr('ng-if')) {
                            scope.ctrl.updateCurrentItemComponents(_.map($(this).children(), function (item) {
                                return $(item).data('elementItem');
                            }));
                        }
                    }
                });
            }
        }
    })
};