module.exports = function (app) {
    require('./login-announcement-style.scss');
    app.directive('loginAnnouncementDirective', function (LangWatcher, langService, $timeout, cmsTemplate) {
        'ngInject';
        return {
            restrict: 'E',
            replace: true,
            templateUrl: cmsTemplate.getDirective('login-announcement-template.html'),
            scope: {
                announcements: '=',
                classes: '@?'
            },
            link: function (scope, element) {
                LangWatcher(scope);
                if (!scope.announcements)
                    return;

                function startOwl(currentLang) {
                    dieOwl();
                    $(element)
                        .owlCarousel({
                            items: 1,
                            rtl: currentLang === 'ar',
                            autoplay: true,
                            autoHeight:true
                        });
                }

                function dieOwl() {
                    $(element).owlCarousel('destroy');
                }

                $timeout(function () {
                    startOwl(langService.current);
                }, 1000);


                langService.listeningToChange(startOwl);

            }
        };

    })
};
