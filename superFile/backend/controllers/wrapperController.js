exports.createPaymentKen = async function (req, res) {
  let inputData = req.body;
  if (
    !inputData.name ||
    !inputData.email ||
    !inputData.mobile ||
    !inputData.amount ||
    !inputData.paisa ||
    !inputData.callBackUrl ||
    !inputData.currencyCode
  ) {
    res.status(422).json({
      status: "failed",
      message: "Please provide all required parameters.",
      type: "error",
    });
  } else if (!validEmail(inputData.email)) {
    res.json({ message: "Invalid Info", type: "error" });
  } else {
    const centralDbConnection = await createDatabase(
      `usermanagement-${process.env.stage}`,
      process.env.central_mongoDbUrl
    );
    const orgListModel = centralDbConnection.model(
      "orglists",
      orgListSchema,
      "orglists"
    );
    const orgData = await orgListModel.findOne({
      _id: req.query.orgId,
    });
    if (!orgData || orgData == null) {
      centralDbConnection.close();
      res.status(500).send({
        status: "failure",
        message: "Organization not found",
      });
    } else {
      let dbConnection = await createDatabase(
        String(orgData._id),
        orgData.connUri
      );
      const settingsModel = dbConnection.model(
        "settings",
        settingsSchema,
        "settings"
      );

      const paymentModel = dbConnection.model("razorpay", RazorpaySchema);
      const settings = await settingsModel.find({});
      let paymentGateway = settings[0].paymentGateway.paymentGateway;

      const credentials = mongoose.Schema({}, { strict: false });
      // const msettingModel = dbConnectionp.model("settings", credentials, "settings")
      const credentialsModel = dbConnection.model(
        "credentials",
        credentials,
        "credentials"
      );
      const credentialData = await credentialsModel.findOne({
        type: "payment",
      });

      var username = credentialData._doc.userName;
      var password = credentialData._doc.password;
      var auth =
        "Basic " + Buffer.from(username + ":" + password).toString("base64");
      let amount = inputData.amount + inputData.paisa;
      let today = Date.now();
      var obj;
      let uniqueId = uuid.v1();
      if (inputData.accept_partial == true) {
        obj = {
          amount: parseInt(amount),
          currency: inputData.currencyCode,
          accept_partial: true,
          first_min_partial_amount: inputData.min_partial_amount,
          expire_by: today,
          reference_id: uniqueId,
          description: "Payment for " + inputData.studentId,
          customer: {
            name: inputData.name,
            contact: inputData.mobile,
            email: inputData.email,
          },
          notify: {
            sms: false,
            email: false,
          },
          reminder_enable: false,
          notes: {
            policy_name: inputData.name,
          },
          callback_url: inputData.callBackUrl,
          callback_method: "get",
        };
      } else {
        obj = {
          amount: parseInt(amount),
          currency: inputData.currencyCode,
          accept_partial: inputData.accept_partial,
          expire_by: today,
          reference_id: uniqueId,
          description: "Payment for " + inputData.studentId,
          customer: {
            name: inputData.name,
            contact: inputData.mobile,
            email: inputData.email,
          },
          notify: {
            sms: false,
            email: false,
          },
          reminder_enable: true,
          notes: {
            policy_name: inputData.name,
          },
          callback_url: inputData.callBackUrl,
          callback_method: "get",
        };
      }
      var options = {
        method: "POST",
        uri: "https://api.razorpay.com/v1/payment_links",
        body: obj,
        json: true,
        headers: {
          "Content-Type": "application/json",
          Authorization: auth,
        },
      };
      rq(options)
        .then(async (success) => {
          console.log("sucess");
          var newData = new paymentModel({
            name: inputData.name,
            email: inputData.email,
            mobile: inputData.mobile,
            studentId: inputData.studentId,
            amount: inputData.amount,
            paisa: inputData.paisa,
            paymentId: success.id,
            callBackUrl: inputData.callBackUrl,
            currencyCode: inputData.currencyCode,
            razorpay: success,
            feesBreakUp: inputData.feesBreakUp,
            webhookStatus: success.status,
            referenceId: uniqueId,
          });
          newData.save(function (err, data) {
            if (err) {
              centralDbConnection.close() // new
              dbConnection.close() // new
              return res.status(500).json({
                message: "Database error",
                success: false,
                Error: err,
              });
            }
            else {
              centralDbConnection.close() // new
              dbConnection.close() // new
              return res.status(200).json({
                message: "Paymentlink Created",
                success: true,
                data: success,
              });
            }
          });
        })
        .catch((err) => {
          res.status(400).json({ Message: "Failed", Error: err });
          centralDbConnection.close() // new
          dbConnection.close() // new
          return;
        })
        .finally(() => {
          centralDbConnection.close();
        });
    }
  }
};
