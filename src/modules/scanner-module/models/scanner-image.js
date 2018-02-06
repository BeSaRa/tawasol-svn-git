module.exports = function (app) {
    app.directive('scannerImage', function ($timeout) {
        'ngInject';
        return {
            restrict: 'A',
            link: function (scope, element) {
                element.bind('error', function () {
                    var self = angular.copy(this);
                    scope.$apply(function () {
                        console.log("FIRST");
                        $(element).attr('src', self.src + 'x');
                        $timeout(function () {
                            console.log("SECOND");
                            $(element).attr('src', self.src);
                        }, 2);
                    });
                });
            }
        }
    })
};