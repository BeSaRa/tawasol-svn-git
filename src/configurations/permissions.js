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
            .addMenuPermissions('menu_item_sms_template', ['MANAGE_SMS_TEMPLATES'])
            .addMenuPermissions('menu_item_correspondence_site_type', ['MANAGE_CORRESPONDENCE_SITE_TYPES'])
            .addMenuPermissions('menu_item_organization_types', ['MANAGE_ORGANIZATION_TYPES'])
            .addMenuPermissions('menu_item_cross_site_management', ['MANAGE_CORRESPONDENCE_SITES'])
            .addMenuPermissions('menu_item_application_users', ['MANAGE_APPLICATION_USERS'])
            .addMenuPermissions('menu_item_reference_number_plans', ['MANAGE_REFERENCE_NUMBER_PLANS'])
            // .addMenuPermissions('menu_item_reference_number_plans', function () {
            //     return false;
            // })
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
            .addMenuPermissions('menu_item_global_localization', function () {
                return false;
            })
            .addMenuPermissions('menu_item_localization', ['MANAGE_GLOBAL_LOCALIZATION'])
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
            .addMenuPermission('menu_item_outgoing_prepare', 'PREPARE_OUTGOING_DOCUMENTS')
            .addMenuPermission('menu_item_outgoing_draft', 'COMPLETE_DRAFT_OUTGOING_DOCUMENTS')
            .addMenuPermission('menu_item_outgoing_review', 'REVIEW_OUTGOING_DOCUMENTS')
            .addMenuPermission('menu_item_outgoing_ready_to_send', 'OUTGOING_READY_TO_SEND')
            .addMenuPermission('menu_item_outgoing_rejected', 'OUTGOING_REJECTED')
            .end()
            // incoming mail
            .addMenuPermissionGroup('menu_item_incoming')
            .addMenuPermission('menu_item_incoming_add', 'ADD_NEW_INCOMING_DOCUMENT')
            .addMenuPermission('menu_item_incoming_scan', 'SCAN_DOCUMENT')
            .addMenuPermission('menu_item_incoming_review', 'REVIEW_INCOMING_DOCUMENT')
            .addMenuPermission('menu_item_incoming_ready_to_send', 'SEND_INCOMING_QUEUE')
            .addMenuPermission('menu_item_incoming_rejected', 'REJECTED_INCOMING_QUEUE')
            .end()
            // internal mail
            .addMenuPermissionGroup('menu_item_internal')
            .addMenuPermission('menu_item_internal_add', 'ADD_NEW_INTERNAL_DOCUMENT')
            .addMenuPermission('menu_item_internal_prepare', 'PREPARE_INTERNAL')
            .addMenuPermission('menu_item_internal_draft', 'DRAFT_INTERNAL')
            .addMenuPermission('menu_item_internal_review', 'REVIEW_INTERNAL')
            .addMenuPermission('menu_item_internal_ready_to_send', 'READY_TO_SEND_INTERNAL')
            .addMenuPermission('menu_item_internal_rejected', 'REJECTED_INTERNAL')
            .addMenuPermission('menu_item_approved_internal_queue', 'APPROVED_INTERNAL_DOCUMENT')
            .end()
            // inbox mail
            .addMenuPermissionGroup('menu_item_inbox')
            .addMenuPermission('menu_item_user_inbox', 'USER_INBOX')
            .addMenuPermission('menu_item_sent_items', 'SENT_ITEMS')
            .addMenuPermission('menu_item_followup_employee_inbox', 'FOLLOW-UP_EMPLOYEES’_INBOXES')
            .addMenuPermission('menu_item_group_inbox', function (employee) {
                return !employee.inRegistry();
            })
            .addMenuPermission('menu_item_proxy_mail_inbox', function (employee) {
                return !employee.isAdmin && employee.isProxyUser();// && _.map(employee.proxyUsers, 'proxyUserOU').indexOf(employee.organization.ouid) > -1;
            })
            .addMenuPermission('menu_item_user_favorite_documents', 'MANAGE_FAVORITE')
            .end()
            .addMenuPermission('menu_item_dashboard', 'landing_page')
            .addMenuPermissionGroup('menu_item_search_module')
            .addMenuPermission('menu_item_search_module_outgoing', 'SEARCH_OUTGOING')
            .addMenuPermission('menu_item_search_module_incoming', 'SEARCH_INCOMING')
            .addMenuPermission('menu_item_search_module_internal', 'SEARCH_INTERNAL_DOCUMENT')
            .addMenuPermission('menu_item_search_module_general', 'GENERAL_SEARCH')
            .end()
            .addMenuPermission('menu_item_user_favorite_documents', function (employee) {
                return !employee.isAdmin;
            })
            .addMenuPermissionGroup('menu_item_central_archive_mail')
            .addMenuPermission('menu_item_central_archive_ready_to_export', function (employee) {
                return employee.userOrganization && employee.userOrganization.centralArchive;
            })
            .end()
            .addMenuPermissionGroup('menu_item_icn_archive')
            .addMenuPermission('menu_item_icn_archive_add', function () {
                return false;
            })
            .addMenuPermission('menu_item_icn_archive_search', function () {
                return false;
            })


    })
};