module.exports = function (app) {
    app.controller('themePreviewDirectiveCtrl', function (themeService) {
        'ngInject';
        var self = this;
        self.controllerName = 'themePreviewDirectiveCtrl';
        self.sidebarItems = ['sidebarToolbar', 'sidebarSelectedParent', 'sidebarSelected'];

        self.setCurrentEmployeeTheme = function (theme) {
            themeService.updateEmployeeTheme(theme)
                .then(function (theme) {
                    themeService.setCurrentTheme(theme);
                });
        }
    });
};