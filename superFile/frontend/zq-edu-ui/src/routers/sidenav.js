export default {
    items: [{
        icon: "zq-icon-dashboard",
        name: "Dashboard",
        title: "View Dashboard",
        url: '/main/dashboard',
        children: []
    },
    {
        icon: "zq-icon-transaction",
        name: "Transactions",
        title: "Manage your Transactions",
        children: [
            {
                name: "Send Demand Note",
                url: "/main/transactions/send-demand-note"
            },
            {
                name: "Collect Fees",
                url: "/main/txn/collect-fees"
            },
            // {
            //     name: "Refund",
            //     url: "/main/txn/refund"
            // }
        ]
    },
    // {
    //     icon: "zq-icon-money",
    //     name: "Money",
    //     title: "Money Related Transactions",
    //     children: []
    // },
    {
        name: "Reports",
        icon: "zq-icon-reports",
        title: "View your Reports",
        children: [
            {
                name: "Demand Note",
                url: "/main/reports/demand-note"
            },
            {
                name: "Fees Collection",
                url: "/main/reports/fees-collection"
            },
            {
                name: "Student Statement",
                url: "/main/reports/student-statement"
            },
            {
                name: "Program Plan Statement",
                url: "/main/reports/programPlan-statement"
            },
            {
                name: "Defaulter Report",
                url: "/main/reports/defaulter-report"
            },
            // {
            //     name: "Refund",
            //     url: "/main/reports/refund"
            // },
            {
                name: "Fee pending",
                url: "/main/reports/fee-pending-report"
            }
        ]
    },
    {
        name: 'Configuration',
        icon: "zq-config-configuration",
        title: "Configuration",
        children: [
            {
                name: "Student Fees Manager",
                url: "/main/configuration/student-fee-mapping"
            },
            {
                name: "Fees Manager",
                url: "/main/configuration/fees-manager"
            }
        ]
    },
    {
        name: 'Setup',
        icon: "zq-icon-settings",
        title: "Manage your Setup",
        children: [
            {
                name: "Masters",
                children: [
                    {
                        name: "Students",
                        url: '/main/setup/masters/student'
                    },
                    {
                        name: "Program Plan",
                        url: '/main/setup/program-plan'
                    },
                    {
                        name: "Fee Structure",
                        url: '/main/setup/fee-structure'
                    },
                    {
                        name: "Fee Types",
                        url: '/main/setup/masters/fee-type'
                    },
                    // {
                    //     name: "Routes",
                    //     url: '/main/setup/routes'
                    // },
                    // {
                    //     name: "Stops",
                    //     url: '/main/setup/stops'
                    // },
                    // {
                    //     name: "Uniform",
                    //     url: '/main/setup/uniform'
                    // },
                    // {
                    //     name: "Books",
                    //     url: '/main/setup/books'
                    // },
                    {
                        name: "Payment Schedule",
                        url: '/main/setup/payment-schedule'
                    },
                    {
                        name: "Reminders",
                        url: '/main/setup/reminders'
                    },
                    // {
                    //     name: "Discounts",
                    //     url: '/main/setup/discounts'
                    // },
                    {
                        name: "Installment",
                        url: '/main/setup/masters/installment'
                    },
                    {
                        name: "Late Fees",
                        url: '/main/setup/masters/late-fees'
                    },
                    // {
                    //     name: "Catagories",
                    //     url: '/main/setup/categories'
                    // }
                ]
            },
            {
                name: "Settings",
                url: '/main/setup/settings'
                // children: [
                //     {
                //         name: "Logo",
                //         url: '/main/setup/Logo'
                //     },
                //     {
                //         name: "Name and address",
                //         url: '/main/setup/name-address'
                //     },
                //     {
                //         name: "Templates",
                //         url: '/main/setup/templates'
                //     },
                //     {
                //         name: "Email Server",
                //         url: '/main/setup/email-server'
                //     },
                //     {
                //         name: "SMS Gateway",
                //         url: '/main/setup/sms-gateway'
                //     },
                //     {
                //         name: "Payment Gateway",
                //         url: '/main/setup/payment-gateway'
                //     },
                //     {
                //         name: "Academic Year",
                //         url: '/main/setup/academic-year'
                //     }
                // ]
            }
        ]
    }]
}