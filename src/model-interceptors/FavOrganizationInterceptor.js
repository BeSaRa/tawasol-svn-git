module.exports = function (app) {
    app.run(function (CMSModelInterceptor) {
        'ngInject';
        var modelName = 'FavOrganization';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            return {
                frequentOUID: model.toOUId
            };
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            return model;
        });

    })
};