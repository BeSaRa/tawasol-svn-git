module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      Information,
                      _) {
        'ngInject';

        var modelName = 'Administrator';


        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            if (model.isSuperAdmin) {
                model.adminOnRegOUID = null;
                model.adminOnRegOUList = [null];
                model.adminOnRegOUInfo = null;
            } else if (model.adminOnRegOUList && model.adminOnRegOUList.length) {
                model.isSuperAdmin = false;
            }
            model.userId = model.userId.hasOwnProperty('id') ? model.userId.id : model.userId;

            delete model.isSuperAdminText;
            delete model.adminOnRegOUListInfo;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            model.userInfo = new Information(model.userInfo);
            model.isSuperAdminText = model.getTranslatedYesNo('isSuperAdmin');
            
            if (model.isSuperAdmin) {
                model.adminOnRegOUID = null;
                model.adminOnRegOUList = [];
                model.adminOnRegOUInfo = null;
                model.adminOnRegOUListInfo = [];
            } else {
                model.adminOnRegOUInfo = new Information(model.adminOnRegOUInfo);
            }
            return model;
        });

    });
};
