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
                                                                     employeeService,
                                                                     _,
                                                                     LangWatcher,
                                                                     $timeout,
                                                                     SequentialWFStep,
                                                                     sequentialWorkflowService) {
        'ngInject';
        var self = this;

        self.controllerName = 'sequentialWorkflowStepsDirectiveCtrl';
        LangWatcher($scope);
        self.employee = employeeService.getEmployee();

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

        self.$generatorElement = $element.find('.step-layout-rows');

        self.insertRowElement = function () {
            if (!self.seqWF.hasAnyDocumentType()) {
                return false;
            }
            var indexToInsert = self.seqWF.stepRows.length;
            if (self.usageType === sequentialWorkflowService.stepsUsageTypes.viewWFSteps) {
                var docCurrentStep = _getStepById(self.correspondence.getSeqWFNextStepId());
                if (docCurrentStep) {
                    indexToInsert = docCurrentStep.itemOrder + 1;
                }
            }
            self.seqWF.stepRows.splice(indexToInsert, 0, null);
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

            /*var titleText = '{{item.getTranslatedName()}}';
            if (stepAction.getTranslatedUserAndOuName()) {
                titleText += ' ({{item.getTranslatedUserAndOuName() }})'
            }*/
            var titleText = _getStepText(stepAction);

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

        self.isViewStepsUsageType = function () {
            return self.usageType === sequentialWorkflowService.stepsUsageTypes.viewWFSteps;
        }

        /**
         * @description Imports the steps from existing sequential workflow
         * @param $event
         */
        self.importStepsFromSeqWF = function ($event) {
            sequentialWorkflowService.controllerMethod
                .selectSequentialWorkflow($event, self.correspondence.getInfo().docClassId)
                .then(function (selectedSeqWF) {
                    var docCurrentStep = _getStepById(self.correspondence.getSeqWFNextStepId());
                    var indexToInsert = -1;
                    if (docCurrentStep) {
                        indexToInsert = docCurrentStep.itemOrder + 1;
                    }

                    var newSteps = _.map(angular.copy(selectedSeqWF.stepRows), function (item) {
                        item.id = null;
                        return item;
                    });

                    self.seqWF.stepRows.splice(indexToInsert, 0, ...newSteps);
                    self.compileAll(self.seqWF.stepRows);
                });
        }

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

        function _getStepById(stepId) {
            return _.find(self.seqWF.stepRows, function (item) {
                return item && item.id === generator.getNormalizedValue(stepId, 'id');
            })
        }

        function _getStepByItemOrder(itemOrder) {
            return _.find(self.seqWF.stepRows, function (item) {
                return item && item.itemOrder === generator.getNormalizedValue(itemOrder, 'itemOrder');
            })
        }

        function _getStepText(stepRow) {
            if (!stepRow) {
                return '';
            }

            var titleText = '',
                previousStep = _getStepByItemOrder(stepRow.itemOrder - 1),
                previousStepUser = (previousStep && previousStep.getTranslatedUserAndOuName()) ? (previousStep.getTranslatedUserAndOuName()) : '',
                stepActionText = ' (' + stepRow.getTranslatedName() + ') ';

            if (self.usageType === sequentialWorkflowService.stepsUsageTypes.manageWFSteps) {
                if (stepRow.itemOrder === 0) {
                    titleText = stepActionText;
                    if (stepRow.getTranslatedUserAndOuName()) {
                        titleText += stepRow.getTranslatedUserAndOuName();
                    }
                } else {
                    titleText = previousStepUser + stepActionText;
                    if (stepRow.getTranslatedUserAndOuName()) {
                        titleText += stepRow.getTranslatedUserAndOuName();
                    }
                }
            } else if (self.usageType === sequentialWorkflowService.stepsUsageTypes.launchWF) {
                if (stepRow.itemOrder === 0) {
                    titleText = (self.employee.getTranslatedName() + ' - ' + self.employee.getExtraFields().ouInfo.getTranslatedName()) + stepActionText;
                    if (stepRow.getTranslatedUserAndOuName()) {
                        titleText += stepRow.getTranslatedUserAndOuName();
                    }
                } else {
                    titleText = previousStepUser + stepActionText;
                    if (stepRow.getTranslatedUserAndOuName()) {
                        titleText += stepRow.getTranslatedUserAndOuName()
                    }
                }
            } else if (self.usageType === sequentialWorkflowService.stepsUsageTypes.viewWFSteps) {
                if (stepRow.itemOrder === 0) {
                    titleText = self.seqWF.getTranslatedCreatorAndOuName() + stepActionText;
                    if (stepRow.getTranslatedUserAndOuName()) {
                        titleText += stepRow.getTranslatedUserAndOuName();
                    }
                } else {
                    titleText = previousStepUser + stepActionText;
                    if (stepRow.getTranslatedUserAndOuName()) {
                        titleText += stepRow.getTranslatedUserAndOuName()
                    }
                }
            } else if (self.usageType === sequentialWorkflowService.stepsUsageTypes.viewWFStatusSteps) {
                if (stepRow.itemOrder === 0) {
                    titleText = self.seqWF.getTranslatedCreatorAndOuName() + stepActionText;
                    if (stepRow.getTranslatedUserAndOuName()) {
                        titleText += stepRow.getTranslatedUserAndOuName();
                    }
                } else {
                    titleText = previousStepUser + stepActionText;
                    if (stepRow.getTranslatedUserAndOuName()) {
                        titleText += stepRow.getTranslatedUserAndOuName()
                    }
                }
            }
            return titleText;
        }

        function _getStepTextWithIcon(stepRow) {
            if (!stepRow) {
                return '';
            }

            var titleText = '',
                iconName = langService.current === 'ar' ? 'arrow-left' : 'arrow-right',
                stepIcon = "&nbsp;<md-icon class='indicator-size' md-svg-icon='" + iconName + "'></md-icon>&nbsp;",
                previousStep = _getStepByItemOrder(stepRow.itemOrder - 1),
                previousStepUserIcon = (previousStep && previousStep.getTranslatedUserAndOuName()) ? (previousStep.getTranslatedUserAndOuName() + stepIcon) : '';

            if (self.usageType === sequentialWorkflowService.stepsUsageTypes.manageWFSteps) {
                if (stepRow.itemOrder === 0) {
                    titleText = stepRow.getTranslatedName();
                    if (stepRow.getTranslatedUserAndOuName()) {
                        titleText += stepIcon + stepRow.getTranslatedUserAndOuName();
                    }
                } else {
                    titleText = previousStepUserIcon + stepRow.getTranslatedName();
                    if (stepRow.getTranslatedUserAndOuName()) {
                        titleText += stepIcon + stepRow.getTranslatedUserAndOuName();
                    }
                }
            } else if (self.usageType === sequentialWorkflowService.stepsUsageTypes.launchWF) {
                if (stepRow.itemOrder === 0) {
                    titleText = (self.employee.getTranslatedName() + ' - ' + self.employee.getExtraFields().ouInfo.getTranslatedName()) + stepIcon + stepRow.getTranslatedName();
                    if (stepRow.getTranslatedUserAndOuName()) {
                        titleText += stepIcon + stepRow.getTranslatedUserAndOuName();
                    }
                } else {
                    titleText = previousStepUserIcon + stepRow.getTranslatedName();
                    if (stepRow.getTranslatedUserAndOuName()) {
                        titleText += stepIcon + stepRow.getTranslatedUserAndOuName()
                    }
                }
            } else if (self.usageType === sequentialWorkflowService.stepsUsageTypes.viewWFSteps) {
                if (stepRow.itemOrder === 0) {
                    titleText = self.seqWF.getTranslatedCreatorAndOuName() + stepIcon + stepRow.getTranslatedName();
                    if (stepRow.getTranslatedUserAndOuName()) {
                        titleText += stepIcon + stepRow.getTranslatedUserAndOuName();
                    }
                } else {
                    titleText = previousStepUserIcon + stepRow.getTranslatedName();
                    if (stepRow.getTranslatedUserAndOuName()) {
                        titleText += stepIcon + stepRow.getTranslatedUserAndOuName()
                    }
                }
            } else if (self.usageType === sequentialWorkflowService.stepsUsageTypes.viewWFStatusSteps) {
                if (stepRow.itemOrder === 0) {
                    titleText = self.seqWF.getTranslatedCreatorAndOuName() + stepIcon + stepRow.getTranslatedName();
                    if (stepRow.getTranslatedUserAndOuName()) {
                        titleText += stepIcon + stepRow.getTranslatedUserAndOuName();
                    }
                } else {
                    titleText = previousStepUserIcon + stepRow.getTranslatedName();
                    if (stepRow.getTranslatedUserAndOuName()) {
                        titleText += stepIcon + stepRow.getTranslatedUserAndOuName()
                    }
                }
            }
            return titleText;
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
                var docCurrentStep = _getStepById(self.correspondence.getSeqWFNextStepId());
                if (!stepRow.id) {
                    return true;
                }
                // opened from authorize and send as first step
                if (!docCurrentStep) {
                    return stepRow.itemOrder > 0;
                }
                return (stepRow.itemOrder > docCurrentStep.itemOrder);
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
                var docCurrentStep = _getStepById(self.correspondence.getSeqWFNextStepId());
                if (!stepRow.id) {
                    return true;
                }
                // opened from authorize and send as first step
                if (!docCurrentStep) {
                    return stepRow.itemOrder > 0;
                }

                return (stepRow.itemOrder > docCurrentStep.itemOrder);
            } else if (self.usageType === sequentialWorkflowService.stepsUsageTypes.viewWFStatusSteps) {
                return false;
            }
        }

        function _checkIfStepViewOnly(seqWFStep) {
            if (self.viewOnly) {
                return true;
            }
            var viewOnly = false;
            if (self.usageType === sequentialWorkflowService.stepsUsageTypes.manageWFSteps) {
                viewOnly = false;
            } else if (self.usageType === sequentialWorkflowService.stepsUsageTypes.launchWF) {
                viewOnly = true;
            } else if (self.usageType === sequentialWorkflowService.stepsUsageTypes.viewWFSteps) {
                var docCurrentStep = _getStepById(self.correspondence.getSeqWFNextStepId());
                if (!seqWFStep.id) {
                    viewOnly = false;
                } else if (!docCurrentStep) { // opened from authorize and send as first step
                    viewOnly = false;
                } else {
                    viewOnly = (seqWFStep.itemOrder < docCurrentStep.itemOrder);
                }
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
                if (!self.correspondence.getSeqWFId()) {
                    self.stepLegendList.push(self.stepLegendClassList.currentStep);
                    self.stepLegendList.push(self.stepLegendClassList.futureStep);
                } else {
                    self.stepLegendList.push(self.stepLegendClassList.pastStep);
                    self.stepLegendList.push(self.stepLegendClassList.currentStep);
                    self.stepLegendList.push(self.stepLegendClassList.futureStep);
                }
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
                // if no seqWFId, means correspondence is not launched, so its similar to launch step
                if (!self.correspondence.getSeqWFId()) {
                    if (idx === 0) {
                        stepStatusClass = self.stepLegendClassList.currentStep.class;
                    } else {
                        stepStatusClass = self.stepLegendClassList.futureStep.class;
                    }
                } else {
                    if (!stepAction.id) {
                        return;
                    }
                    var docCurrentStep = _getStepById(self.correspondence.getSeqWFNextStepId());
                    if (stepAction.itemOrder === docCurrentStep.itemOrder) {
                        stepStatusClass = self.stepLegendClassList.currentStep.class;
                    } else if (stepAction.itemOrder < docCurrentStep.itemOrder) {
                        stepStatusClass = self.stepLegendClassList.pastStep.class;
                    } else if (stepAction.itemOrder > docCurrentStep.itemOrder) {
                        stepStatusClass = self.stepLegendClassList.futureStep.class;
                    }
                }
            } else if (self.usageType === sequentialWorkflowService.stepsUsageTypes.viewWFStatusSteps) {
                var docCurrentStep = self.correspondence.getSeqWFCurrentStepId() ? _getStepById(self.correspondence.getSeqWFCurrentStepId()) : null;
                if (!docCurrentStep) {
                    stepStatusClass = self.stepLegendClassList.pastStep.class;
                } else {
                    if (stepAction.itemOrder === docCurrentStep.itemOrder) {
                        stepStatusClass = self.stepLegendClassList.currentStep.class;
                    } else if (stepAction.itemOrder < docCurrentStep.itemOrder) {
                        stepStatusClass = self.stepLegendClassList.pastStep.class;
                    } else if (stepAction.itemOrder > docCurrentStep.itemOrder) {
                        stepStatusClass = self.stepLegendClassList.futureStep.class;
                    }
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
