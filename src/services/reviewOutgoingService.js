module.exports = function (app) {
    app.service('reviewOutgoingService', function (urlService,
                                                   $http,
                                                   $q,
                                                   generator,
                                                   Outgoing,
                                                   _,
                                                   employeeService,
                                                   dialog,
                                                   langService,
                                                   toast,
                                                   cmsTemplate) {
        'ngInject';
        var self = this;
        self.serviceName = 'reviewOutgoingService';

        self.reviewOutgoings = [];

        /**
         * @description Load the review outgoing mails from server.
         * @returns {Promise|reviewOutgoings}
         */
        self.loadReviewOutgoings = function () {
            return $http.get(urlService.reviewOutgoings.change({id: employeeService.getEmployee().getOUID()})).then(function (result) {
                self.reviewOutgoings = generator.generateCollection(result.data.rs, Outgoing, self._sharedMethods);
                self.reviewOutgoings = generator.interceptReceivedCollection(['Correspondence', 'Outgoing'], self.reviewOutgoings);
                return self.reviewOutgoings;
            });
        };

        /**
         * @description Get review outgoing mails from self.reviewOutgoings if found and if not load it from server again.
         * @returns {Promise|reviewOutgoings}
         */
        self.getReviewOutgoings = function (organization) {
            organization = organization.hasOwnProperty('id') ? organization.id : organization;
            return self.reviewOutgoings.length ? $q.when(self.reviewOutgoings) : self.loadReviewOutgoings(organization);
        };

        /**
         * @description Contains methods for CRUD operations for review outgoing mails
         */
        self.controllerMethod = {
            /**
             * @description Opens popup to add new review outgoing mail
             * @param $event
             */
            reviewOutgoingAdd: function ($event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('review-outgoing'),
                        controller: 'reviewOutgoingPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: false,
                            reviewOutgoing: new Outgoing(
                                {
                                    itemOrder: generator.createNewID(self.reviewOutgoings, 'itemOrder')
                                }),
                            reviewOutgoings: self.reviewOutgoings
                        }
                    });
            },
            /**
             * @description Opens popup to edit review outgoing mail
             * @param reviewOutgoing
             * @param $event
             */
            reviewOutgoingEdit: function (reviewOutgoing, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('review-outgoing'),
                        controller: 'reviewOutgoingPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: true,
                            reviewOutgoing: reviewOutgoing,
                            reviewOutgoings: self.reviewOutgoings
                        }
                    });
            },
            /**
             * @description Show confirm box and remove review outgoing mail
             * @param reviewOutgoing
             * @param $event
             */
            reviewOutgoingRemove: function (reviewOutgoing, $event) {
                return dialog.confirmMessage(langService.get('confirm_remove').change({name: reviewOutgoing.getNames()}), null, null, $event)
                    .then(function () {
                        return self.removeReviewOutgoing(reviewOutgoing).then(function () {
                            toast.success(langService.get("remove_specific_success").change({name: reviewOutgoing.getNames()}));
                            return true;
                        })
                    });
            },
            /**
             * @description Show confirm box and remove bulk review outgoing mails
             * @param reviewOutgoings
             * @param $event
             */
            reviewOutgoingRemoveBulk: function (reviewOutgoings, $event) {
                return dialog
                    .confirmMessage(langService.get('confirm_remove_selected_multiple'), null, null, $event || null)
                    .then(function () {
                        return self.removeBulkReviewOutgoings(reviewOutgoings)
                            .then(function (result) {
                                var response = false;
                                if (result.length === reviewOutgoings.length) {
                                    toast.error(langService.get("failed_remove_selected"));
                                    response = false;
                                } else if (result.length) {
                                    generator.generateFailedBulkActionRecords('remove_success_except_following', _.map(result, function (reviewOutgoing) {
                                        return reviewOutgoing.getNames();
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
             * @description Reject Outgoing mail
             * @param reviewOutgoing
             * @param $event
             */
            reviewOutgoingReject: function (reviewOutgoing, $event) {
                return self.rejectOutgoing(reviewOutgoing)
                    .then(function (result) {
                        toast.success(langService.get("reject_specific_success").change({name: reviewOutgoing.getTranslatedName()}));
                        return true;
                    })
            },
            /**
             * @description Reject Bulk Outgoing mails
             * @param reviewOutgoings
             * @param $event
             */
            reviewOutgoingRejectBulk: function (reviewOutgoings, $event) {
                return self.rejectOutgoingBulk(reviewOutgoings)
                    .then(function (result) {
                        var response = false;
                        if (result.length === reviewOutgoings.length) {
                            toast.error(langService.get("failed_reject_selected"));
                            response = false;
                        } else if (result.length) {
                            generator.generateFailedBulkActionRecords('reject_success_except_following', _.map(result, function (reviewOutgoing) {
                                return reviewOutgoing.getNames();
                            }));
                            response = true;
                        } else {
                            toast.success(langService.get("reject_success"));
                            response = true;
                        }
                        return response;
                    })
            },
            /**
             * @description send review outgoing mail to review
             * @param reviewOutgoing
             * @param $event
             */
            reviewOutgoingAccept: function (reviewOutgoing, $event) {
                return self.acceptReviewOutgoing(reviewOutgoing).then(function () {
                    toast.success(langService.get("accept_specific_success").change({name: reviewOutgoing.getNames()}));
                    return true;
                })
            },
            /**
             * @description Accept bulk review outgoing mails
             * @param reviewOutgoings
             * @param $event
             */
            reviewOutgoingAcceptBulk: function (reviewOutgoings, $event) {
                return self.bulkAcceptReviewOutgoing(reviewOutgoings)
                    .then(function (result) {
                        var response = false;
                        if (result.length === reviewOutgoings.length) {
                            toast.error(langService.get("failed_accept_selected"));
                            response = false;
                        } else if (result.length) {
                            generator.generateFailedBulkActionRecords('accept_success_except_following', _.map(result, function (reviewOutgoing) {
                                return reviewOutgoing.getNames();
                            }));
                            response = true;
                        } else {
                            toast.success(langService.get("selected_accept_success"));
                            response = true;
                        }
                        return response;
                    });
            }
        };

        /**
         * @description Add new review outgoing mail
         * @param reviewOutgoing
         * @return {Promise|Outgoing}
         */
        self.addReviewOutgoing = function (reviewOutgoing) {
            return $http
                .post(urlService.reviewOutgoings,
                    generator.interceptSendInstance('Outgoing', reviewOutgoing))
                .then(function () {
                    return reviewOutgoing;
                });
        };

        /**
         * @description Update the given review outgoing mail.
         * @param reviewOutgoing
         * @return {Promise|Outgoing}
         */
        self.updateReviewOutgoing = function (reviewOutgoing) {
            return $http
                .put(urlService.reviewOutgoings,
                    generator.interceptSendInstance('Outgoing', reviewOutgoing))
                .then(function () {
                    return reviewOutgoing;
                });
        };

        /**
         * @description Remove given review outgoing mail.
         * @param reviewOutgoing
         * @return {Promise|null}
         */
        self.removeReviewOutgoing = function (reviewOutgoing) {
            var vsId = reviewOutgoing.hasOwnProperty('vsId') ? reviewOutgoing.vsId : reviewOutgoing;
            return $http
                .put(urlService.outgoings + '/' + vsId + '/remove')
                .then(function (result) {
                    return true;
                });
        };

        /**
         * @description Remove bulk review outgoing mails.
         * @param reviewOutgoings
         * @return {Promise|null}
         */
        self.removeBulkReviewOutgoings = function (reviewOutgoings) {
            var bulkVsIds = reviewOutgoings[0].hasOwnProperty('vsId') ? _.map(reviewOutgoings, 'vsId') : reviewOutgoings;
            return $http.put(urlService.outgoings + '/remove/bulk', bulkVsIds).then(function (result) {
                result = result.data.rs;
                var failedReviewOutgoings = [];
                _.map(result, function (value, key) {
                    if (!value)
                        failedReviewOutgoings.push(key);
                });
                return _.filter(reviewOutgoings, function (reviewOutgoing) {
                    return (failedReviewOutgoings.indexOf(reviewOutgoing.vsId) > -1);
                });
            });
        };

        /**
         * @description Get review outgoing mail by reviewOutgoingId
         * @param reviewOutgoingId
         * @returns {Outgoing|undefined} return Outgoing Model or undefined if not found.
         */
        self.getReviewOutgoingById = function (reviewOutgoingId) {
            reviewOutgoingId = reviewOutgoingId instanceof Outgoing ? reviewOutgoingId.id : reviewOutgoingId;
            return _.find(self.reviewOutgoings, function (reviewOutgoing) {
                return Number(reviewOutgoing.id) === Number(reviewOutgoingId);
            });
        };

        /**
         * @description Activate review outgoing mail
         * @param reviewOutgoing
         */
        self.activateReviewOutgoing = function (reviewOutgoing) {
            return $http
                .put((urlService.reviewOutgoings + '/activate/' + reviewOutgoing.id))
                .then(function () {
                    return reviewOutgoing;
                });
        };

        /**
         * @description Deactivate review outgoing mail
         * @param reviewOutgoing
         */
        self.deactivateReviewOutgoing = function (reviewOutgoing) {
            return $http
                .put((urlService.reviewOutgoings + '/deactivate/' + reviewOutgoing.id))
                .then(function () {
                    return reviewOutgoing;
                });
        };

        /**
         * @description Activate bulk of review outgoing mails
         * @param reviewOutgoings
         */
        self.activateBulkReviewOutgoings = function (reviewOutgoings) {
            var bulkIds = reviewOutgoings[0].hasOwnProperty('id') ? _.map(reviewOutgoings, 'id') : reviewOutgoings;
            return $http
                .put((urlService.reviewOutgoings + '/activate/bulk'), bulkIds)
                .then(function () {
                    return reviewOutgoings;
                });
        };

        /**
         * @description Deactivate bulk of review outgoing mails
         * @param reviewOutgoings
         */
        self.deactivateBulkReviewOutgoings = function (reviewOutgoings) {
            var bulkIds = reviewOutgoings[0].hasOwnProperty('id') ? _.map(reviewOutgoings, 'id') : reviewOutgoings;
            return $http
                .put((urlService.reviewOutgoings + '/deactivate/bulk'), bulkIds)
                .then(function () {
                    return reviewOutgoings;
                });
        };

        /**
         * @description Reject the outgoing mail
         * @param reviewOutgoing
         */
        self.rejectOutgoing = function (reviewOutgoing) {
            var vsId = reviewOutgoing.hasOwnProperty('vsId') ? reviewOutgoing.vsId : reviewOutgoing;
            return $http
                .put(urlService.outgoings + '/' + vsId + '/reject')
                .then(function () {
                    return reviewOutgoing;
                });
        };

        /**
         * @description Reject the bulk outgoing mails
         * @param reviewOutgoings
         */
        self.rejectOutgoingBulk = function (reviewOutgoings) {
            var vsIds = reviewOutgoings[0].hasOwnProperty('vsId') ? _.map(reviewOutgoings, 'vsId') : reviewOutgoings;
            return $http
                .put(urlService.outgoings + '/reject/bulk', vsIds)
                .then(function (result) {
                    result = result.data.rs;
                    var failedReviewOutgoings = [];
                    _.map(result, function (value, key) {
                        if (!value)
                            failedReviewOutgoings.push(key);
                    });
                    return _.filter(reviewOutgoings, function (reviewOutgoing) {
                        return (failedReviewOutgoings.indexOf(reviewOutgoing.id) > -1);
                    });
                });
        };

        /**
         * @description Accept of review outgoing mail
         * @param reviewOutgoing
         */
        self.acceptReviewOutgoing = function (reviewOutgoing) {
            var vsId = reviewOutgoing.hasOwnProperty('vsId') ? reviewOutgoing.vsId : reviewOutgoing;
            return $http
                .put(urlService.outgoings + '/' + vsId + '/ready-to-sent')
                .then(function () {
                    return reviewOutgoing;
                });
        };

        /**
         * @description Accept of bulk review outgoing mail
         * @param reviewOutgoings
         */
        self.bulkAcceptReviewOutgoing = function (reviewOutgoings) {
            var bulkVsIds = reviewOutgoings[0].hasOwnProperty('vsId') ? _.map(reviewOutgoings, 'vsId') : reviewOutgoings;
            return $http
                .put(urlService.outgoings + '/ready-to-sent/bulk', bulkVsIds)
                .then(function (result) {
                    result = result.data.rs;
                    var failedReviewOutgoings = [];
                    _.map(result, function (value, key) {
                        if (!value)
                            failedReviewOutgoings.push(key);
                    });
                    return _.filter(reviewOutgoings, function (reviewOutgoing) {
                        return (failedReviewOutgoings.indexOf(reviewOutgoing.vsId) > -1);
                    });
                });
        };

        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param reviewOutgoing
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicateReviewOutgoing = function (reviewOutgoing, editMode) {
            var reviewOutgoingsToFilter = self.reviewOutgoings;
            if (editMode) {
                reviewOutgoingsToFilter = _.filter(reviewOutgoingsToFilter, function (reviewOutgoingToFilter) {
                    return reviewOutgoingToFilter.id !== reviewOutgoing.id;
                });
            }
            return _.some(_.map(reviewOutgoingsToFilter, function (existingReviewOutgoing) {
                return existingReviewOutgoing.arName === reviewOutgoing.arName
                    || existingReviewOutgoing.enName.toLowerCase() === reviewOutgoing.enName.toLowerCase();
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteReviewOutgoing, self.updateReviewOutgoing);
    });
};
