module.exports = function (app) {
    app.controller('sendFaxPopCtrl', function (smsTemplateService,
                                               _,
                                               toast,
                                               langService,
                                               dialog,
                                               correspondence,
                                               outgoingService) {
        'ngInject';
        var self = this;
        self.controllerName = 'sendFaxPopCtrl';

        self.correspondence = correspondence;
        self.correspondence.sitesInfoTo = [];
        self.model = angular.copy(correspondence);

        self.faxExportOptions = {
            ATTACHMENTS: true,
            RELATED_BOOKS: true
        };

        self.sendFax = function ($event) {
            outgoingService.sendFax(self.correspondence, self.correspondence.sitesInfoTo, self.faxExportOptions).then(function (result) {
                dialog.hide();
                toast.success(langService.get('success_sending_fax'));
            }).catch(function () {
                toast.error(langService.get('failed_sending_fax'))
            })
        };

        /**
         * @description Close the popup
         */
        self.closePopup = function () {
            dialog.cancel();
        };
    });
};