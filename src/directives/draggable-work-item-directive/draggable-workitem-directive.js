module.exports = function (app) {
    app.directive('draggableWorkItemDirective', function ($timeout) {
        'ngInject';
        return {
            restrict: 'A',
            scope: true,
            link: function (scope, element, attrs) {
                console.log("DRAGGABLE");
            }
        }
    }).directive('droppableWorkItemDirective', function () {
        'ngInject';
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                console.log(element);
            }
        }
    })
};