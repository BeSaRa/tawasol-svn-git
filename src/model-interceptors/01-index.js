module.exports = function (app) {
    require('./ApplicationUserInterceptor')(app);
    require('./OrganizationInterceptor')(app);
    require('./LookupIntercepetor')(app);
    require('./DocumentTypeInterceptor')(app);
    require('./DocumentStatusInterceptor')(app);
    require('./ThemeInterceptor')(app);
    require('./SmsTemplateInterceptor')(app);
    require('./WorkFlowGroupInterceptor')(app);
    require('./EntityInterceptor')(app);
    require('./ClassificationInterceptor')(app);
    require('./DocumentFileInterceptor')(app);
    require('./GlobalSettingInterceptor')(app);
    require('./OUClassificationInterceptor')(app);
    require('./DistributionListInterceptor')(app);
    require('./OUDistributionListInterceptor')(app);
    require('./ReferencePlanNumberInterceptor')(app);
    require('./WorkflowActionInterceptor')(app);
    require('./CorrespondenceSiteInterceptor')(app);
    require('./OUCorrespondenceSiteInterceptor')(app);
    require('./MenuItemInterceptor')(app);
    require('./UserWorkflowActionInterceptor')(app);
    require('./UserClassificationViewPermissionInterceptor')(app);
    require('./PublicAnnouncementInterceptor')(app);
    require('./PrivateAnnouncementInterceptor')(app);
    require('./RoleInterceptor')(app);
    require('./OUApplicationUserInterceptor')(app);
    require('./DocumentTemplateInterceptor')(app);
    require('./AttachmentTypeInterceptor')(app);
    require('./AttachmentInterceptor')(app);
    require('./DocumentCommentInterceptor')(app);
    require('./PropertyConfigurationInterceptor')(app);
    require('./SearchOutgoingInterceptor')(app);
    require('./LinkedObjectInterceptor')(app);
    require('./WorkFlowHistoryInterceptor')(app);
    require('./LinkedDocumentInterceptor')(app);
    require('./LinkedAttachmentInterceptor')(app);
    require('./LinkedEntityInterceptor')(app);
    require('./DestinationHistoryInterceptor')(app);
    require('./ContentViewHistoryInterceptor')(app);
    require('./SmsLogInterceptor')(app);
    require('./FullHistoryInterceptor')(app);
    require('./OutgoingDeliveryReportInterceptor')(app);
    require('./MergedLinkedDocumentHistoryInterceptor')(app);
    require('./WorkItemInterceptor')(app);
    require('./DistributionWorkflowOUInterceptor')(app);
    require('./FavoriteOUInterceptor')(app);
    require('./UserFolderInterceptor')(app);
    require('./CounterInterceptor')(app);
    require('./ReadyToExportOutgoingInterceptor')(app);
    require('./SiteInterceptor')(app);
    require('./QuickSearchCorrespondenceInterceptor')(app);
    require('./EventHistoryInterceptor')(app);
    require('./SendDistributionWorkflowInterceptor')(app);
    require('./CorrespondenceInterceptor')(app);
    require('./AttachmentDeleteInterceptor')(app);
    require('./BroadcastInterceptor')(app);
    require('./EmployeeInterceptor')(app);
    require('./DistributionWorkflowBulkInterceptor')(app);
    require('./SearchIncomingInterceptor')(app);
    require('./SearchInternalInterceptor')(app);
    require('./SentItemDepartmentInboxInterceptor')(app);
    require('./SearchGeneralInterceptor')(app);
    require('./UserWorkflowGroupInterceptor')(app);
    require('./SearchCriteriaInterceptor')(app);
    require('./OUDocumentFileInterceptor')(app);
    require('./ApplicationUserSignatureInterceptor')(app);
    require('./AppUserCertificateInterceptor')(app);
    require('./ViewOutgoingInterceptor')(app);
    require('./ViewIncomingInterceptor')(app);
    require('./ViewInternalInterceptor')(app);
    require('./FavoriteDocumentInterceptor')(app);
    require('./GeneralStepElementViewInterceptor')(app);
    require('./ReferencePlanItemStartSerialInterceptor')(app);
    require('./PrepareCorrespondenceInterceptor')(app);
    require('./LocalizationInterceptor')(app);
    require('./MailNotificationInterceptor')(app);
    require('./ContentViewHistoryEventsInterceptor')(app);
    require('./SendProxyInterceptor')(app);
    require('./ProxyMailUserInterceptor')(app);
    require('./AttachmentViewInterceptor')(app);
    require('./FavOrganizationInterceptor')(app);
    require('./FavUserInterceptor')(app);
    require('./DistributionWFInterceptor')(app);
    require('./UserSearchCriteriaInterceptor')(app);
    require('./UserCommentInterceptor')(app);
    require('./UserFilterInterceptor')(app);
    require('./SiteViewInterceptor')(app);
    require('./G2GInterceptor')(app);
    require('./G2GMessagingHistoryInterceptor')(app);
    require('./PartialExportInterceptor')(app);
    require('./PartialExportCollectionInterceptor')(app);
    require('./PartialExportSelectiveInterceptor')(app);
    require('./DocumentSecurityInterceptor')(app);
    require('./DocumentSecuritySettingInterceptor')(app);
    require('./CorrespondenceVersionInterceptor')(app);
    require('./SearchOutgoingIncomingInterceptor')(app);
    require('./DynamicMenuItemInterceptor')(app);
    require('./ReadyToExportOptionInterceptor')(app);
    require('./RootEntityInterceptor')(app);
    require('./UserMenuItemInterceptor')(app);
    require('./EventHistoryCriteriaInterceptor')(app);
    require('./UserSubscriptionInterceptor')(app);
    require('./CreateReplyInterceptor')(app);
    require('./ViewerLogInterceptor')(app);
    require('./TaskInterceptor')(app);
    require('./TaskParticipantInterceptor')(app);
    require('./AdministratorInterceptor')(app);
    require('./FollowupOrganizationInterceptor')(app);
    require('./OUViewPermissionInterceptor')(app);
    require('./HREmployeeInterceptor')(app);
    require('./DocumentLinkInterceptor')(app);
    require('./TaskCalenderItemInterceptor')(app);
    require('./WFUserInterceptor')(app);
    require('./PredefinedActionInterceptor')(app);
    require('./PredefinedActionMemberInterceptor')(app);
    require('./ExportedTrackingSheetResultInterceptor')(app);
    require('./FollowupBookInterceptor')(app);
    require('./FollowupBookCriteriaInterceptor')(app);
    require('./UserFollowupBookLogInterceptor')(app);
    require('./UserFollowupRequestInterceptor')(app);
    require('./TawasolStampInterceptor')(app);
};
