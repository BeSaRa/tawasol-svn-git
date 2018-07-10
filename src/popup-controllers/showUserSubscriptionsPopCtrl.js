module.exports = function (app) {
    app.controller('showUserSubscriptionsPopCtrl', function (userSubscriptions,
                                                               lookupService,
                                                               $q,
                                                               langService,
                                                               toast,
                                                               dialog,
                                                               employeeService,
                                                               correspondenceService,
                                                               moment,
                                                               generator) {
        'ngInject';
        var self = this;

        self.controllerName = 'showUserSubscriptionsPopCtrl';
        self.progress = null;

        self.userSubscriptions = userSubscriptions;


        self.closeShowUserSubscriptionsPopupFromCtrl = function () {
            dialog.cancel();
        };

        /**
         * @description Preview document
         * @param item
         * @param $event
         */
        self.previewDocument = function (item, $event) {
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }

            correspondenceService.viewCorrespondence({
                vsId: item.vsId,
                docClassName: generator.getDocumentClassName(item.docClassId)
            }, self.gridActions,false ,true);
        };



        /**
         * @description View document
         * @param item
         * @param $event
         */
        self.viewDocument = function (item, $event) {
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            console.log('view document');
        };

        self.getSubscriptionEventType = function(selected){
            var lang = langService.getCurrentLang();
            if(lang === 'en'){
                lang = 'En';
            }

            if(lang === 'ar'){
                lang = "Ar";
            }

            return lookupService.returnLookups(lookupService.documentSubscription).filter(function (item) {
                return item.lookupKey === selected;
            })[0]['default' + lang + 'Name'];
        };

    });
};