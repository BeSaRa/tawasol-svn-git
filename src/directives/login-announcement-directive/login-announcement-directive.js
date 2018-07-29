module.exports = function (app) {
    app.directive('loginAnnouncementDirective', function (LangWatcher, langService, $timeout) {
        'ngInject';
        return {
            restrict: 'E',
            replace: true,
            template: require('./login-announcement-template.html'),
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