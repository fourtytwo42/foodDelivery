/**
 * Receipt generator utility
 * Generates HTML receipt that can be printed or converted to PDF
 */

export interface ReceiptData {
  orderNumber: string
  orderDate: string
  customerName?: string | null
  orderType: string
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  subtotal: number
  tax: number
  deliveryFee: number
  tip: number
  discount: number
  total: number
  paymentMethod?: string
  paymentStatus?: string
}

export function generateReceiptHTML(data: ReceiptData): string {
  const itemsHTML = data.items
    .map(
      (item) => `
    <tr>
      <td>${item.name} x${item.quantity}</td>
      <td style="text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `
    )
    .join('')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receipt - ${data.orderNumber}</title>
  <style>
    body {
      font-family: 'Courier New', monospace;
      width: 300px;
      margin: 0 auto;
      padding: 20px;
      background: white;
    }
    .header {
      text-align: center;
      border-bottom: 2px dashed #000;
      padding-bottom: 10px;
      margin-bottom: 15px;
    }
    .order-info {
      margin-bottom: 15px;
      line-height: 1.6;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
    }
    td {
      padding: 5px 0;
    }
    .totals {
      border-top: 2px dashed #000;
      padding-top: 10px;
      margin-top: 15px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      margin: 5px 0;
    }
    .total-final {
      font-weight: bold;
      font-size: 1.2em;
      border-top: 1px solid #000;
      padding-top: 5px;
      margin-top: 5px;
    }
    .footer {
      text-align: center;
      margin-top: 20px;
      padding-top: 10px;
      border-top: 2px dashed #000;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Restaurant Receipt</h1>
  </div>
  
  <div class="order-info">
    <div><strong>Order #:</strong> ${data.orderNumber}</div>
    <div><strong>Date:</strong> ${data.orderDate}</div>
    ${data.customerName ? `<div><strong>Customer:</strong> ${data.customerName}</div>` : ''}
    <div><strong>Type:</strong> ${data.orderType}</div>
  </div>

  <table>
    ${itemsHTML}
  </table>

  <div class="totals">
    <div class="total-row">
      <span>Subtotal:</span>
      <span>$${data.subtotal.toFixed(2)}</span>
    </div>
    ${data.deliveryFee > 0 ? `
    <div class="total-row">
      <span>Delivery Fee:</span>
      <span>$${data.deliveryFee.toFixed(2)}</span>
    </div>
    ` : ''}
    <div class="total-row">
      <span>Tax:</span>
      <span>$${data.tax.toFixed(2)}</span>
    </div>
    ${data.tip > 0 ? `
    <div class="total-row">
      <span>Tip:</span>
      <span>$${data.tip.toFixed(2)}</span>
    </div>
    ` : ''}
    ${data.discount > 0 ? `
    <div class="total-row">
      <span>Discount:</span>
      <span>-$${data.discount.toFixed(2)}</span>
    </div>
    ` : ''}
    <div class="total-row total-final">
      <span>TOTAL:</span>
      <span>$${data.total.toFixed(2)}</span>
    </div>
  </div>

  ${data.paymentMethod ? `
  <div class="order-info">
    <div><strong>Payment Method:</strong> ${data.paymentMethod}</div>
    <div><strong>Payment Status:</strong> ${data.paymentStatus || 'Pending'}</div>
  </div>
  ` : ''}

  <div class="footer">
    <div>Thank you for your order!</div>
  </div>
</body>
</html>
  `
}

export function printReceipt(data: ReceiptData) {
  const html = generateReceiptHTML(data)
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    printWindow.close()
  }
}

