module.exports = function (app) {
    app.controller('showUserSubscriptionsPopCtrl', function (userSubscriptions,
                                                               lookupService,
                                                               $q,
                                                               langService,
                                                               toast,
                                                               dialog,
                                                               employeeService,
                                                               correspondenceService,
                                                               moment) {
        'ngInject';
        var self = this;

        self.controllerName = 'showUserSubscriptionsPopCtrl';
        self.progress = null;

        self.userSubscriptions = userSubscriptions;

        self.closeShowUserSubscriptionsPopupFromCtrl = function () {
            dialog.cancel();
        };

        self.viewDocument = function (item, $event) {
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }

            correspondenceService.viewCorrespondence({
                vsId: item.documentVSId,
                docClassName: item.docClass
            }, self.gridActions,false ,true);
        };

        /**
         * convert unix timestamp to Original Date Format (YYYY-MM-DD hh:mm:ss A)
         * @returns {*}
         * @param updatedOn
         */
        self.getDateFromUnixTimeStamp = function (updatedOn) {
            return moment(updatedOn).format('YYYY-MM-DD hh:mm:ss A');
        };


        self.getSubscriptionEventType = function(selected){
            var lang = langService.getCurrentLang();
            if(lang === 'en'){
                lang = 'En';
            }

            if(lang === 'ar'){
                lang = "Ar";
            }

            return lookupService.returnLookups(lookupService.eventType).filter(function (item) {
                return item.lookupKey === selected;
            })[0]['default' + lang + 'Name'];
        };

    });
};