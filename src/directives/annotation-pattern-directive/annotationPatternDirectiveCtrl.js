module.exports = function (app) {
    app.controller('annotationPatternDirectiveCtrl', function ($q,
                                                               $scope,
                                                               $rootScope,
                                                               $compile,
                                                               $element,
                                                               generator,
                                                               langService,
                                                               toast,
                                                               dialog,
                                                               $cookies,
                                                               employeeService,
                                                               jobTitleService,
                                                               _,
                                                               PDFService,
                                                               $timeout,
                                                               configurationService,
                                                               LangWatcher) {
        'ngInject';
        var self = this;

        self.controllerName = 'annotationPatternDirectiveCtrl';
        LangWatcher($scope);
        self.employee = employeeService.getEmployee();
        self.finalPatternList = [];
        self.annotationRows = [];

        self.$generatorElement = $element.find('.pattern-layout-rows');

        self.updateRows = function (element) {
            _updateStructure();
            self.compileAll(self.annotationRows);
        };

        self.compileElement = function (element, scope) {
            return $compile(element)(scope);
        };

        self.createRow = function (stepRow, idx) {
            var row = angular
                .element('<div />', {
                    layout: 'row',
                    class: 'step-row'
                }).data('rowIndex', idx);

            row.append(self.createRowCheckBox(stepRow, idx))
            return row;
        };

        self.createRowCheckBox = function (stepRow, idx) {
            return angular.element('<md-checkbox aria-label="check-box" ng-change="ctrl.setInfoPatternList()" ' +
                ' class="sort-cancel check-box-with-no-padding" ng-model="ctrl.annotationRows[' + idx + '].selected"></md-checkbox>')
        };

        self.compileRow = function (element, row) {
            var scope = $rootScope.$new(true);
            scope.row = row;
            scope.ctrl = self;
            LangWatcher(scope);
            return self.compileElement(element, scope);
        };

        self.createItem = function (patternElement, idx) {
            var element = angular
                .element('<div />', {
                    class: 'step-item pattern-item no-style',
                    flex: ''
                })
                .append()
                .data('item', patternElement)
                .data('rowIndex', idx);

            var titleText = _getStepText(patternElement);
            var title = angular.element('<span class="no-style" />', {'md-truncate': ''}).html(titleText);
            var titleContainer = angular.element('<div layout="row"/>');
            titleContainer.append(title);
            titleContainer.append(angular.element('<span />', {flex: ''}));

            element.append();
            element.append(titleContainer);

            return element;
        };

        self.compileItem = function (element, item) {
            var scope = $rootScope.$new(true);
            scope.item = item;
            scope.ctrl = self;
            return self.compileElement(element, scope);
        };

        self.compileAll = function (patternRows) {
            var compiledStep = null;
            self.$generatorElement.html('');
            _.map(patternRows, function (patternRow, index) {
                compiledStep = self.compileRow(self.createRow(patternRow, index), patternRow);
                if (patternRow) {
                    compiledStep.append(self.compileItem(self.createItem(patternRow, index), patternRow));
                }
                self.$generatorElement.append(compiledStep);
            });
            _updateStructure();

        };

        self.setInfoPatternList = function () {
            self.infoPattern = PDFService.getResultFromSelectedRowsUserInfoAnnotation(self.annotationRows);
        };

        function _initAnnotationRows() {
            self.selectedTypes = PDFService.getRowsForResultUserInfoAnnotation();
            self.annotationRows = _.map(self.selectedTypes, function (item, index) {
                var row = PDFService.userInfoAnnotationTypes.find(x => x.id === item.id);
                if (row) {
                    row.selected = item.selected;
                    row.rowIndex = index;
                }
                return row;
            });
        }

        function _getStepText(patternElement) {
            if (!patternElement) {
                return '';
            }
            return langService.get(patternElement.langKey);
        }

        function _updateStructure() {
            self.annotationRows = [];
            self.$generatorElement.children('.step-row').each(function (idx, row) {
                self.annotationRows[idx] = null;
                angular.element(row).children('.step-item').each(function (index, item) {
                    angular.element(item).data('rowIndex', idx);
                    self.annotationRows[idx] = angular.element(item).data('item');
                });
            });
            self.setInfoPatternList();
        }

        $scope.$watch(function () {
            return self.redrawSteps;
        }, function (newVal) {
            if (newVal)
                self.compileAll(self.annotationRows);
        });

        self.$onInit = function () {
            $timeout(function () {
                _initAnnotationRows();
                self.compileAll(self.annotationRows);
            });
        }
    });
};
