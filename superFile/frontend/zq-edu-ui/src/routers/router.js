import React from 'react';

const dashboard = React.lazy(() => import('../components/dashboard'));
const Student = React.lazy(() => import('../components/views/setup/masters/student/student'));
const programPlan = React.lazy(() => import('../components/views/setup/masters/programPlan/programPlan'));
const feeStructure = React.lazy(() => import('../components/views/setup/masters/feeStructure/feeStructure'));
const paymentSchedule = React.lazy(() => import('../components/views/setup/masters/paymentSchedule/paymentSchedule'));
const reminderPlan = React.lazy(() => import('../components/views/setup/masters/remainderPlan/remainderPlan'));
const FeeTypes = React.lazy(() => import('../components/views/setup/masters/fee-type/fees-type'));
const Installments = React.lazy(() => import('../components/views/setup/masters/installment/installment'));
const StudentFeeReport = React.lazy(() => import('../components/views/reports/student-fee/student-fee-report'));
const DemandNoteReport = React.lazy(() => import('../components/views/reports/demand-note/demandNote'));
const StudentStmtReport = React.lazy(() => import('../components/views/reports/student-stmt/studentStmtReport'));
const DefaulterReport = React.lazy(() => import('../components/views/reports/defaulter-report/defaulterReport'));
const FeePendingReport = React.lazy(() => import('../components/views/reports/fee-pending/feePendingReport')); 
const ProgramPlanStmtReport = React.lazy(() => import('../components/views/reports/programPlan-stmt/programPlanStmt')); 
const Settings = React.lazy(() => import('../components/views/setup/settings/settings')); 
const LateFees = React.lazy(() => import('../components/views/setup/masters/late-fees/late-fees'));
const FeesManager = React.lazy(() => import('../components/views/configuration/fees-manager/fees-manager'));
const StudentFeesMapping = React.lazy(() => import('../components/views/configuration/student-fee-mapping/student-fee-mapping'));
const receiptHtmlEditor = React.lazy(() => import('../components/receipt-editor'))
const SendDemandNote = React.lazy(() => import('../components/views/transactions/send-demand-note/send-demand-note'));

const routes = [
    { path: '/main/dashboard', name: 'Dashboard', component: dashboard },
    { path: '/main/receiptEditor', name: 'ReceiptHtmlEditor', component: receiptHtmlEditor },
    { path: '/main/setup/masters/student', name: 'Student', component: Student },
    { path: '/main/setup/program-plan', name: 'programPlan', component: programPlan },
    { path: '/main/setup/fee-structure', name: 'feeStructure', component: feeStructure },
    { path: '/main/setup/payment-schedule', name: 'paymentSchedule', component: paymentSchedule },
    { path: '/main/setup/reminders', name: 'reminderPlan', component: reminderPlan },
    { path: '/main/setup/masters/fee-type', name: 'Fees-type', component: FeeTypes },
    { path: '/main/setup/masters/installment', name: 'Installment', component: Installments },
    { path: '/main/reports/fees-collection', name: 'Student-Report', component: StudentFeeReport },
    { path: '/main/reports/demand-note', name: 'Student-Report', component: DemandNoteReport },
    { path: '/main/reports/student-statement', name: 'Student-Statement-Report', component: StudentStmtReport },
    { path: '/main/reports/defaulter-report', name: 'Defaulter-Report', component: DefaulterReport },
    { path: '/main/reports/fee-pending-report', name: 'Fee Pending-Report', component: FeePendingReport },
    { path: '/main/reports/programPlan-statement', name: 'Program Plan Statement-Report', component: ProgramPlanStmtReport },
    { path: '/main/setup/settings', name: 'Settings', component: Settings },
    { path: '/main/setup/masters/late-fees', name: 'late-fees', component: LateFees },
    { path: '/main/configuration/fees-manager', name: 'Fees-manager', component: FeesManager },
    { path: '/main/configuration/student-fee-mapping', name: 'Student-Fees-Mapping', component: StudentFeesMapping },
    { path: '/main/transactions/send-demand-note', name: 'Send-Demand-Note', component: SendDemandNote },
];
export default routes;