module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      _,
                      moment,
                      lookupService,
                      LinkedObject,
                      documentTypeService,
                      classificationService,
                      documentTagService,
                      entityTypeService,
                      attachmentService,
                      documentCommentService,
                      $location,
                      generator) {
        'ngInject';
        var modelName = 'General';

        var convertedProperties = [
            'mainClassification',
            'subClassification'
        ];

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            var info = model.getInfo();
            model.tags = model.tags ? JSON.stringify(model.tags) : model.tags;

            if (angular.isArray(model.attachments) && model.attachments.length && model.attachments[0]) {
                model.attachments = (model.attachments[0].hasOwnProperty('vsId')) ? JSON.stringify(_.map(model.attachments, 'vsId')) : JSON.stringify(model.attachments);
            } else {
                model.attachments = JSON.stringify([]);
            }
            model.documentTitle = ('document-' + (Math.random() * 1988));

            if (model.linkedEntities && model.linkedEntities.length) {
                model.linkedEntities = JSON.stringify(generator.interceptSendCollection('LinkedObject', model.linkedEntities));
            } else {
                model.linkedEntities = null;
            }

            // if (angular.isArray(model.sitesInfoTo) && model.sitesInfoTo.length) {
            //     model.sitesInfoTo = _.map(model.sitesInfoTo, function (site) {
            //         site.docClassName = info.documentClass;
            //         return site;
            //     });
            //     model.sitesInfoTo = JSON.stringify(generator.interceptReceivedCollection('Site', model.sitesInfoTo));
            // }
            // else {
            //     model.sitesInfoTo = '[]';
            // }
            // if (angular.isArray(model.sitesInfoCC) && model.sitesInfoCC.length) {
            //     model.sitesInfoCC = _.map(model.sitesInfoCC, function (site) {
            //         site.docClassName = info.documentClass;
            //         return site;
            //     });
            //     model.sitesInfoCC = JSON.stringify(generator.interceptReceivedCollection('Site', model.sitesInfoCC));
            // }
            // else {
            //     model.sitesInfoCC = '[]';
            // }
            delete model.documentComments;
            delete model.linkedAttachmentList;//Its actually removed from model but removed here as well if in case it comes up from some other interception

            delete model.securityLevelIndicator;
            delete model.priorityLevelIndicator;
            delete model.attachmentsIndicator;
            delete model.linkedDocsIndicator;
            delete model.tagsIndicator;
            delete model.followUpStatusIndicator;
            delete model.dueDateStatusIndicator;
            delete model.docClassIndicator;
            delete model.cbrEnabled;

            /*If Document has vsId(update document), we will not remove the content file.
            If document don't has vsId(new document), we will remove the content file, so it doesn't affect the save request model */
            if (!model.hasVsId() && model.contentFile)
                delete model.contentFile;

            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {

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

            model.docClassIndicator = model.getDocClassIndicator(model.getInfo().documentClass);
            //model.isPaperIndicator = model.getIsPaperIndicator(model.addMethod);

            return model;
        });

    })
};