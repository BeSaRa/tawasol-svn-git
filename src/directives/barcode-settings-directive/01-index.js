module.exports = function (app) {
    require('./barcode-settings-directive')(app);
    require('./barcodeSettingsDirectiveCtrl')(app);
};