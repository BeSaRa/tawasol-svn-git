module.exports = function (app) {
    require('./view-document-queue-directive')(app);
    require('./viewDocumentQueueDirectiveCtrl')(app);
};