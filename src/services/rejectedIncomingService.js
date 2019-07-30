module.exports = function (app) {
    app.service('rejectedIncomingService', function (urlService,
                                                     $http,
                                                     $q,
                                                     generator,
                                                     Incoming,
                                                     employeeService,
                                                     _,
                                                     dialog,
                                                     langService,
                                                     toast,
                                                     cmsTemplate,
                                                     listGeneratorService) {
        'ngInject';
        var self = this;
        self.serviceName = 'rejectedIncomingService';

        self.rejectedIncomings = [];

        /**
         * @description Load the rejected incoming mails from server.
         * @returns {Promise|rejectedIncoming}
         */
        self.loadRejectedIncomings = function () {
            return $http.get(urlService.incomings + '/ou/' + employeeService.getEmployee().getOUID() + '/rejected').then(function (result) {
                self.rejectedIncomings = generator.generateCollection(result.data.rs, Incoming, self._sharedMethods);
                self.rejectedIncomings = generator.interceptReceivedCollection(['Correspondence', 'Incoming'], self.rejectedIncomings);
                return self.rejectedIncomings;
            });
        };

        /**
         * @description Get rejected incoming mails from self.rejectedIncomings if found and if not load it from server again.
         * @returns {Promise|rejectedIncoming}
         */
        self.getRejectedIncomings = function () {
            return self.rejectedIncomings.length ? $q.when(self.rejectedIncomings) : self.loadRejectedIncomings();
        };

        /**
         * @description Contains methods for CRUD operations for rejected incoming mails
         */
        self.controllerMethod = {
            /**
             * @description Opens popup to add new rejected incoming mail
             * @param $event
             */
            rejectedIncomingAdd: function ($event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('rejected-incoming'),
                        controller: 'rejectedIncomingPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: false,
                            rejectedIncoming: new Incoming(),
                            rejectedIncomings: self.rejectedIncomings
                        }
                    });
            },
            /**
             * @description Opens popup to edit rejected incoming mail
             * @param rejectedIncoming
             * @param $event
             */
            rejectedIncomingEdit: function (rejectedIncoming, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('rejected-incoming'),
                        controller: 'rejectedIncomingPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: true,
                            rejectedIncoming: rejectedIncoming,
                            rejectedIncomings: self.rejectedIncomings
                        }
                    });
            },
            /**
             * @description Show confirm box and remove rejected incoming mail
             * @param rejectedIncoming
             * @param $event
             */
            rejectedIncomingRemove: function (rejectedIncoming, $event) {
                return dialog.confirmMessage(langService.get('confirm_remove').change({name: rejectedIncoming.getNames()}), null, null, $event)
                    .then(function () {
                        return self.removeRejectedIncoming(rejectedIncoming).then(function () {
                            toast.success(langService.get("remove_specific_success").change({name: rejectedIncoming.getNames()}));
                            return true;
                        })
                    });
            },
            /**
             * @description Show confirm box and remove bulk rejected incoming mails
             * @param rejectedIncomings
             * @param $event
             */
            rejectedIncomingRemoveBulk: function (rejectedIncomings, $event) {
                return dialog
                    .confirmMessage(langService.get('confirm_remove_selected_multiple'), null, null, $event || null)
                    .then(function () {
                        return self.removeBulkRejectedIncomings(rejectedIncomings)
                            .then(function (result) {
                                var response = false;
                                if (result.length === rejectedIncomings.length) {
                                    toast.error(langService.get("failed_remove_selected"));
                                    response = false;
                                } else if (result.length) {
                                    generator.generateFailedBulkActionRecords('remove_success_except_following', _.map(result, function (rejectedIncoming) {
                                        return rejectedIncoming.getNames();
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
             * @description send rejected incoming mail to review
             * @param rejectedIncoming
             * @param $event
             */
            rejectedIncomingSendToReview: function (rejectedIncoming, $event) {
                return self.sendToReviewRejectedIncoming(rejectedIncoming).then(function () {
                    toast.success(langService.get("send_to_review_specific_success").change({name: rejectedIncoming.getNames()}));
                    return true;
                })
            },
            /**
             * @description send bulk rejected incoming mails to review
             * @param rejectedIncomings
             * @param $event
             */
            rejectedIncomingSendToReviewBulk: function (rejectedIncomings, $event) {
                return self.bulkSendToReviewRejectedIncoming(rejectedIncomings)
                    .then(function (result) {
                        var response = false;
                        if (result.length === rejectedIncomings.length) {
                            toast.error(langService.get("failed_send_to_review_selected"));
                            response = false;
                        } else if (result.length) {
                            generator.generateFailedBulkActionRecords('send_to_review_success_except_following', _.map(result, function (rejectedIncoming) {
                                return rejectedIncoming.getNames();
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
         * @description Add new rejected incoming mail
         * @param rejectedIncoming
         * @return {Promise|Incoming}
         */
        self.addRejectedIncoming = function (rejectedIncoming) {
            return $http
                .post(urlService.rejectedIncomings,
                    generator.interceptSendInstance('Incoming', rejectedIncoming))
                .then(function () {
                    return rejectedIncoming;
                });
        };

        /**
         * @description Update the given rejected incoming mail.
         * @param rejectedIncoming
         * @return {Promise|Incoming}
         */
        self.updateRejectedIncoming = function (rejectedIncoming) {
            return $http
                .put(urlService.rejectedIncomings,
                    generator.interceptSendInstance('Incoming', rejectedIncoming))
                .then(function () {
                    return rejectedIncoming;
                });
        };

        /**
         * @description Get rejected incoming mail by rejectedIncomingId
         * @param rejectedIncomingId
         * @returns {Incoming|undefined} return Incoming Model or undefined if not found.
         */
        self.getRejectedIncomingById = function (rejectedIncomingId) {
            rejectedIncomingId = rejectedIncomingId instanceof Incoming ? rejectedIncomingId.id : rejectedIncomingId;
            return _.find(self.rejectedIncomings, function (rejectedIncoming) {
                return Number(rejectedIncoming.id) === Number(rejectedIncomingId);
            });
        };

        /**
         * @description Activate rejected incoming mail
         * @param rejectedIncoming
         */
        self.activateRejectedIncoming = function (rejectedIncoming) {
            return $http
                .put((urlService.rejectedIncomings + '/activate/' + rejectedIncoming.id))
                .then(function () {
                    return rejectedIncoming;
                });
        };

        /**
         * @description Deactivate rejected incoming mail
         * @param rejectedIncoming
         */
        self.deactivateRejectedIncoming = function (rejectedIncoming) {
            return $http
                .put((urlService.rejectedIncomings + '/deactivate/' + rejectedIncoming.id))
                .then(function () {
                    return rejectedIncoming;
                });
        };

        /**
         * @description Activate bulk of rejected incoming mails
         * @param rejectedIncomings
         */
        self.activateBulkRejectedIncomings = function (rejectedIncomings) {
            var bulkIds = rejectedIncomings[0].hasOwnProperty('id') ? _.map(rejectedIncomings, 'id') : rejectedIncomings;
            return $http
                .put((urlService.rejectedIncomings + '/activate/bulk'), bulkIds)
                .then(function () {
                    return rejectedIncomings;
                });
        };

        /**
         * @description Deactivate bulk of rejected incoming mails
         * @param rejectedIncomings
         */
        self.deactivateBulkRejectedIncomings = function (rejectedIncomings) {
            var bulkIds = rejectedIncomings[0].hasOwnProperty('id') ? _.map(rejectedIncomings, 'id') : rejectedIncomings;
            return $http
                .put((urlService.rejectedIncomings + '/deactivate/bulk'), bulkIds)
                .then(function () {
                    return rejectedIncomings;
                });
        };


        /**
         * @description Remove given rejected incoming mail.
         * @param rejectedIncoming
         * @return {Promise|null}
         */
        self.removeRejectedIncoming = function (rejectedIncoming) {
            var vsId = rejectedIncoming.hasOwnProperty('vsId') ? rejectedIncoming.vsId : rejectedIncoming;
            return $http
                .put(urlService.incomings + '/' + vsId + '/remove')
                .then(function (result) {
                    return true;
                });
        };

        /**
         * @description Remove bulk rejected incoming mails.
         * @param rejectedIncomings
         * @return {Promise|null}
         */
        self.removeBulkRejectedIncomings = function (rejectedIncomings) {
            var bulkVsIds = rejectedIncomings[0].hasOwnProperty('vsId') ? _.map(rejectedIncomings, 'vsId') : rejectedIncomings;
            return $http.put(urlService.incomings + '/remove/bulk', bulkVsIds).then(function (result) {
                result = result.data.rs;
                var failedRejectedIncomings = [];
                _.map(result, function (value, key) {
                    if (!value)
                        failedRejectedIncomings.push(key);
                });
                return _.filter(rejectedIncomings, function (rejectedIncoming) {
                    return (failedRejectedIncomings.indexOf(rejectedIncoming.vsId) > -1);
                });
            });
        };

        /**
         * @description Send to review of rejected incoming mail
         * @param rejectedIncoming
         */
        self.sendToReviewRejectedIncoming = function (rejectedIncoming) {
            var vsId = rejectedIncoming.hasOwnProperty('vsId') ? rejectedIncoming.vsId : rejectedIncoming;
            return $http
                .put(urlService.incomings + '/' + vsId + '/send-to-review')
                .then(function () {
                    return rejectedIncoming;
                });
        };

        /**
         * @description Send to review of bulk rejected incoming mail
         * @param rejectedIncomings
         */
        self.bulkSendToReviewRejectedIncoming = function (rejectedIncomings) {
            var bulkVsIds = rejectedIncomings[0].hasOwnProperty('vsId') ? _.map(rejectedIncomings, 'vsId') : rejectedIncomings;
            return $http
                .put(urlService.incomings + '/send-to-review/bulk', bulkVsIds)
                .then(function (result) {
                    result = result.data.rs;
                    var failedRejectedIncomings = [];
                    _.map(result, function (value, key) {
                        if (!value)
                            failedRejectedIncomings.push(key);
                    });
                    return _.filter(rejectedIncomings, function (rejectedIncoming) {
                        return (failedRejectedIncomings.indexOf(rejectedIncoming.vsId) > -1);
                    });
                });
        };

        /**
         * @description Send to review of rejected incoming mail
         * @param rejectedIncoming
         */
        self.sendToReviewRejectedIncoming = function (rejectedIncoming) {
            var vsId = rejectedIncoming.hasOwnProperty('vsId') ? rejectedIncoming.vsId : rejectedIncoming;
            return $http
                .put(urlService.incomings + '/' + vsId + '/send-to-review')
                .then(function () {
                    return rejectedIncoming;
                });
        };

        /**
         * @description Send to review of bulk draft incoming mail
         * @param rejectedIncomings
         */
        self.bulkSendToReviewRejectedIncoming = function (rejectedIncomings) {
            var bulkVsIds = rejectedIncomings[0].hasOwnProperty('vsId') ? _.map(rejectedIncomings, 'vsId') : rejectedIncomings;
            return $http
                .put(urlService.incomings + '/send-to-review/bulk', bulkVsIds)
                .then(function (result) {
                    result = result.data.rs;
                    var failedRejectedIncomings = [];
                    _.map(result, function (value, key) {
                        if (!value)
                            failedRejectedIncomings.push(key);
                    });
                    return _.filter(rejectedIncomings, function (rejectedIncoming) {
                        return (failedRejectedIncomings.indexOf(rejectedIncoming.vsId) > -1);
                    });
                });
        };

        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param rejectedIncoming
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicateRejectedIncoming = function (rejectedIncoming, editMode) {
            var rejectedIncomingsToFilter = self.rejectedIncomings;
            if (editMode) {
                rejectedIncomingsToFilter = _.filter(rejectedIncomingsToFilter, function (rejectedIncomingToFilter) {
                    return rejectedIncomingToFilter.id !== rejectedIncoming.id;
                });
            }
            return _.some(_.map(rejectedIncomingsToFilter, function (existingRejectedIncoming) {
                return existingRejectedIncoming.arName === rejectedIncoming.arName
                    || existingRejectedIncoming.enName.toLowerCase() === rejectedIncoming.enName.toLowerCase();
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteRejectedIncoming, self.updateRejectedIncoming);
    });
};
