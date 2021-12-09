module.exports = function (app) {
    require('./pspdf-viewer-directive')(app);
    require('./pspdfViewerDirectiveCtrl')(app);
};
