module.exports = function (app) {
    app.controller('launchSequentialWorkflowPopCtrl', function (_,
                                                                toast,
                                                                $rootScope,
                                                                generator,
                                                                dialog,
                                                                $scope,
                                                                AnnotationType,
                                                                tableGeneratorService,
                                                                lookupService,
                                                                $timeout,
                                                                langService,
                                                                record,
                                                                moment,
                                                                sequentialWorkflows,
                                                                sequentialWorkflowService,
                                                                rootEntity,
                                                                employeeService) {
        'ngInject';
        var self = this;
        self.controllerName = 'launchSequentialWorkflowPopCtrl';
        self.stepsUsageType = sequentialWorkflowService.stepsUsageTypes.launchWF;
        self.form = null;
        self.record = record;
        self.correspondence = record;
        self.sequentialWorkflows = sequentialWorkflows;
        self.canAddSeqWF = rootEntity.hasPSPDFViewer() && employeeService.hasPermissionTo('ADD_SEQ_WF');
        self.securityLevels = lookupService.returnLookups(lookupService.securityLevel);

        self.selectedSeqWF = null;
        self.seqWFSearchText = '';

        self.reloadSequentialWorkflows = function () {
            return sequentialWorkflowService
                .loadSequentialWorkflowsByRegOuDocClassActive(employeeService.getEmployee().getRegistryOUID(), record.getInfo().docClassId)
                .then(function (result) {
                    return self.sequentialWorkflows = result;
                });
        };

        /**
         * @description Opens dialog for add new sequential workflow
         * @param $event
         */
        self.openAddSequentialWorkflowDialog = function ($event) {
            if (!self.canAddSeqWF) {
                return;
            }

            sequentialWorkflowService
                .controllerMethod
                .sequentialWorkflowAdd(employeeService.getEmployee().getRegistryOUID(), self.record.getInfo().docClassId, $event)
                .then(function (result) {
                    self.reloadSequentialWorkflows()
                        .then(function () {
                            toast.success(langService.get('add_success').change({name: result.getNames()}));
                            self.selectedSeqWF = _.find(self.sequentialWorkflows, function (item) {
                                return item.id === result.id && item.status;
                            });
                            self.onChangeSequentialWorkflow();
                        })
                })
                .catch(function () {
                    //self.reloadSequentialWorkflows(self.grid.page);
                });
        };

        /**
         * @description Handles the change of sequential workflow
         */
        self.onChangeSequentialWorkflow = function () {
            self.redrawSteps = true;
            $timeout(function () {
                self.redrawSteps = false;
            }, 100);
        };

        /**
         * @description checks if form is valid
         * @param form
         * @returns {boolean}
         */
        self.isValidForm = function (form) {
            form = form || self.form;
            if (!form) {
                return true;
            }
            generator.validateRequiredSelectFields(form);
            return form.$valid;
        };

        /**
         * @description Launches the sequential workflow
         * @param $event
         * @param terminateAllWFS
         * @param ignoreProxyMessage
         * @returns {boolean}
         */
        self.launchSeqWF = function ($event, terminateAllWFS, ignoreProxyMessage) {
            if (!self.isValidForm()) {
                return false;
            }

            var firstStep = self.selectedSeqWF.steps[0];
            if (firstStep.isAuthorizeAndSendStep()) {
                self.record.openSequentialDocument(AnnotationType.SIGNATURE, self.selectedSeqWF)
                    .then(function () {
                        $rootScope.$emit('SEQ_LAUNCH_SUCCESS');
                        dialog.hide();
                    })
                    .catch(function (error) {
                        console.log('ERROR  FORM LAUNCH', error);
                    });
            } else {
                if (!!firstStep.proxyUserInfo && !ignoreProxyMessage) {
                    _showProxyMessage([firstStep.proxyUserInfo]).then(function () {
                        _launchSeqWF($event, terminateAllWFS);
                    })
                } else {
                    _launchSeqWF($event, terminateAllWFS);
                }

            }
        };

        function _launchSeqWF($event, terminateAllWFS) {
            // cause no need any of those properties is case it is just send (pinCode , composite , ignoreMultiSignValidation)
            var signatureModel = self.record.prepareSignatureModel(null, null, null);
            signatureModel.setSeqWFId(self.selectedSeqWF.id);
            sequentialWorkflowService.launchSeqWFCorrespondence(self.record, signatureModel, null, true, terminateAllWFS)
                .then(function (result) {
                    if (result === 'ERROR_MULTI_USER') {
                        return dialog.confirmMessage(langService.get('workflow_in_multi_user_inbox'))
                            .then(function () {
                                self.launchSeqWF($event, true, true);
                            })
                    }
                    $rootScope.$emit('SEQ_LAUNCH_SUCCESS');
                    toast.success(langService.get('launch_sequential_workflow_success'));
                    dialog.hide(true);
                });
        }

        /**
         * @description Opens dialog for add new ad-hoc sequential workflow and then send
         * @param $event
         */
        self.launchSeqWFWithEdit = function ($event) {
            if (!self.selectedSeqWF) {
                return;
            }

            sequentialWorkflowService
                .controllerMethod
                .sequentialWorkflowCopy($event, self.selectedSeqWF, self.selectedSeqWF.regOUId, true, false, false)
                .then(function (result) {
                    self.sequentialWorkflows.push(result);
                    self.onChangeSequentialWorkflow();
                    toast.success(langService.get('add_success').change({name: result.getNames()}));
                    self.selectedSeqWF = result;
                    //self.launchSeqWF($event);
                })
                .catch(function () {

                });
        };


        /**
         * @description Clears the searchText for the given field
         * @param fieldType
         */
        self.clearSearchText = function (fieldType) {
            self[fieldType + 'SearchText'] = '';
        };

        /**
         * @description Prevent the default dropdown behavior of keys inside the search box of dropdown
         * @param $event
         */
        self.preventSearchKeyDown = function ($event) {
            if ($event) {
                var code = $event.which || $event.keyCode;
                if (code !== 38 && code !== 40)
                    $event.stopPropagation();
            }
        };

        self.$onInit = function () {
            $timeout(function () {
                self.form = $scope.launchSequentialWFForm;
            })
        };

        /**
         * @description Close the popup
         */
        self.closePopup = function () {
            dialog.cancel();
        };


        self.getUsersDoesNotHaveDocumentSecurityLevel = function (proxyUsers) {
            return _.filter(proxyUsers, function (proxyUser) {
                var proxyUserSecurityLevels = generator.getSelectedCollectionFromResult(self.securityLevels, proxyUser.securityLevels, 'lookupKey');

                return _.every(proxyUserSecurityLevels, function (userSecurityLevel) {
                    if (self.correspondence.hasOwnProperty('securityLevelLookup')) {
                        return userSecurityLevel.lookupKey !== self.correspondence.securityLevelLookup.lookupKey
                    } else {
                        return userSecurityLevel.lookupKey !== self.correspondence.securityLevel.lookupKey
                    }
                });
            })
        }

        function _showProxyMessage(proxies) {
            var proxyUsersNotHaveDocumentSecurityLevel = self.getUsersDoesNotHaveDocumentSecurityLevel(proxies);
            if (proxyUsersNotHaveDocumentSecurityLevel && proxyUsersNotHaveDocumentSecurityLevel.length) {
                return dialog.alertMessage(_prepareProxyMessage(proxyUsersNotHaveDocumentSecurityLevel, false));
            }
            var proxyUsersHaveSecurityLevel = _.differenceBy(proxies, proxyUsersNotHaveDocumentSecurityLevel, 'proxyInfo.proxyDomain');
            if (proxyUsersHaveSecurityLevel.length) {
                return dialog.alertMessage(_prepareProxyMessage(proxyUsersHaveSecurityLevel, true));
            }
        }

        /**
         * @description prepare proxy Message
         * @param proxyUsers
         * @param isDocumentHaveSecurityLevel
         * @private
         */
        function _prepareProxyMessage(proxyUsers, isDocumentHaveSecurityLevel) {
            var titleMessage = isDocumentHaveSecurityLevel ?
                langService.get('proxy_user_message') :
                langService.get('document_doesnot_have_security_level_as_delegated_user');

            var titleTemplate = angular.element('<span class="validation-title">' + titleMessage + '</span> <br/>');
            titleTemplate.html(titleMessage);

            var firstStep = self.selectedSeqWF.steps[0];

            var tableRows = _.map(proxyUsers, function (proxyUser) {
                var proxyStartDate = proxyUser.proxyStartDate ? moment(proxyUser.proxyStartDate).format('YYYY-MM-DD') : null;
                var proxyEndDate = proxyUser.proxyEndDate ? moment(proxyUser.proxyEndDate).format('YYYY-MM-DD') : null;
                return [firstStep.toUserInfo.arName, firstStep.toUserInfo.enName, proxyUser.arName, proxyUser.enName, proxyUser.proxyDomain, proxyStartDate, proxyEndDate, proxyUser.proxyMessage];
            });

            var table = tableGeneratorService.createTable([langService.get('arabic_name'), langService.get('english_name'), langService.get('proxy_arabic_name'), langService.get('proxy_english_name'), langService.get('proxy_domain'), langService.get('start_date'), langService.get('end_date'), langService.get('proxy_message')], 'error-table');
            table.createTableRows(tableRows);

            titleTemplate.append(table.getTable(true));

            return titleTemplate.html();
        }
    });
};
