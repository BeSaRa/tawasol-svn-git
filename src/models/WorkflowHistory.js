module.exports = function (app) {
    app.factory('WorkflowHistory', function (CMSModelInterceptor,
                                            langService) {
        'ngInject';
        return function WorkflowHistory(model) {
            var self = this;
            self.id = null;
            self.documentVSID = null;
            self.documentCreationDate = null;
            self.actionDate = null;
            self.docSubject = null;
            self.comments = null;
            self.docFullSerial = null;
            self.sitesInfoTo = null;
            self.sitesInfoCC = null;
            self.securityLevel = null;
            self.ouId = null;
            self.workflowActionID = null;
            self.documentStatusID = null;
            self.userfromID = null;
            self.userToID = null;
            self.queueID = null;
            self.docClassID = null;
/*
            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [
                'arName',
                'enName',
                'status',
                'global'
            ];*/

            if (model)
                angular.extend(this, model);



            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('WorkflowHistory', 'init', this);
        }
    })
};