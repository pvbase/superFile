printf 'Transaction count: '
curl -H "Content-Type: application/json" -H "client: ken42" -H @authToken http://localhost:3000/local/edu/transactions/count
printf '\nFees ledger entries: '
curl -H "Content-Type: application/json" -H "client: ken42" -H @authToken http://localhost:3000/local/edu/feesledger/count
echo ' '
