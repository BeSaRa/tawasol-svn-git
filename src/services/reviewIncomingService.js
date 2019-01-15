module.exports = function (app) {
    app.service('reviewIncomingService', function (urlService,
                                                   $http,
                                                   $q,
                                                   generator,
                                                   Incoming,
                                                   _,
                                                   dialog,
                                                   employeeService,
                                                   langService,
                                                   toast,
                                                   cmsTemplate) {
        'ngInject';
        var self = this;
        self.serviceName = 'reviewIncomingService';

        self.reviewIncomings = [];

        /**
         * @description Load the review incoming mails from server.
         * @returns {Promise|reviewIncomings}
         */
        self.loadReviewIncomings = function () {
            return $http.get(urlService.incomings + '/ou/' + employeeService.getEmployee().getOUID() + '/review').then(function (result) {
                self.reviewIncomings = generator.generateCollection(result.data.rs, Incoming, self._sharedMethods);
                self.reviewIncomings = generator.interceptReceivedCollection(['Correspondence', 'Incoming'], self.reviewIncomings);
                return self.reviewIncomings;
            });
        };

        /**
         * @description Get review incoming mails from self.reviewIncomings if found and if not load it from server again.
         * @returns {Promise|reviewIncomings}
         */
        self.getReviewIncomings = function () {
            return self.reviewIncomings.length ? $q.when(self.reviewIncomings) : self.loadReviewIncomings();
        };

        /**
         * @description Contains methods for CRUD operations for review incoming mails
         */
        self.controllerMethod = {
            /**
             * @description Opens popup to add new review incoming mail
             * @param $event
             */
            reviewIncomingAdd: function ($event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('review-incoming'),
                        controller: 'reviewIncomingPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: false,
                            reviewIncoming: new Incoming(
                                {
                                    itemOrder: generator.createNewID(self.reviewIncomings, 'itemOrder')
                                }),
                            reviewIncomings: self.reviewIncomings
                        }
                    });
            },
            /**
             * @description Opens popup to edit review incoming mail
             * @param reviewIncoming
             * @param $event
             */
            reviewIncomingEdit: function (reviewIncoming, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('review-incoming'),
                        controller: 'reviewIncomingPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: true,
                            reviewIncoming: reviewIncoming,
                            reviewIncomings: self.reviewIncomings
                        }
                    });
            },
            /**
             * @description Show confirm box and remove review incoming mail
             * @param reviewIncoming
             * @param $event
             */
            reviewIncomingRemove: function (reviewIncoming, $event) {
                return dialog.confirmMessage(langService.get('confirm_remove').change({name: reviewIncoming.getNames()}), null, null, $event)
                    .then(function () {
                        return self.removeReviewIncoming(reviewIncoming).then(function () {
                            toast.success(langService.get("remove_specific_success").change({name: reviewIncoming.getNames()}));
                            return true;
                        })
                    });
            },
            /**
             * @description Show confirm box and remove bulk review incoming mails
             * @param reviewIncomings
             * @param $event
             */
            reviewIncomingRemoveBulk: function (reviewIncomings, $event) {
                return dialog
                    .confirmMessage(langService.get('confirm_remove_selected_multiple'), null, null, $event || null)
                    .then(function () {
                        return self.removeBulkReviewIncomings(reviewIncomings)
                            .then(function (result) {
                                var response = false;
                                if (result.length === reviewIncomings.length) {
                                    toast.error(langService.get("failed_remove_selected"));
                                    response = false;
                                } else if (result.length) {
                                    generator.generateFailedBulkActionRecords('remove_success_except_following', _.map(result, function (reviewIncoming) {
                                        return reviewIncoming.getNames();
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
             * @description Reject Incoming mail
             * @param reviewIncoming
             * @param $event
             */
            reviewIncomingReject: function (reviewIncoming, $event) {
                return self.rejectIncoming(reviewIncoming)
                    .then(function (result) {
                        toast.success(langService.get("reject_specific_success").change({name: reviewIncoming.getTranslatedName()}));
                        return true;
                    })
            },
            /**
             * @description Reject Bulk Incoming mails
             * @param reviewIncomings
             * @param $event
             */
            reviewIncomingRejectBulk: function (reviewIncomings, $event) {
                return self.rejectIncomingBulk(reviewIncomings)
                    .then(function (result) {
                        var response = false;
                        if (result.length === reviewIncomings.length) {
                            toast.error(langService.get("failed_reject_selected"));
                            response = false;
                        } else if (result.length) {
                            generator.generateFailedBulkActionRecords('reject_success_except_following', _.map(result, function (reviewIncoming) {
                                return reviewIncoming.getNames();
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
             * @description send review incoming mail to review
             * @param reviewIncoming
             * @param $event
             */
            reviewIncomingAccept: function (reviewIncoming, $event) {
                return self.acceptReviewIncoming(reviewIncoming).then(function () {
                    toast.success(langService.get("accept_specific_success").change({name: reviewIncoming.getNames()}));
                    return true;
                })
            },
            /**
             * @description Accept bulk review incoming mails
             * @param reviewIncomings
             * @param $event
             */
            reviewIncomingAcceptBulk: function (reviewIncomings, $event) {
                return self.bulkAcceptReviewIncoming(reviewIncomings)
                    .then(function (result) {
                        var response = false;
                        if (result.length === reviewIncomings.length) {
                            toast.error(langService.get("failed_accept_selected"));
                            response = false;
                        } else if (result.length) {
                            generator.generateFailedBulkActionRecords('accept_success_except_following', _.map(result, function (reviewIncoming) {
                                return reviewIncoming.getNames();
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
         * @description Add new review incoming mail
         * @param reviewIncoming
         * @return {Promise|Incoming}
         */
        self.addReviewIncoming = function (reviewIncoming) {
            return $http
                .post(urlService.reviewIncomings,
                    generator.interceptSendInstance('Incoming', reviewIncoming))
                .then(function () {
                    return reviewIncoming;
                });
        };

        /**
         * @description Update the given review incoming mail.
         * @param reviewIncoming
         * @return {Promise|Incoming}
         */
        self.updateReviewIncoming = function (reviewIncoming) {
            return $http
                .put(urlService.reviewIncomings,
                    generator.interceptSendInstance('Incoming', reviewIncoming))
                .then(function () {
                    return reviewIncoming;
                });
        };

        /**
         * @description Remove given review incoming mail.
         * @param reviewIncoming
         * @return {Promise|null}
         */
        self.removeReviewIncoming = function (reviewIncoming) {
            var vsId = reviewIncoming.hasOwnProperty('vsId') ? reviewIncoming.vsId : reviewIncoming;
            return $http
                .put(urlService.incomings + '/' + vsId + '/remove')
                .then(function (result) {
                    return true;
                });
        };

        /**
         * @description Remove bulk review incoming mails.
         * @param reviewIncomings
         * @return {Promise|null}
         */
        self.removeBulkReviewIncomings = function (reviewIncomings) {
            var bulkVsIds = reviewIncomings[0].hasOwnProperty('vsId') ? _.map(reviewIncomings, 'vsId') : reviewIncomings;
            return $http.put(urlService.incomings + '/remove/bulk', bulkVsIds).then(function (result) {
                result = result.data.rs;
                var failedReviewIncomings = [];
                _.map(result, function (value, key) {
                    if (!value)
                        failedReviewIncomings.push(key);
                });
                return _.filter(reviewIncomings, function (reviewIncoming) {
                    return (failedReviewIncomings.indexOf(reviewIncoming.vsId) > -1);
                });
            });
        };

        /**
         * @description Get review incoming mail by reviewIncomingId
         * @param reviewIncomingId
         * @returns {Incoming|undefined} return Incoming Model or undefined if not found.
         */
        self.getReviewIncomingById = function (reviewIncomingId) {
            reviewIncomingId = reviewIncomingId instanceof Incoming ? reviewIncomingId.id : reviewIncomingId;
            return _.find(self.reviewIncomings, function (reviewIncoming) {
                return Number(reviewIncoming.id) === Number(reviewIncomingId);
            });
        };

        /**
         * @description Activate review incoming mail
         * @param reviewIncoming
         */
        self.activateReviewIncoming = function (reviewIncoming) {
            return $http
                .put((urlService.reviewIncomings + '/activate/' + reviewIncoming.id))
                .then(function () {
                    return reviewIncoming;
                });
        };

        /**
         * @description Deactivate review incoming mail
         * @param reviewIncoming
         */
        self.deactivateReviewIncoming = function (reviewIncoming) {
            return $http
                .put((urlService.reviewIncomings + '/deactivate/' + reviewIncoming.id))
                .then(function () {
                    return reviewIncoming;
                });
        };

        /**
         * @description Activate bulk of review incoming mails
         * @param reviewIncomings
         */
        self.activateBulkReviewIncomings = function (reviewIncomings) {
            var bulkIds = reviewIncomings[0].hasOwnProperty('id') ? _.map(reviewIncomings, 'id') : reviewIncomings;
            return $http
                .put((urlService.reviewIncomings + '/activate/bulk'), bulkIds)
                .then(function () {
                    return reviewIncomings;
                });
        };

        /**
         * @description Deactivate bulk of review incoming mails
         * @param reviewIncomings
         */
        self.deactivateBulkReviewIncomings = function (reviewIncomings) {
            var bulkIds = reviewIncomings[0].hasOwnProperty('id') ? _.map(reviewIncomings, 'id') : reviewIncomings;
            return $http
                .put((urlService.reviewIncomings + '/deactivate/bulk'), bulkIds)
                .then(function () {
                    return reviewIncomings;
                });
        };

        /**
         * @description Reject the incoming mail
         * @param reviewIncoming
         */
        self.rejectIncoming = function (reviewIncoming) {
            var vsId = reviewIncoming.hasOwnProperty('vsId') ? reviewIncoming.vsId : reviewIncoming;
            return $http
                .put(urlService.incomings + '/' + vsId + '/reject')
                .then(function () {
                    return reviewIncoming;
                });
        };

        /**
         * @description Reject the bulk incoming mails
         * @param reviewIncomings
         */
        self.rejectIncomingBulk = function (reviewIncomings) {
            var vsIds = reviewIncomings[0].hasOwnProperty('vsId') ? _.map(reviewIncomings, 'vsId') : reviewIncomings;
            console.log(urlService.incomings + '/reject/bulk', vsIds);
            return $http
                .put(urlService.incomings + '/reject/bulk', vsIds)
                .then(function (result) {
                    result = result.data.rs;
                    var failedReviewIncomings = [];
                    _.map(result, function (value, key) {
                        if (!value)
                            failedReviewIncomings.push(key);
                    });
                    return _.filter(reviewIncomings, function (reviewIncoming) {
                        return (failedReviewIncomings.indexOf(reviewIncoming.id) > -1);
                    });
                });
        };

        /**
         * @description Accept of review incoming mail
         * @param reviewIncoming
         */
        self.acceptReviewIncoming = function (reviewIncoming) {
            var vsId = reviewIncoming.hasOwnProperty('vsId') ? reviewIncoming.vsId : reviewIncoming;
            return $http
                .put(urlService.incomings + '/' + vsId + '/ready-to-sent')
                .then(function () {
                    return reviewIncoming;
                });
        };

        /**
         * @description Accept of bulk review incoming mail
         * @param reviewIncomings
         */
        self.bulkAcceptReviewIncoming = function (reviewIncomings) {
            var bulkVsIds = reviewIncomings[0].hasOwnProperty('vsId') ? _.map(reviewIncomings, 'vsId') : reviewIncomings;
            return $http
                .put(urlService.incomings + '/ready-to-sent/bulk', bulkVsIds)
                .then(function (result) {
                    result = result.data.rs;
                    var failedReviewIncomings = [];
                    _.map(result, function (value, key) {
                        if (!value)
                            failedReviewIncomings.push(key);
                    });
                    return _.filter(reviewIncomings, function (reviewIncoming) {
                        return (failedReviewIncomings.indexOf(reviewIncoming.vsId) > -1);
                    });
                });
        };

        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param reviewIncoming
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicateReviewIncoming = function (reviewIncoming, editMode) {
            var reviewIncomingsToFilter = self.reviewIncomings;
            if (editMode) {
                reviewIncomingsToFilter = _.filter(reviewIncomingsToFilter, function (reviewIncomingToFilter) {
                    return reviewIncomingToFilter.id !== reviewIncoming.id;
                });
            }
            return _.some(_.map(reviewIncomingsToFilter, function (existingReviewIncoming) {
                return existingReviewIncoming.arName === reviewIncoming.arName
                    || existingReviewIncoming.enName.toLowerCase() === reviewIncoming.enName.toLowerCase();
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteReviewIncoming, self.updateReviewIncoming);
    });
};
