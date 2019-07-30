module.exports = function (app) {
    app.service('rejectedInternalService', function (urlService,
                                                     $http,
                                                     $q,
                                                     generator,
                                                     Internal,
                                                     _,
                                                     dialog,
                                                     employeeService,
                                                     langService,
                                                     toast,
                                                     cmsTemplate,
                                                     listGeneratorService) {
        'ngInject';
        var self = this;
        self.serviceName = 'rejectedInternalService';

        self.rejectedInternals = [];

        /**
         * @description Load the rejected internal mails from server.
         * @returns {Promise|rejectedInternals}
         */
        self.loadRejectedInternals = function () {
            return $http.get(urlService.internals + '/ou/' + employeeService.getEmployee().getOUID() + '/rejected').then(function (result) {
                self.rejectedInternals = generator.generateCollection(result.data.rs, Internal, self._sharedMethods);
                self.rejectedInternals = generator.interceptReceivedCollection(['Correspondence', 'Internal'], self.rejectedInternals);
                return self.rejectedInternals;
            });
        };

        /**
         * @description Get rejected internal mails from self.rejectedInternals if found and if not load it from server again.
         * @returns {Promise|rejectedInternals}
         */
        self.getRejectedInternals = function (organization) {
            organization = organization.hasOwnProperty('id') ? organization.id : organization;
            return self.rejectedInternals.length ? $q.when(self.rejectedInternals) : self.loadRejectedInternals(organization);
        };

        /**
         * @description Contains methods for CRUD operations for rejected internal mails
         */
        self.controllerMethod = {
            /**
             * @description Show confirm box and remove rejected internal mail
             * @param rejectedInternal
             * @param $event
             */
            rejectedInternalRemove: function (rejectedInternal, $event) {
                return dialog.confirmMessage(langService.get('confirm_remove').change({name: rejectedInternal.getNames()}), null, null, $event)
                    .then(function () {
                        return self.removeRejectedInternal(rejectedInternal).then(function () {
                            toast.success(langService.get("remove_specific_success").change({name: rejectedInternal.getNames()}));
                            return true;
                        })
                    });
            },
            /**
             * @description Show confirm box and remove bulk rejected internal mails
             * @param rejectedInternals
             * @param $event
             */
            rejectedInternalRemoveBulk: function (rejectedInternals, $event) {
                return dialog
                    .confirmMessage(langService.get('confirm_remove_selected_multiple'), null, null, $event || null)
                    .then(function () {
                        return self.removeBulkRejectedInternals(rejectedInternals)
                            .then(function (result) {
                                var response = false;
                                if (result.length === rejectedInternals.length) {
                                    toast.error(langService.get("failed_remove_selected"));
                                    response = false;
                                } else if (result.length) {
                                    generator.generateFailedBulkActionRecords('remove_success_except_following', _.map(result, function (rejectedInternal) {
                                        return rejectedInternal.getNames();
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
             * @description send rejected internal mail to review
             * @param rejectedInternal
             * @param $event
             */
            rejectedInternalSendToReview: function (rejectedInternal, $event) {
                return self.sendToReviewRejectedInternal(rejectedInternal).then(function () {
                    toast.success(langService.get("send_to_review_specific_success").change({name: rejectedInternal.getNames()}));
                    return true;
                })
            },
            /**
             * @description send bulk rejected internal mails to review
             * @param rejectedInternals
             * @param $event
             */
            rejectedInternalSendToReviewBulk: function (rejectedInternals, $event) {
                return self.bulkSendToReviewRejectedInternal(rejectedInternals)
                    .then(function (result) {
                        var response = false;
                        if (result.length === rejectedInternals.length) {
                            toast.error(langService.get("failed_send_to_review_selected"));
                            response = false;
                        } else if (result.length) {
                            generator.generateFailedBulkActionRecords('send_to_review_success_except_following', _.map(result, function (rejectedInternal) {
                                return rejectedInternal.getNames();
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
         * @description Get rejected internal mail by rejectedInternalId
         * @param rejectedInternalId
         * @returns {Internal|undefined} return Internal Model or undefined if not found.
         */
        self.getRejectedInternalById = function (rejectedInternalId) {
            rejectedInternalId = rejectedInternalId instanceof Internal ? rejectedInternalId.id : rejectedInternalId;
            return _.find(self.rejectedInternals, function (rejectedInternal) {
                return Number(rejectedInternal.id) === Number(rejectedInternalId);
            });
        };

        /**
         * @description Remove given rejected internal mail.
         * @param rejectedInternal
         * @return {Promise|null}
         */
        self.removeRejectedInternal = function (rejectedInternal) {
            var vsId = rejectedInternal.hasOwnProperty('vsId') ? rejectedInternal.vsId : rejectedInternal;
            return $http
                .put(urlService.internals + '/' + vsId + '/remove')
                .then(function (result) {
                    return true;
                });
        };

        /**
         * @description Remove bulk rejected internal mails.
         * @param rejectedInternals
         * @return {Promise|null}
         */
        self.removeBulkRejectedInternals = function (rejectedInternals) {
            var bulkVsIds = rejectedInternals[0].hasOwnProperty('vsId') ? _.map(rejectedInternals, 'vsId') : rejectedInternals;
            return $http.put(urlService.internals + '/remove/bulk', bulkVsIds).then(function (result) {
                result = result.data.rs;
                var failedRejectedInternals = [];
                _.map(result, function (value, key) {
                    if (!value)
                        failedRejectedInternals.push(key);
                });
                return _.filter(rejectedInternals, function (rejectedInternal) {
                    return (failedRejectedInternals.indexOf(rejectedInternal.vsId) > -1);
                });
            });
        };

        /**
         * @description Send to review of rejected internal mail
         * @param rejectedInternal
         */
        self.sendToReviewRejectedInternal = function (rejectedInternal) {
            var vsId = rejectedInternal.hasOwnProperty('vsId') ? rejectedInternal.vsId : rejectedInternal;
            return $http
                .put(urlService.internals + '/' + vsId + '/send-to-review')
                .then(function () {
                    return rejectedInternal;
                });
        };

        /**
         * @description Send to review of bulk rejected internal mail
         * @param rejectedInternals
         */
        self.bulkSendToReviewRejectedInternal = function (rejectedInternals) {
            var bulkVsIds = rejectedInternals[0].hasOwnProperty('vsId') ? _.map(rejectedInternals, 'vsId') : rejectedInternals;
            return $http
                .put(urlService.internals + '/send-to-review/bulk', bulkVsIds)
                .then(function (result) {
                    result = result.data.rs;
                    var failedRejectedInternals = [];
                    _.map(result, function (value, key) {
                        if (!value)
                            failedRejectedInternals.push(key);
                    });
                    return _.filter(rejectedInternals, function (rejectedInternal) {
                        return (failedRejectedInternals.indexOf(rejectedInternal.vsId) > -1);
                    });
                });
        };

        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param rejectedInternal
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicateRejectedInternal = function (rejectedInternal, editMode) {
            var rejectedInternalsToFilter = self.rejectedInternals;
            if (editMode) {
                rejectedInternalsToFilter = _.filter(rejectedInternalsToFilter, function (rejectedInternalToFilter) {
                    return rejectedInternalToFilter.id !== rejectedInternal.id;
                });
            }
            return _.some(_.map(rejectedInternalsToFilter, function (existingRejectedInternal) {
                return existingRejectedInternal.arName === rejectedInternal.arName
                    || existingRejectedInternal.enName.toLowerCase() === rejectedInternal.enName.toLowerCase();
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteRejectedInternal, self.updateRejectedInternal);
    });
};
