module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      LinkedObject,
                      HREmployee,
                      entityTypeService) {
        'ngInject';
        var modelName = 'HREmployee';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model = new HREmployee(model);
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            var oldModel = angular.copy(model);
            model.typeId = 1; // for employees linked object
            model = new LinkedObject({
                mobileNumber: model.mobile,
                email: model.email,
                qid: model.qId,
                fullNameAr: model.arName,
                fullNameEn: model.enName,
                nationality: model.nationality,
                employeeNum: model.employeeNo.toString(),
                typeId: entityTypeService.getEntityTypeById(model.typeId)
            });

            if (oldModel.attachDomainName) {
                model.domainName = oldModel.domainName;
            }
            return model;
        });

    })
};
