module.exports = function (app) {
    app.controller('magazineIndicatorCtrl', function (LangWatcher, langService, $scope) {
        'ngInject';
        var self = this;
        self.controllerName = 'magazineIndicatorCtrl';
        LangWatcher($scope);
    });
};