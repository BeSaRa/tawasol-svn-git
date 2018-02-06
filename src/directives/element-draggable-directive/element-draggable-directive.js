module.exports = function (app) {

    app.directive('elementDraggableDirective', function () {
        'ngInject';
        return {
            restrict: 'A',
            link: function (scope, element) {
                element.data('elementItem', scope.elementItem);
                $(element)
                    .draggable({
                        revert: 'invalid',
                        connectToSortable:'#reference-pattern',
                        start: function (event, ui) {
                            ui.helper.css('z-index', 2);
                        }
                    })
                    .disableSelection();
            }
        }
    });
};