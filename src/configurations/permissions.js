module.exports = function (app) {
    app.config(function (permissionServiceProvider) {
        'ngInject';

        permissionServiceProvider
            // group of system administration
            .addMenuPermissionGroup('menu_item_system_administration')
            .addMenuPermissions('menu_item_global_settings', ['MANAGE_GLOBAL_SETTINGS'])
            .addMenuPermissions('menu_item_government_entities', ['MANAGE_GOVERNMENT_ENTITIES'])
            .addMenuPermissions('menu_item_classifications', ['MANAGE_CLASSIFICATIONS'])
            .addMenuPermissions('menu_item_manage_workflow_group', ['MANAGE_WORKFLOW_GROUPS'])
            .addMenuPermissions('menu_item_job_title', ['MANAGE_JOB_TITLES'])
            .addMenuPermissions('menu_item_public_announcements', ['MANAGE_PUBLIC_ANNOUNCEMENTS'])
            .addMenuPermissions('menu_item_private_announcements', ['MANAGE_PRIVATE_ANNOUNCEMENTS'])
            .addMenuPermissions('menu_item_manage_roles', ['MANAGE_CUSTOM_ROLES'])
            .addMenuPermissions('menu_item_document_stamps', function (employee) {
                var rootEntity = employee.getRootEntity(),
                    globalSettings = rootEntity && rootEntity.getGlobalSettings();
                if (!rootEntity || !rootEntity.hasPSPDFViewer() || !globalSettings) {
                    return false;
                }
                return globalSettings.isStampModuleEnabled() && employee.hasPermissionTo('MANAGE_STAMPS');
            })
            .addMenuPermissions('menu_item_sms_template', ['MANAGE_SMS_TEMPLATES'])
            .addMenuPermissions('menu_item_correspondence_site_type', ['MANAGE_CORRESPONDENCE_SITE_TYPES'])
            .addMenuPermissions('menu_item_organization_types', ['MANAGE_ORGANIZATION_TYPES'])
            .addMenuPermissions('menu_item_cross_site_management', ['MANAGE_CORRESPONDENCE_SITES'])
            .addMenuPermissions('menu_item_application_users', ['MANAGE_APPLICATION_USERS'])
            .addMenuPermissions('menu_item_reference_number_plans', ['MANAGE_REFERENCE_NUMBER_PLANS'])
            .addMenuPermissions('menu_item_serials', ['MANAGE_REFERENCE_NUMBER_PLANS'])
            .addMenuPermissions('menu_item_ranks', ['MANAGE_RANKS'])
            .addMenuPermissions('menu_item_distribution_lists', ['MANAGE_DISTRIBUTION_LISTS'])
            .addMenuPermissions('menu_item_entity_type', ['MANAGE_ENTITY_TYPES'])
            .addMenuPermissions('menu_item_document_status', ['MANAGE_DOCUMENT_STATUS'])
            .addMenuPermissions('menu_item_themes', ['MANAGE_APPLICATION_THEMES'])
            .addMenuPermissions('menu_item_organization_chart', ['MANAGE_ORGANIZATION_UNITS'])
            .addMenuPermissions('menu_item_workflow_actions', ['MANAGE_WORKFLOW_ACTIONS'])
            .addMenuPermissions('menu_item_document_files', ['MANAGE_FILES'])
            .addMenuPermissions('menu_item_document_templates', ['MANAGE_DOCUMENT_TEMPLATES'])
            .addMenuPermissions('menu_item_attachment_types', ['MANAGE_ATTACHMENT_TYPE'])
            .addMenuPermissions('menu_item_document_types', ['MANAGE_DOCUMENT_TYPE'])
            .addMenuPermissions('menu_item_menu_items', ['DYNAMIC_MENU_ITEM'])
            .addMenuPermissions('menu_item_global_localization', function () {
                return false;
            })
            .addMenuPermissions('menu_item_localization', ['MANAGE_GLOBAL_LOCALIZATION'])
            .addMenuPermissions('menu_item_administrators', function (employee) {
                return employee.isSuperAdmin;
            })
            .addMenuPermissions('menu_item_pending_g2g', function (employee) {
                return employee.isSuperAdmin;
            })
            .addMenuPermission('menu_item_search_viewers_log', function (employee) {
                return employee.isSuperAdmin && !employee.isAdmin;
            })
            .addMenuPermissions('menu_item_sequential_workflows', function (employee) {
                return employee.hasPermissionTo('ADD_SEQ_WF');
            })
            .end()
            // department inbox
            .addMenuPermissionGroup('menu_item_department_inbox')
            .addMenuPermission('menu_item_dep_incoming', 'OPEN_DEPARTMENT’S_INCOMING_QUEUE')
            .addMenuPermission('menu_item_dep_returned', 'OPEN_DEPARTMENT’S_RETURNED_DOCUMENT_QUEUE')
            .addMenuPermission('menu_item_dep_ready_to_export', 'OPEN_DEPARTMENT’S_READY_TO_EXPORT_QUEUE')
            .addMenuPermission('menu_item_dep_sent_items', 'OPEN_DEPARTMENT’S_SENT_DOCUMENT_QUEUE')
            .end()
            // outgoing mail
            .addMenuPermissionGroup('menu_item_outgoing')
            .addMenuPermission('menu_item_add_outgoing', 'ADD_NEW_OUTGOING')
            .addMenuPermission('menu_item_outgoing_simple_add', 'ADD_NEW_OUTGOING')
            .addMenuPermission('menu_item_outgoing_prepare', 'PREPARE_OUTGOING_DOCUMENTS')
            .addMenuPermission('menu_item_outgoing_draft', 'COMPLETE_DRAFT_OUTGOING_DOCUMENTS')
            .addMenuPermission('menu_item_outgoing_review', 'REVIEW_OUTGOING_DOCUMENTS')
            .addMenuPermission('menu_item_outgoing_ready_to_send', 'OUTGOING_READY_TO_SEND')
            .addMenuPermission('menu_item_outgoing_rejected', 'OUTGOING_REJECTED')
            .addMenuPermission('menu_item_outgoing_deleted', 'DELETE_OUTGOING')
            .end()
            // incoming mail
            .addMenuPermissionGroup('menu_item_incoming')
            .addMenuPermission('menu_item_incoming_add', 'ADD_NEW_INCOMING_DOCUMENT')
            .addMenuPermission('menu_item_incoming_simple_add', 'ADD_NEW_INCOMING_DOCUMENT')
            .addMenuPermission('menu_item_incoming_scan', 'INCOMING_SCAN_DOCUMENT')
            .addMenuPermission('menu_item_incoming_review', 'REVIEW_INCOMING_DOCUMENT')
            .addMenuPermission('menu_item_incoming_ready_to_send', 'SEND_INCOMING_QUEUE')
            .addMenuPermission('menu_item_incoming_rejected', 'REJECTED_INCOMING_QUEUE')
            .addMenuPermission('menu_item_incoming_deleted', 'DELETE_INCOMING')
            .end()
            // internal mail
            .addMenuPermissionGroup('menu_item_internal')
            .addMenuPermission('menu_item_internal_add', 'ADD_NEW_INTERNAL_DOCUMENT')
            .addMenuPermission('menu_item_internal_simple_add', 'ADD_NEW_INTERNAL_DOCUMENT')
            .addMenuPermission('menu_item_internal_prepare', 'PREPARE_INTERNAL')
            .addMenuPermission('menu_item_internal_draft', 'DRAFT_INTERNAL')
            .addMenuPermission('menu_item_internal_review', 'REVIEW_INTERNAL')
            .addMenuPermission('menu_item_internal_ready_to_send', 'READY_TO_SEND_INTERNAL')
            .addMenuPermission('menu_item_internal_rejected', 'REJECTED_INTERNAL')
            .addMenuPermission('menu_item_internal_deleted', 'DELETE_INTERNAL')
            .addMenuPermission('menu_item_approved_internal_queue', 'APPROVED_INTERNAL_DOCUMENT')
            .end()
            // inbox mail
            .addMenuPermissionGroup('menu_item_inbox')
            .addMenuPermission('menu_item_user_inbox', 'USER_INBOX')
            .addMenuPermission('menu_item_sent_items', 'SENT_ITEMS')
            .addMenuPermission('menu_item_folders', 'FOLDERS_QUEUE')
            .addMenuPermission('menu_item_followup_employee_inbox', function (employee) {
                return employee.hasAnyPermissions(['FOLLOW-UP_EMPLOYEES’_INBOXES', 'FOLLOW_UP_OU_INBOX']);
            })
            .addMenuPermission('menu_item_followup_employee_sent_items', function (employee) {
                return employee.hasAnyPermissions(['FOLLOW-UP_EMPLOYEES’_INBOXES', 'FOLLOW_UP_OU_INBOX']);
            })
            .addMenuPermission('menu_item_group_inbox', function (employee) {
                return /*!employee.inRegistry() &&*/ employee.hasThesePermissions('GROUP_MAIL');
            })
            .addMenuPermission('menu_item_proxy_mail_inbox', function (employee) {
                return !employee.isAdmin && employee.isProxyUser();// && _.map(employee.proxyUsers, 'proxyUserOU').indexOf(employee.organization.ouid) > -1;
            })
            .addMenuPermission('menu_item_user_favorite_documents', 'MANAGE_FAVORITE')
            .addMenuPermission('menu_item_my_followup', 'USER_FOLLOWUP_BOOKS')
            .addMenuPermissions('menu_item_user_book_followup', ['ADMIN_USER_FOLLOWUP_BOOKS'])
            .end()
            .addMenuPermission('menu_item_dashboard', 'LANDING_PAGE')
            // .addMenuPermissionGroup('menu_item_search_module')
            // .addMenuPermission('menu_item_search_module_outgoing', 'SEARCH_OUTGOING')
            // .addMenuPermission('menu_item_search_module_incoming', 'SEARCH_INCOMING')
            // .addMenuPermission('menu_item_search_module_internal', 'SEARCH_INTERNAL_DOCUMENT')
            // .addMenuPermission('menu_item_search_module_general', 'GENERAL_SEARCH')
            // .addMenuPermissions('menu_item_search_module_outgoing_incoming', ['SEARCH_OUTGOING', 'SEARCH_INCOMING'])
            .addMenuPermission('menu_item_search_module', function (employee) {
                return employee.hasAnyPermissions(['SEARCH_OUTGOING', 'SEARCH_INCOMING', 'SEARCH_INTERNAL_DOCUMENT', 'GENERAL_SEARCH']);
            })
            .addMenuPermission('menu_item_quick_search', 'QUICK_SEARCH')
            .addMenuPermissionGroup('menu_item_central_archive_mail')
            .addMenuPermission('menu_item_central_archive_ready_to_export', function (employee) {
                return employee.userOrganization && employee.userOrganization.centralArchive;
            })
            .end()
            .addMenuPermissionGroup('menu_item_icn_archive')
            .addMenuPermission('menu_item_icn_archive_add', function () {
                return true;
            })
            .addMenuPermission('menu_item_icn_archive_search', function () {
                return true;
            })
            .end()
            .addMenuPermissionGroup('menu_item_g2g')
            .addMenuPermission('menu_item_government_inbox', function (employee) {
                return employee.hasAnyPermissions(["GOVERNMENT_TO_GOVERNMENT", "OLD_SYSTEM_COMMUINCATION"]);
            })
            .addMenuPermission('menu_item_government_returned_mail', function (employee) {
                return employee.hasAnyPermissions(["GOVERNMENT_TO_GOVERNMENT", "OLD_SYSTEM_COMMUINCATION"]);
            })
            .addMenuPermission('menu_item_government_sent_items', function (employee) {
                return employee.hasAnyPermissions(["GOVERNMENT_TO_GOVERNMENT", "OLD_SYSTEM_COMMUINCATION"]);
            })
            .addMenuPermission('menu_item_government_returned_after_return', 'GOVERNMENT_TO_GOVERNMENT')
            .end()
            .addMenuPermissionGroup('menu_item_reports')
            .addMenuPermission('menu_item_reports_statistical_correspondence_report', 'CORRESPONDENCE_REPORT')
            .addMenuPermission('menu_item_reports_statistical_report', 'CORRESPONDENCE_SITE_REPORT')
            .addMenuPermission('menu_item_reports_documentary_report', 'WORKFLOW_OPERATION_REPORT')
            .addMenuPermission('menu_item_reports_followup_report', 'FOLLOWUP_REPORT')
            .addMenuPermission('menu_item_reports_user_mail_report', 'USERMAIL_REPORT')
            .addMenuPermission('menu_item_reports_login_logs_report', 'USERLOGIN_LOGS_REPORT')
            .addMenuPermission('menu_item_reports_system_usage_report', 'SYSTEM_USAGE_BOARD')
            .addMenuPermission('menu_item_reports_message_board_response', 'FOLLOWUP_BOARD')
            .addMenuPermission('menu_item_reports_user_performance_panel', 'USER_PERFORMANCE_BOARD')
            .addMenuPermission('menu_item_reports_monitoring_correspondence_documentary_panel', 'REALTIME_MONITORING_BOARD')
            .addMenuPermission('menu_item_reports_processed_documents', 'PROCESSED_DOCUMENT_REPORT');


    });
};
