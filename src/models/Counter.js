module.exports = function (app) {
    app.factory('Counter', function (CMSModelInterceptor,
                                     employeeService,
                                     _) {
        'ngInject';
        return function Counter(model) {
            var self = this,
                ignoreUnreadCounts = [
                    'menu_item_outgoing',
                    'menu_item_outgoing_prepare',
                    'menu_item_outgoing_draft',
                    'menu_item_outgoing_review',
                    'menu_item_outgoing_ready_to_send',
                    'menu_item_outgoing_rejected',
                    'menu_item_incoming',
                    'menu_item_incoming_scan',
                    'menu_item_incoming_review',
                    'menu_item_incoming_ready_to_send',
                    'menu_item_incoming_rejected',
                    'menu_item_internal_prepare',
                    'menu_item_internal_draft',
                    'menu_item_internal_rejected',
                    'menu_item_internal_review',
                    'menu_item_internal_ready_to_send',
                    'menu_item_user_favorite_documents',
                    'menu_item_outgoing_deleted',
                    'menu_item_incoming_deleted',
                    'menu_item_internal_deleted',
                    'menu_item_my_followup',
                    'menu_item_g2g',
                    'menu_item_government_inbox',
                    'menu_item_government_returned_mail',
                    'menu_item_archive_returned'
                ],
                maps = {
                    menu_item_outgoing: [
                        'outgoingRejected',
                        'outgoingAccepted',
                        'outgoingReview',
                        'outgoingPrepare',
                        // 'outgoingDraft',
                        function (currentValue, counter, employee, property) {
                            // outgoingDeleted
                            return employee.hasThesePermissions('DELETE_OUTGOING') ? (currentValue + (counter.outgoingDeleted[property] < 0 ? 0 : counter.outgoingDeleted[property])) : currentValue;
                        }
                    ],
                    menu_item_outgoing_prepare: [
                        'outgoingPrepare'
                    ],
                    /*menu_item_outgoing_draft: [
                        'outgoingDraft'
                    ],*/
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
                        'incomingRejected',
                        function (currentValue, counter, employee, property) {
                            // incomingDeleted
                            return employee.hasThesePermissions('DELETE_INCOMING') ? (currentValue + (counter.incomingDeleted[property] < 0 ? 0 : counter.incomingDeleted[property])) : currentValue;
                        }
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
                        // 'internalDraft',
                        'internalReview',
                        'internalRejected',
                        'internalReadyToSent',
                        'internalApproved',
                        function (currentValue, counter, employee, property) {
                            // internalDeleted
                            return employee.hasThesePermissions('DELETE_INTERNAL') ? (currentValue + (counter.internalDeleted[property] < 0 ? 0 : counter.internalDeleted[property])) : currentValue;
                        }
                    ],
                    menu_item_internal_prepare: [
                        'internalPrepare'
                    ],
                    /*menu_item_internal_draft: [
                        'internalDraft'
                    ],*/
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
                        'foldersCount',
                        'followupFolderCount',
                        function (currentValue, counter, employee, property) {
                            if (!employee.inRegistry() && employee.hasThesePermissions('GROUP_MAIL')) {
                                currentValue = (counter.groupMail[property] + currentValue);
                            }
                            //currentValue = employee.inRegistry() ? currentValue : (counter.groupMail[property] + currentValue);
                            return currentValue;
                        }
                    ],
                    menu_item_user_inbox: [
                        'userInbox'
                    ],
                    menu_item_department_inbox: [
                        'deptInbox',
                        'readyToExport',
                        'deptReturned'
                        // 'deptSendDocs'
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
                    menu_item_user_favorite_documents: [
                        'userFavouriteDocument'
                    ],
                    menu_item_group_inbox: [
                        'groupMail'
                    ],
                    menu_item_central_archive_mail: [
                        'readyToExportCentralArchive',
                        'returnedMailCentralArchive'
                    ],
                    menu_item_central_archive_ready_to_export: [
                        'readyToExportCentralArchive'
                    ],
                    menu_item_archive_returned: [
                        'returnedMailCentralArchive'
                    ],
                    menu_item_folders: [
                        'foldersCount'
                    ],
                    menu_item_g2g: [
                        'g2gDeptInbox',
                        'g2gDeptReturned'
                    ],
                    menu_item_government_inbox: [
                        'g2gDeptInbox'
                    ],
                    menu_item_government_returned_mail: [
                        'g2gDeptReturned'
                    ],
                    menu_item_outgoing_deleted: [
                        'outgoingDeleted'
                    ],
                    menu_item_incoming_deleted: [
                        'incomingDeleted'
                    ],
                    menu_item_internal_deleted: [
                        'internalDeleted'
                    ],
                    menu_item_my_followup: [
                        'followupFolderCount'
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

            // overdue outgoing  documents
            self.overdueOutgoingDocuments = null;
            // overdue incoming documents
            self.overdueIncomingDocuments = null;

            /*Department Inbox*/
            self.readyToExport = null;
            self.deptInbox = null;
            self.deptReturned = null;

            self.userFavouriteDocument = null;

            self.groupMail = null;

            /*G2G*/
            self.g2gDeptInbox = null;
            self.g2gDeptReturned = null;
            /* deleted queues*/
            self.outgoingDeleted = null;
            self.incomingDeleted = null;
            self.internalDeleted = null;

            // this property not related to the actual model
            self.foldersCount = null;

            self.maped = {};

            var reversedMap = {};
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

            Counter.prototype.getCount = function (propertyName, property) {
                if (property === 'second' && self.maped.hasOwnProperty(propertyName) && self.maped[propertyName][property] < 0) {
                    return false;
                }
                return self.maped.hasOwnProperty(propertyName) ? self.maped[propertyName][property] : null;
            };

            Counter.prototype.hasCounter = function (propertyName, unread) {
                return self.maped.hasOwnProperty(propertyName) && (unread ? ignoreUnreadCounts.indexOf(propertyName) === -1 : true);
            };

            Counter.prototype.reverseMap = function () {
                return _.map(maps, function (item, key) {
                    if (item.length === 1) {
                        reversedMap[item[0]] = key;
                    }
                })
            };

            Counter.prototype.mapCounter = function () {
                var self = this;
                self.reverseMap();
                _.map(maps, function (items, property) {
                    if (!self.maped.hasOwnProperty(property)) {
                        self.maped[property] = {
                            first: 0,
                            second: 0
                        }
                    }

                    self.maped[property].first = employeeService.employeeHasPermissionTo(property) ? (_.reduce(items, function (oldValue, currentValue) {
                        var hasPermission = reversedMap.hasOwnProperty(currentValue) ? employeeService.employeeHasPermissionTo(reversedMap[currentValue]) : true;
                        return typeof currentValue === 'function' ? currentValue(oldValue, self, employeeService.getEmployee(), 'first') : (hasPermission ? oldValue + self[currentValue].first : oldValue);
                    }, 0)) : 0;

                    self.maped[property].second = employeeService.employeeHasPermissionTo(property) ? (_.reduce(items, function (oldValue, currentValue) {
                        var hasPermission = reversedMap.hasOwnProperty(currentValue) ? employeeService.employeeHasPermissionTo(reversedMap[currentValue]) : true;
                        return typeof currentValue === 'function' ? currentValue(oldValue, self, employeeService.getEmployee(), 'second') : (hasPermission ? oldValue + (self[currentValue].second === -1 ? 0 : self[currentValue].second) : oldValue);
                    }, 0)) : 0;

                });
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('Counter', 'init', this);
        }
    })
};
