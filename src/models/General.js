module.exports = function (app) {
    app.factory('General', function (CMSModelInterceptor,
                                     Correspondence,
                                     dialog,
                                     langService,
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
            General.prototype.isCompositeSites = function () {
                return false; // general model doesn't contain isComposite property
            };

            General.prototype.launchWorkFlowAndCheckApprovedInternal = function ($event, action, tab) {
                correspondenceService = this.getCorrespondenceService();
                var info = this.getInfo();
                var self = this;

                // internal electronic and not approved
                if (info.documentClass.toLowerCase() === 'internal' && info.docStatus < 24 && !info.isPaper) {
                    return dialog.confirmMessage(langService.get("confirm_launch_document_has_active_workflow")).then(function () {
                        correspondenceService.launchCorrespondenceWorkflow(self, $event, action, tab);
                    })
                } else {
                    return correspondenceService.launchCorrespondenceWorkflow(this, $event, action, tab);
                }
            };
            General.prototype.openSendFaxDialog = function ($event) {
                correspondenceService = this.getCorrespondenceService();
                return correspondenceService.openSendFaxDialog(this, $event);
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('General', 'init', this);
        }
    })
};
