module.exports = function (app) {
    app.factory('FollowupBook', function (CMSModelInterceptor, langService) {
        'ngInject';
        return function FollowupBook(model) {
            var self = this;
            self.id = null;
            self.actionDate = null;
            self.commentList = null;
            self.docClassId = null;
            self.docDate = null;
            self.docFullSerial = null;
            self.docSubject = null;
            self.docType = null;
            self.folderId = null;
            self.followupDate = null;
            self.ou = null;
            self.ouInfo = null;
            self.priorityLevel = null;
            self.refDocNumber = null;
            self.registeryOU = null;
            self.regouInfo = null;
            self.securityLevel = null;
            self.siteInfo = null;
            self.status = null;
            self.updatedBy = null;
            self.updatedByInfo = null;
            self.updatedOn = null;
            self.userId = null;
            self.userInfo = null;
            self.userOUID = null;
            self.userOuInfo = null;
            self.vsId = null;
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('FollowupBook', 'init', this);
        }
    })
};
