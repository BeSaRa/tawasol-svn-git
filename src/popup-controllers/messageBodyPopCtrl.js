module.exports = function (app) {
    app.controller('messageBodyPopCtrl', function (dialog,
                                                   record,
                                                   isHtml,
                                                   bodyProperty,
                                                   $sce) {
        'ngInject';
        var self = this;

        self.controllerName = 'messageBodyPopCtrl';

        if (isHtml) {
            self.arBody = $sce.trustAsHtml(record[bodyProperty.arabic]);
            self.enBody = $sce.trustAsHtml(record[bodyProperty.english]);
        } else {
            self.arBody = (record[bodyProperty.arabic]);
            self.enBody = (record[bodyProperty.english]);
        }

        self.closePopup = function () {
            dialog.cancel();
        }
    });
};
