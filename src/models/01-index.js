module.exports = function (app) {
    //TODO: need to add interceptor for all below model
    require('./Language')(app);
    require('./Sidebar')(app);
    require('./MenuItem')(app);
    require('./Credentials')(app);
    require('./OrganizationLogin')(app);
    require('./Employee')(app);
    require('./Role')(app);
    require('./OrganizationType')(app);
    require('./Validation')(app);
    require('./PropertyConfiguration')(app);
    require('./UserFolder')(app);
    require('./SendDistributionWorkflow')(app);
    require('./ProxyMailUser')(app);
    require('./OUBroadcast')(app);
    require('./MoveToFolder')(app);
    require('./ReadyToExportOption')(app);
    require('./SearchCorrespondenceSite')(app);

    /************* already intercepted ***************/
    require('./ApplicationUser')(app);
    require('./Organization')(app);
    require('./Lookup')(app);
    require('./ReferencePlanNumber')(app);
    require('./Response')(app);
    require('./DocumentType')(app);
    require('./DocumentStatus')(app);
    require('./Theme')(app);
    require('./WorkflowGroup')(app);
    require('./JobTitle')(app);
    require('./EntityType')(app);
    require('./SmsTemplate')(app);
    require('./CorrespondenceSiteType')(app);
    require('./Entity')(app);
    require('./PublicAnnouncement')(app);
    require('./Classification')(app);
    require('./GlobalSetting')(app);
    require('./PrivateAnnouncement')(app);
    require('./DocumentFile')(app);
    require('./RelatedOUDocumentFile')(app);
    require('./UserClassificationViewPermission')(app);
    require('./OUClassification')(app);
    require('./DistributionList')(app);
    require('./OUDistributionList')(app);
    require('./DistributionListMembers')(app);
    require('./WorkflowAction')(app);
    require('./CorrespondenceSite')(app);
    require('./OUCorrespondenceSite')(app);
    require('./UserWorkflowAction')(app);
    require('./OUApplicationUser')(app);
    require('./UserOuPermission')(app);
    require('./Permission')(app);
    require('./RootEntity')(app);
    require('./Settings')(app);
    require('./ReferencePlanItem')(app);
    require('./UserComment')(app);
    require('./UserWorkflowGroup')(app);
    require('./GlobalLocalization')(app);
    require('./GlobalLocalizationLookup')(app);
    require('./Outgoing')(app);
    require('./DocumentTemplate')(app);
    require('./AttachmentType')(app);
    require('./DocumentTag')(app);
    require('./ApplicationUserSignature')(app);
    require('./Attachment')(app);
    require('./DocumentComment')(app);
    require('./DocumentSearch')(app);
    require('./DistributionWorkflowManager')(app);
    require('./DistributionWorkflowOU')(app);
    require('./DistributionWorkflowPrivateUser')(app);
    require('./DistributionWorkflow')(app);
    require('./FavoriteUser')(app);
    require('./FavoriteOU')(app);
    require('./WorkItem')(app);
    require('./LinkedObject')(app);
    require('./DistributionWorkflowApplicationUser')(app);
    require('./WorkflowHistory')(app);
    require('./LinkedDocument')(app);
    require('./LinkedAttachment')(app);
    require('./LinkedEntity')(app);
    require('./DestinationHistory')(app);
    require('./ContentViewHistory')(app);
    require('./SmsLog')(app);
    require('./FullHistory')(app);
    require('./OutgoingDeliveryReport')(app);
    require('./MergedLinkedDocumentHistory')(app);
    require('./WorkflowGroupDistributionWorkflow')(app);
    require('./WorkflowGroupMembers')(app);
    require('./DistributionWorkflowGovernmentEntity')(app);
    require('./Counter')(app);
    require('./SenderInfo')(app);
    require('./ReadyToExport')(app);
    require('./Site')(app);
    require('./SiteView')(app);
    require('./WorkItemType')(app);
    require('./Incoming')(app);
    require('./QuickSearchCorrespondence')(app);
    require('./Internal')(app);
    require('./General')(app);
    require('./Correspondence')(app);
    require('./EventHistory')(app);
    require('./Broadcast')(app);
    require('./FileIcon')(app);
    require('./Selector')(app);
    require('./Indicator')(app);
    require('./DistributionWorkflowBulk')(app);
    require('./SentItemDepartmentInbox')(app);
    require('./SentItemCentralArchive')(app);
    require('./OUDocumentFile')(app);
    require('./Information')(app);
    require('./Member')(app);
    require('./FavoriteDocument')(app);
    require('./MailNotification')(app);
    require('./GeneralStepElementView')(app);
    require('./ReferencePlanItemStartSerial')(app);
    require('./ApplicationUserInfo')(app);
    require('./FileType')(app);
    require('./Localization')(app);
    require('./ContentViewHistoryEvents')(app);
    require('./CorrespondenceInfo')(app);
    require('./UserSearchCriteria')(app);
    require('./DistributionWF')(app);
    require('./DistributionWFItem')(app);
    require('./DistributionUserWFItem')(app);
    require('./DistributionGroupWFItem')(app);
    require('./DistributionOUWFItem')(app);
    require('./DistributionBulkItem')(app);
    require('./DistributionBulk')(app);
    require('./WFUser')(app);
    require('./WFOrganization')(app);
    require('./WFGroup')(app);
    require('./ProxyInfo')(app);
    require('./ProxyUser')(app);
    require('./CommentModel')(app);
    require('./SignDocumentModel')(app);
    require('./Rank')(app);
    require('./UserFilter')(app);
    require('./G2G')(app);
    require('./G2GMessagingHistory')(app);
    require('./PartialExport')(app);
    require('./PartialExportSelective')(app);
    require('./PartialExportCollection')(app);
    require('./BarcodeSetting')(app);
    require('./OutgoingSearch')(app);
    require('./IncomingSearch')(app);
    require('./InternalSearch')(app);
    require('./GeneralSearch')(app);
    require('./Site_Search')(app);
    require('./UserSubscription')(app);
    require('./LookupG2G')(app);
    require('./Report')(app);
    require('./DocumentSecurity')(app);
    require('./ApprovedCriteria')(app);
    require('./DocumentSecuritySetting')(app);
    require('./DocumentSecurityBarcodeBox')(app);
    require('./DocumentSecurityPage')(app);
    require('./ImageThumbnail')(app);
    require('./DuplicateOption')(app);
    require('./OutgoingIncomingSearch')(app);
    require('./Pair')(app);
    require('./DynamicMenuItem')(app);
    require('./UserMenuItem')(app);
    require('./EventHistoryCriteria')(app);
    require('./MAIPLabel')(app);
    require('./Task')(app);
    require('./TaskParticipant')(app);
    require('./ViewerLog')(app);
    require('./Administrator')(app);
    require('./FollowupOrganization')(app);
};
