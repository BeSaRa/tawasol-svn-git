module.exports = function (app) {
    app.controller('sequentialWorkflowStepsDirectiveCtrl', function ($q,
                                                                     $scope,
                                                                     $rootScope,
                                                                     $compile,
                                                                     $element,
                                                                     generator,
                                                                     langService,
                                                                     toast,
                                                                     dialog,
                                                                     _,
                                                                     LangWatcher,
                                                                     $timeout,
                                                                     SequentialWFStep,
                                                                     sequentialWorkflowService,
                                                                     uuidv4) {
        'ngInject';
        var self = this;

        self.controllerName = 'sequentialWorkflowStepsDirectiveCtrl';
        LangWatcher($scope);

        self.actionsList = [
            new SequentialWFStep({
                stepType: sequentialWorkflowService.workflowStepTypes.sendDocument,
                arName: langService.getByLangKey('seq_send_doc', 'ar'),
                enName: langService.getByLangKey('seq_send_doc', 'en'),
                actionType: sequentialWorkflowService.workflowStepActionTypes.user,
                disabled: function () {
                    return !self.seqWF.hasAnyDocumentType();
                }
            }),
            new SequentialWFStep({
                stepType: sequentialWorkflowService.workflowStepTypes.authorizeAndSend,
                arName: langService.getByLangKey('seq_authorize_and_send_doc', 'ar'),
                enName: langService.getByLangKey('seq_authorize_and_send_doc', 'en'),
                actionType: sequentialWorkflowService.workflowStepActionTypes.user,
                disabled: function () {
                    return !self.seqWF.hasAnyDocumentType() || self.seqWF.isIncomingSeqWF();
                }
            })
        ];
        self.stepLegendList = [];
        self.stepLegendClassList = {
            validStep: {key: 'valid_step', class: 'step-valid'},
            inValidStep: {key: 'invalid_step', class: 'step-invalid'},
            pastStep: {key: 'previous_seq_step', class: 'step-past'},
            currentStep: {key: 'current_seq_step', class: 'step-current'},
            futureStep: {key: 'next_seq_step', class: 'step-future'}
        };

        self.selectedRowIndex = null;
        self.$generatorElement = $element.find('.step-layout-rows');

        self.insertRowElement = function () {
            if (!self.seqWF.hasAnyDocumentType()) {
                return false;
            }
            self.seqWF.stepRows.splice(self.seqWF.stepRows.length, 0, null);
            self.compileAll(self.seqWF.stepRows);
        };

        self.createRow = function (stepRow, idx) {
            var row = angular
                .element('<div />', {
                    layout: 'row',
                    class: 'step-row ' + (_canSortRow(stepRow, idx) ? '' : 'sort-cancel'),
                    'seq-step-droppable': 'ctrl.seqWF'
                }).data('rowIndex', idx);

            if (_canDeleteRow(stepRow, idx)) {
                row.append(self.createDeleteButton('row', idx));
            }
            return row;
        };

        self.deleteRow = function ($event) {
            var row = angular.element($event.target).parents('.step-row');
            // _updateStructure();
            self.seqWF.stepRows.splice(row.data('rowIndex'), 1);
            row.remove();
            self.compileAll(self.seqWF.stepRows);
        };

        self.createDeleteButton = function (type, idx) {
            return angular
                .element('<div />', {
                    class: type === 'row' ? 'step-delete-item-button black' : 'step-delete-item-button'
                })
                .append(angular.element('<md-button />', {
                    'ng-click': type === 'row' ? 'ctrl.deleteRow($event)' : 'ctrl.deleteItem($event)',
                    class: 'md-icon-button'
                }).append(angular.element('<md-icon />', {
                    'md-svg-icon': 'close'
                })));
        };

        self.createItem = function (stepAction, idx) {
            stepAction.dummyId = uuidv4();
            stepAction.itemOrder = idx;
            var element = angular
                .element('<div />', {
                    class: 'step-item seq-step-item no-style',
                    flex: ''
                })
                .append(_canDeleteRow(stepAction, idx) ? self.createDeleteButton('item', idx) : '')
                .append()
                .data('item', stepAction)
                .data('rowIndex', idx)
                .attr('ng-dblclick', 'ctrl.editStep(item, $event)');


            _setStepClass(element, stepAction, idx);

            var titleText = '{{item.getTranslatedName()}}';
            if (stepAction.getTranslatedUserAndOuName()) {
                titleText += ' ({{item.getTranslatedUserAndOuName() }})'
            }
            var title = angular.element('<span class="no-style" />', {'md-truncate': ''}).html(titleText);
            var stepTypeIcon = angular.element('<md-icon />', {
                'md-svg-icon': "{{item.getStepIcon()}}",
                'class': 'indicator-size',
                'tooltip': "{{item.getStepIconTooltip()}}",
                'ng-click': "ctrl.editStep(item, $event)"
            });
            var stepStatusIcon = null;

            if (!stepAction.isValidStep(self.seqWF)) {
                stepStatusIcon = angular.element('<md-icon />', {
                    'md-svg-icon': "alert",
                    'class': 'indicator-size',
                    'tooltip': langService.get('invalid_step'),
                    'ng-click': "ctrl.editStep(item, $event)"
                });
            }

            var titleAndIconContainer = angular.element('<div layout="row"/>');
            titleAndIconContainer.append(title);
            titleAndIconContainer.append(angular.element('<span />', {flex: ''}));
            titleAndIconContainer.append(stepStatusIcon ? stepStatusIcon : '');
            titleAndIconContainer.append(stepTypeIcon);

            element.append();
            element.append(titleAndIconContainer);

            return element;
        };

        self.compileAll = function (stepRows) {
            var compiledStep = null;
            self.$generatorElement.html('');
            _.map(stepRows, function (stepRow, index) {
                compiledStep = self.compileRow(self.createRow(stepRow, index), stepRow);
                if (stepRow) {
                    compiledStep.append(self.compileItem(self.createItem(stepRow, index), stepRow));
                }
                self.$generatorElement.append(compiledStep);
            });
            _updateStructure();

        };

        self.updateRows = function (element) {
            _updateStructure();
            self.compileAll(self.seqWF.stepRows);
        };

        self.compileElement = function (element, scope) {
            return $compile(element)(scope);
        };

        self.compileRow = function (element, row) {
            var scope = $rootScope.$new(true);
            scope.row = row;
            scope.ctrl = self;
            LangWatcher(scope);
            return self.compileElement(element, scope);
        };

        self.compileItem = function (element, item) {
            var scope = $rootScope.$new(true);
            scope.item = item;
            scope.ctrl = self;
            return self.compileElement(element, scope);
        };

        self.deleteItem = function ($event) {
            var $item = angular.element($event.target).parents('.step-item'),
                $row = $item.parents('.step-row');
            if ($row && $row.length) {
                var rowIndex = $row.data('rowIndex'),
                    item = $item.data('item');
                self.seqWF.stepRows[rowIndex] = null;
                $item.remove();
                _updateStructure();
            }
        };

        self.editStep = function (seqWFStep, $event) {
            $event.preventDefault();
            var rowIndex = angular.element($event.target).parents('.step-item').data('rowIndex'),
                viewOnly = _checkIfStepViewOnly(seqWFStep);

            sequentialWorkflowService.controllerMethod
                .sequentialWorkflowStepEdit(self.seqWF, seqWFStep, viewOnly, $event)
                .then(function (updatedSeqWFStep) {
                    self.seqWF.stepRows.splice(rowIndex, 1, updatedSeqWFStep);
                    self.compileAll(self.seqWF.stepRows);
                })
        };

        var _updateSequentialWorkflow = function () {
            return sequentialWorkflowService.updateSequentialWorkflow(self.seqWF)
                .then(function (result) {
                    return sequentialWorkflowService.loadSequentialWorkflowById(self.seqWF).then(function (seqWFResult) {
                        toast.success(langService.get('edit_success').change({name: result.getNames()}));
                        self.seqWF = seqWFResult;
                        return seqWFResult;
                    });
                });
        };

        function _updateStructure() {
            self.seqWF.stepRows = [];
            self.$generatorElement.children('.step-row').each(function (idx, row) {
                self.seqWF.stepRows[idx] = null;
                angular.element(row).children('.step-item').each(function (index, item) {
                    angular.element(item).data('rowIndex', idx);
                    self.seqWF.stepRows[idx] = angular.element(item).data('item');
                });
            });
        }

        function _canSortRow(stepRow, rowIndex) {
            if (self.viewOnly) {
                return false;
            }
            if (!stepRow) {
                return true;
            }
            if (self.usageType === sequentialWorkflowService.stepsUsageTypes.manageWFSteps) {
                return true;
            } else if (self.usageType === sequentialWorkflowService.stepsUsageTypes.launchWF) {
                return (rowIndex > 0);
            } else if (self.usageType === sequentialWorkflowService.stepsUsageTypes.viewWFSteps) {
                return (!stepRow.id || (stepRow.id > self.correspondence.getSeqWFNextStepId()));
            } else if (self.usageType === sequentialWorkflowService.stepsUsageTypes.viewWFStatusSteps) {
                return false;
            }
        }

        function _canDeleteRow(stepRow, rowIndex) {
            if (self.viewOnly) {
                return false;
            }
            if (!stepRow) {
                return true;
            }
            if (self.usageType === sequentialWorkflowService.stepsUsageTypes.manageWFSteps) {
                return true;
            } else if (self.usageType === sequentialWorkflowService.stepsUsageTypes.launchWF) {
                return (rowIndex > 0);
            } else if (self.usageType === sequentialWorkflowService.stepsUsageTypes.viewWFSteps) {
                return (!stepRow.id || (stepRow.id > self.correspondence.getSeqWFNextStepId()));
            } else if (self.usageType === sequentialWorkflowService.stepsUsageTypes.viewWFStatusSteps) {
                return false;
            }
        }

        function _checkIfStepViewOnly(seqWFStep) {
            var viewOnly = false;
            if (self.usageType === sequentialWorkflowService.stepsUsageTypes.manageWFSteps) {
                viewOnly = false;
            } else if (self.usageType === sequentialWorkflowService.stepsUsageTypes.launchWF) {
                viewOnly = true;
            } else if (self.usageType === sequentialWorkflowService.stepsUsageTypes.viewWFSteps) {
                viewOnly = seqWFStep.id && seqWFStep.id <= self.correspondence.getSeqWFNextStepId();
            } else if (self.usageType === sequentialWorkflowService.stepsUsageTypes.viewWFStatusSteps) {
                viewOnly = true;
            }
            return viewOnly;
        }

        function _setStepLegend() {
            // if (usageType = 'launch'), show current/future step
            // if (usageType = 'manage-steps') means we are using from admin screen, show valid/invalid steps
            // if (usageType = 'view-steps'), show past/current/future steps
            // if (usageType = 'view-wf-status-steps'), show past/current/future steps
            if (self.usageType === sequentialWorkflowService.stepsUsageTypes.launchWF) {
                self.stepLegendList.push(self.stepLegendClassList.currentStep);
                self.stepLegendList.push(self.stepLegendClassList.futureStep);
            } else if (self.usageType === sequentialWorkflowService.stepsUsageTypes.manageWFSteps) {
                // self.stepLegendList.push(self.stepLegendClassList.validStep);
                // self.stepLegendList.push(self.stepLegendClassList.inValidStep);
            } else if (self.usageType === sequentialWorkflowService.stepsUsageTypes.viewWFSteps) {
                self.stepLegendList.push(self.stepLegendClassList.pastStep);
                self.stepLegendList.push(self.stepLegendClassList.currentStep);
                self.stepLegendList.push(self.stepLegendClassList.futureStep);
            } else if (self.usageType === sequentialWorkflowService.stepsUsageTypes.viewWFStatusSteps) {
                self.stepLegendList.push(self.stepLegendClassList.pastStep);
                self.stepLegendList.push(self.stepLegendClassList.currentStep);
                self.stepLegendList.push(self.stepLegendClassList.futureStep);
            }
        }

        function _setStepClass(element, stepAction, idx) {
            // if (usageType = 'launch'), first step is current, all other steps are future
            // if (usageType = 'manage-steps') means we are using from admin screen, steps are valid/invalid
            // if (usageType = 'view-steps'), steps are past/current/future
            // if (usageType = 'view-wf-status-steps'), steps are past/current/future
            var stepStatusClass = '';
            if (self.usageType === sequentialWorkflowService.stepsUsageTypes.launchWF) {
                if (idx === 0) {
                    stepStatusClass = self.stepLegendClassList.currentStep.class;
                } else {
                    stepStatusClass = self.stepLegendClassList.futureStep.class;
                }
            } else if (self.usageType === sequentialWorkflowService.stepsUsageTypes.manageWFSteps) {
                /*if (stepAction.isValidStep(self.seqWF)) {
                    stepStatusClass = self.stepLegendClassList.validStep.class;
                } else {
                    stepStatusClass = self.stepLegendClassList.inValidStep.class;
                }*/
            } else if (self.usageType === sequentialWorkflowService.stepsUsageTypes.viewWFSteps) {
                if (stepAction.isCurrentSeqWFStep(self.correspondence)) {
                    stepStatusClass = self.stepLegendClassList.currentStep.class;
                } else if (stepAction.isPastSeqWFStep(self.correspondence)) {
                    stepStatusClass = self.stepLegendClassList.pastStep.class;
                } else if (stepAction.isFutureSeqWFStep(self.correspondence)) {
                    stepStatusClass = self.stepLegendClassList.futureStep.class;
                }
            } else if (self.usageType === sequentialWorkflowService.stepsUsageTypes.viewWFStatusSteps) {
                if (stepAction.getId() === self.correspondence.getSeqWFCurrentStepId()) {
                    stepStatusClass = self.stepLegendClassList.currentStep.class;
                } else if (stepAction.getId() < self.correspondence.getSeqWFCurrentStepId()) {
                    stepStatusClass = self.stepLegendClassList.pastStep.class;
                } else if (stepAction.getId() > self.correspondence.getSeqWFCurrentStepId()) {
                    stepStatusClass = self.stepLegendClassList.futureStep.class;
                }
            }
            element.addClass(stepStatusClass);
        }

        $scope.$watch(function () {
            return self.redrawSteps;
        }, function (newVal) {
            if (newVal)
                self.compileAll(self.seqWF.stepRows);
        });


        self.$onInit = function () {
            $timeout(function () {
                self.compileAll(self.seqWF.stepRows);

                _setStepLegend();
            });
        };

    });
};
