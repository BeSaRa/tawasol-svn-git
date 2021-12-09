module.exports = function (app) {
    app.run(function (CMSModelInterceptor) {
        'ngInject';
        var modelName = 'ExtImportStore';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.metaDataColumns = model.metaDataColumns?.length > 0 ? JSON.stringify(model.metaDataColumns) : JSON.stringify([]);
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            if (model.metaDataColumns?.length > 0) {
                model.metaDataColumns = JSON.parse(model.metaDataColumns);
            }
            return model;
        });

    })
};
