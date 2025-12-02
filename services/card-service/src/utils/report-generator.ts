import type { Transaction } from "../types/transaction"

export const generateCSV = (transactions: Transaction[]): string => {
  const headers = ["UUID", "Card ID", "Amount", "Merchant", "Type", "Date"]
  const rows = transactions.map((t) => [
    t.uuid,
    t.cardId,
    t.amount.toString(),
    t.merchant,
    t.type,
    t.createdAt,
  ])

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n")

  return csvContent
}

export const generateHTML = (transactions: Transaction[]): string => {
  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0)

  const rows = transactions
    .map(
      (t) => `
    <tr>
      <td>${t.uuid}</td>
      <td>${t.merchant}</td>
      <td>$${t.amount.toFixed(2)}</td>
      <td>${t.type}</td>
      <td>${new Date(t.createdAt).toLocaleString()}</td>
    </tr>
  `,
    )
    .join("")

  return `
<!DOCTYPE html>
<html>
<head>
  <title>Transaction Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #4CAF50; color: white; }
    tr:nth-child(even) { background-color: #f2f2f2; }
    .summary { background-color: #e7f3ff; padding: 15px; border-radius: 5px; margin-top: 20px; }
  </style>
</head>
<body>
  <h1>Transaction Report</h1>
  <div class="summary">
    <p><strong>Total Transactions:</strong> ${transactions.length}</p>
    <p><strong>Total Amount:</strong> $${totalAmount.toFixed(2)}</p>
  </div>
  <table>
    <thead>
      <tr>
        <th>Transaction ID</th>
        <th>Merchant</th>
        <th>Amount</th>
        <th>Type</th>
        <th>Date</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
</body>
</html>
  `
}
