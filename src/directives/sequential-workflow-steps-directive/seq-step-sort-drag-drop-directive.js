module.exports = function (app) {
    app.directive('seqActionDraggable', function ($compile) {
        'ngInject';
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var item = angular.copy(scope.item);
                element.data('item', item);
                var self = scope.ctrl,
                    containmentElement = '.steps-container-' + self.usageType;
                $(element)
                    .draggable({
                        cancel: '.disabled',
                        containment: containmentElement,
                        revert: 'invalid',
                        helper: 'clone',
                        tolerance: "pointer",
                        start: function (e, ui) {
                            if (scope.item) {
                                ui.helper.data('item', item);
                            }
                        }
                    });
            }
        }
    });

    app.directive('seqStepDroppable', function ($compile) {
        'ngInject';
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var self = scope.ctrl;
                $(element)
                    .droppable({
                        accept: function (draggableItem) {
                            var record = scope.$eval(attrs.seqStepDroppable);
                            // don't accept if dropping item don't have "step-item" class OR step already has action OR sequential workflow is incoming and dropping item is authorizeAndSend
                            return !(!angular.element(draggableItem).hasClass('step-item')
                                || angular.element(element).children('.step-item').length > 0
                                || (record.isIncomingSeqWF() && draggableItem.data('item').isAuthorizeAndSendStep())
                            );
                        },
                        tolerance: 'pointer',
                        drop: function (event, ui) {
                            var idx = element.data('rowIndex');
                            var item = angular.copy(ui.helper.data('item'));

                            if (element.hasClass('step-row')) {
                                var updatedStepElement = self.compileItem(self.createItem(item, idx), item);
                                ui.helper.data('item', item);

                                element.append(updatedStepElement);

                                scope.$apply(function () {
                                    self.updateRows(ui.helper);
                                });
                            }
                        }
                    });
            }
        }
    });


    app.directive('seqContainerSortable', function () {
        'ngInject';
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var self = scope.ctrl,
                    containmentElement = '.steps-container-' + self.usageType + ' .step-rows-container';
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
    });
};
