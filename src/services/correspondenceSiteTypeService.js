module.exports = function (app) {
    app.service('correspondenceSiteTypeService', function (urlService,
                                                           $http,
                                                           $q,
                                                           generator,
                                                           CorrespondenceSiteType,
                                                           _,
                                                           dialog,
                                                           langService,
                                                           toast, 
                                                           cmsTemplate) {
        'ngInject';
        var self = this;
        self.serviceName = 'correspondenceSiteTypeService';

        self.correspondenceSiteTypes = [];

        /**
         * @description load correspondence site types from server.
         * @returns {Promise|correspondenceSiteTypes}
         */
        self.loadCorrespondenceSiteTypes = function () {
            return $http.get(urlService.correspondenceSiteTypes).then(function (result) {
                self.correspondenceSiteTypes = generator.generateCollection(result.data.rs, CorrespondenceSiteType, self._sharedMethods);
                self.correspondenceSiteTypes = generator.interceptReceivedCollection('CorrespondenceSiteType', self.correspondenceSiteTypes);
                return self.correspondenceSiteTypes;
            });
        };
        /**
         * @description get correspondence site types from self.correspondenceSiteTypes if found and if not load it from server again.
         * @returns {Promise|correspondenceSiteTypes}
         */
        self.getCorrespondenceSiteTypes = function () {
            return self.correspondenceSiteTypes.length ? $q.when(self.correspondenceSiteTypes) : self.loadCorrespondenceSiteTypes();
        };

        /**
         * @description Contains methods for CRUD operations for correspondence site types
         */
        self.controllerMethod = {
            correspondenceSiteTypeAdd: function ($event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        template: cmsTemplate.getPopup('correspondence-site-type'),
                        controller: 'correspondenceSiteTypePopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: false,
                            correspondenceSiteType: new CorrespondenceSiteType(
                                {
                                    itemOrder: generator.createNewID(self.correspondenceSiteTypes, 'itemOrder')
                                }),
                            correspondenceSiteTypes: self.correspondenceSiteType
                        }
                    });
            },
            correspondenceSiteTypeEdit: function (correspondenceSiteType, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        template: cmsTemplate.getPopup('correspondence-site-type'),
                        controller: 'correspondenceSiteTypePopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: true,
                            correspondenceSiteType: angular.copy(correspondenceSiteType)
                        }
                    });
            },
            correspondenceSiteTypeDelete: function (correspondenceSiteType) {
                return dialog.confirmMessage(langService.get('confirm_delete').change({name: correspondenceSiteType.getNames()}))
                    .then(function () {
                        return self.deleteCorrespondenceSiteType(correspondenceSiteType).then(function () {
                            toast.success(langService.get("delete_specific_success").change({name: correspondenceSiteType.getNames()}));
                            return true;
                        })
                    });
            },
            correspondenceSiteTypeDeleteBulk: function (correspondenceSiteTypes) {
                return dialog.confirmMessage(langService.get('confirm_delete_selected_multiple'))
                    .then(function () {
                        return self.deleteBulkCorrespondenceSiteTypes(correspondenceSiteTypes).then(function (result) {
                            var response = false;
                            if (result.length === correspondenceSiteTypes.length) {
                                toast.error(langService.get("failed_delete_selected"));
                                response = false;
                            }
                            else if (result.length) {
                                generator.generateFailedBulkActionRecords('delete_success_except_following', _.map(result, function (correspondenceSiteType) {
                                    return correspondenceSiteType.getNames();
                                }));
                                response = true;
                            }
                            else {
                                toast.success(langService.get("delete_success"));
                                response = true;
                            }
                            return response;
                        });
                    });
            }
        };

        /**
         * @description add new correspondence site type
         * @param correspondenceSiteType
         * @return {Promise|CorrespondenceSiteType}
         */
        self.addCorrespondenceSiteType = function (correspondenceSiteType) {
            return $http
                .post(urlService.correspondenceSiteTypes,
                    generator.interceptSendInstance('CorrespondenceSiteType', correspondenceSiteType))
                .then(function (result) {
                    correspondenceSiteType.id = result.data.rs;
                    return generator.interceptReceivedInstance('CorrespondenceSiteType', generator.generateInstance(result.data.rs, CorrespondenceSiteType, self._sharedMethods));
                });
        };
        /**
         * @description make an update for given correspondence site type.
         * @param correspondenceSiteType
         * @return {Promise|CorrespondenceSiteType}
         */
        self.updateCorrespondenceSiteType = function (correspondenceSiteType) {
            return $http
                .put(urlService.correspondenceSiteTypes,
                    generator.interceptSendInstance('CorrespondenceSiteType', correspondenceSiteType))
                .then(function () {
                    return generator.interceptReceivedInstance('CorrespondenceSiteType', generator.generateInstance(correspondenceSiteType, CorrespondenceSiteType, self._sharedMethods));
                });
        };
        /**
         * @description delete given correspondence site type.
         * @param correspondenceSiteType
         * @return {Promise|null}
         */
        self.deleteCorrespondenceSiteType = function (correspondenceSiteType) {
            var id = correspondenceSiteType.hasOwnProperty('id') ? correspondenceSiteType.id : correspondenceSiteType;
            return $http.delete(urlService.correspondenceSiteTypes + '/' + id);
        };

        /**
         * @description delete bulk correspondence site types.
         * @param correspondenceSiteTypes
         * @return {Promise|null}
         */
        self.deleteBulkCorrespondenceSiteTypes = function (correspondenceSiteTypes) {
            var bulkIds = correspondenceSiteTypes[0].hasOwnProperty('id') ? _.map(correspondenceSiteTypes, 'id') : correspondenceSiteTypes;
            return $http({
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                url: urlService.correspondenceSiteTypes + '/bulk',
                data: bulkIds
            }).then(function (result) {
                result = result.data.rs;
                var failedCorrespondenceSiteTypes = [];
                _.map(result, function (value, key) {
                    if (!value)
                        failedCorrespondenceSiteTypes.push(key);
                });
                return _.filter(correspondenceSiteTypes, function (correspondenceSiteType) {
                    return (failedCorrespondenceSiteTypes.indexOf(correspondenceSiteType.id) > -1);
                });
            });
        };

        /**
         * @description get correspondence site type by correspondenceSiteTypeId
         * @param correspondenceSiteTypeId
         * @returns {CorrespondenceSiteType|undefined} return CorrespondenceSiteType Model or undefined if not found.
         */
        self.getCorrespondenceSiteTypeById = function (correspondenceSiteTypeId) {
            correspondenceSiteTypeId = correspondenceSiteTypeId instanceof CorrespondenceSiteType ? correspondenceSiteTypeId.id : correspondenceSiteTypeId;
            return _.find(self.correspondenceSiteTypes, function (correspondenceSiteType) {
                return Number(correspondenceSiteType.id) === Number(correspondenceSiteTypeId)
            });
        };

        /**
         * @description activate correspondence site type
         * @param correspondenceSiteType
         */
        self.activateCorrespondenceSiteType = function (correspondenceSiteType) {
            return $http
                .put((urlService.correspondenceSiteTypes + '/activate/' + correspondenceSiteType.id))
                .then(function () {
                    return correspondenceSiteType;
                });
        };

        /**
         * @description Deactivate correspondence site type
         * @param correspondenceSiteType
         */
        self.deactivateCorrespondenceSiteType = function (correspondenceSiteType) {
            return $http
                .put((urlService.correspondenceSiteTypes + '/deactivate/' + correspondenceSiteType.id))
                .then(function () {
                    return correspondenceSiteType;
                });
        };

        /**
         * @description Activate bulk of correspondence site types
         * @param correspondenceSiteTypes
         */
        self.activateBulkCorrespondenceSiteTypes = function (correspondenceSiteTypes) {
            return $http
                .put((urlService.correspondenceSiteTypes + '/activate/bulk'), _.map(correspondenceSiteTypes, 'id'))
                .then(function () {
                    return correspondenceSiteTypes;
                });
        };

        /**
         * @description Deactivate bulk of correspondence site types
         * @param correspondenceSiteTypes
         */
        self.deactivateBulkCorrespondenceSiteTypes = function (correspondenceSiteTypes) {
            return $http
                .put((urlService.correspondenceSiteTypes + '/deactivate/bulk'), _.map(correspondenceSiteTypes, 'id'))
                .then(function () {
                    return correspondenceSiteTypes;
                });
        };

        /**
         * @description Check if record with same name exists. Returns true if exists
         * @param correspondenceSiteType
         * @param editMode
         * @returns {boolean}
         */
        self.checkDuplicateCorrespondenceSiteType = function (correspondenceSiteType, editMode) {
            var correspondenceSiteTypesToFilter = self.correspondenceSiteTypes;
            if (editMode) {
                correspondenceSiteTypesToFilter = _.filter(correspondenceSiteTypesToFilter, function (correspondenceSiteTypeToFilter) {
                    return correspondenceSiteTypeToFilter.id !== correspondenceSiteType.id;
                });
            }
            return _.some(_.map(correspondenceSiteTypesToFilter, function (existingCorrespondenceSiteType) {
                return existingCorrespondenceSiteType.arName === correspondenceSiteType.arName
                    || existingCorrespondenceSiteType.enName.toLowerCase() === correspondenceSiteType.enName.toLowerCase()
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };
       /* /!**
         * @description Check if record with same item order exists. Returns true if exists
         * @param correspondenceSiteType
         * @param editMode
         * @returns {boolean}
         *!/
        self.checkDuplicateCorrespondenceSiteTypeItemOrder = function (correspondenceSiteType, editMode) {
            var correspondenceSiteTypesToFilter = self.correspondenceSiteTypes;
            if (editMode) {
                correspondenceSiteTypesToFilter = _.filter(correspondenceSiteTypesToFilter, function (correspondenceSiteTypeToFilter) {
                    return correspondenceSiteTypeToFilter.id !== correspondenceSiteType.id;
                });
            }
            return _.some(_.map(correspondenceSiteTypesToFilter, function (existingCorrespondenceSiteType) {
                return existingCorrespondenceSiteType.itemOrder === Number(correspondenceSiteType.itemOrder);
            }), function (matchingResult) {
                return matchingResult === true;
            });
        };*/

        /**
         * @description create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteCorrespondenceSiteType, self.updateCorrespondenceSiteType);
        /**
         * @description get correspondence site Type by LookupKey
         * @param lookupKey
         */
        self.getCorrespondenceSiteTypeByLookupKey = function (lookupKey) {
            lookupKey = lookupKey.hasOwnProperty('id') ? lookupKey.lookupKey : lookupKey;
            return _.find(self.correspondenceSiteTypes, function (item) {
                return Number(lookupKey) === Number(item.lookupKey);
            });
        }

    });
};
