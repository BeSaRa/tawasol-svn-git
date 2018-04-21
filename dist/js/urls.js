(function () {
    angular
        .module('app')
        .config(function (urlServiceProvider, rootEntityProvider, cmsTemplateProvider) {
            'ngInject';
            urlServiceProvider
                .setEnvironment('stage')
                .setBaseUrl('dev', 'http://localhost:9080/CMSServices/service')
                .setBaseUrl('stage', 'http://100.100.3.220:9080/CMSServices/service')
                .setBaseUrl('test', 'http://eblaepm.no-ip.org:9080/CMSServices/service')
                .setBaseUrl('demo', 'http://eblaepm.no-ip.org:9081/CMSServices/service')
                .setBaseUrl('training', 'http://100.100.3.142:9080/CMSServices/service')
                .setBaseUrl('ibm', 'http://100.100.3.107:9080/CMSServices/service')
                .setBaseUrl('manohar', 'http://100.100.11.4:9080/CMSServices/service');

            urlServiceProvider
            // to load languages
                .addToAll('language', 'dist/resources/lang.json')
                // to load sidebar menus
                .addToAll('menus', 'dist/resources/menu.json')
                // to make authenticate
                .addToAllWithBase('login', 'auth/login')
                // manage localizations
                .addToAllWithBase('localizations', 'cms-entity/admin/localization')
                // to logout
                .addToAllWithBase('logout', 'auth/logout')
                // select organization if user has more then one
                .addToAllWithBase('selectOrganizationLogin', 'auth/login/select-ou')
                // validate token
                .addToAllWithBase('validateToken', 'auth/validate-token')
                // organizations units
                .addToAllWithBase('organizations', 'cms-entity/admin/ou')
                // organization types
                .addToAllWithBase('organizationTypes', 'cms-entity/admin/ou-type')
                // lookups
                .addToAllWithBase('lookups', 'cloud/global-lookup/:lookupName')
                // applicationUsers
                .addToAllWithBase('applicationUsers', 'cms-entity/admin/application-user')
                // customRoles
                .addToAllWithBase('roles', 'cms-entity/admin/custom-role')
                // global lookups
                // global reference plan Numbers
                .addToAllWithBase('referencePlanNumbers', 'cms-entity/admin/reference-plan')
                // document types
                .addToAllWithBase('documentTypes', 'cms-entity/admin/doc-type')
                // document statuses
                .addToAllWithBase('documentStatus', 'cms-entity/admin/doc-status')
                //role permissions
                .addToAllWithBase('rolePermissions', 'cloud/permission')
                // theme
                .addToAllWithBase('themes', 'cms-entity/admin/theme')
                //workflow groups
                .addToAllWithBase('workflowGroups', 'cms-entity/admin/wf-group')
                // job title
                .addToAllWithBase('jobTitles', 'cms-entity/admin/job-title')
                // ranks
                .addToAllWithBase('ranks', 'cms-entity/admin/rank')
                // entity type
                .addToAllWithBase('entityTypes', 'cms-entity/admin/entity-type')
                //sms templates
                .addToAllWithBase('smsTemplates', 'cms-entity/admin/sms-template')
                //correspondence site type
                .addToAllWithBase('correspondenceSiteTypes', 'cms-entity/admin/correspondence-site-type')
                //government entities
                .addToAllWithBase('entities', 'cloud/root-entity')
                //global settings for root entity
                .addToAllWithBase('globalSettingsByRootId', 'cloud/root-entity/{ID}/global-settings')
                .addToAllWithBase('globalSettings', 'cms-entity/admin/global-setting')
                //public announcements
                .addToAllWithBase('publicAnnouncements', 'cms-entity/admin/public-announcement')
                // classifications
                .addToAllWithBase('classifications', 'cms-entity/admin/classification')
                //private announcements
                .addToAllWithBase('privateAnnouncements', 'cms-entity/admin/private-announcement')
                // document file
                .addToAllWithBase('documentFiles', 'cms-entity/admin/document-file')
                // document file
                .addToAllWithBase('relatedOUDocumentFiles', 'cms-entity/admin/ou-document-file')
                // ou document files
                .addToAllWithBase('ouDocumentFiles', 'cms-entity/admin/ou-document-file') // this replacement for relatedOuDocumentFile.
                //user classification permission
                .addToAllWithBase('userClassificationViewPermissions', 'cms-entity/admin/user-classification-permission')
                //organization unit application users
                .addToAllWithBase('ouApplicationUsers', 'cms-entity/admin/ou-application-user')
                //ou application users by application id
                .addToAllWithBase('ouApplicationUsersByUserId', 'cms-entity/admin/ou-application-user/userid/:userId')
                // related application user
                .addToAllWithBase('relatedApplicationUsersByOUId', 'cms-entity/admin/ou-application-user/ouid/:OUId')
                // Unrelated application user
                .addToAllWithBase('unRelatedApplicationUsersByOUId', 'cms-entity/admin/application-user/unassigned/:OUId')
                //related OUClassifications
                .addToAllWithBase('ouClassifications', 'cms-entity/admin/ou-classification')
                //user ou permission
                .addToAllWithBase('userOuPermissions', 'cms-entity/admin/user-ou-permission')
                //distribution lists
                .addToAllWithBase('distributionLists', 'cms-entity/admin/distribution-list')
                //related OUDistributionLists
                .addToAllWithBase('ouDistributionLists', 'cms-entity/admin/ou-distribution-list')
                //workflow actions
                .addToAllWithBase('workflowActions', 'cms-entity/admin/wf-action')
                // userWorkflowActions
                .addToAllWithBase('userWorkflowActions', 'cms-entity/admin/user-wf-action')
                // correspondence sites
                .addToAllWithBase('correspondenceSites', 'cms-entity/admin/correspondence-site')
                //related OUCorrespondenceSites
                .addToAllWithBase('ouCorrespondenceSites', 'cms-entity/admin/ou-correspondence-site')
                // to make authenticate
                .addToAllWithBase('information', 'auth/login/info')
                // encrypt password
                .addToAllWithBase('encryptPassword', 'auth/password/encrypt')
                // user comments
                .addToAllWithBase('userComments', 'cms-entity/user/user-comment')
                // to check connection
                .addToAllWithBase('connectionTest', 'cloud/connection-test')
                // to get all globalLocalizations
                .addToAllWithBase('globalLocalizationLookups', 'cloud/global-localization')
                // user workflow group
                .addToAllWithBase('userWorkflowGroups', 'cms-entity/admin/user-wf-group')
                // prepare outgoings
                .addToAllWithBase('prepareOutgoings', 'cms-entity/correspondence/outgoing/ou/:id/prepare')
                // draft outgoings
                .addToAllWithBase('draftOutgoings', 'cms-entity/correspondence/outgoing/ou/:id/draft')
                // review outgoings
                .addToAllWithBase('reviewOutgoings', 'cms-entity/correspondence/outgoing/ou/:id/review')
                // ready to send outgoings
                .addToAllWithBase('readyToSendOutgoings', 'cms-entity/correspondence/outgoing/ou/:id/ready-to-sent')
                // rejected outgoings
                .addToAllWithBase('rejectedOutgoings', 'cms-entity/correspondence/outgoing/ou/:id/rejected')
                // outgoing urls
                .addToAllWithBase('outgoings', 'cms-entity/correspondence/outgoing')
                // document templates
                .addToAllWithBase('documentTemplates', 'cms-entity/admin/tawasol-template')
                // attachment types
                .addToAllWithBase('attachmentTypes', 'cms-entity/admin/attachment-type')
                // search for tags
                .addToAllWithBase('documentTags', '/cms-entity/correspondence/tag/search?criteria={{tag}}')
                //add signature for application user
                .addToAllWithBase('applicationUserSignatures', '/cms-entity/user/signature')
                // attachments urls
                .addToAllWithBase('attachments', '/cms-entity/correspondence/{{documentClass}}/{{vsId}}/attachments')
                // attachments urls
                .addToAllWithBase('documentComments', 'cms-entity/user/document-comment')
                // property Configurations
                .addToAllWithBase('propertyConfigurations', '/cms-entity/correspondence/property-configuration')
                // search document
                .addToAllWithBase('searchDocument', '/cms-entity/correspondence/search/:searchType')
                // favoritesDWF for launch workflow
                .addToAllWithBase('favoritesDWF', '/cms-entity/user/user-frequent-list')
                // to get workflow dist users
                .addToAllWithBase('distributionWF', '/cms-entity/admin/ou-application-user/dist')
                // get all government users
                .addToAllWithBase('distributionWFEUsers', '/cms-entity/admin/application-user/dist/ge-heads')
                // current user workflow actions
                .addToAllWithBase('distributionWFActions', '/cms-entity/admin/wf-action/wf')
                // private users for distribution workflow
                .addToAllWithBase('distributionWFPrivate', '/cms-entity/admin/ou-application-user/dist/private-users')
                // search managers distribution workflow
                .addToAllWithBase('distributionWFManagers', '/cms-entity/admin/ou-application-user/dist/managers')
                // workflow groups for distribution workflow.
                // .addToAllWithBase('distributionWFGroups', 'cms-entity/admin/user-wf-group/user/active')
                .addToAllWithBase('distributionWFGroups', '/cms-entity/admin/user-wf-group/user')
                // dist workflow reg ou
                .addToAllWithBase('distributionWFREGOrganization', '/cms-entity/admin/ou/dist/reg-ous')
                // dist workflow normal ou
                .addToAllWithBase('distributionWFOrganization', '/cms-entity/admin/ou/dist/ous')
                // get sender information to reply.
                .addToAllWithBase('distributionWFSender', 'cms-entity/user/inbox/{wobNum}/reply')
                /*// search outgoing
                .addToAllWithBase('searchOutgoings', '/cms-entity/correspondence/search')
                // search incoming
                .addToAllWithBase('searchIncomings', '/cms-entity/correspondence/search')
                // search internal
                .addToAllWithBase('searchInternals', '/cms-entity/correspondence/search')*/
                // favorite users distribution workflow
                .addToAllWithBase('favoriteUserDW', '/cms-entity/user/user-frequent-list')
                // search private users distribution workflow
                .addToAllWithBase('privateUsers', '/cms-entity/admin/ou-application-user/dist/private-users')
                // search managers distribution workflow
                .addToAllWithBase('managerDistributionWorkflow', '/cms-entity/admin/ou-application-user/dist/managers')
                // search OU distribution workflow | same url is used in broadcast page
                .addToAllWithBase('ouDistributionWorkflow', '/cms-entity/admin/ou/dist/reg-ous')
                // actions distribution workflow
                .addToAllWithBase('actionsDistributionWorkflow', '/cms-entity/admin/wf-action/wf')
                // user event
                .addToAllWithBase('vts_userEventLog', 'cms-entity/user/event-log')
                //// user action
                //.addToAllWithBase('userActionLog', 'cms-entity/user/action-log')
                // find attachments
                .addToAllWithBase('vts_linkedAttachments', 'cms-entity/user/action-log/attachment/')
                //find linked documents
                .addToAllWithBase('vts_linkedDocuments', 'cms-entity/user/action-log/linkedDocument/')
                //find linked entity
                .addToAllWithBase('vts_linkedEntity', 'cms-entity/user/action-log/linkedEntity/')
                //find linked destinations
                .addToAllWithBase('vts_destinations', 'cms-entity/user/action-log/destinations/')
                //messaging history
                .addToAllWithBase('vts_messagingHistory', 'cms-entity/user/messaging-history/vsid')
                //view content
                .addToAllWithBase('vts_viewContentLog', 'cms-entity/user/view-content-log/vsid/')
                //sms
                .addToAllWithBase('vts_smsLog', 'cms-entity/user/sms-log/vsid/')
                //full history
                .addToAllWithBase('vts_fullHistory', 'cms-entity/user/full-history/vsid')
                //document status history
                .addToAllWithBase('vts_viewActionLog', 'cms-entity/user/view-action-log/vsid')
                // user inbox
                .addToAllWithBase('userInbox', '/cms-entity/user/inbox')
                // user inbox actions
                .addToAllWithBase('userInboxActions', '/cms-entity/correspondence/wf')
                // workflow groups distribution workflow
                .addToAllWithBase('workflowGroupDistributionWorkflow', 'cms-entity/admin/user-wf-group/user/active')
                // launch distribution workflow
                .addToAllWithBase('sendDistributionWorkflow', '/cms-entity/correspondence/wf/{{documentClass}}')
                // incoming department inbox
                .addToAllWithBase('departmentInboxes', '/cms-entity/user/ou-inbox')
                // department inbox actions
                .addToAllWithBase('departmentInboxActions', '/cms-entity/correspondence/wf')
                // layouts
                .addToAllWithBase('layouts', 'cms-entity/user/layouts')
                //user folders
                .addToAllWithBase('userFolders', '/cms-entity/user/user-folder')
                //government entities distribution workflow
                .addToAllWithBase('governmentEntityDistributionWorkflow', '/cms-entity/admin/application-user/dist/ge-heads')
                //download main document
                .addToAllWithBase('downloadDocument', '/cms-entity/correspondence/download-document/vsid')
                //download composite document
                .addToAllWithBase('downloadDocumentComposite', '/cms-entity/correspondence/download-document/composite/vsid')
                // counters
                .addToAllWithBase('counters', 'cms-entity/correspondence/outgoing/counters')
                // prepare template
                .addToAllWithBase('prepareTemplate', 'cms-entity/correspondence/{{classDescription}}/prepare/{{vsId}}')
                // view the document
                .addToAllWithBase('officeWebApps', 'cms-entity/correspondence/owas/content/{{vsId}}/edit')
                // quick accept incoming department inbox
                //.addToAllWithBase('quickReceiveIncomingDepartmentInbox', 'cms-entity/user/ou-inbox/{{workObjectNumber}}/receive-quick')
                // ready to export outgoing
                // .addToAllWithBase('readyToExports', 'cms-entity/correspondence/wf/outgoing/ready-to-export')
                // new ready to export
                .addToAllWithBase('readyToExports', 'cms-entity/user/ou-inbox/ready-to-export')
                // export ready to export outgoing
                .addToAllWithBase('exportReadyToExports', 'cms-entity/correspondence/wf/outgoing/book/{{vsId}}/wob-num/{{wobNum}}/export')
                // terminate single ready to export outgoing
                .addToAllWithBase('terminateReadyToExports', 'cms-entity/correspondence/wf/outgoing/terminate/ready-to-export')
                // correspondence views.
                .addToAllWithBase('correspondenceViews', 'cms-entity/correspondence/correspondence-site-view')
                // quick search
                .addToAllWithBase('quickSearchCorrespondence', 'cms-entity/correspondence/search/quick')
                // incoming
                .addToAllWithBase('incomings', 'cms-entity/correspondence/incoming/')
                // internal
                .addToAllWithBase('internals', 'cms-entity/correspondence/internal')
                // to manage any common correspondences
                .addToAllWithBase('correspondence', 'cms-entity/correspondence')
                // follow up employee inbox
                .addToAllWithBase('followupEmployeeInbox', 'cms-entity/user/inbox/followup-emp-inbox/user/:domainName/ou/:ouId')
                // follow up employee inbox actions
                .addToAllWithBase('followupEmployeeInboxActions', '/cms-entity/correspondence/wf')
                // proxy mail inbox
                .addToAllWithBase('proxyMailInbox', 'cms-entity/user/inbox/manager-inbox/')
                // user sent items
                .addToAllWithBase('userInboxSentItems', 'cms-entity/user/inbox/user-sent-items')
                // broadcast
                .addToAllWithBase('broadcast', 'cms-entity/correspondence/wf/outgoing/vsid/{{VSID}}/broadcast')
                // correspondence workFlow
                .addToAllWithBase('correspondenceWF', 'cms-entity/correspondence/wf')
                //search correspondence sites
                .addToAllWithBase('searchCorrespondenceSites', '/cms-entity/correspondence/correspondence-site-view')
                //Approved Internal
                .addToAllWithBase('approvedInternal', '/cms-entity/correspondence/wf/internal/approved-queue')
                // approved internal actions
                .addToAllWithBase('approvedInternalActions', '/cms-entity/correspondence/wf')
                //search OU application user
                .addToAllWithBase('searchOUApplicationUser', '/cms-entity/admin/ou-application-user')
                // for outgoing lookups
                .addToAllWithBase('correspondenceLookups', 'cms-entity/correspondence/{{documentClass}}/load-lookup')
                // department workFlow link
                .addToAllWithBase('departmentWF', 'cms-entity/user/ou-inbox')
                // user inbox workFlow link
                .addToAllWithBase('inboxWF', 'cms-entity/user/inbox')
                // notifications
                .addToAllWithBase('notifications', 'cms-entity/user/inbox/notifications/:count')
                // user favorite documents
                .addToAllWithBase('favoriteDocuments', 'cms-entity/user/user-favourite-document')
                // file types
                .addToAllWithBase('fileTypes', 'cloud/file-type')
                //export to excel
                .addToAllWithBase('exportToExcel', 'common/export/excel')
                //export to pdf
                .addToAllWithBase('exportToPdf', 'common/export/pdf')
                //all private users
                .addToAllWithBase('allPrivateUsers', 'cms-entity/admin/ou-application-user/dist/all-private-users')
                // all folder count
                .addToAllWithBase('folderCount', '/cms-entity/user/inbox/all-folders-count')
                // all available organization for central archive
                .addToAllWithBase('availableCentralArchive', 'cms-entity/admin/ou/ou-with-central-archive')
                // user filters.
                .addToAllWithBase('userFilters', '/cms-entity/user/user-inbox-filter')
                // all users who set this user as proxy
                .addToAllWithBase('usersWhoSetYouAsProxy', 'cms-entity/admin/ou-application-user/proxy/');
        })
        .config(function (tokenServiceProvider, urlServiceProvider, themeServiceProvider, attachmentServiceProvider) {
            var urlService = urlServiceProvider.$get();
            tokenServiceProvider.setLastLoginOrganizationIdKey('orgLogin');
            // exclude urls form token provider
            tokenServiceProvider
                .excludeTokenFromUrl(urlService.login)
                .excludeTokenFromUrl(urlService.information);

            // to allow theme render.
            themeServiceProvider.allowRender(false);

            // to add a groupExtensions
            attachmentServiceProvider
                .addExtensionGroup('userSignature', [
                    '.png'
                ])
                .addExtensionGroup('wordDocument', [
                    '.doc',
                    '.docx'
                ])
                .addExtensionGroup('scannerImport', [
                    '.png',
                    '.jpg',
                    '.jpeg',
                    '.gif',
                    '.tif',
                    '.tiff'
                ])
                .addExtensionGroup('pdfDocument', [
                    '.pdf'
                ])
                .addExtensionGroupWithExtend('attachmentUpload', ['scannerImport', 'wordDocument'], [
                    '.pdf'
                ]);


        });

})();