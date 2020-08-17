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
                    return !self.record.hasAnyDocumentType();
                }
            }),
            new SequentialWFStep({
                stepType: sequentialWorkflowService.workflowStepTypes.authorizeAndSend,
                arName: langService.getByLangKey('seq_authorize_and_send_doc', 'ar'),
                enName: langService.getByLangKey('seq_authorize_and_send_doc', 'en'),
                actionType: sequentialWorkflowService.workflowStepActionTypes.user,
                disabled: function () {
                    return !self.record.hasAnyDocumentType() || self.record.isIncomingSeqWF();
                }
            })
        ];

        self.selectedRowIndex = null;
        self.$generatorElement = $element.find('.step-layout-rows');

        self.insertRowElement = function () {
            if (!self.record.hasAnyDocumentType()) {
                return false;
            }
            self.record.stepRows.splice(self.record.stepRows.length, 0, null);
            self.compileAll(self.record.stepRows);
        };

        self.createRow = function (stepRow, idx) {
            return angular
                .element('<div />', {
                    layout: 'row',
                    class: 'step-row ' + (self.record.id ? 'sort-cancel' : ''),
                    'seq-step-droppable': 'ctrl.record'
                })
                .append(self.record.id ? '' : self.createDeleteButton('row', idx))
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
            var element = angular
                .element('<div />', {
                    class: 'step-item no-style',
                    flex: ''
                })
                .append(self.record.id ? '' : self.createDeleteButton('item', idx))
                .append()
                .data('item', stepAction)
                .data('rowIndex', idx)
                .attr('ng-dblclick', 'ctrl.editStep(item, $event)')
                .attr('ng-class', "{'valid-item':item.isValidStep(ctrl.record)}");

            var title = angular.element('<span class="no-style" />', {'md-truncate': ''}).html('{{ item.getTranslatedName() }}');
            var stepTypeIcon = angular.element('<md-icon />', {
                'md-svg-icon': "{{item.getStepIcon()}}",
                'class': 'indicator-size',
                'tooltip': "{{item.getStepIconTooltip()}}"
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
            self.compileAll(self.record.stepRows);
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
                self.record.stepRows[rowIndex] = null;
                $item.remove();
                _updateStructure();
            }
        };


        /*self.setSelectedRow = function (element) {
            self.selectedRowIndex = angular.element(element).data('rowIndex');
        };*/

        self.editStep = function (seqWFStep, $event) {
            $event.preventDefault();
            var rowIndex = angular.element($event.target).parents('.step-item').data('rowIndex');
            sequentialWorkflowService.controllerMethod
                .sequentialWorkflowStepEdit(self.record, seqWFStep, self.viewOnly, $event)
                .then(function (updatedSeqWFStep) {
                    self.record.stepRows.splice(rowIndex, 1, updatedSeqWFStep);
                    self.compileAll(self.record.stepRows);
                })
        };

        function _updateStructure() {
            self.record.stepRows = [];
            self.$generatorElement.children('.step-row').each(function (idx, row) {
                self.record.stepRows[idx] = null;
                angular.element(row).children('.step-item').each(function (index, item) {
                    angular.element(item).data('rowIndex', idx);
                    self.record.stepRows[idx] = angular.element(item).data('item');
                });
            });
        }

        $scope.$watch(function () {
            return self.redrawSteps;
        }, function (newVal) {
            if (newVal)
                self.compileAll(self.record.stepRows);
        });


        self.$onInit = function () {
            $timeout(function () {
                self.compileAll(self.record.stepRows);
            });
        };

    });
};
