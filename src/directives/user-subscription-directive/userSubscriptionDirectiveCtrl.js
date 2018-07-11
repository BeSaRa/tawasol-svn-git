module.exports = function (app) {
    app.controller('userSubscriptionDirectiveCtrl', function (lookupService,
                                                              langService,
                                                              userSubscriptionService,
                                                              dialog,
                                                              employeeService,
                                                              correspondenceService,
                                                              generator,
                                                              viewTrackingSheetService,
                                                              Outgoing,
                                                              Incoming,
                                                              Internal,
                                                              General) {
        'ngInject';
        var self = this;

        self.controllerName = 'userSubscriptionDirectiveCtrl';
        self.service = userSubscriptionService;
        self.progress = null;

        self.models = {
            outgoing: Outgoing,
            internal: Internal,
            incoming: Incoming,
            general: General
        };

        userSubscriptionService.getUserSubscriptions();

        /**
         * @description Opens the menu for subscriptions
         * @param $mdMenu
         */
        self.openSubscriptionMenu = function ($mdMenu) {
            if (userSubscriptionService.userSubscriptions.length)
                $mdMenu.open();
            else
                dialog.alertMessage(langService.get("no_user_subscriptions"));
        };

        self.getSubscriptionEventType = function (subscription) {
            subscription = subscription.hasOwnProperty('triggerId') ? subscription.triggerId : subscription;
            var lang = generator.ucFirst(langService.current);

            return lookupService.returnLookups(lookupService.documentSubscription).filter(function (item) {
                return item.lookupKey === subscription;
            })[0]['default' + lang + 'Name'];
        };

        /**
         * @description Preview document
         * @param item
         * @param $event
         */
        self.previewDocument = function (item, $event) {
            $event.preventDefault();
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }

            correspondenceService.viewCorrespondence({
                vsId: item.vsId,
                docClassName: generator.getDocumentClassName(item.docClassId)
            }, self.gridActions, false, true);
        };

        /**
         * @description View document
         * @param item
         * @param $event
         */
        self.viewDocument = function (item, $event) {
            $event.preventDefault();
            if (!employeeService.hasPermissionTo('VIEW_DOCUMENT')) {
                dialog.infoMessage(langService.get('no_view_permission'));
                return;
            }
            console.log('view document');
        };

        function _getModelAndInitialize(documentClass, vsId) {
            var model = new self.models[documentClass.toLowerCase()]();
            if (vsId)
                model.vsId = vsId.hasOwnProperty('vsId') ? vsId.vsId : vsId;
            return model;
        }

        /**
         * @description View Tracking sheet
         * @param record
         * @param $event
         */
        self.viewTrackingSheet = function (record, $event) {
            var document = _getModelAndInitialize(generator.getDocumentClassName(record.docClassId), record);
            debugger;
            viewTrackingSheetService
                .controllerMethod
                .viewTrackingSheetPopup(document, ['view_tracking_sheet', 'tabs'], $event)
        };

        /**
         * @description Check the permission for given action
         * @param permissionKey
         * @param checkAtleastOne
         * @returns {boolean|*}
         */
        self.checkPermission = function (permissionKey, checkAtleastOne) {
            var hasPermission = true;
            if (typeof action.permissionKey === 'string') {
                hasPermission = employeeService.hasPermissionTo(permissionKey);
            }
            else if (angular.isArray(action.permissionKey) && action.permissionKey.length) {
                if (checkAtleastOne) {
                    hasPermission = employeeService.getEmployee().hasAnyPermissions(permissionKey);
                }
                else {
                    hasPermission = employeeService.getEmployee().hasThesePermissions(permissionKey);
                }
            }
            return hasPermission;
        }
    });
};