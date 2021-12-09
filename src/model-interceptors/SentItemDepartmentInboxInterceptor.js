module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      CorrespondenceSite,
                      lookupService,
                      correspondenceService,
                      SenderInfo,
                      entityTypeService,
                      viewDocumentService,
                      generator,
                      Information,
                      LinkedObject,
                      langService,
                      moment,
                      _) {
        'ngInject';

        var modelName = 'SentItemDepartmentInbox';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            model.mainSiteFromIdInfo = new CorrespondenceSite(model.mainSiteFromIdInfo);
            model.subSiteFromIdInfo = new CorrespondenceSite(model.subSiteFromIdInfo);
            model.mainSiteToIdInfo = new CorrespondenceSite(model.mainSiteToIdInfo);
            model.subSiteToIdInfo = new CorrespondenceSite(model.subSiteToIdInfo);
            model.sentByIdInfo = new SenderInfo(model.sentByIdInfo);
            model.setCorrespondenceService(correspondenceService)
                .setViewDocumentService(viewDocumentService);
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.tags = model.tags ? angular.toJson(model.tags) : model.tags;

            if (angular.isArray(model.attachments) && model.attachments.length && model.attachments[0]) {
                model.attachments = (model.attachments[0].hasOwnProperty('vsId')) ? angular.toJson(_.map(model.attachments, 'vsId')) : angular.toJson(model.attachments);
            } else {
                model.attachments = angular.toJson([]);
            }

            if (model.linkedEntities && model.linkedEntities.length) {
                model.linkedEntities = angular.toJson(generator.interceptSendCollection('LinkedObject', model.linkedEntities));
            } else {
                model.linkedEntities = null;
            }
            model.linkedDocs = "[]";

            delete model.typeOriginalCopy;
            delete model.documentComments;
            delete model.securityLevelLookup;
            delete model.securityLevelIndicator;
            delete model.docClassName;
            delete model.originalCopyIndicator;
            delete model.numberOfDays;
            delete model.recordGridName;

            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.docClassName = 'outgoing';
            model.deliveryDate ? getDateFromUnixTimeStamp(model, ['deliveryDate']) : "";
            model.sentDate ? getDateFromUnixTimeStamp(model, ['sentDate']) : "";

            model.typeOriginalCopy = (model.type === 0 ? langService.get('original') : langService.get('copy'));

            if (!angular.isArray(model.tags))
                model.tags = (model.tags && model.tags.length) ? Array.prototype.slice.call(JSON.parse(model.tags)) : [];

            if (!angular.isArray(model.attachments))
                model.attachments = (model.attachments && model.attachments.length) ? Array.prototype.slice.call(JSON.parse(model.attachments)) : [];

            if (model.linkedEntities && !angular.isArray(model.linkedEntities)) {
                model.linkedEntities = _.map(JSON.parse(model.linkedEntities), function (entity) {
                    entity.typeId = entityTypeService.getEntityTypeById(entity.typeId);
                    return new LinkedObject(entity);
                });
            }

            var linkedDocs = [];
            if (!angular.isArray(model.linkedDocs) && model.linkedDocs && model.linkedDocs.length)
                linkedDocs = Array.prototype.slice.call(JSON.parse(model.linkedDocs));

            model.securityLevelLookup = lookupService.getLookupByLookupKey(lookupService.securityLevel, model.securityLevel);
            model.securityLevelIndicator = model.securityLevelLookup ? model.getSecurityLevelIndicator(model.securityLevelLookup) : null;

            model.priorityLevelLookup = lookupService.getLookupByLookupKey(lookupService.priorityLevel, model.priorityLevel);
            model.priorityLevelIndicator = (model.priorityLevelLookup && model.priorityLevelLookup.lookupKey !== 0) ? model.getPriorityLevelIndicator(model.priorityLevelLookup) : null;

            /*model.attachmentsIndicator = model.attachementsNO ? model.getAttachmentsIndicator() : null;
            model.linkedDocsIndicator = model.linkedDocsNO ? model.getLinkedDocumentsIndicator() : null;*/

            model.followupStatusLookup = lookupService.getLookupByLookupKey(lookupService.followupStatus, model.followupStatus);
            model.followUpStatusIndicator = model.followupStatus ? model.getFollowUpStatusIndicator(model.followupStatusLookup) : null;
            model.originalCopyIndicator = model.getOriginalCopyIndicator();

            model.messageStatus = new Information(model.messageStatus);
            model.numberOfDays = generator.getNumberOfDays(model.sentDate, null);

            return model;
        });

        /**
         * convert unix timestamp to Original Date Format (YYYY-MM-DD)
         * @param model
         * @param modelProperties
         * @returns {*}
         */
        var getDateFromUnixTimeStamp = function (model, modelProperties) {
            for (var i = 0; i < modelProperties.length; i++) {
                model[modelProperties[i]] = model[modelProperties[i]] ? moment(model[modelProperties[i]]).format('YYYY-MM-DD') : null;
            }
            return model;
        };
    })
};
