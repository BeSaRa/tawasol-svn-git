module.exports = function (app) {
    app.controller('cmsThemeDirectiveCtrl', function ($scope, $element, tokenService, employeeService, themeService, rootEntity) {
        'ngInject';
        var self = this;
        self.controllerName = 'cmsThemeDirectiveCtrl';

        /**
         * @description theme render
         */
        self.themeRender = function () {
            $element.html('');
            if (themeService.getCurrentTheme() && themeService.getAllowRender()) {
                $element.html(themeService.getCurrentTheme().getCssText());
            }
        };

        /**
         * watcher for the current organization theme from globalSettings.
         */
        $scope.$watch(function () {
            return rootEntity.returnRootEntity();
        }, function (newVal) {
            if (newVal) {
                themeService.setCurrentTheme(rootEntity.getGlobalSettings().theme);
            }
        });


        $scope.$watch(function () {
            return themeService.getCurrentTheme();
        }, function (theme) {
            if (theme && tokenService.getToken())
                self.themeRender();
        });

    });
};