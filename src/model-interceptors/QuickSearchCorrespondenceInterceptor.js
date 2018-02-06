module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      _,
                      moment,
                      lookupService,
                      LinkedObject,
                      correspondenceService,
                      outgoingService,
                      documentFileService,
                      documentTypeService,
                      classificationService,
                      documentTagService,
                      entityTypeService,
                      attachmentService,
                      documentCommentService,
                      generator) {
        'ngInject';

        var modelName = 'QuickSearchCorrespondence';

        var convertedProperties = [
            'docType',
            'fileId',
            'mainClassification',
            'subClassification',
            'priorityLevel'
        ];

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            model
                .setCorrespondenceService(correspondenceService)
                .setOutgoingService(outgoingService)
                .setAttachmentService(attachmentService)
                .setDocumentTagService(documentTagService)
                .setDocumentCommentService(documentCommentService);

            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.securityLevel = generator.getResultFromSelectedCollection(model.securityLevel, 'lookupKey');
            _.map(convertedProperties, function (property) {
                model[property] = angular.isObject(model[property]) && model[property].hasOwnProperty('id') ? model[property].id : model[property];
            });

            model.tags = model.tags ? JSON.stringify(model.tags) : model.tags;

            if (angular.isArray(model.attachments) && model.attachments.length && model.attachments[0]) {
                model.attachments = (model.attachments[0].hasOwnProperty('vsId')) ? JSON.stringify(_.map(model.attachments, 'vsId')) : JSON.stringify(model.attachments);
            } else {
                model.attachments = JSON.stringify([]);
            }
            model.documentTitle = ('document-' + ( Math.random() * 1988));

            if (model.linkedEntities && model.linkedEntities.length) {
                model.linkedEntities = JSON.stringify(generator.interceptSendCollection('LinkedObject', model.linkedEntities));
            } else {
                model.linkedEntities = null;
            }
            model.linkedDocs = "[]";

            if (angular.isArray(model.sitesInfoTo) && model.sitesInfoTo.length) {
                model.sitesInfoTo = JSON.stringify(generator.interceptReceivedCollection('Site', model.sitesInfoTo));
            }
            else {
                model.sitesInfoTo = '[]';
            }
            if (angular.isArray(model.sitesInfoCC) && model.sitesInfoCC.length) {
                model.sitesInfoCC = JSON.stringify(generator.interceptReceivedCollection('Site', model.sitesInfoCC));
            }
            else {
                model.sitesInfoCC = '[]';
            }

            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            /*var securityLevels = lookupService.returnLookups(lookupService.securityLevel);
            if (!angular.isArray(model.securityLevel))
                model.securityLevel = generator.getSelectedCollectionFromResult(securityLevels, model.securityLevel, 'lookupKey');*/

            model.securityLevel = lookupService.getLookupByLookupKey(lookupService.securityLevel, model.securityLevel);
            if (!angular.isDate(model.createdOn))
                model.createdOn = moment(model.createdOn).format('YYYY-MM-DD');

            model.mainClassification = classificationService.getClassificationById(model.mainClassification) || model.mainClassification;
            model.subClassification = classificationService.getClassificationById(model.subClassification) || model.subClassification;
            model.fileId = documentFileService.getDocumentFileById(model.fileId) || model.fileId;
            model.docType = documentTypeService.getDocumentTypeById(model.docType) || model.docType;
            model.priorityLevel = lookupService.getLookupByLookupKey(lookupService.priorityLevel, model.priorityLevel);
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

            return model;
        });

    })
};