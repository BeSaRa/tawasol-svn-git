module.exports = function (app) {
    app.controller('createReplyPopCtrl', function ($q,
                                                   langService,
                                                   dialog,
                                                   $state) {
        'ngInject';
        var self = this;

        self.controllerName = 'createReplyPopCtrl';

        self.replyType = 0;
        self.createAsAttachment = false;
        self.replyTypeOptions = [
            {id: 0, key: 'outgoing'},
            {id: 1, key: 'internal'}
        ];
        self.createAsOptions = [
            {id: true, key: 'attachments'},
            {id: false, key: 'linked_documents'}
        ];

        /**
         * @description Set the user selected values and open create reply screen
         * @param $event
         */
        self.setCreateReply = function ($event) {
            var info = self.record.getInfo(),
                page = self.replyType === 0 ? 'app.outgoing.add' : 'app.internal.add';
            dialog.hide();
            $state.go(page, {
                workItem: info.wobNumber,
                vsId: info.vsId,
                action: 'reply',
                createAsAttachment: self.createAsAttachment
            });
        };

        /**
         * @description close broadcast popup
         */
        self.closePopup = function () {
            dialog.cancel();
        }

    });
};
