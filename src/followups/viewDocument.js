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
            .getPageNameOverride('reviewOutgoing', 'draftOutgoing')
            .getPageNameOverride('readyToSendOutgoing', 'draftOutgoing')
            .getPageNameOverride('rejectedOutgoing', 'draftOutgoing')
            // Incoming
            .getPageNameOverride('reviewIncoming', 'draftOutgoing')
            .getPageNameOverride('readyToSendIncoming', 'draftOutgoing')
            .getPageNameOverride('rejectedIncoming', 'draftOutgoing')
            // Internal
            .getPageNameOverride('draftInternal', 'draftOutgoing')
            .getPageNameOverride('reviewInternal', 'draftOutgoing')
            .getPageNameOverride('readyToSendInternal', 'draftOutgoing')
            .getPageNameOverride('rejectedInternal', 'draftOutgoing')
            // Search
            .getPageNameOverride('searchOutgoing', 'draftOutgoing', {
                disableProperties: function () {
                    return true;
                },
                disableSites: function (model) {
                    var info = model.getInfo();
                    return !(employeeService.hasPermissionTo("MANAGE_DESTINATIONS") && info.docStatus < 25);
                }
            })
            .getPageNameOverride('searchIncoming', 'draftOutgoing', {
                disableProperties: function () {
                    return true;
                }
            })
            .getPageNameOverride('searchInternal', 'draftOutgoing', {
                disableProperties: function () {
                    return true;
                },
                disableSites: function () {
                    return true;
                }
            })
            .getPageNameOverride('searchGeneral', 'draftOutgoing',{
                disableProperties: function () {
                    return true;
                },
                disableSites: function (model) {
                    var info = model.getInfo();
                    var hasPermission = employeeService.hasPermissionTo("MANAGE_DESTINATIONS");
                    var allowedByDocClass = (info.documentClass === 'outgoing') ? (info.docStatus < 25) : (info.documentClass === 'incoming');
                    var allowed = (hasPermission && info.documentClass !== "internal") && allowedByDocClass;
                    return !allowed
                }
            })
    })
};