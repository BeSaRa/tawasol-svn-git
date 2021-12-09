module.exports = function (app) {
    app.directive('titleDirective', function (titleService) {
        'ngInject';
        return {
            restrict: 'A',
            bindToController: true,
            controller: 'titleDirectiveCtrl',
            controllerAs: 'titleCtrl',
            link: function (scope, element) {
                element.html(titleService.title);
                scope.$watch(function () {
                    return titleService.title;
                }, function (string) {
                    if (string) {
                        element.html(string.toUpperCase());
                    }
                });
            }
        }
    })
};