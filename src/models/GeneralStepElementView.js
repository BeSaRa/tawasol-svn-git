module.exports = function (app) {
    app.factory('GeneralStepElementView', function (CMSModelInterceptor,
        _,
        generator,
        moment,
        WorkItem,
        langService,
        Outgoing,
        Internal,
        Incoming,
        Information,
        $sce,
        sequentialWorkflowService,
        employeeService) {
        'ngInject';
        return function GeneralStepElementView(model) {
            var self = this, correspondenceService,
                mapInfo = [
                    'action',
                    'action',
                    'creatorOu',
                    'docStatus',
                    'docType',
                    'documentFile',
                    'mainClassification',
                    'priorityLevel',
                    'registeryOu',
                    'securityLevel',
                    'senderInfo',
                    'subClassification',
                    'fromOuInfo'
                ],
                documentClassMap = {
                    outgoing: Outgoing,
                    incoming: Incoming,
                    internal: Internal
                };
            // default information for correspondence.
            self.action = null;
            self.creatorOu = null;
            self.docStatus = null;
            self.docType = null;
            self.documentFile = null;
            self.mainClassification = null;
            self.priorityLevel = null;
            self.registeryOu = null;
            self.securityLevel = null;
            self.senderInfo = null;
            self.subClassification = null;
            // the correspondence
            self.correspondence = null;
            self.stepElm = null;
            self.documentViewInfo = null;
            // depend on which documentClass
            self.sitesToList = null;
            self.sitesCCList = null;

            // every model has required fields
            // if you don't need to make any required fields leave it as an empty array
            var requiredFields = [];

            if (model)
                angular.extend(this, model);

            GeneralStepElementView.prototype.setCorrespondenceService = function (service) {
                correspondenceService = service;
                return this;
            };

            GeneralStepElementView.prototype.isConditionalApproved = function () {
                return !this.getInfo().isPaper && !!this.generalStepElm.dueDate;
            };

            GeneralStepElementView.prototype.mapReceived = function () {
                var self = this;
                _.map(mapInfo, function (property) {
                    self[property] = new Information(self[property]);
                });
                var className = self.correspondence.classDescription;
                self.correspondence = new documentClassMap[className.toLowerCase()](self.correspondence);
                if (className.toLowerCase === 'incoming') {
                    self.correspondence.receivedByInfo = new Information(self.correspondence.receivedByInfo);
                }
                self.correspondence = generator.interceptReceivedInstance(['Correspondence', className, 'View' + className], self.correspondence);
                self.generalStepElm = self.stepElm;
                self.documentViewInfo.viewURL = $sce.trustAsResourceUrl(self.documentViewInfo.viewURL);
                self.documentViewInfo.editURL = $sce.trustAsResourceUrl(self.documentViewInfo.editURL);

                var dueDateOriginal = angular.copy(self.generalStepElm.dueDate);
                if (self.isConditionalApproved()) {
                    self.conditionalApproveIndicator = self.getConditionalApproveIndicator();//  for conditional approve, due date is actually export date set while conditional approve action
                    self.conditionalApproveExportDate = generator.getDateFromTimeStamp(dueDateOriginal);
                    self.conditionalApproveComment = self.generalStepElm.comments;
                }
                delete self.stepElm;
                return this;
            };

            GeneralStepElementView.prototype.mapSend = function () {
                var self = this;
                delete self.conditionalApproveIndicator;
                delete self.conditionalApproveExportDate;
                delete self.conditionalApproveComment;
                delete self.externalImportData;
                return this;
            };

            /**
             * get all required fields
             * @return {Array|requiredFields}
             */
            GeneralStepElementView.prototype.getRequiredFields = function () {
                return requiredFields;
            };

            GeneralStepElementView.prototype.getInfo = function () {
                return correspondenceService.getCorrespondenceInformation(this);
            };

            GeneralStepElementView.prototype.hasContent = function () {
                return this.correspondence.hasContent();
            };
            GeneralStepElementView.prototype.getReceivedDate = function () {
                return this.generalStepElm.receivedDate ? moment(this.generalStepElm.receivedDate).format(langService.current === 'ar' ? 'DD-MM-YYYY' : 'YYYY-MM-DD') : '';
            };
            GeneralStepElementView.prototype.getReceivedTime = function () {
                return this.generalStepElm.receivedDate ? moment(this.generalStepElm.receivedDate).format('hh:mm A') : '';
            };
            GeneralStepElementView.prototype.getReceivedDateTime = function () {
                return this.receivedDateTime;
            };

            GeneralStepElementView.prototype.isTransferredDocument = function () {
                // if no incomingVSID, then its directly sent from launch(transferred)
                return !this.generalStepElm.incomingVSID;
            };

            GeneralStepElementView.prototype.getCorrespondenceSitesCount = function () {
                var info = this.getInfo(),
                    sitesTo = [], sitesCC = [];
                if (info.documentClass === 'outgoing') {
                    sitesTo = this.correspondence.sitesInfoTo || [];
                    sitesCC = this.correspondence.sitesInfoCC || [];
                    if (generator.isJsonString(sitesTo)) {
                        sitesTo = JSON.parse(sitesTo);
                    }
                    if (generator.isJsonString(sitesCC)) {
                        sitesCC = JSON.parse(sitesCC);
                    }
                    return sitesTo.length + sitesCC.length;
                } else if (info.documentClass === 'incoming') {
                    return 1;
                }
                return 0;
            };

            GeneralStepElementView.prototype.getSeqWFId = function () {
                return this.generalStepElm.seqWFId;
            };

            GeneralStepElementView.prototype.getSeqWFNextStepId = function(){
                return this.generalStepElm.seqWFNextStepId;
            };
            GeneralStepElementView.prototype.getSeqWFBackStepId = function () {
                return this.generalStepElm.seqWFBackStepId;
            }

            /**
             * @description Checks if correspondence already has any active sequential workflow
             * @returns {boolean}
             */
            GeneralStepElementView.prototype.hasActiveSeqWF = function () {
                return !!this.getSeqWFId() && !!this.getSeqWFNextStepId();
            };

            GeneralStepElementView.prototype.isSeqInBackStep = function () {
                return this.generalStepElm.isSeqWFBackward;
            };

            /**
             * @description Show seqWF status
             */
            GeneralStepElementView.prototype.showSeqWFStatusSteps = function ($event) {
                return sequentialWorkflowService.openWFStatusStepsDialog(this.getSeqWFId(), $event);
            };

            /**
             * @description Check if book has create reply permission
             * @param isSpecificVersion
             * @returns {boolean|boolean}
             */
            GeneralStepElementView.prototype.checkCreateReplyPermission = function (isSpecificVersion) {
                var info = this.getInfo(),
                    employee = employeeService.getEmployee(),
                    isAllowed = employee && (
                        (info.documentClass === 'incoming' && employee.hasPermissionTo('CREATE_REPLY'))
                        || (info.documentClass === 'internal' && employee.hasPermissionTo('CREATE_REPLY_INTERNAL'))
                    );

                if (isSpecificVersion) {
                    isAllowed = isAllowed && employee.hasPermissionTo('VIEW_DOCUMENT_VERSION');
                }
                return isAllowed;
            };

            /**
             * @description Check if book has electronic signature permission
             */
            GeneralStepElementView.prototype.checkElectronicSignaturePermission = function () {
                var info = this.getInfo();
                var employee = employeeService.getEmployee();
                return employee && (
                    (info.documentClass === 'outgoing' && employee.hasPermissionTo('ELECTRONIC_SIGNATURE'))
                    || (info.documentClass === 'internal' && employee.hasPermissionTo('ELECTRONIC_SIGNATURE_MEMO'))
                );
            };

            GeneralStepElementView.prototype.getConditionalApproveExportDate = function () {
                return this.conditionalApproveExportDate;
            };

            GeneralStepElementView.prototype.getConditionalApproveComment = function () {
                return this.conditionalApproveComment;
            };

            GeneralStepElementView.prototype.getTranslatedCorrespondenceSiteInfo = function () {
                return this.correspondence.mainSiteSubSiteString.getTranslatedName();
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('GeneralStepElementView', 'init', this);
        }
    })
};
