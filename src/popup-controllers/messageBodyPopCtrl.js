module.exports = function (app) {
    app.controller('messageBodyPopCtrl', function (dialog,
                                                   $sce,
                                                   $timeout) {
        'ngInject';
        var self = this;

        self.controllerName = 'messageBodyPopCtrl';

        $timeout(function () {
            if (self.isHtml) {
                self.arBody = $sce.trustAsHtml(self.record[self.bodyProperty.arabic]);
                self.enBody = $sce.trustAsHtml(self.record[self.bodyProperty.english]);
            } else {
                self.arBody = (self.record[self.bodyProperty.arabic]);
                self.enBody = (self.record[self.bodyProperty.english]);
            }
        });

        self.closePopup = function () {
            dialog.cancel();
        }
    });
};
