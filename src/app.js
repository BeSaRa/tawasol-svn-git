(function (document) {
    // will commented before go to production
    //require('./../dist/resources/lang.json'); // to watch the language and reload if any changes happened.
    //require('./../dist/resources/menu.json'); // to watch the menus and reload if any changes happened.
    require('./sass/style.scss');
    require('./require/libs');

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
                'angularTrix',
                'CMSScanner',
                'LocalStorageModule'
            ]
        );

    require('./require')(app);


    app.config(function ($mdIconProvider, $compileProvider, $qProvider) {
        'ngInject';
        $mdIconProvider.defaultIconSet('assets/icon-set/mdi.svg');
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

})(document);