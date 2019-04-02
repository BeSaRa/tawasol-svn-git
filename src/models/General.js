module.exports = function (app) {
    app.factory('General', function (CMSModelInterceptor,
                                     Correspondence,
                                     Indicator) {
        'ngInject';
        return function General(model) {

            var self = this,
                correspondenceService,
                exportData = {
                    label_serial: 'docFullSerial',
                    subject: 'docSubject',
                    priority_level: function () {
                        return this.priorityLevel.getTranslatedName();
                    },
                    label_document_type: function () {
                        return this.docTypeInfo.getTranslatedName();
                    },
                    creator: function () {
                        return this.creatorInfo.getTranslatedName();
                    },
                    created_on: 'createdOn'
                };
            Correspondence.call(this);
            //self.docClassName = 'General';
            self.docStatus = 2; // by default

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            var indicator = new Indicator();


            if (model)
                angular.extend(this, model);


            General.prototype.getDocClassIndicator = function (docClass) {
                return indicator.getDocClassIndicator(docClass);
            };
            General.prototype.getIsPaperIndicator = function (isPaper) {
                return indicator.getIsPaperIndicator(isPaper);
            };
            General.prototype.hasSite = function () {
                return true;
            };

            General.prototype.getExportedData = function () {
                return exportData;
            };

            General.prototype.launchWorkFlowAndCheckApprovedInternal = function ($event, action, tab) {
                correspondenceService = this.getCorrespondenceService();
                var info = this.getInfo();
                if (info.documentClass.toLowerCase() === 'internal' && info.docStatus === 24 || info.isPaper) {
                    return correspondenceService.launchCorrespondenceWorkflow(this, $event, action, tab);
                } else {
                    return correspondenceService.checkWorkFlowForVsId(info.vsId).then(function (result) {
                        return result ? dialog.infoMessage(langService.get('cannot_launch_document_has_active_workflow')) : correspondenceService.launchCorrespondenceWorkflow(self, $event, action, tab);
                    });
                }
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('General', 'init', this);
        }
    })
};
