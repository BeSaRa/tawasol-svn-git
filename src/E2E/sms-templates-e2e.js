module.exports = function (app) {
    app.run(function ($httpBackend, urlService, generator, Response, SmsTemplate) {
        'ngInject';
        var urlWithId = new RegExp(urlService.smsTemplates + '\/(\\d+)');
        var urlActivateWithId = new RegExp(urlService.smsTemplates + '/activate' + '\/(\\d+)');
        var urlDeactivateWithId = new RegExp(urlService.smsTemplates + '/deactivate' + '\/(\\d+)');

        var smsTemplates = [];

        var response = new Response();

        // get all smsTemplates
        $httpBackend
            .whenGET(urlService.smsTemplates)
            .respond(function () {
                return [200, response.setResponse(smsTemplates)];
            });

        // add new smsTemplate
        $httpBackend
            .whenPOST(urlService.smsTemplates)
            .respond(function (method, url, data) {
                var smsTemplate = JSON.parse(data);
                // create new id for model
                smsTemplate.id = generator.createNewID(smsTemplates, 'id');

                // push model to collections
                smsTemplates.push(smsTemplate);
                return [200, response.setResponse(smsTemplate.id)];
            });

        // edit smsTemplate
        $httpBackend.whenPUT(urlService.smsTemplates)
            .respond(function (method, url, data) {
                var smsTemplate = new SmsTemplate(JSON.parse(data));

                for (var i = 0; i < smsTemplates.length; i++) {
                    if (smsTemplates[i].id === smsTemplate.id) {
                        smsTemplates[i] = smsTemplate;
                        break;
                    }
                }

                return [200, response.setResponse(smsTemplate)];
            });

        // delete smsTemplates bulk
        $httpBackend.whenDELETE(urlService.smsTemplates + '/bulk').respond(function (method, url, data) {
            var smsTemplatesToDelete = JSON.parse(data);

            for (var i = 0; i < smsTemplatesToDelete.length; i++) {
                for (var j = 0; j < smsTemplates.length; j++) {
                    if (smsTemplates[j].id === smsTemplatesToDelete[i]) {
                        smsTemplates.splice(j, 1);
                        break;
                    }
                }
            }
            return [200, response.setResponse(true)];
        });

        // delete smsTemplate single
        $httpBackend.whenDELETE(function (url) {
            return urlWithId.test(url);
        }).respond(function (method, url, data) {
            var id = url.split('/').pop();
            for (var i = 0; i < smsTemplates.length; i++) {
                if (smsTemplates[i].id === parseInt(id)) {
                    smsTemplates.splice(i, 1);
                }
            }
            return [200, response.setResponse(true)];
        });

        // activate smsTemplate status single
        $httpBackend.whenPUT(function (url) {
            return urlActivateWithId.test(url);
        }).respond(function (method, url, data) {
            var id = url.split('/').pop();

            var smsTemplate = smsTemplates.filter(function (e) {
                return e.id === parseInt(id);
            })[0];

            smsTemplate.status = true;

            return [200, response.setResponse(true)];
        });

        // deactivate smsTemplate status single
        $httpBackend.whenPUT(function (url) {
            return urlDeactivateWithId.test(url);
        }).respond(function (method, url, data) {
            var id = url.split('/').pop();

            var smsTemplate = smsTemplates.filter(function (e) {
                return e.id === parseInt(id);
            })[0];

            smsTemplate.status = false;

            return [200, response.setResponse(true)];
        });

        // activate smsTemplate status bulk
        $httpBackend.whenPUT((urlService.smsTemplates + '/activate/bulk')).respond(function (method, url, data) {
            var smsTemplatesToActivate = JSON.parse(data);
            for (var i = 0; i < smsTemplatesToActivate.length; i++) {
                for (var j = 0; j < smsTemplates.length; j++) {
                    if (smsTemplates[j].id === smsTemplatesToActivate[i]) {
                        smsTemplates[j].status = true;
                        break;
                    }
                }
            }
            return [200, response.setResponse(true)];
        });

        // Deactivate smsTemplate status bulk
        $httpBackend.whenPUT((urlService.smsTemplates + '/deactivate/bulk')).respond(function (method, url, data) {
            var smsTemplatesToActivate = JSON.parse(data);
            for (var i = 0; i < smsTemplatesToActivate.length; i++) {
                for (var j = 0; j < smsTemplates.length; j++) {
                    if (smsTemplates[j].id === smsTemplatesToActivate[i]) {
                        smsTemplates[j].status = false;
                        break;
                    }
                }
            }
            return [200, response.setResponse(true)];
        });

    })
};
