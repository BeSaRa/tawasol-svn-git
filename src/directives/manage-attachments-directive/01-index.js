module.exports = function (app) {
    require('./manage-attachments-directive')(app);
    require('./manageAttachmentDirectiveCtrl')(app);
};