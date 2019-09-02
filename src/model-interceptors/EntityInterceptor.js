module.exports = function (app) {
    app.run(function (CMSModelInterceptor,
                      generator,
                      LDAPProvider) {
        'ngInject';

        var modelName = 'Entity';

        CMSModelInterceptor.whenInitModel(modelName, function (model) {
            return model;
        });

        CMSModelInterceptor.whenSendModel(modelName, function (model) {
            model.smtpPort = model.smtpPort ? Number(model.smtpPort) : null;
            for (var i = 0; i < model.ldapProviders.length; i++) {
                model.ldapProviders[i].isSSL = !!model.ldapProviders[i].isSSL;
                model.ldapProviders[i].isDefault = !!model.ldapProviders[i].isDefault;
            }
            // In case of edit, the g2gPassword and internalG2gPassword will only be sent if entered by user to override.
            // If not entered, properties will be removed from object.
            if (model.id) {
                if (model.serverAddress && !model.password)
                    delete model.password;
                if (model.cmUserName && !model.cmPassword)
                    delete model.cmPassword;
                if (model.smtpServerAddress && !model.smtpPassword)
                    delete model.smtpPassword;
                if (model.g2gServerAddress && !model.g2gPassword)
                    delete model.g2gPassword;
                if (model.internalG2gServerAddress && !model.internalG2gPassword)
                    delete model.internalG2gPassword;
            }
            return model;
        });

        CMSModelInterceptor.whenReceivedModel(modelName, function (model) {
            if (model.ldapProviders.length) {
                model.ldapProviders = generator.generateCollection(model.ldapProviders, LDAPProvider);
            }
            model.removeAllPasswords();
            return model;
        });

    })
};
