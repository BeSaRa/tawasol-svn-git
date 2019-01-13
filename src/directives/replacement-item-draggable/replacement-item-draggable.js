module.exports = function (app) {
    app.directive('replacementItemDraggable', function () {
        'ngInject';
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                $(element).draggable({
                    helper: 'clone'
                }).disableSelection();
            }
        }
    })
};
