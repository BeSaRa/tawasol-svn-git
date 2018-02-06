module.exports = function (app) {
    app.run(function ($httpBackend,
                      urlService,
                      generator,
                      Response) {
        'ngInject';
        var urlWithId = new RegExp(urlService.prepareOutgoings + '\/(\\d+)');
        var urlActivateWithId = new RegExp(urlService.prepareOutgoings + '/activate' + '\/(\\d+)');
        var urlDeactivateWithId = new RegExp(urlService.prepareOutgoings + '/deactivate' + '\/(\\d+)');

        var prepareOutgoings = [
            {
                "id": 1,
                "vsId": 1,
                "docSubject": "prepare subject 1",
                "documentTitle": "prepare doc title 1",
                "priorityLevel": 1,
                "securityLevel": 1

            },
            {
                "id": 2,
                "vsId": 2,
                "docSubject": "prepare subject 2",
                "documentTitle": "prepare doc title 2",
                "priorityLevel": 3,
                "securityLevel": 3

            },
            {
                "id": 3,
                "vsId": 3,
                "docSubject": "prepare subject 3",
                "documentTitle": "prepare doc title 3",
                "priorityLevel": 5,
                "securityLevel": 5

            }
        ];

        var response = new Response();

        // get all prepare outgoings
        $httpBackend
            .whenGET(urlService.prepareOutgoings)
            .respond(function () {
                return [200, response.setResponse(prepareOutgoings)];
            });


    })
};