module.exports = function (app) {
    app.directive('loginAnnouncementDirective', function (langService, $document, $timeout) {
        'ngInject';
        return {
            restrict: 'E',
            replace: true,
            template: require('./login-announcement-template.html'),
            scope: {
                announcements: '='
            }/*,
            link: function (scope, element) {
                scope.lang = langService.getCurrentTranslate();
                if (!scope.announcements)
                    return;

                var owl = null, started = false;

                function startOwl(lang) {
                    owl = $(element).owlCarousel({
                        items: 1,
                        margin: 10,
                        rewind: true,
                        autoplay: true,
                        autoheight: true,
                        rtl: (lang === 'ar')
                    });
                    started = true;
                }

                function destroyOwl() {
                    if (!started)
                        return;
                    owl.owlCarousel('destroy');
                    started = false;
                }

                startOwl(langService.current);

                scope.$watch(function () {
                    return langService.current;
                }, function (lang) {
                    scope.lang = langService.getCurrentTranslate();
                    if (!started)
                        return;
                    destroyOwl();
                    startOwl(lang);
                });
            }*/
        };

    })
};