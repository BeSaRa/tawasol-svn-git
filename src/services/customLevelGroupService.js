module.exports = function (app) {
    app.service('customLevelGroupService', function (urlService,
                                                     $http,
                                                     $q,
                                                     generator,
                                                     dialog,
                                                     cmsTemplate,
                                                     CustomLevelGroup,
                                                     langService,
                                                     toast,
                                                     _) {
        'ngInject';
        var self = this;
        self.serviceName = 'customLevelGroupService';

        self.customLevelGroups = [];

        /**
         * @description Load the custom level groupsfrom server.
         * @returns {Promise|customLevelGroups}
         */
        self.loadCustomLevelGroups = function () {
            return $http.get(urlService.applicationUserLevel).then(function (result) {
                self.customLevelGroups = generator.generateCollection(result.data.rs, CustomLevelGroup, self._sharedMethods);
                self.customLevelGroups = generator.interceptReceivedCollection('CustomLevelGroup', self.customLevelGroups);
                return self.customLevelGroups;
            });
        };
        /**
         * @description Get custom level group from self.customLevelGroups if found and if not load it from server again.
         * @returns {Promise|customLevelGroups}
         */
        self.getCustomLevelGroups = function () {
            return self.customLevelGroups.length ? $q.when(self.customLevelGroups) : self.loadCustomLevelGroups();
        };

        /**
         * @description Contains methods for CRUD operations for custom level group
         */
        self.controllerMethod = {
            /**
             * @description Opens popup to add new custom level group
             * @param $event
             */
            customLevelGroupAdd: function ($event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('custom-level-group'),
                        controller: 'customLevelGroupPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: false,
                            customLevelGroup: new CustomLevelGroup(),
                            customLevelGroups: self.customLevelGroups,
                            readOnlyLevels: false
                        }
                    });
            },
            /**
             * @description Opens popup to edit custom level group
             * @param customLevelGroup
             * @param readOnlyLevels
             * @param $event
             */
            customLevelGroupEdit: function (customLevelGroup, readOnlyLevels, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('custom-level-group'),
                        controller: 'customLevelGroupPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: true,
                            customLevelGroup: customLevelGroup,
                            customLevelGroups: self.customLevelGroups,
                            readOnlyLevels: readOnlyLevels
                        }
                    });
            },
            customLevelGroupDelete: function (customLevelGroup, $event) {
                return dialog.confirmMessage(langService.get('confirm_delete').change({name: customLevelGroup.getNames()}))
                    .then(function () {
                        return self.deleteCustomLevelGroup(customLevelGroup).then(function () {
                            toast.success(langService.get("delete_specific_success").change({name: langService.getNames()}));
                            return true;
                        })
                    });
            }
        };

        /**
         * @description Add new custom level group
         * @param customLevelGroup
         * @return {Promise|CustomLevelGroup}
         */
        self.addCustomLevelGroup = function (customLevelGroup) {
            return $http
                .post(urlService.applicationUserLevel,
                    generator.interceptSendInstance('CustomLevelGroup', customLevelGroup))
                .then(function () {
                    return customLevelGroup;
                });
        };
        /**
         * @description Update the given custom level group.
         * @param customLevelGroup
         * @return {Promise|CustomLevelGroup}
         */
        self.updateCustomLevelGroup = function (customLevelGroup) {
            return $http
                .put(urlService.applicationUserLevel,
                    generator.interceptSendInstance('CustomLevelGroup', customLevelGroup))
                .then(function () {
                    return customLevelGroup;
                });
        };

        /**
         * @description delete given CustomLevelGroup.
         * @param customLevelGroup
         * @return {Promise|null}
         */
        self.deleteCustomLevelGroup = function (customLevelGroup) {
            var id = customLevelGroup.hasOwnProperty('id') ? customLevelGroup.id : customLevelGroup;
            return $http.delete(urlService.applicationUserLevel + '/' + id).then(function (result) {
                return result;
            });
        };

        /**
         * @description Activate custom level group
         * @param customLevelGroup
         */
        self.activateCustomLevelGroup = function (customLevelGroup) {
            return $http
                .put((urlService.applicationUserLevel + '/activate/' + customLevelGroup.id))
                .then(function () {
                    return customLevelGroup;
                });
        };

        /**
         * @description Deactivate custom level group
         * @param customLevelGroup
         */
        self.deactivateCustomLevelGroup = function (customLevelGroup) {
            return $http
                .put((urlService.applicationUserLevel + '/deactivate/' + customLevelGroup.id))
                .then(function () {
                    return customLevelGroup;
                });
        };

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteCustomLevelGroup, self.updateCustomLevelGroup);

    });
};
