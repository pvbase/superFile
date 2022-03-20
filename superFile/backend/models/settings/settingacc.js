const mongoose = require("mongoose");
const settingsSchema = new mongoose.Schema(
    {
        company: {
            logo: {
                version: {
                    type: Number
                },
                value: {
                    type: String
                }
            },
            eSignature: {
                version: {
                    type: Number
                },
                value: {
                    type: String
                }
            },
            shareHoldingPattern: {
                version: {
                    type: Number
                },
                value: {
                    type: Array
                }
            },
        },
        numbering: {
            quotation:  {
                version: {
                    type: Number
                },
                value: {
                    type: String
                }
            },
            invoiceNumber: {
                version: {
                    type: Number
                },
                value: {
                    type: String
                }
            },
            purchaseOrder:  {
                version: {
                    type: Number
                },
                value: {
                    type: String
                }
            },
            purchaseInvoiceNumber:  {
                version: {
                    type: Number
                },
                value: {
                    type: String
                }
            },
            contra:  {version: { type: Number}, value: { type: String } },
            reimbursement: {version: { type: Number}, value: { type: String } },
            journal: {version: { type: Number}, value: { type: String } },
            settlement: {version: { type: Number}, value: { type: String } },
            payroll: {version: { type: Number}, value: { type: String } },
            reversal: {version: { type: Number}, value: { type: String } },
            receipt: {version: { type: Number}, value: { type: String } },
            payment: {version: { type: Number}, value: { type: String } },
            debitNoteCustomer: {version: { type: Number}, value: { type: String } },
            debitNoteVendor:{version: { type: Number}, value: { type: String } },
            creditNoteCustomer: {version: { type: Number}, value: { type: String } },
            creditNoteVendor: {version: { type: Number}, value: { type: String } },
        },
        general: {
            currency: {version: { type: Number}, value: { type: String } },
            units: {version: { type: Number}, value: { type: String } },
            financialYear: {version: { type: Number}, value: { type: String } },
            termsandcondition:{version: { type: Number}, value: { type: Array } },
        }
    },
    { timestamps: true },
    { _id: false }
);
//mongoose.set("useFindAndModify", false);
module.exports = settingsSchema;
