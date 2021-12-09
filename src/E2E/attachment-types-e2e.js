module.exports = function (app) {
    app.run(function ($httpBackend, urlService, generator, Response, AttachmentType) {
        'ngInject';
        var urlWithId = new RegExp(urlService.attachmentTypes + '\/(\\d+)');
        var urlActivateWithId = new RegExp(urlService.attachmentTypes + '/activate' + '\/(\\d+)');
        var urlDeactivateWithId = new RegExp(urlService.attachmentTypes + '/deactivate' + '\/(\\d+)');

        var attachmentTypes = [];

        var response = new Response();

        // get all attachmentTypes
        $httpBackend
            .whenGET(urlService.attachmentTypes)
            .respond(function () {
                return [200, response.setResponse(attachmentTypes)];
            });

        // add new attachment Type
        $httpBackend
            .whenPOST(urlService.attachmentTypes)
            .respond(function (method, url, data) {
                var attachmentType = JSON.parse(data);
                // create new id for model
                attachmentType.id = generator.createNewID(attachmentTypes, 'id');

                // push model to collections
                attachmentTypes.push(attachmentType);
                return [200, response.setResponse(attachmentType.id)];
            });

        // edit attachment Type
        $httpBackend.whenPUT(urlService.attachmentTypes)
            .respond(function (method, url, data) {
                var attachmentType = new AttachmentType(JSON.parse(data));

                for (var i = 0; i < attachmentTypes.length; i++) {
                    if (attachmentTypes[i].id === attachmentType.id) {
                        attachmentTypes[i] = attachmentType;
                        break;
                    }
                }

                return [200, response.setResponse(attachmentType)];
            });

        // delete attachmentTypes bulk
        $httpBackend.whenDELETE(urlService.attachmentTypes + '/bulk').respond(function (method, url, data) {
            var attachmentTypesToDelete = JSON.parse(data);

            for (var i = 0; i < attachmentTypesToDelete.length; i++) {
                for (var j = 0; j < attachmentTypes.length; j++) {
                    if (attachmentTypes[j].id === attachmentTypesToDelete[i]) {
                        attachmentTypes.splice(j, 1);
                        break;
                    }
                }
            }
            return [200, response.setResponse(true)];
        });

        // delete attachmentType single
        $httpBackend.whenDELETE(function (url) {
            return urlWithId.test(url);
        }).respond(function (method, url, data) {
            var id = url.split('/').pop();
            for (var i = 0; i < attachmentTypes.length; i++) {
                if (attachmentTypes[i].id === parseInt(id)) {
                    attachmentTypes.splice(i, 1);
                }
            }
            return [200, response.setResponse(true)];
        });

        // activate attachmentType status single
        $httpBackend.whenPUT(function (url) {
            return urlActivateWithId.test(url);
        }).respond(function (method, url, data) {
            var id = url.split('/').pop();

            var attachmentType = attachmentTypes.filter(function (e) {
                return e.id === parseInt(id);
            })[0];

            attachmentType.status = true;

            return [200, response.setResponse(true)];
        });

        // deactivate attachmentType status single
        $httpBackend.whenPUT(function (url) {
            return urlDeactivateWithId.test(url);
        }).respond(function (method, url, data) {
            var id = url.split('/').pop();

            var attachmentType = attachmentTypes.filter(function (e) {
                return e.id === parseInt(id);
            })[0];

            attachmentType.status = false;

            return [200, response.setResponse(true)];
        });

        // activate attachmentType status bulk
        $httpBackend.whenPUT((urlService.attachmentTypes + '/activate/bulk')).respond(function (method, url, data) {
            var attachmentTypesToActivate = JSON.parse(data);
            for (var i = 0; i < attachmentTypesToActivate.length; i++) {
                for (var j = 0; j < attachmentTypes.length; j++) {
                    if (attachmentTypes[j].id === attachmentTypesToActivate[i]) {
                        attachmentTypes[j].status = true;
                        break;
                    }
                }
            }
            return [200, response.setResponse(true)];
        });

        // Deactivate attachmentType status bulk
        $httpBackend.whenPUT((urlService.attachmentTypes + '/deactivate/bulk')).respond(function (method, url, data) {
            var attachmentTypesToActivate = JSON.parse(data);
            for (var i = 0; i < attachmentTypesToActivate.length; i++) {
                for (var j = 0; j < attachmentTypes.length; j++) {
                    if (attachmentTypes[j].id === attachmentTypesToActivate[i]) {
                        attachmentTypes[j].status = false;
                        break;
                    }
                }
            }
            return [200, response.setResponse(true)];
        });


    })
};
