module.exports = function (app) {
    app.controller('userSubscriptionDirectiveCtrl', function (lookupService,
                                                              langService,
                                                              userSubscriptionService,
                                                              dialog,
                                                              employeeService,
                                                              correspondenceService,
                                                              generator,
                                                              viewTrackingSheetService,
                                                              viewDocumentService,
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
            if (!subscription) {
                subscription = subscription.hasOwnProperty('trigerId') ? subscription.trigerId : subscription;
            }
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
            var classname = generator.getDocumentClassName(item.docClassId);

            viewDocumentService.viewQueueDocument({
                vsId: item.vsId,
                docClassName: classname,
                addMethod: item.addMethod,
                docStatus: item.docStatus
            }, [], 'userInbox', $event);
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
            // console.log('view document');
        };

        function _getModelAndInitialize(documentClass, record) {
            var model = new self.models[documentClass.toLowerCase()]();
            if (record) {
                model.vsId = record.vsId;
                model.docSubject = record.docSubject
            }
            return model;
        }

        /**
         * @description View Tracking sheet
         * @param record
         * @param $event
         */
        self.viewTrackingSheet = function (record, $event) {
            var document = _getModelAndInitialize(generator.getDocumentClassName(record.docClassId), record);
            viewTrackingSheetService
                .controllerMethod
                .viewTrackingSheetPopup(document, ['view_tracking_sheet', 'tabs'], $event)
        };

        /**
         * @description Contains the permissions objects to be used for subscription actions.
         * @type {{trackingSheet: string}}
         */
        self.permissions = {
            trackingSheet: "VIEW_DOCUMENT'S_TRACKING_SHEET"
        };

        /**
         * @description Check the permission for given action
         * @param permissionKey
         * @param checkAtleastOne
         * @returns {boolean|*}
         */
        self.checkPermission = function (permissionKey, checkAtleastOne) {
            var hasPermission = true;
            if (typeof permissionKey === 'string') {
                hasPermission = employeeService.hasPermissionTo(permissionKey);
            } else if (angular.isArray(permissionKey) && permissionKey.length) {
                if (checkAtleastOne) {
                    hasPermission = employeeService.getEmployee().hasAnyPermissions(permissionKey);
                } else {
                    hasPermission = employeeService.getEmployee().hasThesePermissions(permissionKey);
                }
            }
            return hasPermission;
        }
    });
};
