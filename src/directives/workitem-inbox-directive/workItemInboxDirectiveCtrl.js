module.exports = function (app) {
    app.controller('workItemInboxDirectiveCtrl', function ($scope, LangWatcher, langService) {
        'ngInject';
        var self = this;
        self.controllerName = 'workItemInboxDirectiveCtrl';
        self.langService = langService;
        LangWatcher($scope);

        // console.log("HELLO");
    });
};