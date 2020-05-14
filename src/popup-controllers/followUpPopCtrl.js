module.exports = function (app) {
    app.controller('followUpPopCtrl', function (followUpData, followUpUserService, folders, toast, langService, dialog) {
        'ngInject';
        var self = this;
        self.controllerName = 'followUpPopCtrl';
        self.model = followUpData;
        self.folders = folders || [];
        self.minDate = new Date();
        self.minDate.setDate(self.minDate.getDate() + 1);

        if (!self.model.followupDate) {
            self.model.followupDate = self.minDate;
        }


        self.closeDialog = function () {
            dialog.cancel();
        };

        self.saveToMyFollowUp = function () {
            return followUpUserService
                .saveUserFollowUp(self.model)
                .then(function () {
                    toast.success(langService.get('followup_added_successfully').change({name: self.model.docSubject}));
                    dialog.hide();
                });
        }


    });
};
