module.exports = function (app) {
    app.run(function (CMSModelInterceptor) {
        'ngInject';
        var modelName = 'TawasolStamp';
        
        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            if (model.hasOwnProperty('metaData')) {
                var imageUrl = "data:" + model.mimeType + ";base64," + model.content;
                model = model.metaData;
                model.contentElementUrl = imageUrl;
            }

            return model;
        });
        
    })
};
