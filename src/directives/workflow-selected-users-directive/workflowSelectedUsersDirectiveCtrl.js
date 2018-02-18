module.exports = function (app) {
    app.controller('workflowSelectedUsersDirectiveCtrl', function ($scope , LangWatcher) {
        'ngInject';
        var self = this;
        self.controllerName = 'workflowSelectedUsersDirectiveCtrl';
        LangWatcher($scope);

        self.runAllComplete = function (gridName) {
            return self.callbackAllComplete(gridName);
        }

    });
};