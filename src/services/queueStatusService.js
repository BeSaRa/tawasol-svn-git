module.exports = function (app) {
    app.service('queueStatusService', function () {
        'ngInject';
        var self = this;
        self.UNDER_RECEIVE = 1;
        self.META_DATA_ONLY = 2;
        self.DRAFT = 3;
        self.COMPLETED = 4;
        self.EDIT_AFTER_AUTHORIZED = 5;
        self.EDIT_AFTER_EXPORTED = 6;
        self.SENT_TO_RE_AUDIT = 7;// Rejected Books
        self.ACCEPTED = 8;// Ready for Sent
        self.REMOVED = 9;
        self.ARCHIVED = 21;
        self.SENT = 22;
        self.PARTIAILLY_AUTHORIZED = 23;
        self.FULLY_AUTHORIZED = 24;
        self.EXPORTED = 25;

        self.statuses = {
            under_receive: self.UNDER_RECEIVE,
            meta_data_only: self.META_DATA_ONLY,
            draft: self.DRAFT,
            completed: self.COMPLETED,
            edit_after_authorized: self.EDIT_AFTER_AUTHORIZED,
            edit_after_exported: self.EDIT_AFTER_EXPORTED,
            sent_to_re_audit: self.SENT_TO_RE_AUDIT,
            accepted: self.ACCEPTED,
            removed: self.REMOVED,
            archived: self.ARCHIVED,
            sent: self.SENT,
            partiailly_authorized: self.PARTIAILLY_AUTHORIZED,
            fully_authorized: self.FULLY_AUTHORIZED,
            exported: self.EXPORTED
        };


        self.getDocumentStatus = function (status) {
            return self.statuses[status];
        }
    })
};