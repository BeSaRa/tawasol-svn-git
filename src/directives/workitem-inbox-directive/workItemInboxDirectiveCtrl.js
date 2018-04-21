module.exports = function (app) {
    app.controller('workItemInboxDirectiveCtrl', function ($scope, LangWatcher) {
        'ngInject';
        var self = this;
        self.controllerName = 'workItemInboxDirectiveCtrl';
        LangWatcher($scope);

        // console.log("HELLO");
    });
};