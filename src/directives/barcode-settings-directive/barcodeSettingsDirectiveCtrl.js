module.exports = function (app) {
    app.controller('barcodeSettingsDirectiveCtrl', function ($scope,
                                                             $rootScope,
                                                             $timeout,
                                                             _,
                                                             LangWatcher,
                                                             Lookup,
                                                             $compile,
                                                             $element,
                                                             globalSettingService,
                                                             BarcodeSetting,
                                                             lookupService,
                                                             langService,
                                                             dialog,
                                                             cmsTemplate) {
        'ngInject';
        var self = this;
        self.controllerName = 'barcodeSettingsDirectiveCtrl';
        LangWatcher($scope);
        self.barcodeElements = lookupService.returnLookups(lookupService.barcodeElement);
        self.barcodeElements = _.sortBy(self.barcodeElements, function (element) {
            return element.itemOrder ? element.itemOrder : '';
        });

        self.barcodeElements.unshift(new Lookup({
            lookupStrKey: '',
            defaultArName: langService.getKey('static_text', 'ar'),
            defaultEnName: langService.getKey('static_text', 'en'),
            lookupKey: 'STATIC_WORD'
        }));

        self.elements = [];

        self.selectedRowIndex = null;

        self.$generatorElement = $element.find('.barcode-layout-rows');

        self.barcodeTypes = [
            new Lookup({
                lookupKey: 0,
                defaultArName: 'CODE_128',
                defaultEnName: 'CODE_128'
            }),
            new Lookup({
                lookupKey: 1,
                defaultArName: 'QR_CODE',
                defaultEnName: 'QR_CODE'
            }),
            new Lookup({
                lookupKey: 2,
                defaultArName: 'CODABAR',
                defaultEnName: 'CODABAR'
            })
        ];

        self.fontNames = [{value: 'Courier New', text: 'Courier New'},
            {value: 'Times New Roman', text: 'Times New Roman'},
            {value: 'Helvetica', text: 'Helvetica'},
            {value: 'Arial', text: 'Arial'},
            {value: 'Verdana', text: 'Verdana'},
            {value: 'Comic Sans MS', text: 'Comic Sans MS'},
            {value: 'Arial Black', text: 'Arial Black'},
            {value: 'Arabic Typesetting', text: 'Arabic Typesetting'},
            {value: 'Traditional Arabic', text: 'Traditional Arabic'}];

        function _getRow(rowIdx) {
            return typeof self.globalSetting.barcodeElements.rows[rowIdx] !== 'undefined' ? rowIdx : -1;
        }

        function _rowExists(rowIndex) {
            return _getRow(rowIndex) !== -1;
        }

        function _updateStructure() {
            self.globalSetting.barcodeElements.rows = [];
            self.elements = [];
            self.$generatorElement.children('.barcode-row').each(function (idx, row) {
                self.globalSetting.barcodeElements.rows[idx] = [];
                angular.element(row).children('.barcode-item').each(function (index, item) {
                    angular.element(item).data('rowIndex', idx);
                    self.globalSetting.barcodeElements.rows[idx].push(angular.element(item).data('item'));
                    self.elements.push(angular.element(item).data('item'));
                });
            });
        }

        function _isStaticWord(item) {
            return item.lookupKey === 'STATIC_WORD';
        }

        self.isElementStaticWord = function (item) {
            return _isStaticWord(item);
        };

        self.elementExists = function (element) {
            return self.getElementPosition(element) !== -1;
        };

        self.getElementPosition = function (element) {
            return _.findIndex(self.elements, function (item) {
                return !_isStaticWord(item) && element.id === item.id;
            })
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

        self.createDeleteButton = function (type, idx) {
            if (self.hasBarcodeLabel(idx)) {
                return;
            }
            return angular
                .element('<div />', {
                    class: type === 'row' ? 'barcode-delete-item-button black' : 'barcode-delete-item-button'
                })
                .append(angular.element('<md-button />', {
                    'ng-click': type === 'row' ? 'ctrl.deleteRow($event)' : 'ctrl.deleteItem($event)',
                    class: 'md-icon-button'
                }).append(angular.element('<md-icon />', {
                    'md-svg-icon': 'close'
                })));
        };

        self.electronicExists = function (idx) {
            return self.globalSetting.barcodeElements.isElectronic.hasOwnProperty(idx) && self.globalSetting.barcodeElements.isElectronic[idx];
        };

        self.createRowCheckBox = function (idx) {
            if (typeof self.globalSetting.barcodeElements.isElectronic[idx] === 'undefined') {
                self.globalSetting.barcodeElements.isElectronic[idx] = true;
            }
            return angular.element('<md-checkbox aria-label="check-box" tooltip="{{lang.electronic}}" tooltip-direction="bottom" ng-checked="ctrl.hasBarcodeLabel(' + idx + ') || ctrl.electronicExists(' + idx + ')" ng-disabled="ctrl.hasBarcodeLabel(' + idx + ')" ng-model="ctrl.globalSetting.barcodeElements.isElectronic[' + idx + ']" class="sort-cancel check-box-with-no-padding isElectronic" ng-change="ctrl.checkRow($event)"></md-checkbox>')
        };

        self.hasBarcodeLabel = function (rowIndex) {
            return _.map(self.globalSetting.barcodeElements.rows[rowIndex], 'lookupStrKey').indexOf('BARCODE_LABEL') !== -1;
        };

        self.createRow = function (row, idx) {
            return angular
                .element('<div />', {
                    layout: 'row',
                    class: 'barcode-row',
                    'bc-sortable': ''
                })
                .append(self.createDeleteButton('row', idx))
                .append(self.createRowCheckBox(idx))
                .data('rowIndex', idx);
        };

        self.createItem = function (item, idx) {
            self.elements.push(item);
            var title = angular.element('<span />', {'md-truncate': ''}).html('{{ ctrl.isElementStaticWord(item) ? (item.lookupStrKey ? item.lookupStrKey : item.getTranslatedName() )  :  item.getTranslatedName() }}');
            var element = angular
                .element('<div />', {
                    class: 'barcode-item',
                    flex: ''
                })
                .append(self.createDeleteButton('item', item.lookupStrKey !== 'BARCODE_LABEL' ? undefined : idx))
                .append()
                .data('item', item)
                .data('rowIndex', idx)
                .attr('ng-class', "{'static-text-element':ctrl.isElementStaticWord(item),'sort-cancel':item.status}");
            if (self.isElementStaticWord(item)) {
                title.attr('ng-if', '!item.status');
                title.attr('ng-dblclick', 'ctrl.editStaticText(item)');
                var input = angular.element('<input ng-blur="ctrl.stopEditStaticText(item)" ng-trim="false" ng-keypress="ctrl.editStaticTextOffWhenEnter(item,$event)" ng-if="item.status"  class="static-text-element-input" type="text" ng-model="item.lookupStrKey" />')
                element.append(input);
            }
            element.append(title);
            return element;
        };

        self.editStaticTextOffWhenEnter = function (item, $event) {
            var code = $event.keyCode || $event.which;
            if (code !== 13)
                return;
            item.status = false;
            _updateStructure();
        };

        self.stopEditStaticText = function (item) {
            item.status = false;
            _updateStructure();
        };

        self.editStaticText = function (item) {
            item.status = true;
        };

        self.compileBarcode = function (rows) {
            var $row = null;
            self.$generatorElement.html('');
            _.map(rows, function (row, idx) {
                $row = self.compileRow(self.createRow(row, idx), row);
                _.map(row, function (item) {
                    $row.append(self.compileItem(self.createItem(item, idx), item));
                });
                self.$generatorElement.append($row);
            });
            _updateStructure();
        };

        self.deleteRow = function ($event) {
            var row = angular.element($event.target).parents('.barcode-row');
            row.remove();
            _updateStructure();
        };

        self.deleteItem = function ($event) {
            var $item = angular.element($event.target).parents('.barcode-item'),
                $row = $item.parents('.barcode-row'),
                rowIndex = $row.data('rowIndex'),
                item = $item.data('item'),
                itemIndex = self.globalSetting.barcodeElements.rows[rowIndex].indexOf(item);
            self.globalSetting.barcodeElements.rows[rowIndex].splice(itemIndex);
            self.elements.splice(self.getElementPosition(item), 1);
            $item.remove();
            _updateStructure();
        };

        self.updateRows = function (element) {
            if (element && !self.elementExists(angular.element(element).data('item'))) {
                self.elements.push(angular.element(element).data('item'));
            }
            _updateStructure();
        };

        self.updateIsElectronicStatus = function () {
            self.$generatorElement.find('md-checkbox').each(function (idx, item) {
                self.globalSetting.barcodeElements.isElectronic[idx] = angular.element(item).hasClass('md-checked');
                var scope = $rootScope.$new(true);
                scope.ctrl = self;
                LangWatcher(scope);
                angular.element(item).replaceWith($compile(self.createRowCheckBox(idx))(scope));
            });
        };

        self.setSelectedRow = function (element) {
            self.selectedRowIndex = angular.element(element).data('rowIndex');
        };

        self.getBarcodeTest = function ($event) {
            globalSettingService
                .testBarcodeSettings(self.globalSetting)
                .then(function (result) {
                    if (result) {
                        return dialog
                            .showDialog({
                                targetEvent: $event,
                                templateUrl: cmsTemplate.getPopup('test-barcode-settings'),
                                controller: function () {
                                    'ngInject';
                                    this.closeBarcodePopup = function ($event) {
                                        dialog.hide();
                                    }
                                },
                                bindToController: true,
                                controllerAs: 'ctrl',
                                locals: {
                                    barcode: result
                                }
                            });
                    }
                });
        };

        self.insertRowAfter = function () {
            self.globalSetting.barcodeElements.rows.splice((self.rowIndex + 1), 0, []);
            self.compileBarcode(self.globalSetting.barcodeElements.rows);
        };

        self.insertRowBefore = function () {
            self.globalSetting.barcodeElements.rows.splice(self.rowIndex, 0, []);
            self.compileBarcode(self.globalSetting.barcodeElements.rows);
        };

        self.insertRowElement = function () {
            self.globalSetting.barcodeElements.rows.splice(self.globalSetting.barcodeElements.rows.length, 0, []);
            self.compileBarcode(self.globalSetting.barcodeElements.rows);
        };

        $timeout(function () {
            self.compileBarcode(self.globalSetting.barcodeElements.rows);
        });

    });
};
