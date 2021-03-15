module.exports = function (app) {
    require('./annotation-pattern-style.scss');
    app.directive('annotationPatternDirective', function (cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            templateUrl: cmsTemplate.getDirective('annotation-pattern-template.html'),
            controller: 'annotationPatternDirectiveCtrl',
            controllerAs: 'ctrl',
            bindToController: true,
            replace: true,
            scope: {
                infoPattern: '=',
                redrawSteps: '=',
                viewOnly: '='
            }
        }
    });

    app.directive('annotationContainerSortable', function () {
        'ngInject';
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var self = scope.ctrl,
                    containmentElement = '.pattern-rows-wrapper .pattern-rows-container';
                $(element)
                    .sortable({
                        containment: containmentElement,
                        items: "> div:not(.sort-cancel)",
                        tolerance: "pointer",
                        cancel: '.sort-cancel',
                        placeholder: "row-placeholder",
                        update: function () {
                            self.updateRows();
                        }
                    })

            }
        }
    })
};
