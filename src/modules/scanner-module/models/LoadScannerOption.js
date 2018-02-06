module.exports = function (app) {
    app.factory('LoadScannerOption', function () {
        'ngInject';
        var LoadScannerOption = this;

        LoadScannerOption.UseLastConfiguration = 0;
        LoadScannerOption.ShowDriverList = 1;
        LoadScannerOption.ShowConnectedDriverList = 2;
        LoadScannerOption.ShowDeviceList = 3;
        return LoadScannerOption;
    })
};
//Contains all the specific Web Toolkit errors.

