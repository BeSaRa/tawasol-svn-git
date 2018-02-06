module.exports = function (app) {
    app.service('reviewInternalService', function (urlService,
                                                   $http,
                                                   $q,
                                                   generator,
                                                   employeeService,
                                                   Internal,
                                                   _,
                                                   dialog,
                                                   langService,
                                                   toast,
                                                   cmsTemplate) {
        'ngInject';
        var self = this;
        self.serviceName = 'reviewInternalService';

        self.reviewInternals = [];

        /**
         * @description Load the review internal mails from server.
         * @returns {Promise|reviewInternals}
         */
        self.loadReviewInternals = function () {
            return $http.get(urlService.internals + '/ou/' + employeeService.getEmployee().getOUID() + '/review').then(function (result) {
                self.reviewInternals = generator.generateCollection(result.data.rs, Internal, self._sharedMethods);
                self.reviewInternals = generator.interceptReceivedCollection(['Correspondence', 'Internal'], self.reviewInternals);
                return self.reviewInternals;
            });
        };

        /**
         * @description Get review internal mails from self.reviewInternals if found and if not load it from server again.
         * @returns {Promise|reviewInternals}
         */
        self.getReviewInternals = function () {
            return self.reviewInternals.length ? $q.when(self.reviewInternals) : self.loadReviewInternals();
        };

        /**
         * @description Contains methods for CRUD operations for review internal mails
         */
        self.controllerMethod = {
            /**
             * @description Show confirm box and remove review internal mail
             * @param reviewInternal
             * @param $event
             */
            reviewInternalRemove: function (reviewInternal, $event) {
                return dialog.confirmMessage(langService.get('confirm_remove').change({name: reviewInternal.getNames()}), null, null, $event)
                    .then(function () {
                        return self.removeReviewInternal(reviewInternal).then(function () {
                            toast.success(langService.get("remove_specific_success").change({name: reviewInternal.getNames()}));
                            return true;
                        })
                    });
            },
            /**
             * @description Show confirm box and remove bulk review internal mails
             * @param reviewInternals
             * @param $event
             */
            reviewInternalRemoveBulk: function (reviewInternals, $event) {
                return dialog
                    .confirmMessage(langService.get('confirm_remove_selected_multiple'), null, null, $event || null)
                    .then(function () {
                        return self.removeBulkReviewInternals(reviewInternals)
                            .then(function (result) {
                                var response = false;
                                if (result.length === reviewInternals.length) {
                                    toast.error(langService.get("failed_remove_selected"));
                                    response = false;
                                } else if (result.length) {
                                    generator.generateFailedBulkActionRecords('remove_success_except_following', _.map(result, function (reviewInternal) {
                                        return reviewInternal.getNames();
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
             * @description Reject internal mail
             * @param reviewInternal
             * @param $event
             */
            reviewInternalReject: function (reviewInternal, $event) {
                return self.rejectInternal(reviewInternal)
                    .then(function (result) {
                        toast.success(langService.get("reject_specific_success").change({name: reviewInternal.getTranslatedName()}));
                        return true;
                    })
            },
            /**
             * @description Reject Bulk internal mails
             * @param reviewInternals
             * @param $event
             */
            reviewInternalRejectBulk: function (reviewInternals, $event) {
                return self.rejectInternalBulk(reviewInternals)
                    .then(function (result) {
                        var response = false;
                        if (result.length === reviewInternals.length) {
                            toast.error(langService.get("failed_reject_selected"));
                            response = false;
                        } else if (result.length) {
                            generator.generateFailedBulkActionRecords('reject_success_except_following', _.map(result, function (reviewInternal) {
                                return reviewInternal.getNames();
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
             * @description send draft internal mail to review
             * @param reviewInternal
             * @param $event
             */
            reviewInternalAccept: function (reviewInternal, $event) {
                return self.acceptReviewInternal(reviewInternal).then(function () {
                    toast.success(langService.get("accept_specific_success").change({name: reviewInternal.getNames()}));
                    return true;
                })
            },
            /**
             * @description Accept bulk review internal mails
             * @param reviewInternals
             * @param $event
             */
            reviewInternalAcceptBulk: function (reviewInternals, $event) {
                return self.bulkAcceptReviewInternal(reviewInternals)
                    .then(function (result) {
                        var response = false;
                        if (result.length === reviewInternals.length) {
                            toast.error(langService.get("failed_accept_selected"));
                            response = false;
                        } else if (result.length) {
                            generator.generateFailedBulkActionRecords('accept_success_except_following', _.map(result, function (reviewInternal) {
                                return reviewInternal.getNames();
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
         * @description Add new review internal mail
         * @param reviewInternal
         * @return {Promise|Internal}
         */
        self.addReviewInternal = function (reviewInternal) {
            /*return $http
                .post(urlService.reviewInternals,
                    generator.interceptSendInstance('Internal', reviewInternal))
                .then(function () {
                    return reviewInternal;
                });*/
        };

        /**
         * @description Update the given review internal mail.
         * @param reviewInternal
         * @return {Promise|Internal}
         */
        self.updateReviewInternal = function (reviewInternal) {
            /* return $http
                 .put(urlService.reviewInternals,
                     generator.interceptSendInstance('Internal', reviewInternal))
                 .then(function () {
                     return reviewInternal;
                 });*/
        };

        /**
         * @description Remove given review internal mail.
         * @param reviewInternal
         * @return {Promise|null}
         */
        self.removeReviewInternal = function (reviewInternal) {
            var vsId = reviewInternal.hasOwnProperty('vsId') ? reviewInternal.vsId : reviewInternal;
            return $http
                .put(urlService.internals + '/' + vsId + '/remove')
                .then(function (result) {
                    return true;
                });
        };

        /**
         * @description Remove bulk review internal mails.
         * @param reviewInternals
         * @return {Promise|null}
         */
        self.removeBulkReviewInternals = function (reviewInternals) {
            var bulkVsIds = reviewInternals[0].hasOwnProperty('vsId') ? _.map(reviewInternals, 'vsId') : reviewInternals;
            return $http.put(urlService.internals + '/remove/bulk', bulkVsIds).then(function (result) {
                result = result.data.rs;
                var failedReviewInternals = [];
                _.map(result, function (value, key) {
                    if (!value)
                        failedReviewInternals.push(key);
                });
                return _.filter(reviewInternals, function (reviewInternal) {
                    return (failedReviewInternals.indexOf(reviewInternal.vsId) > -1);
                });
            });
        };

        /**
         * @description Get review internal mail by reviewInternalId
         * @param reviewInternalId
         * @returns {Internal|undefined} return Internal Model or undefined if not found.
         */
        self.getReviewInternalById = function (reviewInternalId) {
            reviewInternalId = reviewInternalId instanceof Internal ? reviewInternalId.id : reviewInternalId;
            /* return _.find(self.reviewInternals, function (reviewInternal) {
                 return Number(reviewInternal.id) === Number(reviewInternalId);
             });*/
        };


        /**
         * @description Reject the internal mail
         * @param reviewInternal
         */
        self.rejectInternal = function (reviewInternal) {
            var vsId = reviewInternal.hasOwnProperty('vsId') ? reviewInternal.vsId : reviewInternal;
            return $http
                .put(urlService.internals + "/" + vsId + '/reject')
                .then(function () {
                    return reviewInternal;
                });
        };

        /**
         * @description Reject the bulk internal mails
         * @param reviewInternals
         */
        self.rejectInternalBulk = function (reviewInternals) {
            var vsIds = reviewInternals[0].hasOwnProperty('vsId') ? _.map(reviewInternals, 'vsId') : reviewInternals;
            return $http
                .put(urlService.internals + '/reject/bulk', vsIds)
                .then(function (result) {
                    result = result.data.rs;
                    var failedReviewInternals = [];
                    _.map(result, function (value, key) {
                        if (!value)
                            failedReviewInternals.push(key);
                    });
                    return _.filter(reviewInternals, function (reviewInternal) {
                        return (failedReviewInternals.indexOf(reviewInternal.id) > -1);
                    });
                });
        };

        /**
         * @description Accept of review internal mail
         * @param reviewInternal
         */
        self.acceptReviewInternal = function (reviewInternal) {
            var vsId = reviewInternal.hasOwnProperty('vsId') ? reviewInternal.vsId : reviewInternal;
            return $http
                .put(urlService.internals + "/" + vsId + '/ready-to-sent')
                .then(function () {
                    return reviewInternal;
                });
        };

        /**
         * @description Accept of bulk review internal mail
         * @param reviewInternals
         */
        self.bulkAcceptReviewInternal = function (reviewInternals) {
            var bulkVsIds = reviewInternals[0].hasOwnProperty('vsId') ? _.map(reviewInternals, 'vsId') : reviewInternals;
            return $http
                .put(urlService.internals + '/ready-to-sent/bulk', bulkVsIds)
                .then(function (result) {
                    result = result.data.rs;
                    var failedReviewInternals = [];
                    _.map(result, function (value, key) {
                        if (!value)
                            failedReviewInternals.push(key);
                    });
                    return _.filter(reviewInternals, function (reviewInternal) {
                        return (failedReviewInternals.indexOf(reviewInternal.vsId) > -1);
                    });
                });
        };

        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param reviewInternal
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicateReviewInternal = function (reviewInternal, editMode) {
            var reviewInternalsToFilter = self.reviewInternals;
            if (editMode) {
                reviewInternalsToFilter = _.filter(reviewInternalsToFilter, function (reviewInternalToFilter) {
                    return reviewInternalToFilter.id !== reviewInternal.id;
                });
            }
            return _.some(_.map(reviewInternalsToFilter, function (existingReviewInternal) {
                return existingReviewInternal.arName === reviewInternal.arName
                    || existingReviewInternal.enName.toLowerCase() === reviewInternal.enName.toLowerCase();
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteReviewInternal, self.updateReviewInternal);
    });
};
