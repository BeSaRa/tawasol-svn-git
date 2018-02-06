module.exports = function (app) {
    app.service('draftOutgoingService', function (urlService,
                                                  $http,
                                                  $q,
                                                  generator,
                                                  Outgoing,
                                                  employeeService,
                                                  _,
                                                  dialog,
                                                  langService,
                                                  toast,
                                                  cmsTemplate) {
        'ngInject';
        var self = this;
        self.serviceName = 'draftOutgoingService';

        self.draftOutgoings = [];

        /**
         * @description Load the draft outgoing mails from server.
         * @param organization
         * @returns {Promise|draftOutgoings}
         */
        self.loadDraftOutgoings = function () {
            return $http.get(urlService.draftOutgoings.change({id: employeeService.getEmployee().getOUID()})).then(function (result) {
                self.draftOutgoings = generator.generateCollection(result.data.rs, Outgoing, self._sharedMethods);
                self.draftOutgoings = generator.interceptReceivedCollection(['Correspondence', 'Outgoing'], self.draftOutgoings);
                return self.draftOutgoings;
            });
        };

        /**
         * @description Get draft outgoing mails from self.draftOutgoings if found and if not load it from server again.
         * @param organization
         * @returns {Promise|draftOutgoings}
         */
        self.getDraftOutgoings = function () {
            return self.draftOutgoings.length ? $q.when(self.draftOutgoings) : self.loadDraftOutgoings();
        };

        /**
         * @description Contains methods for CRUD operations for draft outgoing mails
         */
        self.controllerMethod = {
            /**
             * @description Show confirm box and remove draft outgoing mail
             * @param draftOutgoing
             * @param $event
             */
            draftOutgoingRemove: function (draftOutgoing, $event) {
                return dialog.confirmMessage(langService.get('confirm_remove').change({name: draftOutgoing.getNames()}), null, null, $event)
                    .then(function () {
                        return self.removeDraftOutgoing(draftOutgoing).then(function () {
                            toast.success(langService.get("remove_specific_success").change({name: draftOutgoing.getNames()}));
                            return true;
                        })
                    });
            },
            /**
             * @description Show confirm box and remove bulk draft outgoing mails
             * @param draftOutgoings
             * @param $event
             */
            draftOutgoingRemoveBulk: function (draftOutgoings, $event) {
                return dialog
                    .confirmMessage(langService.get('confirm_remove_selected_multiple'), null, null, $event || null)
                    .then(function () {
                        return self.removeBulkDraftOutgoings(draftOutgoings)
                            .then(function (result) {
                                var response = false;
                                if (result.length === draftOutgoings.length) {
                                    toast.error(langService.get("failed_remove_selected"));
                                    response = false;
                                } else if (result.length) {
                                    generator.generateFailedBulkActionRecords('remove_success_except_following', _.map(result, function (draftOutgoing) {
                                        return draftOutgoing.getNames();
                                    }));
                                    response = true;
                                } else {
                                    toast.success(langService.get("remove_success"));
                                    response = true;
                                }
                                return response;
                            });
                    });
            },
            /**
             * @description send draft outgoing mail to review
             * @param draftOutgoing
             * @param $event
             */
            draftOutgoingSendToReview: function (draftOutgoing, $event) {
                return self.sendToReviewDraftOutgoing(draftOutgoing).then(function () {
                    toast.success(langService.get("send_to_review_specific_success").change({name: draftOutgoing.getNames()}));
                    return true;
                })
            },
            /**
             * @description send bulk draft outgoing mails to review
             * @param draftOutgoings
             * @param $event
             */
            draftOutgoingSendToReviewBulk: function (draftOutgoings, $event) {
                return self.bulkSendToReviewDraftOutgoing(draftOutgoings)
                    .then(function (result) {
                        var response = false;
                        if (result.length === draftOutgoings.length) {
                            toast.error(langService.get("failed_send_to_review_selected"));
                            response = false;
                        } else if (result.length) {
                            generator.generateFailedBulkActionRecords('send_to_review_success_except_following', _.map(result, function (draftOutgoing) {
                                return draftOutgoing.getNames();
                            }));
                            response = true;
                        } else {
                            toast.success(langService.get("selected_send_to_review_success"));
                            response = true;
                        }
                        return response;
                    });
            }
        };

        /**
         * @description Remove given draft outgoing mail.
         * @param draftOutgoing
         * @return {Promise|null}
         */
        self.removeDraftOutgoing = function (draftOutgoing) {
            var vsId = draftOutgoing.hasOwnProperty('vsId') ? draftOutgoing.vsId : draftOutgoing;
            return $http
                .put(urlService.outgoings + '/' + vsId + '/remove')
                .then(function (result) {
                    return true;
                });
        };

        /**
         * @description Remove bulk draft outgoing mails.
         * @param draftOutgoings
         * @return {Promise|null}
         */
        self.removeBulkDraftOutgoings = function (draftOutgoings) {
            var bulkVsIds = draftOutgoings[0].hasOwnProperty('vsId') ? _.map(draftOutgoings, 'vsId') : draftOutgoings;
            return $http.put(urlService.outgoings + '/remove/bulk', bulkVsIds).then(function (result) {
                result = result.data.rs;
                var failedDraftOutgoings = [];
                _.map(result, function (value, key) {
                    if (!value)
                        failedDraftOutgoings.push(key);
                });
                return _.filter(draftOutgoings, function (draftOutgoing) {
                    return (failedDraftOutgoings.indexOf(draftOutgoing.vsId) > -1);
                });
            });
        };

        /**
         * @description Get draft outgoing mail by draftOutgoingId
         * @param draftOutgoingId
         * @returns {Outgoing|undefined} return Outgoing Model or undefined if not found.
         */
        self.getDraftOutgoingById = function (draftOutgoingId) {
            draftOutgoingId = draftOutgoingId instanceof Outgoing ? draftOutgoingId.id : draftOutgoingId;
            return _.find(self.draftOutgoings, function (draftOutgoing) {
                return Number(draftOutgoing.id) === Number(draftOutgoingId);
            });
        };

        /**
         * @description Activate draft outgoing mail
         * @param draftOutgoing
         */
        self.activateDraftOutgoing = function (draftOutgoing) {
            return $http
                .put((urlService.draftOutgoings + '/activate/' + draftOutgoing.id))
                .then(function () {
                    return draftOutgoing;
                });
        };

        /**
         * @description Deactivate draft outgoing mail
         * @param draftOutgoing
         */
        self.deactivateDraftOutgoing = function (draftOutgoing) {
            return $http
                .put((urlService.draftOutgoings + '/deactivate/' + draftOutgoing.id))
                .then(function () {
                    return draftOutgoing;
                });
        };

        /**
         * @description Activate bulk of draft outgoing mails
         * @param draftOutgoings
         */
        self.activateBulkDraftOutgoings = function (draftOutgoings) {
            var bulkIds = draftOutgoings[0].hasOwnProperty('id') ? _.map(draftOutgoings, 'id') : draftOutgoings;
            return $http
                .put((urlService.draftOutgoings + '/activate/bulk'), bulkIds)
                .then(function () {
                    return draftOutgoings;
                });
        };

        /**
         * @description Deactivate bulk of draft outgoing mails
         * @param draftOutgoings
         */
        self.deactivateBulkDraftOutgoings = function (draftOutgoings) {
            var bulkIds = draftOutgoings[0].hasOwnProperty('id') ? _.map(draftOutgoings, 'id') : draftOutgoings;
            return $http
                .put((urlService.draftOutgoings + '/deactivate/bulk'), bulkIds)
                .then(function () {
                    return draftOutgoings;
                });
        };

        /**
         * @description Send to review of draft outgoing mail
         * @param draftOutgoing
         */
        self.sendToReviewDraftOutgoing = function (draftOutgoing) {
            var vsId = draftOutgoing.hasOwnProperty('vsId') ? draftOutgoing.vsId : draftOutgoing;
            return $http
                .put(urlService.outgoings + '/' + vsId + '/send-to-review')
                .then(function () {
                    return draftOutgoing;
                });
        };

        /**
         * @description Send to review of bulk draft outgoing mail
         * @param draftOutgoings
         */
        self.bulkSendToReviewDraftOutgoing = function (draftOutgoings) {
            var bulkVsIds = draftOutgoings[0].hasOwnProperty('vsId') ? _.map(draftOutgoings, 'vsId') : draftOutgoings;
            return $http
                .put(urlService.outgoings + '/send-to-review/bulk', bulkVsIds)
                .then(function (result) {
                    result = result.data.rs;
                    var failedDraftOutgoings = [];
                    _.map(result, function (value, key) {
                        if (!value)
                            failedDraftOutgoings.push(key);
                    });
                    return _.filter(draftOutgoings, function (draftOutgoing) {
                        return (failedDraftOutgoings.indexOf(draftOutgoing.vsId) > -1);
                    });
                });
        };

        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param draftOutgoing
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicateDraftOutgoing = function (draftOutgoing, editMode) {
            var draftOutgoingsToFilter = self.draftOutgoings;
            if (editMode) {
                draftOutgoingsToFilter = _.filter(draftOutgoingsToFilter, function (draftOutgoingToFilter) {
                    return draftOutgoingToFilter.id !== draftOutgoing.id;
                });
            }
            return _.some(_.map(draftOutgoingsToFilter, function (existingDraftOutgoing) {
                return existingDraftOutgoing.arName === draftOutgoing.arName
                    || existingDraftOutgoing.enName.toLowerCase() === draftOutgoing.enName.toLowerCase();
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteDraftOutgoing, self.updateDraftOutgoing);
    });
};
