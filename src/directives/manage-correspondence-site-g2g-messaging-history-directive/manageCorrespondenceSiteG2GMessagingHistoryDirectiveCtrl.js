module.exports = function (app) {
    app.controller('manageCorrespondenceSiteG2GMessagingHistoryDirectiveCtrl', function (correspondenceViewService,
                                                                         LangWatcher,
                                                                         $scope) {
        'ngInject';
        var self = this;
        self.controllerName = 'manageCorrespondenceSiteG2GMessagingHistoryDirectiveCtrl';

        // watch the language for any changes from current user.
        LangWatcher($scope);

    });
};