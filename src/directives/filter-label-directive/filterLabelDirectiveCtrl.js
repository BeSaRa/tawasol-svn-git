module.exports = function (app) {
    app.controller('filterLabelDirectiveCtrl', function ($scope, LangWatcher) {
        'ngInject';
        var self = this;
        self.controllerName = 'filterLabelDirectiveCtrl';
        LangWatcher($scope);
    });
};