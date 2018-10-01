module.exports = function (app) {
    require('./attachment-viewer-directive')(app);
    require('./attachmentViewerDirectiveCtrl')(app);
};