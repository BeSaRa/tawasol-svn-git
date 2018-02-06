module.exports = function (app) {
    require('./models/FileType')(app);
    require('./models/ImageCompression')(app);
    require('./models/IPSettings')(app);
    require('./models/TaskStatus')(app);
    require('./models/getDefaultRequest')(app);
    require('./models/networkErrorCallback')(app);
    require('./models/AsyncOperation')(app);
    require('./models/Page')(app);
    require('./models/Document')(app);
    require('./models/Filter')(app);
    require('./models/FilterProperty')(app);
    require('./models/getFilterProperty')(app);
    require('./models/setFilterProperty')(app);
    require('./models/DataEncoding')(app);
    require('./models/LoadScannerOption')(app);
    require('./models/Uploader')(app);
    require('./models/CCToolkit')(app);
    require('./models/ajaxRequest')(app);
    require('./models/ISISWebErrorCode')(app);
    require('./models/PixColorFormat')(app);
    require('./models/Tags')(app);
    require('./models/PleaseWaitDialog')(app);
    require('./models/scanner-image')(app);

    /// Service and controller //
    require('./services/scannerService')(app);
    require('./controllers/scannerCtrl')(app);
    require('./css/scanner.scss');
};