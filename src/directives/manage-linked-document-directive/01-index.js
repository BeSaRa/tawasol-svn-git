module.exports = function (app) {
    require('./manage-linked-document-directive')(app);
    require('./manageLinkedDocumentDirectiveCtrl')(app);
};