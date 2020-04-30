module.exports = function (app) {
    app.controller('createReplyPopCtrl', function ($q,
                                                   langService,
                                                   dialog,
                                                   $state,
                                                   employeeService,
                                                   generator,
                                                   _) {
        'ngInject';
        var self = this;

        self.controllerName = 'createReplyPopCtrl';
        self.employee = employeeService.getEmployee();

        self.replyType = 0;
        self.replyForm = 0;
        self.addMethod = null;
        self.createAsAttachment = false;

        var permissions = {
            outgoingPaper: 'OUTGOING_PAPER',
            internalPaper: 'INTERNAL_PAPER'
        };

        self.addMethodOptions = [
            {
                id: 0,
                key: 'electronic',
                disabled: function () {
                    return self.employee.isBacklogMode();
                }
            },
            {
                id: 1,
                key: 'paper',
                disabled: function () {
                    return !self.employee.hasPermissionTo(_getPaperPermissionKey())
                }
            }
        ];
        _setAddMethod();

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

        self.validateLabels = {
            replyType: 'reply_type',
            addMethod: 'label_document_type',
            replyForm: 'reply_form',
            createAsAttachment: 'link_incoming_as'
        };

        /**
         * @description Handles the change of reply type
         * @param $event
         */
        self.onChangeReplyType = function ($event) {
            _setAddMethod();
        };

        /**
         * @description Checks if create reply button is disabled
         * @returns {boolean}
         */
        self.isCreateReplyDisabled = function () {
            return self.addMethod === null;
        };

        /**
         * @description Set the user selected values and open create reply screen
         * @param $event
         */
        self.setCreateReply = function ($event) {
            if (self.isCreateReplyDisabled()) {
                generator.generateErrorFields('check_this_fields', [self.validateLabels.addMethod]);
                return;
            }

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
                sourceDocClass: info.documentClass,
                addMethod: self.addMethod
            });
        };

        /**
         * @description close broadcast popup
         */
        self.closePopup = function () {
            dialog.cancel();
        };

        function _getPaperPermissionKey() {
            return self.replyType === 0 ? permissions.outgoingPaper : permissions.internalPaper;
        }

        function _setAddMethod() {
            self.addMethod = null;
            // if backlogMode, only paper is allowed but if no paper permission(OUTGOING_PAPER/INTERNAL_PAPER), addMethod will be null
            // else electronic
            if (self.employee.isBacklogMode()) {
                if (self.employee.hasPermissionTo(_getPaperPermissionKey())) {
                    self.addMethod = 1;
                }
            } else {
                self.addMethod = 0;
            }
        }

    });
};
