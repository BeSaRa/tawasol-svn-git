module.exports = function (app) {
    app.controller('createReplyPopCtrl', function ($q,
                                                   langService,
                                                   dialog,
                                                   $state) {
        'ngInject';
        var self = this;

        self.controllerName = 'createReplyPopCtrl';

        self.replyForm = 0;
        self.replyType = 0;
        self.createAsAttachment = false;

        self.replyFormOptions = [
            {id: 0, key: 'simple'},
            {id: 1, key: 'advanced'}
        ];
        self.replyTypeOptions = [
            {id: 0, key: 'reply_outgoing'},
            {id: 1, key: 'reply_internal'}
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
                page,
                pages = {
                    outgoingAdd: 'app.outgoing.add',
                    outgoingSimpleAdd: 'app.outgoing.simple-add',
                    internalAdd: 'app.internal.add',
                    internalSimpleAdd: 'app.internal.simple-add'
                };
            if (self.replyForm === 0) {
                page = self.replyType === 0 ? pages.outgoingSimpleAdd : pages.internalSimpleAdd;
            } else {
                page = self.replyType === 0 ? pages.outgoingAdd : pages.internalAdd;
            }
            dialog.hide();
            $state.go(page, {
                wobNum: info.wobNumber,
                vsId: info.vsId,
                action: 'reply',
                createAsAttachment: self.createAsAttachment,
                sourceDocClass: info.documentClass
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
