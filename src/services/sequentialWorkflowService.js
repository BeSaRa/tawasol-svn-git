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
                                                       PDFService,
                                                       SequentialWF,
                                                       PDFViewer,
                                                       AnnotationType,
                                                       downloadService,
                                                       employeeService,
                                                       SequentialWFResult,
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

        self.stepsUsageTypes = {
            launchWF: 'launch',
            manageWFSteps: 'manage-steps',
            viewWFSteps: 'view-steps',
            viewWFStatusSteps: 'view-wf-status-steps'
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
             * @param docClassId
             * @param $event
             */
            sequentialWorkflowAdd: function (regOuId, docClassId, $event) {
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
                                /*creatorId: employeeService.getEmployee().id,
                                creatorOUId: employeeService.getEmployee().getOUID()*/
                            }),
                            defaultDocClass: (generator.validRequired(docClassId) ? docClassId : null)
                        }
                    });
            },
            /**
             * @description Opens popup to add new sequential workflow as copy of given record
             * @param sequentialWorkflow
             * @param regOuId
             * @param adHoc
             * @param $event
             */
            sequentialWorkflowCopy: function (sequentialWorkflow, regOuId, adHoc, $event) {
                return dialog
                    .showDialog({
                        targetEvent: $event,
                        templateUrl: cmsTemplate.getPopup('sequential-workflow'),
                        controller: 'sequentialWorkflowPopCtrl',
                        controllerAs: 'ctrl',
                        locals: {
                            editMode: false,
                            viewOnly: false,
                            defaultDocClass: adHoc ? sequentialWorkflow.docClassID : null
                        },
                        resolve: {
                            sequentialWorkflow: function () {
                                'ngInject';
                                return self.loadSequentialWorkflowById(sequentialWorkflow)
                                    .then(function (newSequentialWF) {
                                        newSequentialWF.id = null;
                                        newSequentialWF.regOUId = regOuId ? generator.getNormalizedValue(regOuId, 'id') : null;
                                        newSequentialWF.steps = _.map(newSequentialWF.steps, function (step) {
                                            step.id = null;
                                            return step;
                                        });
                                        newSequentialWF.isAdhoc = adHoc;
                                        newSequentialWF.stepRows = angular.copy(newSequentialWF.steps);

                                        return newSequentialWF;
                                    });
                            }
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
                            defaultDocClass: null
                        },
                        resolve: {
                            sequentialWorkflow: function () {
                                'ngInject';
                                return self.loadSequentialWorkflowById(sequentialWorkflow);
                            }
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
                            defaultDocClass: null
                        },
                        resolve: {
                            sequentialWorkflow: function () {
                                'ngInject';
                                return self.loadSequentialWorkflowById(sequentialWorkflow);
                            }
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
                        return self.deleteBulkSequentialWorkflows(sequentialWorkflows);
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
                var step = angular.copy(sequentialWorkflowStep),
                    defer = $q.defer();

                /*// if new step and seqWF is internal, set organization to selected regOu as WF will be inside organization only
                if (!sequentialWorkflowStep.id && sequentialWorkflow.isInternalSeqWF()) {
                    step.uiOuId = sequentialWorkflow.regOUId;
                }*/

                // if not view only, proceed
                // otherwise, load seqWF by id and use it as record and use step from it
                if (!viewOnly) {
                    defer.resolve(sequentialWorkflow);
                } else {
                    self.loadSequentialWorkflowById(sequentialWorkflow)
                        .then(function (result) {
                            step = _.find(result.stepRows, function (item) {
                                return generator.getNormalizedValue(item, 'id') === generator.getNormalizedValue(step, 'id');
                            });
                            defer.resolve(result);
                        });
                }

                return defer.promise.then(function (seqWF) {
                    return dialog
                        .showDialog({
                            targetEvent: $event,
                            templateUrl: cmsTemplate.getPopup('sequential-workflow-step'),
                            controller: 'sequentialWorkflowStepPopCtrl',
                            controllerAs: 'ctrl',
                            bindToController: true,
                            locals: {
                                seqWF: seqWF,
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
                                workflowActions: function (workflowActionService, WorkflowAction) {
                                    'ngInject';
                                    return workflowActionService.loadCurrentUserWorkflowActions()
                                        .then(function (result) {
                                            // if not viewOnly, return normally all actions
                                            // otherwise, push the missing wfAction from actionInfo (if actionInfo is missing, return normally all actions)
                                            if (!viewOnly || !step.actionInfo || !step.actionInfo.id) {
                                                return result;
                                            }
                                            var index = _.findIndex(result, function (item) {
                                                return generator.getNormalizedValue(item, 'id') === generator.getNormalizedValue(step, 'actionId');
                                            });
                                            if (index === -1) {
                                                result.push(new WorkflowAction({
                                                    arName: step.actionInfo.arName,
                                                    enName: step.actionInfo.enName,
                                                    id: step.actionInfo.id
                                                }))
                                            }
                                            return result;
                                        });
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
                });
            },

        };

        /**
         * @description Add new sequential workflow
         * @param sequentialWorkflow
         * @return {Promise|SequentialWF}
         */
        self.addSequentialWorkflow = function (sequentialWorkflow) {
            return $http
                .post(urlService.sequentialWorkflow, generator.interceptSendInstance('SequentialWF', sequentialWorkflow))
                .then(function (result) {
                    sequentialWorkflow.id = result.data.rs;
                    sequentialWorkflow.steps = angular.copy(sequentialWorkflow.stepRows);
                    return generator.interceptReceivedInstance('SequentialWF', sequentialWorkflow);
                })
                .catch(function (error) {
                    return errorCode.showErrorDialog(error, null, generator.getTranslatedError(error));
                });
        };

        /**
         * @description Update the given sequential workflow
         * @param sequentialWorkflow
         * @return {Promise|SequentialWF}
         */
        self.updateSequentialWorkflow = function (sequentialWorkflow) {
            return $http
                .put(urlService.sequentialWorkflow, generator.interceptSendInstance('SequentialWF', sequentialWorkflow))
                .then(function () {
                    return generator.interceptReceivedInstance('SequentialWF', sequentialWorkflow);
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
                    return errorCode.showErrorDialog(error, null, generator.getTranslatedError(error));
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
                return generator.getBulkActionResponse(result, sequentialWorkflows, false, 'failed_delete_selected', 'delete_success', 'delete_success_except_following', 'id');
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
            if (typeof correspondence.isSeqInBackStep !== "undefined" && correspondence.isSeqInBackStep()) {
                signatureModel.isSeqWFBackward = true;
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
         * @description preform back step for te SEQ Correspondence
         * @param correspondence
         * @param backStepOptions
         * @param pdfInstance
         * @param documentOperations
         * @param ignoreContent
         * @param hasChanges
         * @return {*}
         */
        self.backStepSeqWFCorrespondence = async function (correspondence, backStepOptions, pdfInstance, documentOperations, ignoreContent, hasChanges) {
            var info = correspondence.getInfo(), addAttachment = false;
            var INSTANT_JSON = await pdfInstance.exportInstantJSON();
            delete INSTANT_JSON.pdfId;
            return PDFService.applyAnnotationsOnPDFDocument(correspondence, AnnotationType.ANNOTATION, INSTANT_JSON, documentOperations)
                .then(function (pdfContent) {
                    var formData = new FormData();
                    formData.append('entity', JSON.stringify({
                        vsid: info.vsId,
                        wobNum: info.wobNumber,
                        validateMultiSignature: false,
                        seqWFId: correspondence.getSeqWFId(),
                        backwardOptions: backStepOptions
                    }));
                    if (info.isPaper || info.docStatus >= 23 && !ignoreContent) {
                        hasChanges ? formData.append('content', pdfContent) : null;
                    } else {
                        addAttachment = true;
                    }
                    return $http.post(urlService.sequentialWorkflowBackStep.change({documentClass: info.documentClass}), formData, {
                        headers: {
                            'Content-Type': undefined
                        }
                    }).then(function (result) {
                        addAttachment && hasChanges ? correspondence.addAnnotationAsAttachment(pdfContent) : result;
                    });
                })
        };

        /**
         * @description Resets the sequential workflow for the book and send it back to initial state
         * @param correspondence
         * @param $event
         */
        self.resetSeqWF = function (correspondence, $event) {
            return self.showReasonDialog('reset_reason', $event, 'reset')
                .then(function (reason) {
                    var info = correspondence.getInfo(),
                        url = urlService.correspondence + '/' + info.documentClass + '/vsid/' + info.vsId + '/wob-num/' + info.wobNumber + '/authorize/reset?userComments=' + reason;
                    return $http.put(url)
                        .then(function (result) {
                            return result.data.rs;
                        })
                        .catch(function (error) {
                            return errorCode.showErrorDialog(error, null, generator.getTranslatedError(error));
                        });
                })
        };

        /**
         * @description Loads the step status
         * @param sequentialWorkflowId
         * @returns {*}
         */
        self.loadSeqWFStatusSteps = function (sequentialWorkflowId) {
            return $http.get(urlService.sequentialWorkflow + '/wf-status/' + generator.getNormalizedValue(sequentialWorkflowId, 'id'))
                .then(function (result) {
                    result.data.rs.first = generator.interceptReceivedInstance('SequentialWF', generator.generateInstance(result.data.rs.first, SequentialWF, self._sharedMethods));
                    result.data.rs.second = generator.interceptReceivedInstance('SequentialWFResult', generator.generateInstance(result.data.rs.second, SequentialWFResult));
                    return result.data.rs;
                });
        };

        /**
         * @description Opens the dialog to show steps of sequential workflow status
         * @param sequentialWorkflowId
         * @param $event
         */
        self.openWFStatusStepsDialog = function (sequentialWorkflowId, $event) {
            self.loadSeqWFStatusSteps(sequentialWorkflowId)
                .then(function (result) {
                    return dialog
                        .showDialog({
                            targetEvent: $event || null,
                            templateUrl: cmsTemplate.getPopup('view-seq-wf-status-steps'),
                            controllerAs: 'ctrl',
                            locals: {
                                viewOnly: true,
                                sequentialWF: angular.copy(result.first),
                                sequentialWFResult: angular.copy(result.second)
                            },
                            bindToController: true,
                            controller: function (dialog, sequentialWorkflowService) {
                                'ngInject';
                                var self = this;
                                self.stepsUsageType = sequentialWorkflowService.stepsUsageTypes.viewWFStatusSteps;

                                self.closePopup = function () {
                                    dialog.cancel();
                                }
                            }
                        });
                });
        };
        /**
         * @description  open reason dialog
         * @param dialogTitle
         * @param $event
         * @param saveButtonKey
         * @param reasonText
         * @param allowedMaxLength
         * @returns {promise|*}
         */
        self.showReasonDialog = function (dialogTitle, $event, saveButtonKey, reasonText, allowedMaxLength) {
            return dialog
                .showDialog({
                    templateUrl: cmsTemplate.getPopup('reason'),
                    controller: 'reasonPopCtrl',
                    controllerAs: 'ctrl',
                    bindToController: true,
                    targetEvent: $event,
                    locals: {
                        title: dialogTitle,
                        saveButtonKey: saveButtonKey,
                        reasonText: reasonText || '',
                        allowedMaxLength: allowedMaxLength || 1000
                    },
                    resolve: {
                        comments: function (userCommentService) {
                            'ngInject';
                            return userCommentService.loadUserCommentsForDistribution();
                        }
                    }
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
