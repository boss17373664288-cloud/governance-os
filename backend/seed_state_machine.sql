DELETE FROM state_machine_definition WHERE entity_type = 'SALES_ORDER';

INSERT INTO state_machine_definition (entity_type, from_state, to_state, action, guard_conditions, side_effects, is_active) VALUES
('SALES_ORDER', 'DRAFT', 'PENDING_APPROVAL', 'submit', '{"hasLowPrice":true}', '{"notify":"business_director"}', true),
('SALES_ORDER', 'DRAFT', 'APPROVED', 'submit_direct', '{"hasLowPrice":false}', '{"createAR":true,"createConsignment":true}', true),
('SALES_ORDER', 'DRAFT', 'CANCELLED', 'cancel', '{}', '{}', true),
('SALES_ORDER', 'PENDING_APPROVAL', 'APPROVED', 'approve', '{}', '{"createAR":true,"createConsignment":true,"notify":"sales_rep"}', true),
('SALES_ORDER', 'PENDING_APPROVAL', 'REJECTED', 'reject', '{}', '{"notify":"sales_rep"}', true),
('SALES_ORDER', 'REJECTED', 'REJECTED_LOCKED', 'reject_lock', '{"rejectCount":2}', '{"lock":true}', true),
('SALES_ORDER', 'REJECTED', 'DRAFT', 'resubmit', '{}', '{}', true),
('SALES_ORDER', 'APPROVED', 'STOCK_ALLOCATED', 'allocate', '{}', '{"createPickTask":true}', true),
('SALES_ORDER', 'APPROVED', 'CANCELLED', 'cancel', '{}', '{"reverseAR":true}', true),
('SALES_ORDER', 'STOCK_ALLOCATED', 'SHIPPED', 'ship', '{}', '{"deductInventory":true}', true),
('SALES_ORDER', 'STOCK_ALLOCATED', 'CANCELLED', 'cancel', '{}', '{"reverseAR":true}', true),
('SALES_ORDER', 'SHIPPED', 'COMPLETED', 'complete', '{}', '{"closeAR":true}', true);
