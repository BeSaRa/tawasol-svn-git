module.exports = function (app) {
    app.controller('sendFaxPopCtrl', function (smsTemplateService,
                                               _,
                                               toast,
                                               langService,
                                               dialog,
                                               $timeout,
                                               correspondence,
                                               correspondenceService) {
        'ngInject';
        var self = this;
        self.controllerName = 'sendFaxPopCtrl';

        self.correspondence = correspondence;
        self.model = angular.copy(correspondence);

        $timeout(function () {
            self.correspondence.sitesInfoTo = self.sites;
        });
        self.faxExportOptions = {
            ATTACHMENTS: true,
            RELATED_BOOKS: true
        };

        self.sendFax = function ($event) {
            var sitesWithoutFax = _.filter(self.correspondence.sitesInfoTo, function (site) {
                return !site.faxNumber;
            });
            if (sitesWithoutFax.length) {
                dialog.alertMessage(langService.get('please_add_fax_number_to_all_sites'));
            } else {
                correspondenceService.sendFax(self.correspondence, self.correspondence.sitesInfoTo, self.faxExportOptions)
                    .then(function (result) {
                        dialog.hide();
                        toast.success(langService.get('success_sending_fax'));
                    }).catch(function () {
                    toast.error(langService.get('failed_sending_fax'))
                })
            }
        };

        /**
         * @description Close the popup
         */
        self.closePopup = function () {
            dialog.cancel();
        };
    });
};
