module.exports = function (app) {
    app.controller('userLinksPopupCtrl', function (userLinks, employeeService, langService, dialog, correspondenceService, toast) {
        'ngInject';
        var self = this;
        self.controllerName = 'userLinksPopupCtrl';
        self.userLinks = userLinks;

        /**
         * @description load links for current user.
         * @returns {*}
         */
        self.reloadUserLinks = function () {
            var employee = employeeService.getEmployee();
            return correspondenceService
                .loadUserLinks(employee.id, employee.getOUID())
                .then(function (links) {
                    return self.userLinks = links;
                });
        };
        /**
         * @description change status of clicked link
         * @param link
         */
        self.toggleLinkStatus = function (link) {
            correspondenceService.updateDocumentLink(link, link.createCorrespondence())
                .then(function () {
                    toast.success(langService.get('status_success'));
                })
                .catch(function () {
                    link.status = !link.status;
                    dialog.errorMessage(langService.get('something_happened_when_update_status'));
                });
        };
        /**
         * @description open link in edit dialog
         * @param link
         * @param $event
         */
        self.openEditLink = function (link, $event) {
            var correspondence = link.createCorrespondence();
            correspondenceService
                .openSendDocumentURLDialog(correspondence, $event)
                .then(function () {
                    self.reloadUserLinks();
                })
        };

        self.closeUserLinksPopup = function () {
            dialog.cancel();
        };
    });
};
