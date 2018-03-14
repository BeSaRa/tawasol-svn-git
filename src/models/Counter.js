module.exports = function (app) {
    app.factory('Counter', function (CMSModelInterceptor,
                                     employeeService,
                                     _) {
        'ngInject';
        return function Counter(model) {
            var self = this,
                maps = {
                    menu_item_outgoing: [
                        'outgoingRejected',
                        'outgoingAccepted',
                        'outgoingReview',
                        'outgoingPrepare',
                        'outgoingDraft'
                    ],
                    menu_item_outgoing_prepare: [
                        'outgoingPrepare'
                    ],
                    menu_item_outgoing_draft: [
                        'outgoingDraft'
                    ],
                    menu_item_outgoing_review: [
                        'outgoingReview'
                    ],
                    menu_item_outgoing_ready_to_send: [
                        'outgoingAccepted'
                    ],
                    menu_item_outgoing_rejected: [
                        'outgoingRejected'
                    ],
                    menu_item_incoming: [
                        'incomingPrepare',
                        'incomingReview',
                        'incomingReadyToSent',
                        'incomingRejected'
                    ],
                    menu_item_incoming_scan: [
                        'incomingPrepare'
                    ],
                    menu_item_incoming_review: [
                        'incomingReview'
                    ],
                    menu_item_incoming_ready_to_send: [
                        'incomingReadyToSent'
                    ],
                    menu_item_incoming_rejected: [
                        'incomingRejected'
                    ],
                    menu_item_internal: [
                        'internalPrepare',
                        'internalDraft',
                        'internalReview',
                        'internalRejected',
                        'internalReadyToSent',
                        'internalApproved'
                    ],
                    menu_item_internal_prepare: [
                        'internalPrepare'
                    ],
                    menu_item_internal_draft: [
                        'internalDraft'
                    ],
                    menu_item_internal_review: [
                        'internalReview'
                    ],
                    menu_item_internal_rejected: [
                        'internalRejected'
                    ],
                    menu_item_internal_ready_to_send: [
                        'internalReadyToSent'
                    ],
                    menu_item_approved_internal_queue: [
                        'internalApproved'
                    ],
                    menu_item_inbox: [
                        'userInbox',
                        'userFavouriteDocument',
                        function (currentValue, counter, employee) {
                            currentValue = employee.inRegistry() ? currentValue : (counter.groupMail + currentValue);
                            return currentValue;
                        }
                    ],
                    menu_item_user_inbox: [
                        'userInbox'
                    ],
                    menu_item_department_inbox: [
                        'deptInbox',
                        'readyToExport',
                        'deptReturned',
                        'deptSendDocs'
                    ],
                    menu_item_dep_incoming: [
                        'deptInbox'
                    ],
                    menu_item_dep_ready_to_export: [
                        'readyToExport'
                    ],
                    menu_item_dep_returned: [
                        'deptReturned'
                    ],
                    menu_item_dep_sent_items: [
                        'deptSendDocs'
                    ],
                    menu_item_user_favorite_documents: [
                        'userFavouriteDocument'
                    ],
                    menu_item_group_inbox: [
                        'groupMail'
                    ],
                    menu_item_central_archive_mail: [
                        'readyToExportCentralArchive'
                    ],
                    menu_item_central_archive_ready_to_export: [
                        'readyToExportCentralArchive'
                    ]
                };
            /*User Inbox*/
            self.userInbox = null;

            /*Outgoing Mail*/
            self.outgoingPrepare = null;
            self.outgoingReview = null;
            self.outgoingDraft = null;
            self.outgoingRejected = null;
            self.outgoingAccepted = null;   //Ready To Send

            /*Incoming Mail*/
            self.incomingPrepare = null;
            self.incomingReview = null;
            self.incomingRejected = null;
            self.incomingReadyToSent = null;

            /*Internal Mail*/
            self.internalPrepare = null;
            self.internalDraft = null;
            self.internalReview = null;
            self.internalRejected = null;
            self.internalReadyToSent = null;

            /*Department Inbox*/
            self.readyToExport = null;
            self.deptInbox = null;
            self.deptReturned = null;
            self.deptSendDocs = null;

            self.userFavouriteDocument = null;

            self.groupMail = null;

            self.maped = {};

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            Counter.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            Counter.prototype.getCount = function (propertyName) {
                return self.maped.hasOwnProperty(propertyName) ? self.maped[propertyName] : null;
            };

            Counter.prototype.mapCounter = function () {
                var self = this;
                _.map(maps, function (items, property) {
                    self.maped[property] = _.reduce(items, function (oldValue, currentValue) {
                        return typeof currentValue === 'function' ? currentValue(oldValue, self, employeeService.getEmployee()) : (oldValue + self[currentValue]);
                    }, 0);
                });
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('Counter', 'init', this);
        }
    })
};