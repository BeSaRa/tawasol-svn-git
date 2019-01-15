module.exports = function (app) {
    app.service('attachmentTypeService', function (urlService,
                                                   $http,
                                                   $q,
                                                   generator,
                                                   AttachmentType,
                                                   dialog,
                                                   cmsTemplate,
                                                   _,
                                                   langService,
                                                   toast) {
        'ngInject';
        var self = this;
        self.serviceName = 'attachmentTypeService';

        self.attachmentTypes = [];

        /**
         * @description Load the attachment types from server.
         * @returns {Promise|attachmentTypes}
         */
        self.loadAttachmentTypes = function () {
            return $http.get(urlService.attachmentTypes).then(function (result) {
                self.attachmentTypes = generator.generateCollection(result.data.rs, AttachmentType, self._sharedMethods);
                self.attachmentTypes = generator.interceptReceivedCollection('AttachmentType', self.attachmentTypes);
                return self.attachmentTypes;
            });
        };
        /**
         * @description Get attachment types from self.attachmentTypes if found and if not load it from server again.
         * @returns {Promise|attachmentTypes}
         */
        self.getAttachmentTypes = function () {
            return self.attachmentTypes.length ? $q.when(self.attachmentTypes) : self.loadAttachmentTypes();
        };

        /**
         * @description Contains methods for CRUD operations for attachment types
         */
        self.controllerMethod = {
            /**
             * @description Opens popup to add new attachment type
             * @param $event
             */
            attachmentTypeAdd: function ($event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('attachment-type'),
                        controller: 'attachmentTypePopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: false,
                            attachmentType: new AttachmentType(
                                {
                                    itemOrder: generator.createNewID(self.attachmentTypes, 'itemOrder')
                                }),
                            attachmentTypes: self.attachmentTypes
                        }
                    });
            },
            /**
             * @description Opens popup to edit attachment type
             * @param attachmentType
             * @param $event
             */
            attachmentTypeEdit: function (attachmentType, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('attachment-type'),
                        controller: 'attachmentTypePopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: true,
                            attachmentType: attachmentType,
                            attachmentTypes: self.attachmentTypes
                        }
                    });
            },
            /**
             * @description Show confirm box and delete bulk attachment type
             * @param attachmentType
             * @param $event
             */
            attachmentTypeDelete: function (attachmentType, $event) {
                return dialog
                    .confirmMessage(langService.get('confirm_delete').change({name: attachmentType.getNames()}), null, null, $event)
                    .then(function () {
                        return self.deleteAttachmentType(attachmentType)
                            .then(function () {
                                toast.success(langService.get("delete_specific_success").change({name: attachmentType.getNames()}));
                                return true;
                            });
                    });
            },
            /**
             * @description Show confirm box and delete bulk attachment types
             * @param attachmentTypes
             * @param $event
             */
            attachmentTypeDeleteBulk: function (attachmentTypes, $event) {
                return dialog
                    .confirmMessage(langService.get('confirm_delete_selected_multiple'), null, null, $event || null)
                    .then(function () {
                        return self.deleteBulkAttachmentTypes(attachmentTypes)
                            .then(function (result) {
                                var response = false;
                                if (result.length === attachmentTypes.length) {
                                    toast.error(langService.get("failed_delete_selected"));
                                    response = false;
                                } else if (result.length) {
                                    generator.generateFailedBulkActionRecords('delete_success_except_following', _.map(result, function (attachmentType) {
                                        return attachmentType.getNames();
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
         * @description Add new attachment type
         * @param attachmentType
         * @return {Promise|AttachmentType}
         */
        self.addAttachmentType = function (attachmentType) {
            return $http
                .post(urlService.attachmentTypes,
                    generator.interceptSendInstance('AttachmentType', attachmentType))
                .then(function () {
                    return attachmentType;
                });
        };
        /**
         * @description Update the given attachment type.
         * @param attachmentType
         * @return {Promise|AttachmentType}
         */
        self.updateAttachmentType = function (attachmentType) {
            return $http
                .put(urlService.attachmentTypes,
                    generator.interceptSendInstance('AttachmentType', attachmentType))
                .then(function () {
                    return attachmentType;
                });
        };

        /**
         * @description Delete given attachment type.
         * @param attachmentType
         * @return {Promise|null}
         */
        self.deleteAttachmentType = function (attachmentType) {
            var id = attachmentType.hasOwnProperty('id') ? attachmentType.id : attachmentType;
            return $http.delete((urlService.attachmentTypes + '/' + id));
        };

        /**
         * @description Delete bulk attachment types.
         * @param attachmentTypes
         * @return {Promise|null}
         */
        self.deleteBulkAttachmentTypes = function (attachmentTypes) {
            var bulkIds = attachmentTypes[0].hasOwnProperty('id') ? _.map(attachmentTypes, 'id') : attachmentTypes;
            return $http({
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                url: urlService.attachmentTypes + '/bulk',
                data: bulkIds
            }).then(function (result) {
                result = result.data.rs;
                var failedAttachmentTypes = [];
                _.map(result, function (value, key) {
                    if (!value)
                        failedAttachmentTypes.push(key);
                });
                return _.filter(attachmentTypes, function (attachmentType) {
                    return (failedAttachmentTypes.indexOf(attachmentType.id) > -1);
                });
            });
        };

        /**
         * @description Get attachment type by attachmentTypeId
         * @param attachmentTypeId
         * @returns {AttachmentType|undefined} return AttachmentType Model or undefined if not found.
         */
        self.getAttachmentTypeById = function (attachmentTypeId) {
            attachmentTypeId = attachmentTypeId.hasOwnProperty('id') ? attachmentTypeId.id : attachmentTypeId;
            return _.find(self.attachmentTypes, function (attachmentType) {
                return Number(attachmentType.id) === Number(attachmentTypeId)
            });
        };
        /**
         * @description get attachment type by lookup key
         * @param lookupKey
         * @returns {*}
         */
        self.getAttachmentTypeByLookupKey = function (lookupKey) {
            lookupKey = lookupKey.hasOwnProperty('id') ? lookupKey.lookupKey : lookupKey;
            return _.find(self.attachmentTypes, function (lookup) {
                return Number(lookup.lookupKey) === Number(lookupKey)
            }) || lookupKey;
        };

        /**
         * @description Activate attachment type
         * @param attachmentType
         */
        self.activateAttachmentType = function (attachmentType) {
            return $http
                .put((urlService.attachmentTypes + '/activate/' + attachmentType.id))
                .then(function () {
                    return attachmentType;
                });
        };

        /**
         * @description Deactivate attachment type
         * @param attachmentType
         */
        self.deactivateAttachmentType = function (attachmentType) {
            return $http
                .put((urlService.attachmentTypes + '/deactivate/' + attachmentType.id))
                .then(function () {
                    return attachmentType;
                });
        };

        /**
         * @description Activate bulk attachment types
         * @param attachmentTypes
         */
        self.activateBulkAttachmentTypes = function (attachmentTypes) {
            var bulkIds = attachmentTypes[0].hasOwnProperty('id') ? _.map(attachmentTypes, 'id') : attachmentTypes;
            return $http
                .put((urlService.attachmentTypes + '/activate/bulk'), bulkIds)
                .then(function () {
                    return attachmentTypes;
                });
        };

        /**
         * @description Deactivate bulk of attachment types
         * @param attachmentTypes
         */
        self.deactivateBulkAttachmentTypes = function (attachmentTypes) {
            var bulkIds = attachmentTypes[0].hasOwnProperty('id') ? _.map(attachmentTypes, 'id') : attachmentTypes;
            return $http
                .put((urlService.attachmentTypes + '/deactivate/bulk'), bulkIds)
                .then(function () {
                    return attachmentTypes;
                });
        };

        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param attachmentType
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicateAttachmentType = function (attachmentType, editMode) {
            var attachmentTypesToFilter = self.attachmentTypes;
            if (editMode) {
                attachmentTypesToFilter = _.filter(attachmentTypesToFilter, function (attachmentTypeToFilter) {
                    return attachmentTypeToFilter.id !== attachmentType.id;
                });
            }
            return _.some(_.map(attachmentTypesToFilter, function (existingAttachmentType) {
                return existingAttachmentType.arName === attachmentType.arName
                    || existingAttachmentType.enName.toLowerCase() === attachmentType.enName.toLowerCase();
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };

        self.returnAttachmentTypes = function (documentClass) {
            return _.filter(self.attachmentTypes, function (attachmentType) {
                return _.find(attachmentType.lookupStrKey, function (key) {
                    return key.lookupStrKey.toLowerCase() === documentClass.toLowerCase();
                });
            });
        };

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteAttachmentType, self.updateAttachmentType);

    });
};
