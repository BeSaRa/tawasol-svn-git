module.exports = function (app) {
    app.service('rejectedOutgoingService', function (urlService,
                                                     $http,
                                                     $q,
                                                     generator,
                                                     employeeService,
                                                     Outgoing,
                                                     _,
                                                     dialog,
                                                     langService,
                                                     toast,
                                                     cmsTemplate,
                                                     listGeneratorService) {
        'ngInject';
        var self = this;
        self.serviceName = 'rejectedOutgoingService';

        self.rejectedOutgoings = [];

        /**
         * @description Load the rejected outgoing mails from server.
         * @returns {Promise|rejectedOutgoings}
         */
        self.loadRejectedOutgoings = function () {
            return $http.get(urlService.rejectedOutgoings.change({id: employeeService.getEmployee().getOUID()})).then(function (result) {
                self.rejectedOutgoings = generator.generateCollection(result.data.rs, Outgoing, self._sharedMethods);
                self.rejectedOutgoings = generator.interceptReceivedCollection(['Correspondence', 'Outgoing'], self.rejectedOutgoings);
                return self.rejectedOutgoings;
            });
        };

        /**
         * @description Get rejected outgoing mails from self.rejectedOutgoings if found and if not load it from server again.
         * @returns {Promise|rejectedOutgoings}
         */
        self.getRejectedOutgoings = function () {
            return self.rejectedOutgoings.length ? $q.when(self.rejectedOutgoings) : self.loadRejectedOutgoings();
        };

        /**
         * @description Contains methods for CRUD operations for rejected outgoing mails
         */
        self.controllerMethod = {
            /**
             * @description Opens popup to add new rejected outgoing mail
             * @param $event
             */
            rejectedOutgoingAdd: function ($event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('rejected-outgoing'),
                        controller: 'rejectedOutgoingPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: false,
                            rejectedOutgoing: new Outgoing(),
                            rejectedOutgoings: self.rejectedOutgoings
                        }
                    });
            },
            /**
             * @description Opens popup to edit rejected outgoing mail
             * @param rejectedOutgoing
             * @param $event
             */
            rejectedOutgoingEdit: function (rejectedOutgoing, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('rejected-outgoing'),
                        controller: 'rejectedOutgoingPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: true,
                            rejectedOutgoing: rejectedOutgoing,
                            rejectedOutgoings: self.rejectedOutgoings
                        }
                    });
            },
            /**
             * @description Show confirm box and remove rejected outgoing mail
             * @param rejectedOutgoing
             * @param $event
             */
            rejectedOutgoingRemove: function (rejectedOutgoing, $event) {
                return dialog.confirmMessage(langService.get('confirm_remove').change({name: rejectedOutgoing.getNames()}), null, null, $event)
                    .then(function () {
                        return self.removeRejectedOutgoing(rejectedOutgoing).then(function () {
                            toast.success(langService.get("remove_specific_success").change({name: rejectedOutgoing.getNames()}));
                            return true;
                        })
                    });
            },
            /**
             * @description Show confirm box and remove bulk rejected outgoing mails
             * @param rejectedOutgoings
             * @param $event
             */
            rejectedOutgoingRemoveBulk: function (rejectedOutgoings, $event) {
                return dialog
                    .confirmMessage(langService.get('confirm_remove_selected_multiple'), null, null, $event || null)
                    .then(function () {
                        return self.removeBulkRejectedOutgoings(rejectedOutgoings)
                            .then(function (result) {
                                var response = false;
                                if (result.length === rejectedOutgoings.length) {
                                    toast.error(langService.get("failed_remove_selected"));
                                    response = false;
                                } else if (result.length) {
                                    generator.generateFailedBulkActionRecords('remove_success_except_following', _.map(result, function (rejectedOutgoing) {
                                        return rejectedOutgoing.getNames();
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
             * @description send rejected outgoing mail to review
             * @param rejectedOutgoing
             * @param $event
             */
            rejectedOutgoingSendToReview: function (rejectedOutgoing, $event) {
                return self.sendToReviewRejectedOutgoing(rejectedOutgoing).then(function () {
                    toast.success(langService.get("send_to_review_specific_success").change({name: rejectedOutgoing.getNames()}));
                    return true;
                })
            },
            /**
             * @description send bulk rejected outgoing mails to review
             * @param rejectedOutgoings
             * @param $event
             */
            rejectedOutgoingSendToReviewBulk: function (rejectedOutgoings, $event) {
                return self.bulkSendToReviewRejectedOutgoing(rejectedOutgoings)
                    .then(function (result) {
                        var response = false;
                        if (result.length === rejectedOutgoings.length) {
                            toast.error(langService.get("failed_send_to_review_selected"));
                            response = false;
                        } else if (result.length) {
                            generator.generateFailedBulkActionRecords('send_to_review_success_except_following', _.map(result, function (rejectedOutgoing) {
                                return rejectedOutgoing.getNames();
                            }));
                            response = true;
                        } else {
                            toast.success(langService.get("selected_send_to_review_success"));
                            response = true;
                        }
                        return response;
                    });
            },
            /**
             * @description Archive the rejected outgoing mail
             * @param rejectedOutgoing
             * @param $event
             */
            rejectedOutgoingArchive: function (rejectedOutgoing, $event) {
                return self.archiveRejectedOutgoing(rejectedOutgoing)
                    .then(function () {
                        toast.success(langService.get("archive_specific_success").change({name: rejectedOutgoing.getTranslatedName()}));
                        return true;
                    });
            },
            /**
             * @description Archive bulk rejected outgoing mails
             * @param rejectedOutgoings
             * @param $event
             */
            rejectedOutgoingArchiveBulk: function (rejectedOutgoings, $event) {
                return self.archiveBulkRejectedOutgoing(rejectedOutgoings)
                    .then(function (result) {
                        var response = false;
                        if (result.length === rejectedOutgoings.length) {
                            toast.error(langService.get("failed_archive_selected"));
                            response = false;
                        } else if (result.length) {
                            generator.generateFailedBulkActionRecords('archive_success_except_following', _.map(result, function (rejectedOutgoing) {
                                return rejectedOutgoing.getNames();
                            }));
                            response = true;
                        } else {
                            toast.success(langService.get("archive_success"));
                            response = true;
                        }
                        return response;
                    });
            }
        };

        /**
         * @description Add new rejected outgoing mail
         * @param rejectedOutgoing
         * @return {Promise|Outgoing}
         */
        self.addRejectedOutgoing = function (rejectedOutgoing) {
            return $http
                .post(urlService.rejectedOutgoings,
                    generator.interceptSendInstance('Outgoing', rejectedOutgoing))
                .then(function () {
                    return rejectedOutgoing;
                });
        };

        /**
         * @description Update the given rejected outgoing mail.
         * @param rejectedOutgoing
         * @return {Promise|Outgoing}
         */
        self.updateRejectedOutgoing = function (rejectedOutgoing) {
            return $http
                .put(urlService.rejectedOutgoings,
                    generator.interceptSendInstance('Outgoing', rejectedOutgoing))
                .then(function () {
                    return rejectedOutgoing;
                });
        };

        /**
         * @description Get rejected outgoing mail by rejectedOutgoingId
         * @param rejectedOutgoingId
         * @returns {Outgoing|undefined} return Outgoing Model or undefined if not found.
         */
        self.getRejectedOutgoingById = function (rejectedOutgoingId) {
            rejectedOutgoingId = rejectedOutgoingId instanceof Outgoing ? rejectedOutgoingId.id : rejectedOutgoingId;
            return _.find(self.rejectedOutgoings, function (rejectedOutgoing) {
                return Number(rejectedOutgoing.id) === Number(rejectedOutgoingId);
            });
        };

        /**
         * @description Activate rejected outgoing mail
         * @param rejectedOutgoing
         */
        self.activateRejectedOutgoing = function (rejectedOutgoing) {
            return $http
                .put((urlService.rejectedOutgoings + '/activate/' + rejectedOutgoing.id))
                .then(function () {
                    return rejectedOutgoing;
                });
        };

        /**
         * @description Deactivate rejected outgoing mail
         * @param rejectedOutgoing
         */
        self.deactivateRejectedOutgoing = function (rejectedOutgoing) {
            return $http
                .put((urlService.rejectedOutgoings + '/deactivate/' + rejectedOutgoing.id))
                .then(function () {
                    return rejectedOutgoing;
                });
        };

        /**
         * @description Activate bulk of rejected outgoing mails
         * @param rejectedOutgoings
         */
        self.activateBulkRejectedOutgoings = function (rejectedOutgoings) {
            var bulkIds = rejectedOutgoings[0].hasOwnProperty('id') ? _.map(rejectedOutgoings, 'id') : rejectedOutgoings;
            return $http
                .put((urlService.rejectedOutgoings + '/activate/bulk'), bulkIds)
                .then(function () {
                    return rejectedOutgoings;
                });
        };

        /**
         * @description Deactivate bulk of rejected outgoing mails
         * @param rejectedOutgoings
         */
        self.deactivateBulkRejectedOutgoings = function (rejectedOutgoings) {
            var bulkIds = rejectedOutgoings[0].hasOwnProperty('id') ? _.map(rejectedOutgoings, 'id') : rejectedOutgoings;
            return $http
                .put((urlService.rejectedOutgoings + '/deactivate/bulk'), bulkIds)
                .then(function () {
                    return rejectedOutgoings;
                });
        };


        /**
         * @description Remove given rejected outgoing mail.
         * @param rejectedOutgoing
         * @return {Promise|null}
         */
        self.removeRejectedOutgoing = function (rejectedOutgoing) {
            var vsId = rejectedOutgoing.hasOwnProperty('vsId') ? rejectedOutgoing.vsId : rejectedOutgoing;
            return $http
                .put(urlService.outgoings + '/' + vsId + '/remove')
                .then(function (result) {
                    return true;
                });
        };

        /**
         * @description Remove bulk rejected outgoing mails.
         * @param rejectedOutgoings
         * @return {Promise|null}
         */
        self.removeBulkRejectedOutgoings = function (rejectedOutgoings) {
            var bulkVsIds = rejectedOutgoings[0].hasOwnProperty('vsId') ? _.map(rejectedOutgoings, 'vsId') : rejectedOutgoings;
            return $http.put(urlService.outgoings + '/remove/bulk', bulkVsIds).then(function (result) {
                result = result.data.rs;
                var failedRejectedOutgoings = [];
                _.map(result, function (value, key) {
                    if (!value)
                        failedRejectedOutgoings.push(key);
                });
                return _.filter(rejectedOutgoings, function (rejectedOutgoing) {
                    return (failedRejectedOutgoings.indexOf(rejectedOutgoing.vsId) > -1);
                });
            });
        };

        /**
         * @description Send to review of rejected outgoing mail
         * @param rejectedOutgoing
         */
        self.sendToReviewRejectedOutgoing = function (rejectedOutgoing) {
            var vsId = rejectedOutgoing.hasOwnProperty('vsId') ? rejectedOutgoing.vsId : rejectedOutgoing;
            return $http
                .put(urlService.outgoings + '/' + vsId + '/send-to-review')
                .then(function () {
                    return rejectedOutgoing;
                });
        };

        /**
         * @description Send to review of bulk rejected outgoing mail
         * @param rejectedOutgoings
         */
        self.bulkSendToReviewRejectedOutgoing = function (rejectedOutgoings) {
            var bulkVsIds = rejectedOutgoings[0].hasOwnProperty('vsId') ? _.map(rejectedOutgoings, 'vsId') : rejectedOutgoings;
            return $http
                .put(urlService.outgoings + '/send-to-review/bulk', bulkVsIds)
                .then(function (result) {
                    result = result.data.rs;
                    var failedRejectedOutgoings = [];
                    _.map(result, function (value, key) {
                        if (!value)
                            failedRejectedOutgoings.push(key);
                    });
                    return _.filter(rejectedOutgoings, function (rejectedOutgoing) {
                        return (failedRejectedOutgoings.indexOf(rejectedOutgoing.vsId) > -1);
                    });
                });
        };

        /**
         * @description Archive the rejected outgoing mail
         * @param rejectedOutgoing
         */
        self.archiveRejectedOutgoing = function (rejectedOutgoing) {
            var vsId = rejectedOutgoing.hasOwnProperty('vsId') ? rejectedOutgoing.vsId : rejectedOutgoing;
            return $http
                .put(urlService.outgoings + '/' + vsId + '/archive')
                .then(function () {
                    return rejectedOutgoing;
                });
        };

        /**
         * @description Archive the bulk rejected outgoing mail
         * @param rejectedOutgoings
         */
        self.archiveBulkRejectedOutgoing = function (rejectedOutgoings) {
            var vsIds = rejectedOutgoings[0].hasOwnProperty('vsId') ? _.map(rejectedOutgoings, 'vsId') : rejectedOutgoings;
            return $http
                .put((urlService.outgoings + '/archive/bulk'), vsIds)
                .then(function (result) {
                    result = result.data.rs;
                    var failedRejectedOutgoings = [];
                    _.map(result, function (value, key) {
                        if (!value)
                            failedRejectedOutgoings.push(key);
                    });
                    return _.filter(rejectedOutgoings, function (rejectedOutgoing) {
                        return (failedRejectedOutgoings.indexOf(rejectedOutgoing.vsId) > -1);
                    });
                });
        };

        /**
         * @description Send to review of rejected outgoing mail
         * @param rejectedOutgoing
         */
        self.sendToReviewRejectedOutgoing = function (rejectedOutgoing) {
            var vsId = rejectedOutgoing.hasOwnProperty('vsId') ? rejectedOutgoing.vsId : rejectedOutgoing;
            return $http
                .put(urlService.outgoings + '/' + vsId + '/send-to-review')
                .then(function () {
                    return rejectedOutgoing;
                });
        };

        /**
         * @description Send to review of bulk draft outgoing mail
         * @param rejectedOutgoings
         */
        self.bulkSendToReviewRejectedOutgoing = function (rejectedOutgoings) {
            var bulkVsIds = rejectedOutgoings[0].hasOwnProperty('vsId') ? _.map(rejectedOutgoings, 'vsId') : rejectedOutgoings;
            return $http
                .put(urlService.outgoings + '/send-to-review/bulk', bulkVsIds)
                .then(function (result) {
                    result = result.data.rs;
                    var failedRejectedOutgoings = [];
                    _.map(result, function (value, key) {
                        if (!value)
                            failedRejectedOutgoings.push(key);
                    });
                    return _.filter(rejectedOutgoings, function (rejectedOutgoing) {
                        return (failedRejectedOutgoings.indexOf(rejectedOutgoing.vsId) > -1);
                    });
                });
        };

        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param rejectedOutgoing
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicateRejectedOutgoing = function (rejectedOutgoing, editMode) {
            var rejectedOutgoingsToFilter = self.rejectedOutgoings;
            if (editMode) {
                rejectedOutgoingsToFilter = _.filter(rejectedOutgoingsToFilter, function (rejectedOutgoingToFilter) {
                    return rejectedOutgoingToFilter.id !== rejectedOutgoing.id;
                });
            }
            return _.some(_.map(rejectedOutgoingsToFilter, function (existingRejectedOutgoing) {
                return existingRejectedOutgoing.arName === rejectedOutgoing.arName
                    || existingRejectedOutgoing.enName.toLowerCase() === rejectedOutgoing.enName.toLowerCase();
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteRejectedOutgoing, self.updateRejectedOutgoing);
    });
};
