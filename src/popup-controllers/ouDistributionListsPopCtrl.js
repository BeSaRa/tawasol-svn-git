module.exports = function (app) {
    app.controller('ouDistributionListsPopCtrl', function (dialog, distributionLists, toast, langService, organizationService) {
        'ngInject';
        var self = this;
        self.controllerName = 'ouDistributionListsPopCtrl';

        self.distributionLists = distributionLists;
        self.selectedOUDistributionList = null;

        self.excludedDL = _.map(self.excludedDL, 'id');

        /**
         *@description save private registry Ous
         * @param $event
         */
        self.saveOUDistributionList = function ($event) {
            organizationService.addOUDistributionList(self.regOu, self.selectedOUDistributionList)
                .then(function () {
                    dialog.hide();
                }).catch(function () {
                toast.error(langService.get("failed"));
            });
        };


        self.excludeOUDistributionListIfExists = function (dl) {
            dl = dl.hasOwnProperty('id') ? dl.id : dl;
            return self.excludedDL.indexOf(dl) === -1;
        };


        self.closePopup = function () {
            dialog.cancel();
        }
    });
};
