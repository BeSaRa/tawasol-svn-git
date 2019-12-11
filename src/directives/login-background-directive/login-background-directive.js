module.exports = function (app) {
    app.directive('loginBackgroundDirective', function (rootEntity) {
        'ngInject';
        return {
            restrict: 'A',
            link: function (scope, element) {
                var imagePath = 'assets/images/background-' + rootEntity.getRootEntityIdentifier() + '.png';
                element.css({
                    backgroundImage: "url(" + imagePath + ")"
                })
            }
        };

    })
};
