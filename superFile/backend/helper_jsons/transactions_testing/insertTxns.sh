# author - rahul.jain 
#curl -H "Content-Type: application/json" -H "client: ken42" -H Authorization:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im11bml5YXJhai5uZWVsYW1lZ2FtQGdtYWlsLmNvbSIsImlkIjoiNWY4NTgyZTA2OGEwMDIwMDA4NmM2Y2YxIiwiaWF0IjoxNjA1MTcwOTY2LCJleHAiOjE2MDUyNTczNjZ9.trGxJpWXPjgPJNy3iVUdm4pquSsIo1b3MA-Ibg5fXcQ http://localhost:3000/local/edu/feesledger/count


curl -s -o /dev/null -d @demandNote-1.json -H "Content-Type: application/json" -H "client: ken42" -H @authToken http://localhost:3000/local/edu/transactions 
curl -s -o /dev/null -d @demandNote-2.json -H "Content-Type: application/json" -H "client: ken42" -H @authToken http://localhost:3000/local/edu/transactions 
curl -s -o /dev/null -d @demandNote-3.json -H "Content-Type: application/json" -H "client: ken42" -H @authToken http://localhost:3000/local/edu/transactions 

curl -s -o /dev/null -d @demandNote-1-payment.json -H "Content-Type: application/json" -H "client: ken42" -H @authToken http://localhost:3000/local/edu/transactions 
curl -s -o /dev/null -d @demandNote-2-payment.json -H "Content-Type: application/json" -H "client: ken42" -H @authToken http://localhost:3000/local/edu/transactions 
curl -s -o /dev/null -d @demandNote-3-payment.json -H "Content-Type: application/json" -H "client: ken42" -H @authToken http://localhost:3000/local/edu/transactions 

curl -s -o /dev/null -d @demandNote-4.json -H "Content-Type: application/json" -H "client: ken42" -H @authToken http://localhost:3000/local/edu/transactions 
curl -s -o /dev/null -d @demandNote-5.json -H "Content-Type: application/json" -H "client: ken42" -H @authToken http://localhost:3000/local/edu/transactions 
curl -s -o /dev/null -d @demandNote-4-5-payment.json -H "Content-Type: application/json" -H "client: ken42" -H @authToken http://localhost:3000/local/edu/transactions 

./counts.sh 
