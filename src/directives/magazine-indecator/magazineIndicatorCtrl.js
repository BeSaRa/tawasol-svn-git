module.exports = function (app) {
    app.controller('magazineIndicatorCtrl', function (LangWatcher, $timeout, langService, $scope) {
        'ngInject';
        var self = this;
        self.controllerName = 'magazineIndicatorCtrl';
        LangWatcher($scope);

        $scope.$watch(function () {
            return self.colorCallback;
        }, function (value) {
            if (value && typeof value === 'function')
                self.color = self.colorCallback(self.model);
        });

    });
};