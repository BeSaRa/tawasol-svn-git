module.exports = function (app) {
    app.run(function ($httpBackend,
                      urlService,
                      generator,
                      Response) {
        'ngInject';
        var urlWithId = new RegExp(urlService.reviewOutgoings + '\/(\\d+)');
        var urlActivateWithId = new RegExp(urlService.reviewOutgoings + '/activate' + '\/(\\d+)');
        var urlDeactivateWithId = new RegExp(urlService.reviewOutgoings + '/deactivate' + '\/(\\d+)');

        var reviewOutgoings = [
            {
                "id": 1,
                "vsId": 1,
                "docSubject": "review subject 1",
                "documentTitle": "review doc title 1",
                "priorityLevel": 1,
                "securityLevel": 1

            },
            {
                "id": 2,
                "vsId": 2,
                "docSubject": "review subject 2",
                "documentTitle": "review doc title 2",
                "priorityLevel": 3,
                "securityLevel": 3

            },
            {
                "id": 3,
                "vsId": 3,
                "docSubject": "review subject 3",
                "documentTitle": "review doc title 3",
                "priorityLevel": 5,
                "securityLevel": 5

            }
        ];

        var response = new Response();

        // get all review outgoings
        $httpBackend
            .whenGET(urlService.reviewOutgoings)
            .respond(function () {
                return [200, response.setResponse(reviewOutgoings)];
            });


    })
};