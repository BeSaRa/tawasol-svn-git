module.exports = function (app) {
    app.config(function (loginPageProvider,
                         tokenServiceProvider,
                         urlServiceProvider,
                         IdleProvider,
                         rootEntityProvider,
                         viewDocumentServiceProvider,
                         localStorageServiceProvider,
                         $httpProvider) {
        'ngInject';

        var urlService = urlServiceProvider.$get();
        localStorageServiceProvider.setPrefix('CMS_');
        // if you do not need to flip login background set it to false
        loginPageProvider.flipLoginBackground(false);
        // add default CMSInterceptor
        $httpProvider.interceptors.push('CMSInterceptor');
        // set last login organization key


        // IdleProvider.idle((5 * 100 * 70)); // in seconds
        //IdleProvider.timeout(60); // in seconds
        //
        // 3164, 3165, 3166, 3167, 3168, 3169, 3170, 3171, 3172, 3173

        viewDocumentServiceProvider
            .addPageName('draftOutgoing')
            .addPageName('reviewOutgoing')
            .addPageName('readyToSendOutgoing')
            .addPageName('rejectedOutgoing')
            .addPageName('deletedOutgoing')
            // Incoming
            .addPageName('reviewIncoming')
            .addPageName('readyToSendIncoming')
            .addPageName('rejectedIncoming')
            .addPageName('deletedIncoming')
            // Internal
            .addPageName('draftInternal')
            .addPageName('reviewInternal')
            .addPageName('readyToSendInternal')
            .addPageName('rejectedInternal')
            .addPageName('approvedInternal')
            .addPageName('deletedInternal')
            // Search
            .addPageName('searchOutgoing')
            .addPageName('searchIncoming')
            .addPageName('searchInternal')
            .addPageName('searchGeneral')
            .addPageName('quickSearch')
            .addPageName('searchOutgoingIncoming')
            // User Inbox
            .addPageName('proxyMail')
            .addPageName('userInbox')
            .addPageName('followupEmployeeInbox')
            .addPageName('favoriteDocument')
            .addPageName('groupMail')
            .addPageName('sentItem')
            .addPageName('folder')
            // Central Archive
            .addPageName('centralArchiveReadyToExport')
            .addPageName('returnedCentralArchive')
            // Department Inbox
            .addPageName('departmentIncoming')
            .addPageName('departmentReturned')
            .addPageName('departmentSentItem')
            .addPageName('departmentReadyToExport')
            // G2G
            .addPageName('g2gIncoming')
            .addPageName('g2gSentItem')
            .addPageName('g2gReturned')
            .addPageName('g2gPending');

    });
};
