module.exports = function (app) {
    app.controller('sendDocumentLinkPopCtrl', function (_,
                                                        toast,
                                                        langService,
                                                        dialog,
                                                        correspondence,
                                                        documentLink,
                                                        DocumentLinkSubscriber,
                                                        moment,
                                                        employeeService,
                                                        correspondenceService,
                                                        $filter) {
            'ngInject';
            var self = this;
            self.controllerName = 'sendDocumentLinkPopCtrl';

            self.correspondence = correspondence;
            self.model = angular.copy(correspondence);
            self.currentDate = new Date();
            self.documentLinkSubscriber = new DocumentLinkSubscriber();
            self.selectedDocumentLinkSubscribers = [];

            /**
             * @description add link subscriber
             */
            self.addDocumentLinkSubscriber = function (form) {
                self.documentLink.documentLinkSubscribers.push(self.documentLinkSubscriber);
                _resetDocumentLinkSubscriber(form);
            };

            self.sendDocumentLink = function ($event) {
                correspondenceService.sendDocumentLink(self.documentLink, self.correspondence)
                    .then(function () {
                        toast.success(langService.get('successfully_send_document_url'));
                    });
            };

            var _resetDocumentLinkSubscriber = function (form) {
                self.documentLinkSubscriber = new DocumentLinkSubscriber();
                self.selectedDocumentLinkSubscribers = [];
                if (form)
                    form.$setUntouched();
            };

            /**
             * @description remove document subscriber
             * @param subscriber
             * @param $index
             * @param $event
             */
            self.removeDocumentLinkSubscriber = function (subscriber, $index, $event) {
                return dialog
                    .confirmMessage(langService.get('confirm_remove').change({name: subscriber.sharedToFullName}), null, null, $event)
                    .then(function () {
                        self.documentLink.documentLinkSubscribers.splice($index, 1);
                        self.selectedDocumentLinkSubscribers = [];
                        toast.success(langService.get('delete_success'));
                    });
            };


            /**
             * @description delete bulk document subscriber
             * @param $event
             */
            self.removeBulkDocumentLinkSubscribers = function ($event) {
                return dialog
                    .confirmMessage(langService.get('confirm_delete_selected_multiple'), null, null, $event)
                    .then(function () {
                        var selectedSubscriber = null;
                        for (var i = 0; i < self.selectedDocumentLinkSubscribers.length; i++) {
                            selectedSubscriber = self.selectedDocumentLinkSubscribers[i];
                            var index = _.findIndex(self.documentLink.documentLinkSubscribers, function (documentSubscriber) {
                                return documentSubscriber.sharedToMobileNum === selectedSubscriber.sharedToMobileNum &&
                                    documentSubscriber.sharedToEmail === selectedSubscriber.sharedToEmail;
                            });
                            if (index > -1)
                                self.documentLink.documentLinkSubscribers.splice(index, 1);
                        }
                        _resetDocumentLinkSubscriber();
                        toast.success(langService.get('delete_success'));
                    });
            };


            self.getSortedData = function () {
                self.documentLink.documentLinkSubscribers = $filter('orderBy')(self.documentLink.documentLinkSubscribers, self.grid.order);
            };

            self.grid = {
                limit: 5, // default limit
                page: 1, // first page
                //order: 'arName', // default sorting order
                order: '', // default sorting order
                limitOptions: [5, 10, 20, {
                    label: langService.get('all'),
                    value: function () {
                        return (self.documentLink.documentLinkSubscribers.length + 21);
                    }
                }]
            };

            /**
             * @description Close the popup
             */
            self.closePopup = function () {
                dialog.cancel();
            };
        }
    );
};