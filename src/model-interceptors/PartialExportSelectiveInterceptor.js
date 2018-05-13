module.exports = function (app) {
    app.run(function (CMSModelInterceptor, PartialExportCollection) {
        'ngInject';
        var modelName = 'PartialExportSelective';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            model.setPartialExportCollection(PartialExportCollection);
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.mapSend();
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            return model;
        });

    })
};