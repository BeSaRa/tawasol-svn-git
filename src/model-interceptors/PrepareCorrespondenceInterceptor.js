module.exports = function (app) {
    app.run(function (CMSModelInterceptor, generator) {
        'ngInject';
        var modelName = 'PrepareCorrespondence';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            var formData = new FormData();
            var info = model.entity.getInfo();
            var entity = generator.interceptSendInstance(['Correspondence', generator.ucFirst(info.documentClass)], model.entity);
            entity.signaturesCount = 1;
            entity.documentTitle = 'document-' + Date.now();
            formData.append('entity', angular.toJson(entity));
            formData.append('content', model.content);
            return formData;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            return model;
        });

    })
};