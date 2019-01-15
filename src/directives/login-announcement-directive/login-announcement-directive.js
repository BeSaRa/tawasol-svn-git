module.exports = function (app) {
    app.directive('loginAnnouncementDirective', function (LangWatcher, langService, $timeout,cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            replace: true,
            templateUrl: cmsTemplate.getDirective('login-announcement-template.html'),
            scope: {
                announcements: '='
            },
            link: function (scope, element) {
                LangWatcher(scope);
                if (!scope.announcements)
                    return;

                function startOwl() {
                    $(element)
                        .owlCarousel({
                            items: 1,
                            rtl: true,
                            autoplay: true
                        });
                }

                function dieOwl() {
                    $(element).owlCarousel('destroy');
                }

                $timeout(function () {
                    startOwl(langService.current);
                }, 1000);

            }
        };

    })
};
