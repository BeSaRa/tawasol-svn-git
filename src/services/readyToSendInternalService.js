module.exports = function (app) {
    app.service('readyToSendInternalService', function (urlService,
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
        self.serviceName = 'readyToSendInternalService';

        self.readyToSendInternals = [];

        /**
         * @description Load the ready to send internal mails from server.
         * @returns {Promise|readyToSendInternals}
         */
        self.loadReadyToSendInternals = function () {
            return $http.get(urlService.internals + '/ou/' + employeeService.getEmployee().getOUID() + '/ready-to-sent').then(function (result) {
                self.readyToSendInternals = generator.generateCollection(result.data.rs, Internal, self._sharedMethods);
                self.readyToSendInternals = generator.interceptReceivedCollection(['Correspondence', 'Internal'], self.readyToSendInternals);
                return self.readyToSendInternals;
            });
        };

        /**
         * @description Get ready to send internal mails from self.readyToSendInternals if found and if not load it from server again.
         * @returns {Promise|readyToSendInternals}
         */
        self.getReadyToSendInternals = function () {
            return self.readyToSendInternals.length ? $q.when(self.readyToSendInternals) : self.loadReadyToSendInternals();
        };

        /**
         * @description Contains methods for CRUD operations for ready to send internal mails
         */
        self.controllerMethod = {
            /**
             * @description Archive the ready to send internal mail
             * @param readyToSendInternal
             * @param $event
             */
            readyToSendInternalArchive: function (readyToSendInternal, $event) {
                return self.archiveReadyToSendInternal(readyToSendInternal)
                    .then(function () {
                        toast.success(langService.get("archive_specific_success").change({name: readyToSendInternal.getTranslatedName()}));
                        return true;
                    });
            },
            /**
             * @description Archive bulk ready to send internal mails
             * @param readyToSendInternals
             * @param $event
             */
            readyToSendInternalArchiveBulk: function (readyToSendInternals, $event) {
                return self.archiveBulkReadyToSendInternal(readyToSendInternals)
                    .then(function (result) {
                        var response = false;
                        if (result.length === readyToSendInternals.length) {
                            toast.error(langService.get("failed_archive_selected"));
                            response = false;
                        } else if (result.length) {
                            generator.generateFailedBulkActionRecords('archive_success_except_following', _.map(result, function (readyToSendInternal) {
                                return readyToSendInternal.getNames();
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
         * @description Get ready to send internal mail by readyToSendInternalId
         * @param readyToSendInternalId
         * @returns {Internal|undefined} return Internal Model or undefined if not found.
         */
        self.getReadyToSendInternalById = function (readyToSendInternalId) {
            readyToSendInternalId = readyToSendInternalId instanceof Internal ? readyToSendInternalId.id : readyToSendInternalId;
            /*  return _.find(self.readyToSendInternals, function (readyToSendInternal) {
                  return Number(readyToSendInternal.id) === Number(readyToSendInternalId);
              });*/
        };

        /**
         * @description Archive the ready to send internal mail
         * @param readyToSendInternal
         */
        self.archiveReadyToSendInternal = function (readyToSendInternal) {
            var vsId = readyToSendInternal.hasOwnProperty('vsId') ? readyToSendInternal.vsId : readyToSendInternal;
            return $http
                .put(urlService.internals + '/' + vsId + '/archive')
                .then(function () {
                    return readyToSendInternal;
                });
        };

        /**
         * @description Archive the bulk ready to send internal mail
         * @param readyToSendInternals
         */
        self.archiveBulkReadyToSendInternal = function (readyToSendInternals) {
            var vsIds = readyToSendInternals[0].hasOwnProperty('vsId') ? _.map(readyToSendInternals, 'vsId') : readyToSendInternals;
            return $http
                .put((urlService.internals + '/archive/bulk'), vsIds)
                .then(function (result) {
                    result = result.data.rs;
                    var failedReadyToSendInternals = [];
                    _.map(result, function (value, key) {
                        if (!value)
                            failedReadyToSendInternals.push(key);
                    });
                    return _.filter(readyToSendInternals, function (readyToSendInternal) {
                        return (failedReadyToSendInternals.indexOf(readyToSendInternal.vsId) > -1);
                    });
                });
        };

        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param readyToSendInternal
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicateReadyToSendInternal = function (readyToSendInternal, editMode) {
            var sendInternalsToFilter = self.readyToSendInternals;
            if (editMode) {
                sendInternalsToFilter = _.filter(sendInternalsToFilter, function (sendInternalToFilter) {
                    return sendInternalToFilter.id !== readyToSendInternal.id;
                });
            }
            return _.some(_.map(sendInternalsToFilter, function (existingSendInternal) {
                return existingSendInternal.arName === readyToSendInternal.arName
                    || existingSendInternal.enName.toLowerCase() === readyToSendInternal.enName.toLowerCase();
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteReadyToSendInternal, self.updateReadyToSendInternal);
    });
};
