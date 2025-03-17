import React from 'react';
import { formatCurrency } from '@/pages/Commande'; // Import helper functions
import type { Order } from '@/pages/Commande';     // Import the Order interface

interface InvoiceProps {
  order: Order;
}
const Invoice: React.FC<InvoiceProps> = ({ order }) => {
    const orderTotal = order.produits?.reduce((sum,item)=>{
       return  sum + (parseFloat(item.produit.prix.toString())* parseInt(item.quantite) * (1 - (parseFloat(item.remise) || 0)/100 ))
    },0)
    const totalPayments = parseFloat(order.payments?.reduce((sum,item)=>{
        return  sum + parseFloat(item.montant)
    },0).toFixed(2));
    const  remiseGlobale = parseFloat(order.remiseGlobale || '0');
    const sousTotal =orderTotal;
    const Total = (sousTotal * (1 - remiseGlobale / 100) - totalPayments).toFixed(2);
  return (
    <div className="invoice hidden print:block p-6"> {/* Hidden by default, visible for printing */}
      <h1 className="text-2xl font-bold mb-4">Invoice</h1>

        <div className="mb-4">
        <strong>Order Number:</strong> ORD-{order._id.substring(order._id.length - 6)}<br />
        <strong>Date:</strong> {order.createdAt} {/* Format this appropriately */}
        </div>

        <div className="mb-4">
        <h2 className="text-xl font-semibold">Client Information</h2>
        <p><strong>Name:</strong> {order.client?.nom}</p>
        <p><strong>Address:</strong> {order.client?.adresse}</p>
        <p><strong>Phone:</strong> {order.client?.telephone}</p>
      </div>

      <h2 className="text-xl font-semibold mb-2">Order Items</h2>
      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left">Product</th>
            <th className="text-right">Quantity</th>
            <th className="text-right">Unit Price</th>
             <th className="text-right">remise</th>
            <th className="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
             {order.produits?.map((item) => (
                                    <tr key={item.produit._id}>
                                    <td >{item.produit.nom}</td>
                                    <td className="text-right">{item.quantite}</td>
                                   <td className="text-right">{formatCurrency(item.produit.prix)}</td>
                                   <td className="text-right">
                                        {item.remise}%
                                     </td>

                                   <td className="text-right">
                                   {formatCurrency((parseFloat(item.produit.prix.toString()) * parseInt(item.quantite) * (1- (parseFloat(item.remise) || 0)/100)))}
                                     </td>
                                </tr>
                            ))}
        </tbody>
      </table>

      <h2 className="text-xl font-semibold mb-2 mt-4">Payments</h2>
        <table className='w-full'>
            <thead>
            <TableHead>Type</TableHead>
            <TableHead className='text-right'>Amount </TableHead>
             </thead>
               <TableBody>
                {order.payments?.map((payment) => (
                <TableRow key={payment.id}>
                    <TableCell>
                    {/* Display Type Paiement */}
                        {payment.typePaiement}
                    </TableCell>
                    <TableCell className="text-right">
                    {formatCurrency(payment.montant)}
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
        </table>
        <div className="flex justify-end mt-4">
            <div className="space-y-2 text-right">
                <div className="flex justify-between">Sous-Total:<span>{formatCurrency(orderTotal)}</span></div>
                <div className="flex justify-between">Remise Globale:<span>{order.remiseGlobale || 0}%</span></div>
                 <div className="flex justify-between">  Total payments:
                  <span>{formatCurrency(totalPayments)}</span>
                   </div>
                <div className="flex justify-between font-bold text-lg"> Reste à payer:
                    <span>{formatCurrency(Total)}</span>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Invoice;