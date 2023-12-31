(function () {
    angular
        .module('app')
        .config(function (urlServiceProvider) {
            'ngInject';
            urlServiceProvider
                .addToAllWithSegment('desktopEdit', '/goedit?mimtype={type}&vsid={vsId}&docsubject={subject}&docclassname={documentClass}&token={token}&view-only={mode}&entity={entityIdentifier}&ouid={currentOuId}&base-url={base_url}', 'desktopWord')
                .addToAll('language', 'dist/resources/lang.json')
                .addToAll('menus', 'dist/resources/menu.json')
                .addToAll('pspdfLanguage', 'dist/resources/pspdfkitLang.json')
                .addToAllWithSegment('icnLogin', '/navigator/jaxrs/logon?userid={{username}}&password={{password}}', 'icn')
                .addToAllWithSegment('icnSearch', '/navigator/bookmark.jsp?desktop=cms&repositoryId=EBLAICN&repositoryType=p8&docid=StoredSearch%2C%7BF4B4E428-6FC3-4BD3-BC91-AF46EC513DB1%7D%2C%7B76B326FF-8873-CB36-8524-6381F0800000%7D&mimeType=application%2Fx-filenet-searchtemplate&template_name=StoredSearch&version=current&vsId=%7BFF5CAE8D-D59D-CDF2-8488-6381F0800000%7D', 'icn')
                .addToAllWithSegment('icnAdd', '/navigator/bookmark.jsp?desktop=cms&repositoryId=EBLAICN&repositoryType=p8&docid=EntryTemplate%2C%7BF4B4E428-6FC3-4BD3-BC91-AF46EC513DB1%7D%2C%7BFB387ADC-CD58-C442-87A2-6381EEA00000%7D&mimeType=application%2Fx-icn-documententrytemplate&template_name=EntryTemplate&version=current&vsId=%7B2248377B-9A84-C3F3-845F-6381EEA00000%7D', 'icn')

                .addToAllWithSegment('reports', '/Reports/report/Reports/{reportName}?rs:embed=true&token={token}', 'report')
                .addToAllWithSegment('portal', '/ReportServer/logon.aspx?ReturnUrl={reportUrl}', 'report')
                .addToAllWithBase('login', 'auth/login')
                .addToAllWithBase('localizations', 'cms-entity/admin/localization')
                .addToAllWithBase('logout', 'auth/logout')
                .addToAllWithBase('selectOrganizationLogin', 'auth/login/select-ou')
                .addToAllWithBase('validateToken', 'auth/validate-token')
                .addToAllWithBase('organizations', 'cms-entity/admin/ou')
                .addToAllWithBase('organizationTypes', 'cms-entity/admin/ou-type')
                .addToAllWithBase('lookups', 'cloud/global-lookup/:lookupName')
                .addToAllWithBase('applicationUsers', 'cms-entity/admin/application-user')
                .addToAllWithBase('applicationUserLdap', 'cms-entity/admin/ldap/entites/check-user-exists?loginName=:domainName')
                .addToAllWithBase('roles', 'cms-entity/admin/custom-role')
                .addToAllWithBase('referencePlanNumbers', 'cms-entity/admin/reference-plan')
                .addToAllWithBase('documentTypes', 'cms-entity/admin/doc-type')
                .addToAllWithBase('documentStatus', 'cms-entity/admin/doc-status')
                .addToAllWithBase('rolePermissions', 'cloud/permission')
                .addToAllWithBase('themes', 'cms-entity/admin/theme')
                .addToAllWithBase('workflowGroups', 'cms-entity/admin/wf-group')
                .addToAllWithBase('jobTitles', 'cms-entity/admin/job-title')
                .addToAllWithBase('ranks', 'cms-entity/admin/rank')
                .addToAllWithBase('entityTypes', 'cms-entity/admin/entity-type')
                .addToAllWithBase('smsTemplates', 'cms-entity/admin/sms-template')
                .addToAllWithBase('correspondenceSiteTypes', 'cms-entity/admin/correspondence-site-type')
                .addToAllWithBase('entities', 'cloud/root-entity')
                .addToAllWithBase('globalSettingsByRootId', 'cloud/root-entity/{ID}/global-settings')
                .addToAllWithBase('globalSettings', 'cms-entity/admin/global-setting')
                .addToAllWithBase('publicAnnouncements', 'cms-entity/admin/public-announcement')
                .addToAllWithBase('classifications', 'cms-entity/admin/classification')
                .addToAllWithBase('privateAnnouncements', 'cms-entity/admin/private-announcement')
                .addToAllWithBase('documentFiles', 'cms-entity/admin/document-file')
                .addToAllWithBase('relatedOUDocumentFiles', 'cms-entity/admin/ou-document-file')
                .addToAllWithBase('ouDocumentFiles', 'cms-entity/admin/ou-document-file')
                .addToAllWithBase('userClassificationViewPermissions', 'cms-entity/admin/user-classification-permission')
                .addToAllWithBase('ouApplicationUsers', 'cms-entity/admin/ou-application-user')
                .addToAllWithBase('followupOrganization', 'cms-entity/admin/user-follow-up')
                .addToAllWithBase('ouApplicationUsersByUserId', 'cms-entity/admin/ou-application-user/userid/:userId')
                .addToAllWithBase('relatedApplicationUsersByOUId', 'cms-entity/admin/ou-application-user/ouid/:OUId')
                .addToAllWithBase('unRelatedApplicationUsersByOUId', 'cms-entity/admin/application-user/unassigned/:OUId')
                .addToAllWithBase('ouClassifications', 'cms-entity/admin/ou-classification')
                .addToAllWithBase('userOuPermissions', 'cms-entity/admin/user-ou-permission')
                .addToAllWithBase('distributionLists', 'cms-entity/admin/distribution-list')
                .addToAllWithBase('ouDistributionLists', 'cms-entity/admin/ou-distribution-list')
                .addToAllWithBase('workflowActions', 'cms-entity/admin/wf-action')
                .addToAllWithBase('userWorkflowActions', 'cms-entity/admin/user-wf-action')
                .addToAllWithBase('correspondenceSites', 'cms-entity/admin/correspondence-site')
                .addToAllWithBase('ouCorrespondenceSites', 'cms-entity/admin/ou-correspondence-site')
                .addToAllWithBase('information', 'auth/login/info')
                .addToAllWithBase('encryptPassword', 'auth/password/encrypt')
                .addToAllWithBase('userComments', 'cms-entity/user/user-comment')
                .addToAllWithBase('connectionTest', 'cloud/connection-test')
                .addToAllWithBase('globalLocalizationLookups', 'cloud/global-localization')
                .addToAllWithBase('userWorkflowGroups', 'cms-entity/admin/user-wf-group')
                .addToAllWithBase('prepareOutgoings', 'cms-entity/correspondence/outgoing/ou/:id/prepare')
                .addToAllWithBase('draftOutgoings', 'cms-entity/correspondence/outgoing/ou/:id/draft')
                .addToAllWithBase('reviewOutgoings', 'cms-entity/correspondence/outgoing/ou/:id/review')
                .addToAllWithBase('readyToSendOutgoings', 'cms-entity/correspondence/outgoing/ou/:id/ready-to-sent')
                .addToAllWithBase('rejectedOutgoings', 'cms-entity/correspondence/outgoing/ou/:id/rejected')
                .addToAllWithBase('outgoings', 'cms-entity/correspondence/outgoing')
                .addToAllWithBase('documentTemplates', 'cms-entity/admin/tawasol-template')
                .addToAllWithBase('attachmentTypes', 'cms-entity/admin/attachment-type')
                .addToAllWithBase('documentTags', '/cms-entity/correspondence/tag/search?criteria={{tag}}')
                .addToAllWithBase('applicationUserSignatures', '/cms-entity/user/signature')
                .addToAllWithBase('attachments', '/cms-entity/correspondence/{{documentClass}}/{{vsId}}/attachments')
                .addToAllWithBase('documentComments', 'cms-entity/user/document-comment')
                .addToAllWithBase('propertyConfigurations', '/cms-entity/correspondence/property-configuration')
                .addToAllWithBase('searchDocument', '/cms-entity/correspondence/search/:searchType')
                .addToAllWithBase('favoritesDWF', '/cms-entity/user/user-frequent-list')
                .addToAllWithBase('favoriteWFActions', '/cms-entity/admin/frequent-user-wf-action')
                .addToAllWithBase('distributionWF', '/cms-entity/admin/ou-application-user/dist')
                .addToAllWithBase('distributionWFEUsers', '/cms-entity/admin/application-user/dist/ge-heads')
                .addToAllWithBase('distributionWFActions', '/cms-entity/admin/wf-action/wf')
                .addToAllWithBase('distributionWFPrivate', '/cms-entity/admin/ou-application-user/dist/private-users')
                .addToAllWithBase('distributionWFManagers', '/cms-entity/admin/ou-application-user/dist/managers')
                .addToAllWithBase('distributionWFViceManagers', '/cms-entity/admin/ou-application-user/dist/vice-managers')
                .addToAllWithBase('distributionWFGroups', '/cms-entity/admin/user-wf-group/user')
                .addToAllWithBase('distributionWFREGOrganization', '/cms-entity/admin/ou/dist/reg-ous')
                .addToAllWithBase('distributionWFOrganization', '/cms-entity/admin/ou/dist/ous')
                .addToAllWithBase('distributionWFSender', 'cms-entity/user/inbox/{wobNum}/reply')
                .addToAllWithBase('favoriteUserDW', '/cms-entity/user/user-frequent-list')
                .addToAllWithBase('privateUsers', '/cms-entity/admin/ou-application-user/dist/private-users')
                .addToAllWithBase('managerDistributionWorkflow', '/cms-entity/admin/ou-application-user/dist/managers')
                .addToAllWithBase('ouDistributionWorkflow', '/cms-entity/admin/ou/dist/reg-ous')
                .addToAllWithBase('actionsDistributionWorkflow', '/cms-entity/admin/wf-action/wf')
                .addToAllWithBase('vts_userEventLog', 'cms-entity/user/event-log')
                .addToAllWithBase('vts_linkedAttachments', 'cms-entity/user/action-log/attachment/')
                .addToAllWithBase('vts_linkedDocuments', 'cms-entity/user/action-log/linkedDocument/')
                .addToAllWithBase('vts_linkedEntity', 'cms-entity/user/action-log/linkedEntity/')
                .addToAllWithBase('vts_destinations', 'cms-entity/user/action-log/destinations/')
                .addToAllWithBase('vts_messagingHistory', 'cms-entity/user/messaging-history/vsid')
                .addToAllWithBase('vts_receivedIncomingHistory', 'cms-entity/user/event-log/export/history/vsid')
                .addToAllWithBase('vts_viewContentLog', 'cms-entity/user/view-content-log/vsid/')
                .addToAllWithBase('vts_smsLog', 'cms-entity/user/sms-log/vsid/')
                .addToAllWithBase('vts_fullHistory', 'cms-entity/user/full-history/vsid')
                .addToAllWithBase('vts_viewActionLog', 'cms-entity/user/view-action-log/vsid')
                .addToAllWithBase('vts_annotationLog', 'cms-entity/user/action-log/annotation/:vsId')
                .addToAllWithBase('userInbox', '/cms-entity/user/inbox')
                .addToAllWithBase('userInboxActions', '/cms-entity/correspondence/wf')
                .addToAllWithBase('workflowGroupDistributionWorkflow', 'cms-entity/admin/user-wf-group/user/active')
                .addToAllWithBase('sendDistributionWorkflow', '/cms-entity/correspondence/wf/{{documentClass}}')
                .addToAllWithBase('departmentInboxes', '/cms-entity/user/ou-inbox')
                .addToAllWithBase('departmentInboxActions', '/cms-entity/correspondence/wf')
                .addToAllWithBase('layouts', 'cms-entity/user/layouts')
                .addToAllWithBase('userFolders', '/cms-entity/user/user-folder')
                .addToAllWithBase('governmentEntityDistributionWorkflow', '/cms-entity/admin/application-user/dist/ge-heads')
                .addToAllWithBase('downloadDocument', '/cms-entity/correspondence/download-document/vsid')
                .addToAllWithBase('downloadDocumentComposite', '/cms-entity/correspondence/download-document/composite/vsid')
                .addToAllWithBase('downloadDocumentAttachment', '/cms-entity/correspondence/download-document/attachment/vsid')
                .addToAllWithBase('downloadDocumentTemplate', '/cms-entity/correspondence/download-document/template/vsid')
                .addToAllWithBase('getDocumentEmailContent', '/cms-entity/correspondence/download-document/email/vsid')
                .addToAllWithBase('getDocumentCompositeEmailContent', '/cms-entity/correspondence/download-document/composite/email/vsid')
                .addToAllWithBase('counters', 'cms-entity/correspondence/outgoing/counters')
                .addToAllWithBase('prepareTemplate', 'cms-entity/correspondence/{{classDescription}}/prepare/{{vsId}}')
                .addToAllWithBase('officeWebApps', 'cms-entity/correspondence/owas/content/{{vsId}}/edit')
                .addToAllWithBase('readyToExports', 'cms-entity/user/ou-inbox/ready-to-export')
                .addToAllWithBase('exportDocumentByVsId', 'cms-entity/correspondence/wf/outgoing/book/{{vsId}}/export')
                .addToAllWithBase('exportReadyToExports', 'cms-entity/correspondence/wf/outgoing/book/{{vsId}}/wob-num/{{wobNum}}/export')
                .addToAllWithBase('selectiveExportByVsId', 'cms-entity/correspondence/wf/outgoing/book/{{vsId}}/selective-export')
                .addToAllWithBase('selectiveExport', 'cms-entity/correspondence/wf/outgoing/book/{{vsId}}/wob-num/{{wobNum}}/selective-export')
                .addToAllWithBase('terminateReadyToExports', 'cms-entity/correspondence/wf/outgoing/terminate/ready-to-export')
                .addToAllWithBase('correspondenceViews', 'cms-entity/correspondence/correspondence-site-view')
                .addToAllWithBase('quickSearchCorrespondence', 'cms-entity/correspondence/search/quick')
                .addToAllWithBase('incomings', 'cms-entity/correspondence/incoming')
                .addToAllWithBase('internals', 'cms-entity/correspondence/internal')
                .addToAllWithBase('correspondence', 'cms-entity/correspondence')
                .addToAllWithBase('followupEmployeeInbox', 'cms-entity/user/inbox/followup-emp-inbox/user/:domainName/ou/:ouId')
                .addToAllWithBase('followupEmployeeSentItems', 'cms-entity/user/inbox/user-sent-items/user-id/:userId/ou/:ouId')
                .addToAllWithBase('viewWorkItem', 'cms-entity/user/inbox/wob-num/')
                .addToAllWithBase('followupEmployeeInboxActions', '/cms-entity/correspondence/wf')
                .addToAllWithBase('proxyMailInbox', 'cms-entity/user/inbox/manager-inbox/')
                .addToAllWithBase('userInboxSentItems', 'cms-entity/user/inbox/user-sent-items')
                .addToAllWithBase('departmentSentItems', 'cms-entity/user/ou-inbox/dept-sent-items')
                .addToAllWithBase('broadcast', 'cms-entity/correspondence/wf/outgoing/vsid/{{VSID}}/broadcast')
                .addToAllWithBase('correspondenceWF', 'cms-entity/correspondence/wf')
                .addToAllWithBase('searchCorrespondenceSites', '/cms-entity/correspondence/correspondence-site-view')
                .addToAllWithBase('approvedInternal', '/cms-entity/correspondence/wf/internal/approved-queue')
                .addToAllWithBase('approvedInternalActions', '/cms-entity/correspondence/wf')
                .addToAllWithBase('searchOUApplicationUser', '/cms-entity/admin/ou-application-user')
                .addToAllWithBase('correspondenceLookups', 'cms-entity/correspondence/{{documentClass}}/load-lookup')
                .addToAllWithBase('departmentWF', 'cms-entity/user/ou-inbox')
                .addToAllWithBase('inboxWF', 'cms-entity/user/inbox')
                .addToAllWithBase('notifications', 'cms-entity/user/inbox/notifications/:count')
                .addToAllWithBase('favoriteDocuments', 'cms-entity/user/user-favourite-document')
                .addToAllWithBase('fileTypes', 'cloud/file-type')
                .addToAllWithBase('exportToExcel', 'common/export/excel')
                .addToAllWithBase('exportToPdf', 'common/export/pdf')
                .addToAllWithBase('exportToWord', 'common/export/word')
                .addToAllWithBase('allPrivateUsers', 'cms-entity/admin/ou-application-user/all-private-users')
                .addToAllWithBase('folderCount', '/cms-entity/user/inbox/all-folders-count')
                .addToAllWithBase('availableCentralArchive', 'cms-entity/admin/ou/ou-with-central-archive')
                .addToAllWithBase('userFilters', '/cms-entity/user/user-inbox-filter')
                .addToAllWithBase('userSubscriptions', 'cms-entity/user/user-subscription')
                .addToAllWithBase('usersWhoSetYouAsProxy', 'cms-entity/admin/ou-application-user/proxy/')
                .addToAllWithBase('updateManagerProxy', 'cms-entity/admin/ou-application-user/update-manager-proxy')
                .addToAllWithBase('g2gInbox', '/g2g/')
                .addToAllWithBase('documentSecurity', 'cms-entity/admin/documentsecurity')
                .addToAllWithBase('entityWithlimit', 'cms-entity/admin/{entityName}/limit/{number}')
                .addToAllWithBase('entityBySearchText', 'cms-entity/admin/{entityName}/lookup/criteria')
                .addToAllWithBase('childrenEntities', 'cms-entity/admin/{entityName}/childs/{entityId}')
                .addToAllWithBase('dynamicMenuItems', 'cms-entity/user/menu-item')
                .addToAllWithBase('maipLabels', '/cms-entity/correspondence/download-document/maip/labels')
                .addToAllWithBase('distributionWFCentralArchiveForUser', 'cms-entity/admin/ou/dist/central-archive')
                .addToAllWithBase('followupOu', 'cms-entity/admin/ou/dist/follow-up-ou')
                .addToAllWithBase('addManagerToAllUsers', "cms-entity/admin/ou/ou/:ouId/add-:manager-to-all")
                .addToAllWithBase('tasks', 'cms-entity/user/tasks')
                .addToAllWithBase('userAdminList', 'cms-entity/admin/user-admin-list')
                .addToAllWithBase('ouViewPermission', 'cms-entity/admin/user-view-ou-permission')
                .addToAllWithBase('hrEmployeeIntegration', 'cms-entity/admin/employee/criteria')
                .addToAllWithBase('employeeLookup', 'cms-entity/admin/employee/lookup')
                .addToAllWithBase('documentLink', 'cms-entity/user/document-link')
                .addToAllWithBase('viewDocumentLink', 'no-auth/view-link/:subscriberId/entity/:entity?otp=:otp')
                .addToAllWithBase('refreshCache', 'cloud/root-entity/refresh-cache')
                .addToAllWithBase('resendG2GKuwait', 'g2g/correspondence/g2gActionID/{g2gActionID}/resend')
                .addToAllWithBase('deliveryReportG2GKuwait', 'g2g/get-delivery-report/g2gActionID/{g2gActionId}')
                .addToAllWithBase('recallAndTerminate', 'g2g/correspondence/recall-and-terminate')
                .addToAllWithBase('recallAndForward', 'g2g/correspondence/g2gActionID/{g2gActionID}/recall-and-forward')
                .addToAllWithBase('g2gAttachments', 'g2g/correspondence/g2gActionID/{g2gActionID}/update-document-attachments')
                .addToAllWithBase('g2gCorrespondenceByActionID', 'g2g/correspondence/g2gActionID/{g2gActionID}/update-document-properties')
                .addToAllWithBase('messagingHistory', 'cms-entity/user/messaging-history')
                .addToAllWithBase('g2gTerminateByActionID', 'g2g/terminate/g2gActionID/{g2gActionID}')
                .addToAllWithBase('privateRegistryOU', 'cms-entity/admin/ou-private-registry')
                .addToAllWithBase('correspondenceCommon', 'cms-entity/correspondence/common')
                .addToAllWithBase('downloadSelected', 'cms-entity/correspondence/{documentClass}/merge-book')
                .addToAllWithBase('downloadDocumentContent', 'cms-entity/correspondence/common/download-content/{vsId}')
                .addToAllWithBase('downloadDocumentContentPDF', 'cms-entity/correspondence/common/mobility/vsid/{vsId}')
                .addToAllWithBase('downloadAttachmentContentPDF', 'cms-entity/correspondence/common/mobility/attachment/vsid/{vsId}')
                .addToAllWithBase('ouicksearchOverdueCounters', 'cms-entity/correspondence/search/quick/followup/{documentClass}')
                .addToAllWithBase('overdueCounters', 'cms-entity/user/landing-page/followup-counter')
                .addToAllWithBase('linkedPerson', 'cms-entity/admin/linked-person')
                .addToAllWithBase('predefinedAction', 'cms-entity/admin/user-dist-wf')
                .addToAllWithBase('followUpFolders', 'cms-entity/user/user-followup-book/folder')
                .addToAllWithBase('userFollowUp', 'cms-entity/user/user-followup-book')
                .addToAllWithBase('prepareFollowUp', 'cms-entity/user/user-followup-book/prepare-followup/vsid/:vsId/doc-class/:classKey')
                .addToAllWithBase('documentStamp', 'cms-entity/admin/tawasol-stamp')
                .addToAllWithBase('sequentialWorkflow', 'cms-entity/admin/seq-wf')
                .addToAllWithBase('sequentialWorkflowBackStep', 'cms-entity/correspondence/wf/:documentClass/seq-wf/back-ward')
                .addToAllWithBase('annotationContent', 'cms-entity/correspondence/common/annotation-content')
                .addToAllWithBase('openForApproval', 'cms-entity/correspondence/:documentClass/open-for-approval/vsid/:vsId')
                .addToAllWithBase('authorizeDocumentByAnnotation', 'cms-entity/correspondence/:documentClass/annotation/authorize')
                .addToAllWithBase('userInkSignature', 'cms-entity/user/annotation')
                .addToAllWithBase('BJClassifier', 'cms-entity/admin/documentsecurity/classifier/label')
                .addToAllWithBase('kwtDigitalStamp', 'cms-entity/correspondence/outgoing/digital-stamp/vsid/:vsId/stamp-vsid/:stampVsId')
                .addToAllWithBase('externalDataSource', 'cms-entity/admin/ex-import-store')
                .addToAllWithBase('userExternalDataSource', 'cms-entity/user/user-ext-import-store')
                .addToAllWithBase('activeOus', 'cms-entity/admin/ou/active/lookup')
                .addToAllWithBase('reminderEmail', 'cms-entity/user/inbox/send-remainder')
                .addToAllWithBase('returnedArchive', 'cms-entity/correspondence/incoming/ou/returned-to-central-archive')
                .addToAllWithBase('bulkRecallSentItems', 'cms-entity/user/inbox/bulk/recall')
                .addToAllWithBase('privateUserClassification', 'cms-entity/admin/user-classification')
                .addToAllWithBase('dynamicFollowup', 'cms-entity/user/user-followup-dynamic')
                .addToAllWithBase('dynamicFollowupUsers', '/cms-entity/user/user-followup-dynamic/dyanmic-followup-permission/ou/:ouId')
                .addToAllWithBase('applicationUserLevel', '/cms-entity/admin/application-user-level')
                .addToAllWithBase('userSpecificDistWF', '/cms-entity/admin/user-specific-dist-wf')
                .addToAllWithBase('lastAction', 'cms-entity/user/full-history/last-action/vsid')
                .addToAllWithBase('ouLogo', 'cms-entity/admin/ou/logo/')
                .addToAllWithBase('ministerAssistant', 'cms-entity/admin/minsitry-assistant')
        })
        .config(function (tokenServiceProvider, urlServiceProvider, themeServiceProvider, attachmentServiceProvider) {
            var urlService = urlServiceProvider.$get();
            tokenServiceProvider.setLastLoginOrganizationIdKey('orgLogin');

            tokenServiceProvider
                .excludeTokenFromUrl(urlService.login)
                .excludeUpdateToken(urlService.logut)
                .excludeUpdateToken(urlService.information)
                .excludeTokenFromUrl(urlService.information);


            themeServiceProvider.allowRender(false);

            attachmentServiceProvider
                .addExtensionGroup('png_jpg', [
                    '.png',
                    '.jpg',
                    '.jpeg'
                ])
                .addExtensionGroup('userSignature', [
                    '.png'
                ])
                .addExtensionGroup('userCertificate', [
                    '.pfx'
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
