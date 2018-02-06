module.exports = function (app) {
    app.controller('sidebarRightDirectiveCtrl', function ($scope, LangWatcher, themeService) {
        'ngInject';
        var self = this;
        self.controllerName = 'sidebarRightDirectiveCtrl';
        LangWatcher($scope); // watch the languages.
        // theme service
        self.themeService = themeService;


    });
};