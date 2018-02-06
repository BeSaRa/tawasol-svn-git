module.exports = function (app) {
    app.service('draftIncomingService', function (urlService,
                                                  $http,
                                                  $q,
                                                  generator,
                                                  Incoming,
                                                  _,
                                                  dialog,
                                                  langService,
                                                  toast,
                                                  cmsTemplate) {
        'ngInject';
        var self = this;
        self.serviceName = 'draftIncomingService';

        self.draftIncomings = [];

        /**
         * @description Load the draft incoming mails from server.
         * @param organization
         * @returns {Promise|Incomings}
         */
        self.loadDraftIncomings = function (organization) {
            var ou = organization.hasOwnProperty('id') ? organization.id : organization;
            return $http.get(urlService.incomings + '/ou/' + ou + '/draft').then(function (result) {
                self.draftIncomings = generator.generateCollection(result.data.rs, Incoming, self._sharedMethods);
                self.draftIncomings = generator.interceptReceivedCollection(['Correspondence', 'Incoming'], self.draftIncomings);
                return self.draftIncomings;
            });
        };

        /**
         * @description Get draft incoming mails from self.draftIncomings if found and if not load it from server again.
         * @param organization
         * @returns {Promise|Incomings}
         */
        self.getDraftIncomings = function (organization) {
            organization = organization.hasOwnProperty('id') ? organization.id : organization;
            return self.draftIncomings.length ? $q.when(self.draftIncomings) : self.loadDraftIncomings(organization);
        };

        /**
         * @description Contains methods for CRUD operations for draft incoming mails
         */
        self.controllerMethod = {
            /**
             * @description Show confirm box and remove draft incoming mail
             * @param draftIncoming
             * @param $event
             */
            draftIncomingRemove: function (draftIncoming, $event) {
                return dialog.confirmMessage(langService.get('confirm_remove').change({name: draftIncoming.getNames()}), null, null, $event)
                    .then(function () {
                        return self.removeDraftIncoming(draftIncoming).then(function () {
                            toast.success(langService.get("remove_specific_success").change({name: draftIncoming.getNames()}));
                            return true;
                        })
                    });
            },
            /**
             * @description Show confirm box and remove bulk draft incoming mails
             * @param draftIncomings
             * @param $event
             */
            draftIncomingRemoveBulk: function (draftIncomings, $event) {
                return dialog
                    .confirmMessage(langService.get('confirm_remove_selected_multiple'), null, null, $event || null)
                    .then(function () {
                        return self.removeBulkDraftIncomings(draftIncomings)
                            .then(function (result) {
                                var response = false;
                                if (result.length === draftIncomings.length) {
                                    toast.error(langService.get("failed_remove_selected"));
                                    response = false;
                                } else if (result.length) {
                                    generator.generateFailedBulkActionRecords('remove_success_except_following', _.map(result, function (draftIncoming) {
                                        return draftIncoming.getNames();
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
             * @description send draft incoming mail to review
             * @param draftIncoming
             * @param $event
             */
            draftIncomingSendToReview: function (draftIncoming, $event) {
                return self.sendToReviewDraftIncoming(draftIncoming).then(function () {
                    toast.success(langService.get("send_to_review_specific_success").change({name: draftIncoming.getNames()}));
                    return true;
                })
            },
            /**
             * @description send bulk draft incoming mails to review
             * @param draftIncomings
             * @param $event
             */
            draftIncomingSendToReviewBulk: function (draftIncomings, $event) {
                return self.bulkSendToReviewDraftIncoming(draftIncomings)
                    .then(function (result) {
                        var response = false;
                        if (result.length === draftIncomings.length) {
                            toast.error(langService.get("failed_send_to_review_selected"));
                            response = false;
                        } else if (result.length) {
                            generator.generateFailedBulkActionRecords('send_to_review_success_except_following', _.map(result, function (draftIncoming) {
                                return draftIncoming.getNames();
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
         * @description Remove given draft incoming mail.
         * @param draftIncoming
         * @return {Promise|null}
         */
        self.removeDraftIncoming = function (draftIncoming) {
            var vsId = draftIncoming.hasOwnProperty('vsId') ? draftIncoming.vsId : draftIncoming;
            return $http
                .put(urlService.incomings + '/' + vsId + '/remove')
                .then(function (result) {
                    return true;
                });
        };

        /**
         * @description Remove bulk draft incoming mails.
         * @param draftIncomings
         * @return {Promise|null}
         */
        self.removeBulkDraftIncomings = function (draftIncomings) {
            var bulkVsIds = draftIncomings[0].hasOwnProperty('vsId') ? _.map(draftIncomings, 'vsId') : draftIncomings;
            return $http.put(urlService.incomings + '/remove/bulk', bulkVsIds).then(function (result) {
                result = result.data.rs;
                var failedDraftIncomings = [];
                _.map(result, function (value, key) {
                    if (!value)
                        failedDraftIncomings.push(key);
                });
                return _.filter(draftIncomings, function (draftIncoming) {
                    return (failedDraftIncomings.indexOf(draftIncoming.vsId) > -1);
                });
            });
        };

        /**
         * @description Get draft incoming mail by draftIncomingId
         * @param draftIncomingId
         * @returns {Incoming|undefined} return Incoming Model or undefined if not found.
         */
        self.getDraftIncomingById = function (draftIncomingId) {
            draftIncomingId = draftIncomingId instanceof Incoming ? draftIncomingId.id : draftIncomingId;
            return _.find(self.draftIncomings, function (draftIncoming) {
                return Number(draftIncoming.id) === Number(draftIncomingId);
            });
        };

        /**
         * @description Activate draft incoming mail
         * @param draftIncoming
         */
        self.activateDraftIncoming = function (draftIncoming) {
            return $http
                .put((urlService.draftIncomings + '/activate/' + draftIncoming.id))
                .then(function () {
                    return draftIncoming;
                });
        };

        /**
         * @description Deactivate draft incoming mail
         * @param draftIncoming
         */
        self.deactivateDraftIncoming = function (draftIncoming) {
            return $http
                .put((urlService.draftIncomings + '/deactivate/' + draftIncoming.id))
                .then(function () {
                    return draftIncoming;
                });
        };

        /**
         * @description Activate bulk of draft incoming mails
         * @param draftIncomings
         */
        self.activateBulkDraftIncomings = function (draftIncomings) {
            var bulkIds = draftIncomings[0].hasOwnProperty('id') ? _.map(draftIncomings, 'id') : draftIncomings;
            return $http
                .put((urlService.draftIncomings + '/activate/bulk'), bulkIds)
                .then(function () {
                    return draftIncomings;
                });
        };

        /**
         * @description Deactivate bulk of draft incoming mails
         * @param draftIncomings
         */
        self.deactivateBulkDraftIncomings = function (draftIncomings) {
            var bulkIds = draftIncomings[0].hasOwnProperty('id') ? _.map(draftIncomings, 'id') : draftIncomings;
            return $http
                .put((urlService.draftIncomings + '/deactivate/bulk'), bulkIds)
                .then(function () {
                    return draftIncomings;
                });
        };

        /**
         * @description Send to review of draft incoming mail
         * @param draftIncoming
         */
        self.sendToReviewDraftIncoming = function (draftIncoming) {
            var vsId = draftIncoming.hasOwnProperty('vsId') ? draftIncoming.vsId : draftIncoming;
            return $http
                .put(urlService.incomings + '/' + vsId + '/send-to-review')
                .then(function () {
                    return draftIncoming;
                });
        };

        /**
         * @description Send to review of bulk draft incoming mail
         * @param draftIncomings
         */
        self.bulkSendToReviewDraftIncoming = function (draftIncomings) {
            var bulkVsIds = draftIncomings[0].hasOwnProperty('vsId') ? _.map(draftIncomings, 'vsId') : draftIncomings;
            return $http
                .put(urlService.incomings + '/send-to-review/bulk', bulkVsIds)
                .then(function (result) {
                    result = result.data.rs;
                    var failedDraftIncomings = [];
                    _.map(result, function (value, key) {
                        if (!value)
                            failedDraftIncomings.push(key);
                    });
                    return _.filter(draftIncomings, function (draftIncoming) {
                        return (failedDraftIncomings.indexOf(draftIncoming.vsId) > -1);
                    });
                });
        };

        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param draftIncoming
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicateDraftIncoming = function (draftIncoming, editMode) {
            var draftIncomingsToFilter = self.draftIncomings;
            if (editMode) {
                draftIncomingsToFilter = _.filter(draftIncomingsToFilter, function (draftIncomingToFilter) {
                    return draftIncomingToFilter.id !== draftIncoming.id;
                });
            }
            return _.some(_.map(draftIncomingsToFilter, function (existingDraftIncoming) {
                return existingDraftIncoming.arName === draftIncoming.arName
                    || existingDraftIncoming.enName.toLowerCase() === draftIncoming.enName.toLowerCase();
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteDraftIncoming, self.updateDraftIncoming);
    });
};
