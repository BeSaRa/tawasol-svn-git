(function (app) {
    app.directive('menuDirective', function () {
        'ngInject';
        return {
            templateUrl: 'views/menu-directive.html',
            replace: true,
            scope: {
                items: "=",
                parent: "=",
                lang: '='
            },
            controller: 'editMenuCtrl'
        }
    })
})(app);