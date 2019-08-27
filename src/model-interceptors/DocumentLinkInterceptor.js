module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      employeeService,
                      DocumentLinkSubscriber,
                      lookupService,
                      DocumentLink,
                      moment,
                      generator) {
        'ngInject';
        var modelName = 'DocumentLink';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            if (!model.id) {
                var employee = employeeService.getEmployee();
                model.createdBy = employee.id;
                model.createdByOU = employee.getOUID();
                model.creationTime = generator.getTimeStampFromDate(new Date());
            }

            model.expirationTime = moment(model.expirationTime).format('Y-MM-DD');
            model.expirationTime = model.expirationTime + ' ' + (model.expirationHours ? model.expirationHours + ':00' : '00:00:00');
            model.expirationTime = moment(model.expirationTime).toDate();
            delete model.expirationHours;
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            var expirationTime = model.expirationTime;
            model.expirationTime = moment(expirationTime).toDate();
            model.expirationHours = moment(expirationTime).format('HH:mm');
            return model;
        });
    })
};
