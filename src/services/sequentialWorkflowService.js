module.exports = function (app) {
    app.service('sequentialWorkflowService', function (urlService,
                                                       cmsTemplate,
                                                       $http,
                                                       $q,
                                                       generator,
                                                       _,
                                                       dialog,
                                                       langService,
                                                       toast,
                                                       SequentialWF,
                                                       employeeService,
                                                       errorCode) {
        'ngInject';
        var self = this;
        self.serviceName = 'sequentialWorkflowService';

        self.sequentialWorkflows = [];
        self.workflowStepTypes = {
            1: 'sendDocument',
            2: 'authorizeAndSend',
            sendDocument: 1,
            authorizeAndSend: 2
        };

        self.workflowStepActionTypes = {
            user: 0,
            groupMail: 1,
            organization: 2,
            0: 'user',
            1: 'groupMail',
            2: 'organization'
        };

        /**
         * @description Loads all the sequential workflows by regOu
         * @param regOuId
         * @returns {Promise|*}
         */
        self.loadSequentialWorkflowsByRegOu = function (regOuId) {
            if (!regOuId) {
                self.sequentialWorkflows = [];
                return $q.reject('MISSING_REGISTRY_ORGANIZATION');
            }
            return $http.get(urlService.sequentialWorkflow + '/reg-ou/' + generator.getNormalizedValue(regOuId, 'id'))
                .then(function (result) {
                    self.sequentialWorkflows = generator.generateCollection(result.data.rs, SequentialWF, self._sharedMethods);
                    self.sequentialWorkflows = generator.interceptReceivedCollection('SequentialWF', self.sequentialWorkflows);
                    return self.sequentialWorkflows;
                });
        };

        /**
         * @description Loads the sequential workflow by sequentialWorkflowId
         * @param sequentialWorkflowId
         * @returns {Promise|*}
         */
        self.loadSequentialWorkflowById = function (sequentialWorkflowId) {
            if (!sequentialWorkflowId) {
                return $q.reject('sequentialWorkflowId is missing');
            }
            return $http.get(urlService.sequentialWorkflow + '/' + generator.getNormalizedValue(sequentialWorkflowId, 'id'))
                .then(function (result) {
                    return generator.interceptReceivedInstance('SequentialWF', generator.generateInstance(result.data.rs, SequentialWF, self._sharedMethods));
                });
        };

        /**
         * @description Loads all the active sequential workflows by regOu and docClassId
         * @param regOuId
         * @param docClassId
         * @returns {Promise|*}
         */
        self.loadSequentialWorkflowsByRegOuDocClassActive = function (regOuId, docClassId) {
            if (!regOuId) {
                return $q.reject('MISSING_REGISTRY_ORGANIZATION');
            }
            if (!generator.validRequired(docClassId)) {
                return $q.reject('docClassId is missing');
            }
            var url = urlService.sequentialWorkflow + '/reg-ou/' + generator.getNormalizedValue(regOuId, 'id') + '/doc-class-id/' + generator.getNormalizedValue(docClassId, 'id');
            return $http.get(url)
                .then(function (result) {
                    return generator.interceptReceivedCollection('SequentialWF', generator.generateCollection(result.data.rs, SequentialWF, self._sharedMethods));
                });
        };

        /**
         * @description Contains methods for CRUD operations for sequential workflow
         */
        self.controllerMethod = {
            /**
             * @description Opens popup to add new sequential workflow
             * @param regOuId
             * @param $event
             */
            sequentialWorkflowAdd: function (regOuId, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('sequential-workflow'),
                        controller: 'sequentialWorkflowPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: false,
                            viewOnly: false,
                            sequentialWorkflow: new SequentialWF({
                                regOUId: regOuId ? generator.getNormalizedValue(regOuId, 'id') : null,
                                creatorId: employeeService.getEmployee().id,
                                creatorOUId: employeeService.getEmployee().getOUID()
                            })
                        }
                    });
            },
            /**
             * @description Opens popup to add new sequential workflow as copy of given record
             * @param sequentialWorkflow
             * @param regOuId
             * @param $event
             */
            sequentialWorkflowCopy: function (sequentialWorkflow, regOuId, $event) {
                var newSequentialWF = angular.copy(sequentialWorkflow);

                newSequentialWF.id = null;
                newSequentialWF.regOUId = regOuId ? generator.getNormalizedValue(regOuId, 'id') : null;
                newSequentialWF.creatorId = employeeService.getEmployee().id;
                newSequentialWF.creatorOUId = employeeService.getEmployee().getOUID();
                newSequentialWF.steps = _.map(sequentialWorkflow.steps, function (step) {
                    step.id = null;
                    return step;
                });
                newSequentialWF.stepRows = angular.copy(newSequentialWF.steps);

                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('sequential-workflow'),
                        controller: 'sequentialWorkflowPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: false,
                            viewOnly: false,
                            sequentialWorkflow: newSequentialWF
                        }
                    });
            },
            /**
             * @description Opens popup to edit sequential workflow
             * @param sequentialWorkflow
             * @param $event
             */
            sequentialWorkflowEdit: function (sequentialWorkflow, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('sequential-workflow'),
                        controller: 'sequentialWorkflowPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: true,
                            viewOnly: false,
                            sequentialWorkflow: angular.copy(sequentialWorkflow)
                        }
                    });
            },
            /**
             * @description Opens popup to view sequential workflow
             * @param sequentialWorkflow
             * @param $event
             */
            sequentialWorkflowView: function (sequentialWorkflow, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('sequential-workflow'),
                        controller: 'sequentialWorkflowPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: true,
                            viewOnly: true,
                            sequentialWorkflow: angular.copy(sequentialWorkflow)
                        }
                    });
            },
            /**
             * @description Show confirm box and delete sequential workflow
             * @param sequentialWorkflow
             * @param $event
             */
            sequentialWorkflowDelete: function (sequentialWorkflow, $event) {
                return dialog
                    .confirmMessage(langService.get('confirm_delete').change({name: sequentialWorkflow.getNames()}), null, null, $event)
                    .then(function () {
                        return self.deleteSequentialWorkflow(sequentialWorkflow)
                            .then(function () {
                                toast.success(langService.get("delete_specific_success").change({name: sequentialWorkflow.getNames()}));
                                return true;
                            });
                    });
            },
            /**
             * @description Show confirm box and delete bulk sequential workflows
             * @param sequentialWorkflows
             * @param $event
             */
            sequentialWorkflowDeleteBulk: function (sequentialWorkflows, $event) {
                return dialog
                    .confirmMessage(langService.get('confirm_delete_selected_multiple'), null, null, $event || null)
                    .then(function () {
                        return self.deleteBulkSequentialWorkflows(sequentialWorkflows)
                            .then(function (result) {
                                var response = false;
                                if (result.length === sequentialWorkflows.length) {
                                    toast.error(langService.get("failed_delete_selected"));
                                    response = false;
                                } else if (result.length) {
                                    generator.generateFailedBulkActionRecords('delete_success_except_following', _.map(result, function (item) {
                                        return item.getNames();
                                    }));
                                    response = true;
                                } else {
                                    toast.success(langService.get("delete_success"));
                                    response = true;
                                }
                                return response;
                            });
                    });
            },
            /**
             * @description Opens popup to edit sequential workflow step
             * @param sequentialWorkflow
             * @param sequentialWorkflowStep
             * @param viewOnly
             * @param $event
             */
            sequentialWorkflowStepEdit: function (sequentialWorkflow, sequentialWorkflowStep, viewOnly, $event) {
                var step = angular.copy(sequentialWorkflowStep);

                // if new step and seqWF is internal, set organization to selected regOu as WF will be inside organization only
                if (!sequentialWorkflowStep.id && sequentialWorkflow.isInternalSeqWF()) {
                    step.uiOuId = sequentialWorkflow.regOUId;
                }

                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('sequential-workflow-step'),
                        controller: 'sequentialWorkflowStepPopCtrl',
                        controllerAs: 'ctrl',
                        bindToController: true,
                        locals: {
                            record: angular.copy(sequentialWorkflow),
                            step: step,
                            viewOnly: viewOnly
                        },
                        resolve: {
                            organizations: function (organizationService) {
                                'ngInject';
                                return organizationService.loadOrganizations(true, true)
                                    .then(function (result) {
                                        return _.filter(result, function (ou) {
                                            return !!ou.status && ou.hasRegistry;
                                        })
                                    });
                            },
                            workflowActions: function (workflowActionService) {
                                'ngInject';
                                return workflowActionService.loadCurrentUserWorkflowActions();
                            },
                            comments: function (userCommentService) {
                                'ngInject';
                                return userCommentService.loadUserCommentsForDistribution();
                            },
                            ouApplicationUsers: function (ouApplicationUserService) {
                                'ngInject';
                                if (!step.uiOuId) {
                                    return [];
                                }
                                return ouApplicationUserService
                                    .searchByCriteria({regOu: generator.getNormalizedValue(step.uiOuId, 'id')})
                                    .then(function (result) {
                                        return _.map(result, function (item) {
                                            item.userIdAndOuId = item.getUserIdAndOuIdCombination();
                                            return item;
                                        });
                                    });
                            }
                        }
                    });
            },

        };

        /**
         * @description Add new sequential workflow
         * @param sequentialWorkflow
         * @return {Promise|DocumentTemplate}
         */
        self.addSequentialWorkflow = function (sequentialWorkflow) {
            return $http
                .post(urlService.sequentialWorkflow, generator.interceptSendInstance('SequentialWF', sequentialWorkflow))
                .then(function (result) {
                    return sequentialWorkflow;
                })
                .catch(function (error) {
                    return errorCode.showErrorDialog(error, null, generator.getTranslatedError(error));
                });
        };

        /**
         * @description Update the given sequential workflow
         * @param sequentialWorkflow
         * @return {Promise|DocumentTemplate}
         */
        self.updateSequentialWorkflow = function (sequentialWorkflow) {
            return $http
                .put(urlService.sequentialWorkflow, generator.interceptSendInstance('SequentialWF', sequentialWorkflow))
                .then(function () {
                    return sequentialWorkflow;
                })
                .catch(function (error) {
                    return errorCode.showErrorDialog(error, null, generator.getTranslatedError(error));
                });
        };

        /**
         * @description Activate sequential workflow
         * @param sequentialWorkflow
         */
        self.activateSequentialWorkflow = function (sequentialWorkflow) {
            return $http
                .put((urlService.sequentialWorkflow + '/activate/' + generator.getNormalizedValue(sequentialWorkflow, 'id')))
                .then(function () {
                    return sequentialWorkflow;
                });
        };

        /**
         * @description Deactivate sequential workflow
         * @param sequentialWorkflow
         */
        self.deactivateSequentialWorkflow = function (sequentialWorkflow) {
            return $http
                .put((urlService.sequentialWorkflow + '/deactivate/' + generator.getNormalizedValue(sequentialWorkflow, 'id')))
                .then(function () {
                    return sequentialWorkflow;
                });
        };

        /**
         * @description Activate bulk of sequential workflows
         * @param sequentialWorkflows
         */
        self.activateBulkSequentialWorkflows = function (sequentialWorkflows) {
            var bulkIds = sequentialWorkflows[0].hasOwnProperty('id') ? _.map(sequentialWorkflows, 'id') : sequentialWorkflows;
            return $http
                .put((urlService.sequentialWorkflow + '/activate/bulk'), bulkIds)
                .then(function () {
                    return sequentialWorkflows;
                });
        };

        /**
         * @description Deactivate bulk of sequential workflows
         * @param sequentialWorkflows
         */
        self.deactivateBulkSequentialWorkflows = function (sequentialWorkflows) {
            var bulkIds = sequentialWorkflows[0].hasOwnProperty('id') ? _.map(sequentialWorkflows, 'id') : sequentialWorkflows;
            return $http
                .put((urlService.sequentialWorkflow + '/deactivate/bulk'), bulkIds)
                .then(function () {
                    return sequentialWorkflows;
                });
        };

        /**
         * @description Delete given sequential workflow.
         * @param sequentialWorkflow
         * @return {Promise|null}
         */
        self.deleteSequentialWorkflow = function (sequentialWorkflow) {
            return $http.delete(urlService.sequentialWorkflow + '/' + generator.getNormalizedValue(sequentialWorkflow, 'id'))
                .catch(function (error) {
                    return errorCode.showErrorDialog(error);
                });
        };

        /**
         * @description Delete bulk sequential workflows.
         * @param sequentialWorkflows
         * @return {Promise|null}
         */
        self.deleteBulkSequentialWorkflows = function (sequentialWorkflows) {
            var bulkIds = sequentialWorkflows[0].hasOwnProperty('id') ? _.map(sequentialWorkflows, 'id') : sequentialWorkflows;
            return $http({
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                url: urlService.sequentialWorkflow + '/bulk',
                data: bulkIds
            }).then(function (result) {
                result = result.data.rs;
                var failedRecords = [];
                _.map(result, function (value, key) {
                    if (!value)
                        failedRecords.push(key);
                });
                return _.filter(sequentialWorkflows, function (item) {
                    return (failedRecords.indexOf(item.id) > -1);
                });
            });
        };

        /**
         * @description Launches the sequential workflow for given record
         * @param record
         * @param seqWFId
         * @param content
         * @param ignoreValidateMultiSign
         */
        self.launchSequentialWorkflow = function (record, seqWFId, ignoreValidateMultiSign, content) {
            var info = record.getInfo();
            var data = {
                vsid: info.vsId,
                wobNum: info.isWorkItem() ? info.wobNumber : null,
                validateMultiSignature: !ignoreValidateMultiSign,
                seqWFId: generator.getNormalizedValue(seqWFId, 'id')
            };
            var form = new FormData();
            form.append('entity', JSON.stringify(data));
            if (content)
                form.append('content', content);
            //TODO: send (authorizedFile after annotation) as content in formData if authorize step
            return $http
                .post((urlService.correspondenceWF + '/' + info.documentClass + '/seq-wf/launch'), form, {
                    headers: {
                        'Content-Type': undefined
                    }
                }).then(function (result) {
                    return result.data.rs;
                });
        };

        /**
         * @description Advance the sequential workflow to next step for given record
         * @param record
         * @param content
         * @param ignoreValidateMultiSign
         */
        self.launchNextStepSequentialWorkflow = function (record, ignoreValidateMultiSign, content) {
            var info = record.getInfo();
            var data = {
                vsid: info.vsId,
                wobNum: info.isWorkItem() ? info.wobNumber : null,
                validateMultiSignature: !ignoreValidateMultiSign,
                seqWFId: generator.getNormalizedValue(record.getSeqWFId(), 'id')
            };
            var form = new FormData();
            form.append('entity', JSON.stringify(data));

            if (content)
                form.append('content', content);
            //TODO: send (authorizedFile after annotation) as content in formData if authorize step
            return $http
                .post((urlService.correspondenceWF + '/' + info.documentClass + '/seq-wf/advance'), form, {
                    headers: {
                        'Content-Type': undefined
                    }
                }).then(function (result) {
                    return result.data.rs;
                }).catch(function (error) {
                    return errorCode.showErrorDialog(error, null, generator.getTranslatedError(error));
                });
        };

        /**
         * @description launch seqWF of run next step
         * @param correspondence
         * @param signatureModel
         * @param content
         * @param launch
         * @param terminateAllWFS
         * @return {*}
         */
        self.launchSeqWFCorrespondence = function (correspondence, signatureModel, content, launch, terminateAllWFS) {
            var info = correspondence.getInfo();
            var form = new FormData();

            if (terminateAllWFS) {
                signatureModel.terminateAllWFS = true;
            }
            form.append('entity', JSON.stringify(signatureModel));
            if (content) {
                form.append('content', content);
            }
            return $http
                .post((urlService.correspondenceWF + '/' + info.documentClass + '/seq-wf/' + (launch ? 'launch' : 'advance')), form, {
                    headers: {
                        'Content-Type': undefined
                    }
                }).then(function (result) {
                    return result.data.rs;
                }).catch(function (error) {
                    return errorCode.showErrorDialog(error, null, generator.getTranslatedError(error));
                });
        };
        /**
         * @description create the shared method to the model.
         * @type {{delete: generator.delete, update: generator.update}}
         * @private
         */
        self._sharedMethods = generator.generateSharedMethods(self.deleteSequentialWorkflow, self.updateSequentialWorkflow);
    });
};
