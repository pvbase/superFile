const mongoose = require("mongoose");
const settingsOrginalSchema = new mongoose.Schema(
    {
        company: {
            logo: { type: String },
            eSignature: { type: String },
            shareHoldingPattern: { type: Object }
        },
        numbering: {
            quotation: { type: String },
            invoiceNumber: { type: String },
            purchaseOrder: { type: String },
            purchaseInvoiceNumber: { type: String },
            contra: { type: String },
            reimbursement: { type: String },
            journal: { type: String },
            settlement: { type: String },
            payroll: { type: String },
            reversal: { type: String },
            receipt: { type: String },
            payment: { type: String },
            debitNoteCustomer: { type: String },
            debitNoteVendor: { type: String },
            creditNoteCustomer: { type: String },
            creditNoteVendor: { type: String },
        },
        general: {
            currency: { type: String },
            units: { type: String },
            financialYear: { type: String },
            termsandcondition: { type: Object },
        }
    }
);
//mongoose.set("useFindAndModify", false);
module.exports = settingsOrginalSchema;
