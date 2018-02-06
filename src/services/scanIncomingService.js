module.exports = function (app) {
    app.service('scanIncomingService', function (urlService,
                                                 $http,
                                                 $q,
                                                 generator,
                                                 Incoming,
                                                 employeeService,
                                                 _,
                                                 dialog,
                                                 langService,
                                                 toast,
                                                 cmsTemplate) {
        'ngInject';
        var self = this;
        self.serviceName = 'scanIncomingService';

        self.scanIncomings = [];

        /**
         * @description Load the scan incomings from server.
         * @returns {Promise|Incoming}
         */
        self.loadScanIncomings = function () {
            return $http.get(urlService.incomings + 'ou/' + employeeService.getEmployee().getOUID() + '/prepare').then(function (result) {
                self.scanIncomings = generator.generateCollection(result.data.rs, Incoming, self._sharedMethods);
                self.scanIncomings = generator.interceptReceivedCollection(['Correspondence', 'Incoming'], self.scanIncomings);
                return self.scanIncomings;
            });
        };

        /**
         * @description Get scan incomings from self.scanIncomings if found and if not load it from server again.
         * @returns {Promise|Incoming}
         */
        self.getScanIncomings = function () {
            return self.scanIncomings.length ? $q.when(self.scanIncomings) : self.loadScanIncomings();
        };

        /**
         * @description Contains methods for CRUD operations for scan incomings
         */
        self.controllerMethod = {
            /**
             * @description Opens popup to add new scan incoming
             * @param $event
             */
            scanIncomingAdd: function ($event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        template: cmsTemplate.getPopup('scan-incoming'),
                        controller: 'scanIncomingPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: false,
                            scanIncoming: new Incoming(
                                {
                                    itemOrder: generator.createNewID(self.scanIncomings, 'itemOrder')
                                }),
                            scanIncomings: self.scanIncomings
                        }
                    });
            },
            /**
             * @description Opens popup to edit scan incoming
             * @param scanIncoming
             * @param $event
             */
            scanIncomingEdit: function (scanIncoming, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        template: cmsTemplate.getPopup('scan-incoming'),
                        controller: 'scanIncomingPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: true,
                            scanIncoming: scanIncoming,
                            scanIncomings: self.scanIncomings
                        }
                    });
            },
            /**
             * @description Show confirm box and delete scan incoming
             * @param scanIncoming
             * @param $event
             */
            scanIncomingRemove: function (scanIncoming, $event) {
                return dialog.confirmMessage(langService.get('confirm_delete').change({name: scanIncoming.getNames()}), null, null, $event)
                    .then(function () {
                        return self.deleteScanIncoming(scanIncoming).then(function () {
                            toast.success(langService.get("delete_specific_success").change({name: scanIncoming.getNames()}));
                            return true;
                        })
                    });
            },
            /**
             * @description Show confirm box and delete bulk scan incomings
             * @param scanIncomings
             * @param $event
             */
            scanIncomingRemoveBulk: function (scanIncomings, $event) {
                return dialog
                    .confirmMessage(langService.get('confirm_delete_selected_multiple'), null, null, $event || null)
                    .then(function () {
                        return self.removeBulkScanIncomings(scanIncomings)
                            .then(function (result) {
                                var response = false;
                                if (result.length === scanIncomings.length) {
                                    toast.error(langService.get("failed_delete_selected"));
                                    response = false;
                                } else if (result.length) {
                                    generator.generateFailedBulkActionRecords('delete_success_except_following', _.map(result, function (scanIncoming) {
                                        return scanIncoming.getNames();
                                    }));
                                    response = true;
                                } else {
                                    toast.success(langService.get("delete_success"));
                                    response = true;
                                }
                                return response;
                            });
                    });
            }
        };

        /**
         * @description Add new scan incoming
         * @param scanIncoming
         * @return {Promise|Incoming}
         */
        self.addScanIncoming = function (scanIncoming) {
            return $http
                .post(urlService.scanIncomings,
                    generator.interceptSendInstance('Incoming', scanIncoming))
                .then(function () {
                    return scanIncoming;
                });
        };

        /**
         * @description Update the given scan incoming.
         * @param scanIncoming
         * @return {Promise|Incoming}
         */
        self.updateScanIncoming = function (scanIncoming) {
            return $http
                .put(urlService.scanIncomings,
                    generator.interceptSendInstance('Incoming', scanIncoming))
                .then(function () {
                    return scanIncoming;
                });
        };

        /**
         * @description Delete given scan incoming.
         * @param scanIncoming
         * @return {Promise|null}
         */
        self.deleteScanIncoming = function (scanIncoming) {
            var vsId = scanIncoming.hasOwnProperty('vsId') ? scanIncoming.vsId : scanIncoming;
            return $http
                .put(urlService.incomings + '/' + vsId + '/remove')
                .then(function (result) {
                    return true;
                });
        };

        /**
         * @description Delete bulk scan incomings.
         * @param scanIncomings
         * @return {Promise|null}
         */
        self.removeBulkScanIncomings = function (scanIncomings) {
            var bulkVsIds = scanIncomings[0].hasOwnProperty('vsId') ? _.map(scanIncomings, 'vsId') : scanIncomings;
            return $http.put(urlService.incomings + '/remove/bulk', bulkVsIds).then(function (result) {
                result = result.data.rs;
                var failedScanIncomings = [];
                _.map(result, function (value, key) {
                    if (!value)
                        failedScanIncomings.push(key);
                });
                return _.filter(scanIncomings, function (scanIncoming) {
                    return (failedScanIncomings.indexOf(scanIncoming.vsId) > -1);
                });
            });
        };

        /**
         * @description Get scan incoming by scanIncomingId
         * @param scanIncomingId
         * @returns {Incoming|undefined} return Incoming Model or undefined if not found.
         */
        self.getScanIncomingById = function (scanIncomingId) {
            scanIncomingId = scanIncomingId instanceof Incoming ? scanIncomingId.id : scanIncomingId;
            return _.find(self.scanIncomings, function (scanIncoming) {
                return Number(scanIncoming.id) === Number(scanIncomingId);
            });
        };

        /**
         * @description Activate scan incoming
         * @param scanIncoming
         */
        self.activateScanIncoming = function (scanIncoming) {
            return $http
                .put((urlService.scanIncomings + '/activate/' + scanIncoming.id))
                .then(function () {
                    return scanIncoming;
                });
        };

        /**
         * @description Deactivate scan incoming
         * @param scanIncoming
         */
        self.deactivateScanIncoming = function (scanIncoming) {
            return $http
                .put((urlService.scanIncomings + '/deactivate/' + scanIncoming.id))
                .then(function () {
                    return scanIncoming;
                });
        };

        /**
         * @description Activate bulk of scan incomings
         * @param scanIncomings
         */
        self.activateBulkScanIncomings = function (scanIncomings) {
            var bulkIds = scanIncomings[0].hasOwnProperty('id') ? _.map(scanIncomings, 'id') : scanIncomings;
            return $http
                .put((urlService.scanIncomings + '/activate/bulk'), bulkIds)
                .then(function () {
                    return scanIncomings;
                });
        };

        /**
         * @description Deactivate bulk of scan incomings
         * @param scanIncomings
         */
        self.deactivateBulkScanIncomings = function (scanIncomings) {
            var bulkIds = scanIncomings[0].hasOwnProperty('id') ? _.map(scanIncomings, 'id') : scanIncomings;
            return $http
                .put((urlService.scanIncomings + '/deactivate/bulk'), bulkIds)
                .then(function () {
                    return scanIncomings;
                });
        };

        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param scanIncoming
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicateScanIncoming = function (scanIncoming, editMode) {
            var scanIncomingsToFilter = self.scanIncomings;
            if (editMode) {
                scanIncomingsToFilter = _.filter(scanIncomingsToFilter, function (scanIncomingToFilter) {
                    return scanIncomingToFilter.id !== scanIncoming.id;
                });
            }
            return _.some(_.map(scanIncomingsToFilter, function (existingScanIncoming) {
                return existingScanIncoming.arName === scanIncoming.arName
                    || existingScanIncoming.enName.toLowerCase() === scanIncoming.enName.toLowerCase();
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteScanIncoming, self.updateScanIncoming);
    });
};
