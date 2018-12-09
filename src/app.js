(function (document) {
    // will commented before go to production
    //require('./../dist/resources/lang.json'); // to watch the language and reload if any changes happened.
    //require('./../dist/resources/menu.json'); // to watch the menus and reload if any changes happened.
    require('./sass/style.scss');
    require('./require/libs');

    // this is as a workaround to avoid the exception till get the update for text-angular plugin
    angular.lowercase = function (text) {
        return text ? text.toLowerCase() : text;
    };
    angular.uppercase = function (text) {
        return text ? text.toUpperCase() : text;
    };
    var app = angular
        .module('app',
            [
                // 'E2EModule',
                'ngAria',
                'ngMessages',
                'ngAnimate',
                'ui.router',
                'ngMaterial',
                'ngCookies',
                'ngIdle',
                'md.data.table',
                'tooltips',
                'mdColorPicker',
                // 'angularTrix',
                'CMSScanner',
                'LocalStorageModule',
                'ui.mask',
                'textAngular'
            ]
        );

    require('./require')(app);


    app.config(function ($mdIconProvider, $compileProvider, $qProvider) {
        'ngInject';
        $mdIconProvider
            .defaultIconSet('assets/icon-set/mdi.svg')
            .icon('add-filter', 'assets/icon-set/add-filter.svg');
        $compileProvider.debugInfoEnabled(false);
        // $qProvider.errorOnUnhandledRejections(false);
    });

    angular.element(function () {
        'ngInject';
        angular.bootstrap(document, ['app']);
    });

    app.run(function () {
        'ngInject';
        console.log("%c *** CMS LOADER START ***", "color:blue");
    });
    window['GET_PRIVATE_BUILD'] = function () {
        return app.$_privateBuildNumber;
    }
})(document);