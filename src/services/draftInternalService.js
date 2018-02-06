module.exports = function (app) {
    app.service('draftInternalService', function (urlService,
                                                  $http,
                                                  $q,
                                                  generator,
                                                  Internal,
                                                  employeeService,
                                                  _,
                                                  dialog,
                                                  langService,
                                                  toast,
                                                  cmsTemplate) {
        'ngInject';
        var self = this;
        self.serviceName = 'draftInternalService';

        self.draftInternals = [];

        /**
         * @description Load the draft internal mails from server.
         * @param organization
         * @returns {Promise|draftInternals}
         */
        self.loadDraftInternals = function () {
            return $http.get(urlService.internals + '/ou/' + employeeService.getEmployee().getOUID() + '/draft').then(function (result) {
                self.draftInternals = generator.generateCollection(result.data.rs, Internal, self._sharedMethods);
                self.draftInternals = generator.interceptReceivedCollection(['Correspondence', 'Internal'], self.draftInternals);
                return self.draftInternals;
            });
        };

        /**
         * @description Get draft internal mails from self.draftInternals if found and if not load it from server again.
         * @param organization
         * @returns {Promise|draftInternals}
         */
        self.getDraftInternals = function () {
            return self.draftInternals.length ? $q.when(self.draftInternals) : self.loadDraftInternals();
        };

        /**
         * @description Contains methods for CRUD operations for draft internal mails
         */
        self.controllerMethod = {
            /**
             * @description Show confirm box and remove draft internal mail
             * @param draftInternal
             * @param $event
             */
            draftInternalRemove: function (draftInternal, $event) {
                return dialog.confirmMessage(langService.get('confirm_remove').change({name: draftInternal.getNames()}), null, null, $event)
                    .then(function () {
                        return self.removeDraftInternal(draftInternal).then(function () {
                            toast.success(langService.get("remove_specific_success").change({name: draftInternal.getNames()}));
                            return true;
                        })
                    });
            },
            /**
             * @description Show confirm box and remove bulk draft internal mails
             * @param draftInternals
             * @param $event
             */
            draftInternalRemoveBulk: function (draftInternals, $event) {
                return dialog
                    .confirmMessage(langService.get('confirm_remove_selected_multiple'), null, null, $event || null)
                    .then(function () {
                        return self.removeBulkDraftInternals(draftInternals)
                            .then(function (result) {
                                var response = false;
                                if (result.length === draftInternals.length) {
                                    toast.error(langService.get("failed_remove_selected"));
                                    response = false;
                                } else if (result.length) {
                                    generator.generateFailedBulkActionRecords('remove_success_except_following', _.map(result, function (draftInternal) {
                                        return draftInternal.getNames();
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
             * @description send draft internal mail to review
             * @param draftInternal
             * @param $event
             */
            draftInternalSendToReview: function (draftInternal, $event) {
                return self.sendToReviewDraftInternal(draftInternal).then(function () {
                    toast.success(langService.get("send_to_review_specific_success").change({name: draftInternal.getNames()}));
                    return true;
                })
            },
            /**
             * @description send bulk draft internal mails to review
             * @param draftInternals
             * @param $event
             */
            draftInternalSendToReviewBulk: function (draftInternals, $event) {
                return self.bulkSendToReviewDraftInternal(draftInternals)
                    .then(function (result) {
                        var response = false;
                        if (result.length === draftInternals.length) {
                            toast.error(langService.get("failed_send_to_review_selected"));
                            response = false;
                        } else if (result.length) {
                            generator.generateFailedBulkActionRecords('send_to_review_success_except_following', _.map(result, function (draftInternal) {
                                return draftInternal.getNames();
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
         * @description Remove given draft internal mail.
         * @param draftInternal
         * @return {Promise|null}
         */
        self.removeDraftInternal = function (draftInternal) {
            var vsId = draftInternal.hasOwnProperty('vsId') ? draftInternal.vsId : draftInternal;
            return $http
                .put(urlService.internals + '/' + vsId + '/remove')
                .then(function (result) {
                    return true;
                });
        };

        /**
         * @description Remove bulk draft internal mails.
         * @param draftInternals
         * @return {Promise|null}
         */
        self.removeBulkDraftInternals = function (draftInternals) {
            var bulkVsIds = draftInternals[0].hasOwnProperty('vsId') ? _.map(draftInternals, 'vsId') : draftInternals;
            return $http.put(urlService.internals + '/remove/bulk', bulkVsIds).then(function (result) {
                result = result.data.rs;
                var failedDraftInternals = [];
                _.map(result, function (value, key) {
                    if (!value)
                        failedDraftInternals.push(key);
                });
                return _.filter(draftInternals, function (draftInternal) {
                    return (failedDraftInternals.indexOf(draftInternal.vsId) > -1);
                });
            });
        };

        /**
         * @description Get draft internal mail by draftInternalId
         * @param draftInternalId
         * @returns {Internal|undefined} return Internal Model or undefined if not found.
         */
        self.getDraftInternalById = function (draftInternalId) {
            draftInternalId = draftInternalId instanceof Internal ? draftInternalId.id : draftInternalId;
            /*return _.find(self.draftInternals, function (draftInternal) {
                return Number(draftInternal.id) === Number(draftInternalId);
            });*/
        };

        /**
         * @description Send to review of draft internal mail
         * @param draftInternal
         */
        self.sendToReviewDraftInternal = function (draftInternal) {
            var vsId = draftInternal.hasOwnProperty('vsId') ? draftInternal.vsId : draftInternal;
            return $http
                .put(urlService.internals + '/' + vsId + '/send-to-review')
                .then(function () {
                    return draftInternal;
                });
        };

        /**
         * @description Send to review of bulk draft internal mail
         * @param draftInternals
         */
        self.bulkSendToReviewDraftInternal = function (draftInternals) {
            var bulkVsIds = draftInternals[0].hasOwnProperty('vsId') ? _.map(draftInternals, 'vsId') : draftInternals;
            return $http
                .put(urlService.internals + '/send-to-review/bulk', bulkVsIds)
                .then(function (result) {
                    result = result.data.rs;
                    var failedDraftInternals = [];
                    _.map(result, function (value, key) {
                        if (!value)
                            failedDraftInternals.push(key);
                    });
                    return _.filter(draftInternals, function (draftInternal) {
                        return (failedDraftInternals.indexOf(draftInternal.vsId) > -1);
                    });
                });
        };

        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param draftInternal
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicateDraftInternal = function (draftInternal, editMode) {
            var draftInternalsToFilter = self.draftInternals;
            if (editMode) {
                draftInternalsToFilter = _.filter(draftInternalsToFilter, function (draftInternalToFilter) {
                    return draftInternalToFilter.id !== draftInternal.id;
                });
            }
            return _.some(_.map(draftInternalsToFilter, function (existingDraftInternal) {
                return existingDraftInternal.arName === draftInternal.arName
                    || existingDraftInternal.enName.toLowerCase() === draftInternal.enName.toLowerCase();
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteDraftInternal, self.updateDraftInternal);
    });
};
