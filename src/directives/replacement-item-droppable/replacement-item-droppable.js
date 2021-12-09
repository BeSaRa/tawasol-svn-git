module.exports = function (app) {
    app.directive('replacementItemDroppable', function (lookupService, $timeout, $compile) {
        'ngInject';
        return {
            restrict: 'A',
            require: '^urlParserDirective',
            link: function (scope, element, attrs, ctrl) {
                $(element).droppable({
                    accept: function (ui) {
                        return !$(this).children().length && ui.hasClass('replacement-item');
                    },
                    drop: function (event, ui) {
                        var lookupKey = Number(ui.helper.data('id').split('-').pop());
                        var lookup = lookupService.getLookupByLookupKey(lookupService.menuItemParam, lookupKey);

                        $timeout(function () {
                            ctrl.setVariableValue(scope.item, lookup);
                        });
                    }
                }).disableSelection();
            }
        }
    })
};
