var app = angular.module('app', ['ngRoute','ngMaterial']);

app.config(function ($routeProvider , $locationProvider , $mdIconProvider) {
    'ngInject';
    $locationProvider.hashPrefix('');
    $mdIconProvider.defaultIconSet('mdi.svg');

    $routeProvider
        .when('/', {
            templateUrl: 'views/home.html',
            controller: 'homeCtrl'
        })
        .when('/Languages', {
            templateUrl: 'views/lang.html',
            controller: 'langCtrl'
        })
        .when('/Menus', {
            templateUrl: 'views/menu.html',
            controller: 'menuCtrl',
            controllerAs: 'ctrl',
            resolve: {
                menus: function (menuService) {
                    return menuService.loadMenus();
                },
                languages: function (langDevService) {
                    return langDevService.loadLanguages();
                }
            }
        })

});
