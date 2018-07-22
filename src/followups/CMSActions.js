module.exports = function (app) {
    app.run(function (CMSActionService) {
        'ngInject';

        CMSActionService
            .addActionGroup('draftOutgoing')
            .addAction('document_information', {
                type: 'action',
                icon: 'information-variant',
                text: 'grid_action_document_info',
                shortcut: false,
                showInView: false,
                subMenu: [
                    {
                        type: 'info',
                        checkShow: self.checkToShowAction,
                        gridName: 'outgoing-draft'
                    }
                ],
                class: "action-green"
            });

    })
};