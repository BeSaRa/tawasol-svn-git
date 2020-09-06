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
            return angular
                .element('<div />', {
                    layout: 'row',
                    class: 'step-row ' + (self.seqWF.id ? 'sort-cancel' : ''),
                    'seq-step-droppable': 'ctrl.seqWF'
                })
                .append(self.seqWF.id ? '' : self.createDeleteButton('row', idx))
                .data('rowIndex', idx);
        };

        self.deleteRow = function ($event) {
            var row = angular.element($event.target).parents('.step-row');
            row.remove();
            _updateStructure();
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
                    class: 'step-item no-style',
                    flex: ''
                })
                .append(self.seqWF.id ? '' : self.createDeleteButton('item', idx))
                .append()
                .data('item', stepAction)
                .data('rowIndex', idx)
                .attr('ng-dblclick', 'ctrl.editStep(item, $event)');

            // if isLaunchSeqWF, first step is current, all other steps are future
            // no self.correspondence means we are using from admin screen
            // otherwise from next actions screen
            if (self.isLaunchSeqWF) {
                element.attr('ng-class', "{" +
                    "'" + self.stepLegendClassList.currentStep.class + "' : " + (idx === 0) + ", " +
                    "'" + self.stepLegendClassList.futureStep.class + "' : " + (idx > 0) +
                    "}");
            } else if (!self.correspondence) {
                element.attr('ng-class', "{" +
                    "'" + self.stepLegendClassList.validStep.class + "' : item.isValidStep(ctrl.seqWF), " +
                    "'" + self.stepLegendClassList.inValidStep.class + "' : !item.isValidStep(ctrl.seqWF)" +
                    "}");
            } else {
                element.attr('ng-class', "{" +
                    "'" + self.stepLegendClassList.pastStep.class + "' : item.isPastSeqWFStep(ctrl.correspondence), " +
                    "'" + self.stepLegendClassList.currentStep.class + "' : item.isCurrentSeqWFStep(ctrl.correspondence), " +
                    "'" + self.stepLegendClassList.futureStep.class + "' : item.isFutureSeqWFStep(ctrl.correspondence)" +
                    "}");
            }

            var title = angular.element('<span class="no-style" />', {'md-truncate': ''}).html('{{ item.getTranslatedName() }}');
            var stepTypeIcon = angular.element('<md-icon />', {
                'md-svg-icon': "{{item.getStepIcon()}}",
                'class': 'indicator-size',
                'tooltip': "{{item.getStepIconTooltip()}}",
                'ng-click': "ctrl.editStep(item, $event)"
            });

            var titleAndIconContainer = angular.element('<div layout="row"/>');
            titleAndIconContainer.append(title);
            titleAndIconContainer.append(angular.element('<span />', {flex: ''}));
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

        self.setStepLegend = function () {
            // if isLaunchSeqWF, show current step, future step
            // if no self.correspondence means we are using from admin screen, show valid, invalid steps
            // otherwise from next actions after launch, show past, current, future steps
            if (self.isLaunchSeqWF) {
                self.stepLegendList.push(self.stepLegendClassList.currentStep);
                self.stepLegendList.push(self.stepLegendClassList.futureStep);
            } else if (!self.correspondence) {
                self.stepLegendList.push(self.stepLegendClassList.validStep);
                self.stepLegendList.push(self.stepLegendClassList.inValidStep);
            } else {
                self.stepLegendList.push(self.stepLegendClassList.pastStep);
                self.stepLegendList.push(self.stepLegendClassList.currentStep);
                self.stepLegendList.push(self.stepLegendClassList.futureStep);
            }
        };

        /*self.setSelectedRow = function (element) {
            self.selectedRowIndex = angular.element(element).data('rowIndex');
        };*/

        self.editStep = function (seqWFStep, $event) {
            $event.preventDefault();
            var rowIndex = angular.element($event.target).parents('.step-item').data('rowIndex');
            sequentialWorkflowService.controllerMethod
                .sequentialWorkflowStepEdit(self.seqWF, seqWFStep, self.viewOnly, $event)
                .then(function (updatedSeqWFStep) {
                    self.seqWF.stepRows.splice(rowIndex, 1, updatedSeqWFStep);
                    self.compileAll(self.seqWF.stepRows);
                })
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

        $scope.$watch(function () {
            return self.redrawSteps;
        }, function (newVal) {
            if (newVal)
                self.compileAll(self.seqWF.stepRows);
        });


        self.$onInit = function () {
            $timeout(function () {
                self.compileAll(self.seqWF.stepRows);

                self.setStepLegend();
            });
        };

    });
};
