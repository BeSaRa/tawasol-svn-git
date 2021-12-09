module.exports = function (app) {
    app.directive('backgroundDirective', function () {
        'ngInject';
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                function getBackgroundSize() {
                    var size = !attrs.backgroundDirective ? 'tall' : attrs.backgroundDirective;
                    return 'background-' + size;
                }

                function getBackgroundColor() {
                    var color = !attrs.color ? 'blue' : attrs.color;
                    return 'header-bg-' + color;
                }

                var bg = angular.element('<div />', {class: getBackgroundSize()});

                bg.addClass(getBackgroundColor() || 'blue');


                element.prepend(bg);
            }
        }
    })
};