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
                                                             dialog,
                                                             cmsTemplate) {
        'ngInject';
        var self = this;
        self.controllerName = 'barcodeSettingsDirectiveCtrl';
        LangWatcher($scope);
        self.barcodeElements = lookupService.returnLookups(lookupService.barcodeElement);
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

        console.log(self.barcodeTypes[0].getTranslatedName());

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
            return self.compileElement(element, scope);
        };

        self.compileItem = function (element, item) {
            var scope = $rootScope.$new(true);
            scope.item = item;
            scope.ctrl = self;
            return self.compileElement(element, scope);
        };

        self.createDeleteButton = function (type) {
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

        self.createRow = function (row, idx) {
            return angular
                .element('<div />', {
                    layout: 'row',
                    class: 'barcode-row',
                    'bc-sortable': ''
                })
                .append(self.createDeleteButton('row'))
                .data('rowIndex', idx);
        };

        self.createItem = function (item, idx) {
            self.elements.push(item);
            return angular
                .element('<div />', {
                    class: 'barcode-item',
                    flex: ''
                })
                .append(self.createDeleteButton('item'))
                .append(angular.element('<span />', {'md-truncate': ''}).html('{{item.getTranslatedName()}}'))
                .data('item', item)
                .data('rowIndex', idx);
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

        self.setSelectedRow = function (element) {
            self.selectedRowIndex = angular.element(element).data('rowIndex');
        };

        self.getBarcodeTest = function ($event) {
            globalSettingService
                .testBarcodeSettings(self.globalSetting)
                .then(function (result) {
                    return dialog
                        .showDialog({
                            targetEvent: $event,
                            template: cmsTemplate.getPopup('test-barcode-settings'),
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