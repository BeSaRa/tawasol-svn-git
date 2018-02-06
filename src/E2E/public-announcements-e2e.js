module.exports = function (app) {
    app.run(function ($httpBackend, urlService, generator, Response, PublicAnnouncement) {
        'ngInject';
        var urlWithId = new RegExp(urlService.publicAnnouncements + '\/(\\d+)');
        var urlActivateWithId = new RegExp(urlService.publicAnnouncements + '/activate' + '\/(\\d+)');
        var urlDeactivateWithId = new RegExp(urlService.publicAnnouncements + '/deactivate' + '\/(\\d+)');

        var publicAnnouncements = [];

        var response = new Response();

        // get all publicAnnouncements
        $httpBackend
            .whenGET(urlService.publicAnnouncements)
            .respond(function () {
                return [200, response.setResponse(publicAnnouncements)];
            });

        // add new publicAnnouncement
        $httpBackend
            .whenPOST(urlService.publicAnnouncements)
            .respond(function (method, url, data) {
                var publicAnnouncement = JSON.parse(data);
                // create new id for model
                publicAnnouncement.id = generator.createNewID(publicAnnouncements, 'id');

                // push model to collections
                publicAnnouncements.push(publicAnnouncement);
                return [200, response.setResponse(publicAnnouncement.id)];
            });

        // edit publicAnnouncement
        $httpBackend.whenPUT(urlService.publicAnnouncements)
            .respond(function (method, url, data) {
                var publicAnnouncement = new PublicAnnouncement(JSON.parse(data));

                for (var i = 0; i < publicAnnouncements.length; i++) {
                    if (publicAnnouncements[i].id === publicAnnouncement.id) {
                        publicAnnouncements[i] = publicAnnouncement;
                        break;
                    }
                }

                return [200, response.setResponse(publicAnnouncement)];
            });

        // delete publicAnnouncements bulk
        $httpBackend.whenDELETE(urlService.publicAnnouncements + '/bulk').respond(function (method, url, data) {
            var publicAnnouncementsToDelete = JSON.parse(data);

            for (var i = 0; i < publicAnnouncementsToDelete.length; i++) {
                for (var j = 0; j < publicAnnouncements.length; j++) {
                    if (publicAnnouncements[j].id === publicAnnouncementsToDelete[i]) {
                        publicAnnouncements.splice(j, 1);
                        break;
                    }
                }
            }
            return [200, response.setResponse(true)];
        });

        // delete publicAnnouncement single
        $httpBackend.whenDELETE(function (url) {
            return urlWithId.test(url);
        }).respond(function (method, url, data) {
            var id = url.split('/').pop();
            for (var i = 0; i < publicAnnouncements.length; i++) {
                if (publicAnnouncements[i].id === parseInt(id)) {
                    publicAnnouncements.splice(i, 1);
                }
            }
            return [200, response.setResponse(true)];
        });

        // activate publicAnnouncement status single
        $httpBackend.whenPUT(function (url) {
            return urlActivateWithId.test(url);
        }).respond(function (method, url, data) {
            var id = url.split('/').pop();

            var publicAnnouncement = publicAnnouncements.filter(function (e) {
                return e.id === parseInt(id);
            })[0];

            publicAnnouncement.status = true;

            return [200, response.setResponse(true)];
        });

        // deactivate publicAnnouncement status single
        $httpBackend.whenPUT(function (url) {
            return urlDeactivateWithId.test(url);
        }).respond(function (method, url, data) {
            var id = url.split('/').pop();

            var publicAnnouncement = publicAnnouncements.filter(function (e) {
                return e.id === parseInt(id);
            })[0];

            publicAnnouncement.status = false;

            return [200, response.setResponse(true)];
        });

        // activate publicAnnouncement status bulk
        $httpBackend.whenPUT((urlService.publicAnnouncements + '/activate/bulk')).respond(function (method, url, data) {
            var publicAnnouncementsToActivate = JSON.parse(data);
            for (var i = 0; i < publicAnnouncementsToActivate.length; i++) {
                for (var j = 0; j < publicAnnouncements.length; j++) {
                    if (publicAnnouncements[j].id === publicAnnouncementsToActivate[i]) {
                        publicAnnouncements[j].status = true;
                        break;
                    }
                }
            }
            return [200, response.setResponse(true)];
        });

        // Deactivate publicAnnouncement status bulk
        $httpBackend.whenPUT((urlService.publicAnnouncements + '/deactivate/bulk')).respond(function (method, url, data) {
            var publicAnnouncementsToActivate = JSON.parse(data);
            for (var i = 0; i < publicAnnouncementsToActivate.length; i++) {
                for (var j = 0; j < publicAnnouncements.length; j++) {
                    if (publicAnnouncements[j].id === publicAnnouncementsToActivate[i]) {
                        publicAnnouncements[j].status = false;
                        break;
                    }
                }
            }
            return [200, response.setResponse(true)];
        });


    })
};
