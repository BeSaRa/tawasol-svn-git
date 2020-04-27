module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      generator,
                      PredefinedActionMember) {
        'ngInject';
        var modelName = 'PredefinedAction';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            if (model.members && model.members.length) {
                model.members = generator.interceptSendCollection('PredefinedActionMember', model.members)
            }
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            if (model.members && model.members.length) {
                model.members = generator.interceptReceivedCollection('PredefinedActionMember', generator.generateCollection(model.members, PredefinedActionMember))
            }
            return model;
        });

    })
};
