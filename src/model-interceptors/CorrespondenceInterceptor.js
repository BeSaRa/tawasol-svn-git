module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      moment,
                      lookupService,
                      _,
                      generator,
                      employeeService,
                      attachmentService,
                      Attachment,
                      entityTypeService,
                      documentFileService,
                      LinkedObject,
                      classificationService,
                      documentTypeService,
                      managerService,
                      documentTagService,
                      downloadService,
                      documentCommentService,
                      correspondenceService,
                      Information) {
        'ngInject';

        var modelName = 'Correspondence';

        var convertedProperties = [
            'mainClassification',
            'subClassification',
            'fileId'
        ];

        var lookupConverter = [
            'docType',
            'docStatus',
            'securityLevel',
            'priorityLevel'
        ];

        var needsProperties = [
            'docSubject',
            'id',
            'lastModified',
            'lastModifier',
            'docFullSerial',
            'docDate',
            'classDescription',
            'vsId'
        ];

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            model
                .setCorrespondenceService(correspondenceService)
                .setAttachmentService(attachmentService)
                .setDocumentTagService(documentTagService)
                .setDocumentCommentService(documentCommentService)
                .setManagerService(managerService)
                .setDownloadService(downloadService);
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.tags = model.tags ? angular.toJson(model.tags) : model.tags;
            model.registryOU = model.registryOU.hasOwnProperty('id') ? model.registryOU.id : model.registryOU;
            _.map(lookupConverter, function (property) {
                model[property] = angular.isObject(model[property]) && model[property].hasOwnProperty('id') ? model[property].lookupKey : model[property];
            });
            _.map(convertedProperties, function (property) {
                model[property] = angular.isObject(model[property]) && model[property].hasOwnProperty('id') ? model[property].id : model[property];
            });
            // for linked document when add or edit full Correspondence.
            model.linkedDocList = _.map(model.linkedDocs, function (item) {
                return _.pick(item, needsProperties);
            });
            // for linked attachments when add or edit full Correspondence.
            model.linkedAttachmenstList = _.map(model.attachments, function (item) {
                return item.hasOwnProperty('id') ? generator.interceptSendInstance('AttachmentView', item) : generator.interceptSendInstance('AttachmentView', new Attachment({vsId: item}));
            });

            if (model.linkedDocs && angular.isArray(model.linkedDocs) && model.linkedDocs.length) {
                model.linkedDocs = model.linkedDocs[0].hasOwnProperty('vsId') ? angular.toJson(_.map(model.linkedDocs, 'vsId')) : angular.toJson(model.linkedDocs);
            } else {
                model.linkedDocs = angular.toJson([]);
            }
            //Remove the Linked Exported documents from attachments list
            model.attachments = _.filter(model.attachments, function (attachment) {
                return !attachment.refVSID;
            });
            if (angular.isArray(model.attachments) && model.attachments.length && model.attachments[0]) {
                model.attachments = (model.attachments[0].hasOwnProperty('vsId')) ? angular.toJson(_.map(model.attachments, 'vsId')) : angular.toJson(model.attachments);
            } else {
                model.attachments = angular.toJson([]);
            }
            if (model.linkedEntities && model.linkedEntities.length) {
                model.linkedEntities = angular.toJson(generator.interceptSendCollection('LinkedObject', model.linkedEntities));
            } else {
                model.linkedEntities = angular.toJson([]);
            }

            /*if (info.documentClass === 'outgoing') {

            } else if (info.documentClass === 'incoming') {
                var toArray = generator.interceptSendCollection('Site', model.sitesInfoTo);
                var ccArray = generator.interceptSendCollection('Site', model.sitesInfoCC);
                var merged = toArray.concat(ccArray)[0];
                model = angular.extend(model, merged);
                delete model.sitesInfoTo;
                delete model.sitesInfoCC

            } else {
                delete model.sitesInfoTo;
                delete model.sitesInfoCC
            }*/


            delete model.cbrEnabled;

            delete model.securityLevelIndicator;
            delete model.priorityLevelIndicator;
            delete model.attachmentsIndicator;
            delete model.linkedDocsIndicator;
            delete model.tagsIndicator;

            delete model.documentComments;
            delete model.securityLevelIndicator;
            delete model.securityLevelLookup;
            delete model.priorityLevelIndicator;
            delete model.priorityLevelLookup;
            delete model.attachmentsIndicator;
            delete model.linkedDocsIndicator;
            delete model.tagsIndicator;
            delete model.followUpStatusIndicator;
            delete model.dueDateStatusIndicator;
            // delete model.linkedAttachmenstList;
            delete model.attachmentList;
            delete model.linkedEntitiesList;
            delete model.linkedAttachmentList;
            delete model.linkedCommentsList;
            // delete model.linkedDocList;
            delete model.ccSitesList;
            delete model.toSitesList;
            delete model.documentFileInfo;

            delete model.docTypeInfo;
            delete model.securityLevelInfo;
            delete model.priorityLevelInfo;
            delete model.siteTypeInfo;
            delete model.subSiteInfo;
            delete model.mainSiteInfo;

            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            var documentClass = model.getInfo().documentClass,
                entityTypes = correspondenceService.getLookup(documentClass, 'entityTypes');

            if (!angular.isArray(model.attachments))
                model.attachments = (model.attachments && model.attachments.length) ? Array.prototype.slice.call(JSON.parse(model.attachments)) : [];

            model.docTypeInfo = model.docTypeInfo ? new Information(model.docTypeInfo) : new Information();
            model.securityLevelInfo = model.securityLevelInfo ? new Information(model.securityLevelInfo) : new Information();
            model.priorityLevelInfo = model.priorityLevelInfo ? new Information(model.priorityLevelInfo) : new Information();
            model.mainClassificationInfo = model.mainClassificationInfo ? new Information(model.mainClassificationInfo) : new Information();
            model.subClassificationInfo = model.subClassificationInfo ? new Information(model.subClassificationInfo) : new Information();
            model.docStatusInfo = model.docStatusInfo ? new Information(model.docStatusInfo) : new Information();
            model.registeryOuInfo = model.registeryOuInfo ? new Information(model.registeryOuInfo) : new Information();
            model.documentFileInfo = model.documentFileInfo ? new Information(model.documentFileInfo) : new Information();

            model.mainClassification = correspondenceService.getCorrespondenceLookupById(documentClass, 'classifications', model.mainClassification) || model.mainClassification;
            model.subClassification = correspondenceService.getCorrespondenceLookupById(documentClass, 'classifications', model.subClassification) || model.subClassification;

            model.docTypeForSearchGrid = _.find(documentTypeService.documentTypes, {lookupKey: model.docType});

            model.docType = correspondenceService.getLookup(documentClass, 'docTypes', model.docType) || model.docType;

            model.fileId = correspondenceService.getCorrespondenceLookupById(documentClass, 'documentFiles', model.fileId) || model.fileId; // not lookup

            model.securityLevel = model.securityLevelLookup = lookupService.getLookupByLookupKey(lookupService.securityLevel, model.securityLevel);
            model.priorityLevel = model.priorityLevelLookup = lookupService.getLookupByLookupKey(lookupService.priorityLevel, model.priorityLevel);

            model.creatorInfo = model.creatorInfo ? new Information(model.creatorInfo) : new Information();
            if (!angular.isDate(model.docDate)) {
                model.docDate = moment(model.docDate).format('YYYY-MM-DD');
                model.createdOn = angular.copy(model.docDate);
            }
            //TODO: Commented and added in upper if condition according to change from Iyad as createdOn field is reflecting a field from filenet but we used docDate in place of createdOn to reflect our custom date.
            /*if (!angular.isDate(model.createdOn))
                model.createdOn = moment(model.createdOn).format('YYYY-MM-DD');*/



            if (model.linkedEntities && !angular.isArray(model.linkedEntities)) {
                model.linkedEntities = _.map(JSON.parse(model.linkedEntities), function (entity) {
                    entity.typeId = !(entity.typeId) ? entityTypeService.getLinkedType(0, entityTypes) : entityTypeService.getLinkedType(entity.typeId, entityTypes);
                    return new LinkedObject(entity);
                });
            } else {
                model.linkedEntities = !model.linkedEntities ? [] : model.linkedEntities;
            }

            // Indicators
            model.securityLevelIndicator = model.securityLevel ? model.getSecurityLevelIndicator(model.securityLevel) : null;
            model.priorityLevelIndicator = model.priorityLevel ? model.getPriorityLevelIndicator(model.priorityLevel) : null;
            model.attachmentsIndicator = model.attachments && model.attachments.length ? model.getAttachmentsIndicator() : null;

            if (model.tags && !angular.isArray(model.tags)) {
                model.tags = angular.fromJson(model.tags);
            }

            model.linkedDocs = (model.linkedDocs && model.linkedDocs.length) ? angular.fromJson(model.linkedDocs) : model.linkedDocs;
            var linkedDocs = angular.copy(model.linkedDocs) || [];
            if (model.linkedDocs && model.linkedDocs.length && !angular.isArray(model.linkedDocs))
                linkedDocs = Array.prototype.slice.call(JSON.parse(model.linkedDocs));

            model.linkedDocsIndicator = linkedDocs.length ? model.getLinkedDocumentsIndicator() : null;
            model.tagsIndicator = (model.tags && model.tags.length) ? model.getTagsIndicator(model.tags.length) : null;
            model.isPaperIndicator = model.getInfo().documentClass !== 'incoming' ? model.getIsPaperIndicator(model.hasOwnProperty('addMethod') ? model.addMethod : 1) : null;
            return model;
        });

    })
};