module.exports = function (app) {
    app.service('prepareInternalService', function (urlService,
                                                    $http,
                                                    $q,
                                                    generator,
                                                    Internal,
                                                    _,
                                                    employeeService,
                                                    dialog,
                                                    langService,
                                                    toast,
                                                    cmsTemplate) {
        'ngInject';
        var self = this;
        self.serviceName = 'prepareInternalService';

        self.prepareInternals = [];

        /**
         * @description Load the prepare internal items from server.
         * @param organization
         * @returns {Promise|Internal}
         */
        self.loadPrepareInternals = function () {
            return $http.get(urlService.internals + '/ou/' + employeeService.getEmployee().getOUID() + '/prepare').then(function (result) {
                self.prepareInternals = generator.generateCollection(result.data.rs, Internal, self._sharedMethods);
                self.prepareInternals = generator.interceptReceivedCollection(['Correspondence', 'Internal'], self.prepareInternals);
                return self.prepareInternals;
            });
        };

        /**
         * @description Get prepare internal items from self.prepareInternals if found and if not load it from server again.
         * @returns {Promise|Internal}
         */
        self.getPrepareInternals = function () {
            return self.prepareInternals.length ? $q.when(self.prepareInternals) : self.loadPrepareInternals();
        };

        /**
         * @description Contains methods for CRUD operations for prepare internal items
         */
        self.controllerMethod = {
            /**
             * @description Show confirm box and delete prepare internal item
             * @param prepareInternal
             * @param $event
             */
            prepareInternalRemove: function (prepareInternal, $event) {
                return dialog.confirmMessage(langService.get('confirm_delete').change({name: prepareInternal.getNames()}), null, null, $event)
                    .then(function () {
                        return self.removePrepareInternal(prepareInternal).then(function () {
                            toast.show(langService.get("delete_specific_success").change({name: prepareInternal.getNames()}));
                            return true;
                        })
                    });
            },
            /**
             * @description Show confirm box and delete bulk prepare internal items
             * @param prepareInternals
             * @param $event
             */
            prepareInternalRemoveBulk: function (prepareInternals, $event) {
                return dialog
                    .confirmMessage(langService.get('confirm_remove_selected_multiple'), null, null, $event || null)
                    .then(function () {
                        return self.removeBulkPrepareInternals(prepareInternals)
                            .then(function (result) {
                                var response = false;
                                if (result.length === prepareInternals.length) {
                                    toast.error(langService.get("failed_remove_selected"));
                                    response = false;
                                } else if (result.length) {
                                    generator.generateFailedBulkActionRecords('remove_success_except_following', _.map(result, function (prepareInternal) {
                                        return prepareInternal.getNames();
                                    }));
                                    response = true;
                                } else {
                                    toast.success(langService.get("remove_success"));
                                    response = true;
                                }
                                return response;
                            });
                    });
            }
        };

        /**
         * @description Delete given prepare internal item.
         * @param prepareInternal
         * @return {Promise|null}
         */
        self.removePrepareInternal = function (prepareInternal) {
            var vsId = prepareInternal.hasOwnProperty('vsId') ? prepareInternal.vsId : prepareInternal;
            return $http
                .put(urlService.internals + '/' + vsId + '/remove')
                .then(function (result) {
                    return true;
                });
        };

        /**
         * @description Remove bulk prepare internal mails.
         * @param prepareInternals
         * @return {Promise|null}
         */
        self.removeBulkPrepareInternals = function (prepareInternals) {
            var bulkVsIds = prepareInternals[0].hasOwnProperty('vsId') ? _.map(prepareInternals, 'vsId') : prepareInternals;
            return $http.put(urlService.internals + '/remove/bulk', bulkVsIds).then(function (result) {
                result = result.data.rs;
                var failedPrepareInternals = [];
                _.map(result, function (value, key) {
                    if (!value)
                        failedPrepareInternals.push(key);
                });
                return _.filter(prepareInternals, function (prepareInternal) {
                    return (failedPrepareInternals.indexOf(prepareInternal.vsId) > -1);
                });
            });
        };

        /**
         * @description Get prepare internal item by prepareInternalId
         * @param prepareInternalId
         * @returns {Internal|undefined} return PrepareInternal Model or undefined if not found.
         */
        self.getPrepareInternalById = function (prepareInternalId) {
            prepareInternalId = prepareInternalId instanceof PrepareInternal ? prepareInternalId.id : prepareInternalId;
            return _.find(self.prepareInternals, function (prepareInternal) {
                return Number(prepareInternal.id) === Number(prepareInternalId);
            });
        };

        /**
         * @description Send the item to draft
         * @param prepareInternal
         */
        self.sendToDraftPrepareInternal = function (prepareInternal) {
            var vsId = prepareInternal.hasOwnProperty('vsId') ? prepareInternal.vsId : prepareInternal;
            return $http
                .put(urlService.internals + '/' + vsId + '/send-to-draft')
                .then(function (result) {
                    return prepareInternal;
                });
        };

        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param prepareInternal
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicatePrepareInternal = function (prepareInternal, editMode) {
            var prepareInternalsToFilter = self.prepareInternals;
            if (editMode) {
                prepareInternalsToFilter = _.filter(prepareInternalsToFilter, function (prepareInternalToFilter) {
                    return prepareInternalToFilter.id !== prepareInternal.id;
                });
            }
            return _.some(_.map(prepareInternalsToFilter, function (existingPrepareInternal) {
                return existingPrepareInternal.arName === prepareInternal.arName
                    || existingPrepareInternal.enName.toLowerCase() === prepareInternal.enName.toLowerCase();
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deletePrepareInternal, self.updatePrepareInternal);
    });
};
