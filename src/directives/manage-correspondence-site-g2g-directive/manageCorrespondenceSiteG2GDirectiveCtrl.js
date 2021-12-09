module.exports = function (app) {
    app.controller('manageCorrespondenceSiteG2GDirectiveCtrl', function (correspondenceViewService,
                                                                         LangWatcher,
                                                                         $scope) {
        'ngInject';
        var self = this;
        self.controllerName = 'manageCorrespondenceSiteG2GDirectiveCtrl';

        // watch the language for any changes from current user.
        LangWatcher($scope);

    });
};