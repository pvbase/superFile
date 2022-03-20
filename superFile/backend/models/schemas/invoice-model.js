const mongoose = require("mongoose");

const invoiceDetails = new mongoose.Schema(
    {
        displayName: {type: String}, 
        date: {type: Date}, 
        paymentDueDate: {type: Date}, 
        otherField1: {type: String}, 
        otherField2: {type: String}
    }
); 

const ewayBill = new mongoose.Schema(
    {
        number: {type: String}, 
        date: {type: Date}, 
        vehicleNumber: {type: String}, 
        generatedBy: {type: String}, 
        transporterId: {type: String}, 
        validFrom: {type: Date}, 
        validTill: {type: Date}
    }
); 

const invoiceItem = new mongoose.Schema(
    {
        number: {type: Number}, 
        particulars: {type: String}, 
        hsnSac: {type: String}, 
        coaCode: {type: String}, 
        quantity: {type: Number}, 
        quantityUnit: {type: String}, 
        unitPrice: {type: Number},  
        discount: {type: Number},  
        totalPrice: {type: Number},  
        sgstCoaCode: {type: String}, 
        sgstRate: {type: Number},  
        sgstAmount: {type: Number},  
        cgstCoaCode: {type: String}, 
        cgstRate: {type: Number},  
        cgstAmount: {type: Number},  
        igstCoaCode: {type: String}, 
        igstRate: {type: Number},  
        igstAmount: {type: Number},  
        itemTotal: {type: Number},  
    }
); 

const invoiceSchema = new mongoose.Schema(
    {
        docType: {type: String, required: true},
        orgId: {type: mongoose.Types.ObjectId}, 
        docDetails: {type: invoiceDetails}, // declared above in the same file
        toOrgId: {type: mongoose.Types.ObjectId}, 
        orgCoaCode: {type: String}, 
        shipToOrgId: {type: mongoose.Types.ObjectId}, 
        ewayBill: {type: ewayBill}, // declared above in the same file
        description: [{type: invoiceItem}], // array of invoice items; declared above in the same file 
        taxableAmount: {type: Number},  
        subTotal: {type: Number}, 
        discount: {type: Number}, 
        taxAmount: {type: Number}, 
        advanceAmount: {type: Number}, 
        totalAmount: {type: Number}, 
        totalInWords: {type: String}, 
        CTALink: {type: String}, 
        notes: [{type: String}], // array 
        tnc: [{type: String}], // array 
        forName: {type: String}, 
        signatureType: {type: String}, 
        signatureRefId: {type: String}, 
        signatoryName: {type: String}
    },
);

module.exports = invoiceSchema;
