module.exports = function (app) {
    app.controller('workItemInboxDirectiveCtrl', function ($scope, employeeService, LangWatcher, langService) {
        'ngInject';
        var self = this;
        self.controllerName = 'workItemInboxDirectiveCtrl';
        self.langService = langService;
        LangWatcher($scope);
        self.employeeService = employeeService;
        // console.log("HELLO");
    });
};