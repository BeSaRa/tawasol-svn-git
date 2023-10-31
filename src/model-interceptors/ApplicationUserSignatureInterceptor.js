module.exports = function (app) {
    app.run(function (CMSModelInterceptor, generator, ApplicationUserSignature) {
        'ngInject';

        var modelName = 'ApplicationUserSignature';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            delete model.cbrEnabled;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            if (model.hasOwnProperty('metaData')) {
                var imageUrl = "data:" + model.mimeType + ";base64," + model.content;
                model = generator.interceptReceivedInstance('ApplicationUserSignature', generator.generateInstance(model.metaData, ApplicationUserSignature));
                model.contentElementUrl = imageUrl;
            }
            return model;
        });

    })
};