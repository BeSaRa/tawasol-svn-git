(function (app) {
    app
        .controller('menuCtrl', function (menus, languages, menuService, langDevService) {
            'ngInject';
            var self = this;
            self.menus = menus;
            self.languages = languages;
        });
})(app);