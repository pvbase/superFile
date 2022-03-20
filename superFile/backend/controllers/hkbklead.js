
exports.getleads = async (req, res) => {
    res.status(200).send({

        "feesDetails": [
            {
                "year": 1,
                "fees": 20000.00
            },
            {
                "year": 2,
                "fees": 20000.00
            },
            {
                "year": 3,
                "fees": 20000.00
            },
            {
                "year": 4,
                "fees": 20000.00
            }
        ]

    })
}

exports.postleads = async (req, res) => {
    res.status(201).send({ message: "lead details added" })
}