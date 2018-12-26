module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      documentTemplateService,
                      Information,
                      langService,
                      _) {
        'ngInject';

        var modelName = 'DocumentTemplate';
        // var deletedElse = ['signaturesCount', 'docType', 'templateType', 'ou'];

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.ou = angular.copy(model.isGlobal) ? null : Number(model.ou);
            delete model.cbrEnabled;
            delete model.docTypeInfo;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.docType = model.docType === -1 ? null : model.docType;
            model.docTypeInfo = null;
            var matchedDocumentType = _.find(documentTemplateService.documentTypes, function (documentType) {
                return (documentType.value === model.docType);
            });
            if (matchedDocumentType)
                model.docTypeInfo = new Information({
                    arName: langService.getByLangKey(matchedDocumentType.langKey, 'ar'),
                    enName: langService.getByLangKey(matchedDocumentType.langKey, 'en')
                });
            return model;
        });

    })
};