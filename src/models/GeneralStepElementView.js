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

            GeneralStepElementView.prototype.mapReceived = function () {
                var self = this;
                _.map(mapInfo, function (property) {
                    self[property] = new Information(self[property]);
                });
                var className = self.correspondence.classDescription;
                self.correspondence = new documentClassMap[className.toLowerCase()](self.correspondence);
                self.correspondence = generator.interceptReceivedInstance(['Correspondence', className, 'View' + className], self.correspondence);
                self.generalStepElm = self.stepElm;
                self.documentViewInfo.viewURL = $sce.trustAsResourceUrl(self.documentViewInfo.viewURL);
                self.documentViewInfo.editURL = $sce.trustAsResourceUrl(self.documentViewInfo.editURL);
                delete self.stepElm;
                return this;
            };

            GeneralStepElementView.prototype.mapSend = function () {

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

            /**
             * @description Check if book has create reply permission
             */
            GeneralStepElementView.prototype.checkCreateReplyPermission = function () {
                var info = this.getInfo();
                var employee = employeeService.getEmployee();
                return ((info.documentClass === 'incoming' && employee.hasPermissionTo('CREATE_REPLY'))
                    || (info.documentClass === 'internal' && employee.hasPermissionTo('CREATE_REPLY_INTERNAL')));
            };

            /**
             * @description Check if book has electronic signature permission
             */
            GeneralStepElementView.prototype.checkElectronicSignaturePermission = function () {
                var info = this.getInfo();
                var employee = employeeService.getEmployee();
                return ((info.documentClass === 'outgoing' && employee.hasPermissionTo('ELECTRONIC_SIGNATURE')) ||
                    (info.documentClass === 'internal' && employee.hasPermissionTo('ELECTRONIC_SIGNATURE_MEMO')))
            };

            // don't remove CMSModelInterceptor from last line
            // should be always at last thing after all methods and properties.
            CMSModelInterceptor.runEvent('GeneralStepElementView', 'init', this);
        }
    })
};
