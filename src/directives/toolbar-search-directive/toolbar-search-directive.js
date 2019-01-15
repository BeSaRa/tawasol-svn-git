module.exports = function (app) {
    app.directive('toolbarSearchDirective', function ($window,cmsTemplate) {
        'ngInject';
        return {
            replace: true,
            templateUrl: cmsTemplate.getDirective('toolbar-search-template.html'),
            bindToController: true,
            controller: 'toolbarSearchDirectiveCtrl',
            controllerAs: 'search',
            scope: true,
            link: function (scope, element, attrs, ctrl) {

                var w = angular.element($window);
                var hideOnBlur = function () {
                    ctrl.hideSearch();
                    if (!scope.$$phase)
                        scope.$apply();
                };

                var bindEscKey = function (event) {
                    var keyCode = event.keyCode || event.which;
                    if (keyCode === 27) {
                        ctrl.hideSearch();
                        if (!scope.$$phase)
                            scope.$apply();
                    }
                };

                w.on('keydown', function (e) {
                    var code = e.keyCode || e.which;
                    //83 true
                    if (code === 83 && e.ctrlKey) {
                        e.preventDefault();
                        scope.$apply(function () {
                            ctrl.showSearch();
                        });
                    }
                });

                scope.$watch('search.showSearchForm', function (value, value2) {
                    var input = element.find('input');
                    if (value) {
                        input.focus();
                        input.bind('keydown', bindEscKey);
                    } else {
                        input.blur();
                        input.unbind('keydown', bindEscKey);
                    }
                })

            }
        }
    });
};
