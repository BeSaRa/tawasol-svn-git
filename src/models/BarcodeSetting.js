module.exports = function (app) {
    app.factory('BarcodeSetting', function (CMSModelInterceptor, Lookup, lookupService, langService, _) {
        'ngInject';
        return function BarcodeSetting(model) {
            var self = this;
            self.fontSize = null;
            self.width = null;
            self.height = null;
            self.encodeType = null;
            self.barcodeText = null;
            self.barcodeLabelLoc = null;
            self.rows = [];
            self.isElectronic = [];
            self.resolution = 100;
            self.fontName = 'Arial';
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            BarcodeSetting.prototype.getRequiredFields = function () {
                return requiredFields;
            };
            BarcodeSetting.prototype.setFontSize = function (fontSize) {
                this.fontSize = fontSize;
                return this;
            };
            BarcodeSetting.prototype.setWidth = function (width) {
                this.width = width;
                return this;
            };
            BarcodeSetting.prototype.setHeight = function (height) {
                this.height = height;
                return this;
            };
            BarcodeSetting.prototype.setEncodeType = function (encodeType) {
                this.encodeType = encodeType;
                return this;
            };
            BarcodeSetting.prototype.setBarcodeText = function (barcodeText) {
                this.barcodeText = barcodeText;
                return this;
            };
            BarcodeSetting.prototype.setBarcodeLabelLoc = function (barcodeLabelLoc) {
                this.barcodeLabelLoc = barcodeLabelLoc;
                return this;
            };
            BarcodeSetting.prototype.setRows = function (rows) {
                this.rows = rows;
                return this;
            };

            BarcodeSetting.prototype.mapReceived = function () {
                var getLookup = lookupService.getLookupByLookupKey;
                var self = this;
                if (typeof self.rows === 'string')
                    self.rows = angular.fromJson(self.rows);

                self.rows = _.map(self.rows, function (row, idx) {
                    var rowItems = row.split('|');
                    return _.map(rowItems, function (item) {
                        if (item.split(':')[0] === 'id') {
                            return getLookup(lookupService.barcodeElement, item.split(':')[1])
                        }
                        return new Lookup({
                            lookupStrKey: item.split(':')[1],
                            defaultArName: langService.getKey('static_text', 'ar'),
                            defaultEnName: langService.getKey('static_text', 'en'),
                            lookupKey: 'STATIC_WORD'
                        });
                    })
                });
                return this;
            };

            BarcodeSetting.prototype.mapSend = function () {
                var self = this;
                self.rows = _.map(self.rows, function (row) {
                    var items = _.map(row, function (item) {
                        if (item.lookupKey === 'STATIC_WORD') {
                            return 'none:' + item.lookupStrKey;
                        } else {
                            return 'id:' + item.lookupKey;
                        }
                    });
                    return items.join('|');
                });
                return angular.toJson(this);
            };
            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('BarcodeSetting', 'init', this);
        }
    })
};
