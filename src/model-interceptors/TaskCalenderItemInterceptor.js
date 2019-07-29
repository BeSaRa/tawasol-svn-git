module.exports = function (app) {
    app.run(function (CMSModelInterceptor, Information) {
        'ngInject';
        var modelName = 'TaskCalenderItem';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.creatorInfo = new Information(model.creatorInfo);
            return model;
        });

    })
};
