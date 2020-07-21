module.exports = function (app) {
    app.factory('errorCode', function ($q, _, dialog, langService) {
        'ngInject';

        var errorCodes = {
                EMPTY_RESULT: 2014,
                CAN_NOT_DELETE_LOOKUP: 3014,
                FAILED_DELETE: 1004,
                // FAILED_DUE_TO_LINKED_OBJECT: 1005,
                DOCUMENT_NO_PREVIEW_UNAVAILABLE_MISSING: 2040,
                WORK_ITEM_NOT_FOUND: 2043,
                FAILED_DELETE_DOCUMENT: 2034,
                ITEM_LOCKED: 2058,
                ENTITY_NOT_FOUND: 12000,
                AUTHORIZE_FAILED: 3008,
                ROOT_ENTITY_NOT_FOUND: 1001,
                FILE_NOT_ALLOWED: 2041,
                FAILED_INSERT_DOCUMENT: 2006,
                ERROR_UPLOAD_FILE: 5001,
                DUPLICATE_ENTRY: 1008,
                INACTIVE_USER_ENTITY: 9016,
                ACCESS_DENIED: 9011,
                PASSWORD_EMPTY: 9017,
                NO_USER_TO_BROADCAST: 3018,
                PRINT_BARCODE_ERROR_NO_BARCODE_ELEMENT: 3019,
                CANNOT_EDIT_AFTER_EXPORT_BECAUSE_RECEIVED_BY_ONE_SITE: 3023,
                CANNOT_RECALL_OPENED_BOOK: 3031,
                CANNOT_RECALL_NON_EXISTING_BOOK: 2016,
                CANNOT_ADD_SUBSCRIPTION_SAME_USER_SAME_BOOK: 3032,
                G2G_ERROR_FETCH_SENT_OR_RETURN_BOOK: 14001,
                G2G_USER_NOT_AUTHENTICATED: 14002,
                G2G_CAN_NOT_RECEIVE_RECALLED_DOCUMENT: 14003,
                G2G_CANNOT_RECALL_FROM_THIS_SITE_BECAUSE_THE_STATUS_IS_NOT_PENDING_OR_SENT: 14004,
                G2G_CANNOT_REMOVE_TRANSACTION_FOR_THIS_SITE_BECAUSE_THE_STATUS_IS_NOT_REJECTED_OR_RETURNED: 14005,

                G2G_BOOK_PROPERTIES_CAN_NOT_BE_EMPTY: 14006,
                G2G_USER_NOT_AUTHORIZED: 14007,
                G2G_ERROR_WHILE_SENDING: 14008,
                G2G_ERROR_WHILE_RECEIVING: 14009,
                G2G_ERROR_WHILE_RETURNING_TO_SENDER: 14010,
                G2G_ERROR_WHILE_RECALLING: 14011,

                G2G_ERROR_WHILE_REMOVE_TRANSACTION: 14012,
                G2G_ERROR_CAN_NOT_RESEND_ALREADY_PENDING_BOOK: 14013,

                G2G_RECALL_FAILED: 3044,
                NO_DOCUMENT_SECURITY: 13006,
                FAIL_DUPLICATION: 2053,
                INVALID_REFERENCE_FORMAT: 3025,
                // entity connection errors
                SEC_LDAP_ADDING_ENTITY: 13008,
                SEC_LDAP_OU_NOT_AVAILABLE: 13009,
                SEC_LDAP_INVALID_SERVER_ADDRESS: 13010,
                SEC_LDAP_INVALID_OP: 13011,
                SEC_ERROR_USER_UN_AUTHORIZED_FOR_SERVICE: 13012,
                ALREADY_EXISTS_INCOMING_BOOK_WITH_SAME_REFERENCE_NUMBER: 2059,
                INVALID_DOC_STATUS_TO_EXPORT: 3036,
                // entity connection errors end
                ERROR_SAVE_DOC_ALREADY_MODIFIED_BY_OTHER_USER: 4019,
                INVALID_LINK: 3041,
                ERROR_RUNNING_JOB: 3029,
                ERROR_MISSING_REQUIRED_TEMPLATE_FIELDS: 2023,
                OPERATION_NOT_SUPPORTED: 3002,
                USER_NOT_EXIST: 9006,
                USER_NOT_LINKED_WITH_DEPARTMENT: 9007,
                DOCUMENT_HAS_BEEN_DELETED: 3045,
                NOT_ENOUGH_CERTIFICATES: 3047,
                PIN_CODE_NOT_MATCH: 3048,
                DUPLICATE_BOOK_FOLLOWUP: 3049,
                CANNOT_EXPORT_TOO_MANY_ATTACHMENTS_OR_LINKED_DOCUMENTS: 2060
            },
            errorLangKeys = {
                1001: 'no_records_found',
                2006: 'can_not_insert_the_document',
                5001: 'error_upload_file',
                3023: 'can_not_edit_after_export_because_received_by_one_site',
                14001: 'g2g_error_fetch_sent_return_book',
                14002: 'g2g_not_authenticated',
                14003: 'g2g_can_not_receive_recalled_document',
                14004: 'g2g_cannot_recall_because_status_is_not_pending_sent',
                14005: 'g2g_can_not_terminate_because_book_not_rejected_or_returned',
                14006: 'g2g_book_properties_can_not_be_empty',
                14007: 'g2g_not_authorized',
                14008: 'g2g_error_while_sending',
                //14009: 'g2g_error_while_receiving',
                14009: 'error_while_receiving_document',
                14010: 'g2g_error_while_returning_to_sender',
                14011: 'g2g_error_occurred_while_recalling',
                14012: 'g2g_error_while_remove_transaction',
                14013: 'g2g_error_can_not_resend_already_pending_book',
                //14028: 'g2g_error_occurred_while_terminate'
                4019: 'error_save_document_already_modified_by_other_user',
                2059: 'incoming_book_exists_same_number_site_year',
                9006: 'user_not_exist',
                9017: 'password_not_correct',
                9016: 'user_not_active',
                9007: 'user_not_linked_with_department',
                3045: 'document_has_been_deleted',
                3047: 'certificate_missing',
                3048: 'pincode_not_match',
                3044: 'g2g_recall_failed',
                3049: 'duplicate_followup_book',
                2060: 'cannot_export_too_many_attachments_or_linked_documents'
            };

        return {
            checkIf: function (error, errorCode, callback) {
                var code = error.hasOwnProperty('data') && error.data ? error.data.ec : error;
                if (code === errorCodes[errorCode]) {
                    if (callback)
                        return callback();
                    return true;
                }
                return $q.reject(error);
            },
            /**
             * @description to check if the error code exists or not
             * @param error
             * @return {boolean}
             */
            hasErrorCode: function (error) {
                var code = error.hasOwnProperty('data') && error.data ? error.data.ec : error;
                // Object.values changed to _.values as Object.values not supported in IE
                return _.values(errorCodes).indexOf(code) !== -1;
            },
            /**
             * @description Shows the error dialog according to the error code
             * @param error
             * @param messageLangKey
             * LangKey to override the error message
             * @param message
             * Message will override the error message and messageLangKey
             */
            showErrorDialog: function (error, messageLangKey, message) {
                var code = error.hasOwnProperty('data') && error.data ? error.data.ec : error;
                if (message) {
                    dialog.errorMessage(message);
                } else if (messageLangKey) {
                    dialog.errorMessage(langService.get(messageLangKey));
                } else {
                    var errorExists = _.values(errorCodes).indexOf(code) !== -1;
                    if (errorExists && errorLangKeys[code]) {
                        dialog.errorMessage(langService.get(errorLangKeys[code]));
                    }
                }
                return $q.reject(error);
            }
        }
    })
};
