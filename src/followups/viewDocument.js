module.exports = function (app) {
    app.run(function (viewDocumentService, employeeService) {
        'ngInject';

        viewDocumentService
            .getPageName(
                'draftOutgoing',
                function (model) {
                    return !employeeService.hasPermissionTo("EDIT_OUTGOING_PROPERTIES");
                }, function (model) {
                    return !employeeService.hasPermissionTo("MANAGE_DESTINATIONS");
                }, function (model) {
                    return false
                })
            .getPageNameOverride('reviewOutgoing', 'draftOutgoing', {
                disableAll: function () {
                    return true;
                }
            })
    })
};