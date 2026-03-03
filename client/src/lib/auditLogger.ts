import { supabase } from './supabase';

export type AuditAction =
    | 'LOGIN'
    | 'LOGOUT'
    | 'CREATE_USER'
    | 'UPDATE_USER'
    | 'DELETE_USER'
    | 'SUBMIT_KRS'
    | 'APPROVE_KRS'
    | 'REJECT_KRS'
    | 'INPUT_GRADE'
    | 'LOCK_GRADE'
    | 'CREATE_BILL'
    | 'UPDATE_BILL'
    | 'DELETE_BILL'
    | 'VERIFY_PAYMENT'
    | 'UPDATE_PROFILE'
    | 'DELETE_RECORD';

export const logAction = async (
    userId: string,
    role: string,
    action: AuditAction,
    module: string,
    entityId: string,
    oldData?: any,
    newData?: any
) => {
    try {
        const { error } = await supabase.from('audit_logs').insert([{
            user_id: userId,
            user_role: role,
            action: action,
            module: module,
            entity_id: entityId,
            old_data: oldData,
            new_data: newData,
            user_agent: window.navigator.userAgent
        }]);

        if (error) {
            console.warn('Silent Audit Log Error:', error);
        }
    } catch (err) {
        console.warn('Audit Logging Exception:', err);
    }
};
