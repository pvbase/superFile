var mongoose = require("mongoose");
const orgListSchema = require("../models/orglists-schema");
const StudentSchema = require("../models/studentModel");
const GuardianSchema = require("../models/guardianModel");
exports.stupdate = async (req, res) => {
    const Mongouri = `${process.env.MongoUrl}/${process.env.database}`;
    console.log(Mongouri);
    mongoose
        .createConnection(`${Mongouri}`, {
            useNewUrlParser: true,
            useCreateIndex: true,
            useUnifiedTopology: true,
        })
        .then((value) => {
            const createModels = value.model("orglists", orgListSchema, "orglists");
            createModels.findById(req.query.instituteid).then(async (data) => {
                console.log(`${data.connUri}/${req.query.instituteid}`);
                const connection = mongoose.createConnection(
                    `${data.connUri}/${req.query.instituteid}`,
                    {
                        useNewUrlParser: true,
                        useCreateIndex: true,
                        useUnifiedTopology: true,
                    }
                );

                const updateStudent = connection.model(
                    "students",
                    StudentSchema,
                    "students"
                );
                const UpdateParent = connection.model(
                    "guardians",
                    GuardianSchema,
                    "guardians"
                );


                var Fetchid = { _id: req.body.studentDetails._id };
                var updateStudents = {
                    $set: {
                        gender: req.body.studentDetails.gender,
                        admittedOn: req.body.studentDetails.admittedOn,
                        citizenship: req.body.studentDetails.citizenship,
                        section: req.body.studentDetails.section,
                        firstName: req.body.studentDetails.firstName,
                        lastName: req.body.studentDetails.lastName,
                        dob: req.body.studentDetails.dob,
                        phoneNo: req.body.studentDetails.phoneNo,
                        email: req.body.studentDetails.email,
                        addressDetails: req.body.addressDetails,
                        campusId:req.body.studentDetails.campusId,
                        isFinalYear:req.body.studentDetails.isFinalYear
                    },
                };

                var ParentFetchid = { _id: req.body.guardianDetails._id };
                var updatePareent = {
                    $set: {
                        firstName: req.body.guardianDetails.firstName,
                        lastName: req.body.guardianDetails.lastName,
                        fullName:req.body.guardianDetails.fullName,
                        mobile: req.body.guardianDetails.mobile,
                        email: req.body.guardianDetails.email,
                        motherDetails:req.body.motherKYCDetails,
                        fatherDetails:req.body.fatherKYCDetails,
                        guardianDetails:req.body.guardianKYCDetails
                    },
                };
                updateStudent.updateMany(Fetchid, updateStudents, function (serr, sdata) {
                    console.log(serr)
                    if (sdata) {
                        console.log("update parent")
                        UpdateParent.updateMany(ParentFetchid, updatePareent, function (perr, pdata) {
                            if (data) {
                                res.status(200);
                                res.send({ message: "students details updated successfully" });
                            }
                        })
                    }
                });











            })
        })
        .catch((err) => {
            console.log(err);
        });

}