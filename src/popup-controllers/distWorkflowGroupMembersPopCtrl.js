module.exports = function (app) {
    app.controller('distWorkflowGroupMembersPopCtrl', function ($q,
                                                                langService,
                                                                toast,
                                                                dialog) {
        'ngInject';
        var self = this;

        self.controllerName = 'distWorkflowGroupMembersPopCtrl';

        self.selectedMembers = [];

        self.addSelectedMembers = function () {
            if (!self.selectedMembers.length) {
                return false;
            }
            debugger;
            dialog.hide(self.selectedMembers);
        };

        /**
         * @description Close the popup
         */
        self.closePopup = function () {
            dialog.cancel();
        };

    });
};
