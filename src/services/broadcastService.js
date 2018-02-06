module.exports = function (app) {
    app.service('broadcastService', function (urlService,
                                              $http,
                                              $q,
                                              generator,
                                              _,
                                              dialog,
                                              langService,
                                              toast,
                                              OUBroadcast,
                                              WorkflowGroup,
                                              WorkflowAction,
                                              cmsTemplate) {
        'ngInject';
        var self = this;
        self.serviceName = 'broadcastService';
        self.ouBroadcast = [];
        self.actions = [];

        /**
         * @description Contains methods for CRUD operations for broadcast record
         */
        self.controllerMethod = {
            /**
             * @description Opens popup to Send broadcast
             * @param model
             * @param $event
             */
            broadcastSend: function (model, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        template: cmsTemplate.getPopup('broadcast'),
                        controller: 'broadcastPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            vsId: (model && model.hasOwnProperty('vsId')) ? model.vsId : model
                        },
                        resolve: {
                            organizations: function (broadcastService) {
                                'ngInject';
                                return broadcastService.loadOrganizationGroups();
                            },
                            actions: function (broadcastService) {
                                'ngInject';
                                return broadcastService.loadActions();
                            },
                            workflowGroups: function (broadcastService) {
                                'ngInject';
                                return broadcastService.loadWorkflowGroups();
                            }
                        }
                    });
            }
        };

        /**
         * @description Load reg OU from server.
         * @returns {Promise}
         */
        self.loadOrganizationGroups = function () {
            return $http.get(urlService["ouDistributionWorkflow"]).then(function (result) {
                self.ouBroadcast = generator.generateCollection(result.data.rs, OUBroadcast, self._sharedMethods);
                self.ouBroadcast = generator.interceptReceivedCollection('OUBroadcast', result.data.rs);
                return self.ouBroadcast;
            });
        };

        /**
         * @description load workflow group from server
         */
        self.loadWorkflowGroups = function () {
            return $http.get(urlService.workflowGroupDistributionWorkflow).then(function (result) {
                var workflowGroups = _.map(result.data.rs, function (workflowGroup) {
                    return workflowGroup.wfgroup;
                });

                self.workflowGroups = generator.generateCollection(workflowGroups, WorkflowGroup, self._sharedMethods);
                return self.workflowGroups;
            })
                .catch(function () {
                    return [];
                });
        };

        /**
         * @description load actions from server
         */
        self.loadActions = function () {
            return $http.get(urlService["actionsDistributionWorkflow"]).then(function (result) {
                self.actions = generator.generateCollection(result.data.rs, WorkflowAction, self._sharedMethods);
                return self.actions;
            })
        };

        /**
         * @description broadcast all selected organizations and workflow groups
         * @param broadcast
         * @param vsId
         */
        self.broadcast = function (broadcast, vsId) {
            return $http
                .post(urlService.broadcast.replace('{{VSID}}', vsId),
                    generator.interceptSendInstance('Broadcast', broadcast))
                .then(function (result) {
                    toast.success(langService.get("broadcast_success"));
                }).catch(function () {
                    toast.error(langService.get("failed"));
                });
        };

        /**
         * @description Create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteBroadcast, self.updateBroadcast);
    });
};
