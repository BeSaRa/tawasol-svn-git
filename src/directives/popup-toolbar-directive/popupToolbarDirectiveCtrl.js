module.exports = function (app) {
    app.controller('popupToolbarDirectiveCtrl', function (LangWatcher,
                                                          $scope) {
        'ngInject';
        var self = this;
        self.controllerName = 'popupToolbarDirectiveCtrl';
        LangWatcher($scope);

        self.toggleFullScreen = function () {
            self.fullScreen = !self.fullScreen;
        };

        /*self.closePopupCallback = function () {
            if (self.closeCallback)
                self.closeCallback();
        }*/

    });
};
