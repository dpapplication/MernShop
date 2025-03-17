import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
    CreditCard, // For "Carte bancaire"
    Wallet,     // Decent icon for "Espèces"
    FileText,   // Reasonable icon for "Chèque" (check)
    Repeat,      // Decent for "Virement" (transfer)
  } from 'lucide-react';



interface PaymentSummaryProps {
  payments?: { typePaiement: string; montant: string }[]; // payments can be undefined.
}

const PaymentSummary: React.FC<PaymentSummaryProps> = ({ payments }) => {

  // Calculate totals for each payment type:
  const totals: Record<string, number> = {
    'Carte bancaire': 0,
    'Espèces': 0,
    'Chèque': 0,
    'Virement': 0,
  };

    if(payments) { // Check if payments exist before iterating
        for (const payment of payments) {
            if (totals.hasOwnProperty(payment.typePaiement)) { //Important check for valid type.
                const amount = parseFloat(payment.montant); // Parse to number
                if (!isNaN(amount)) { // Verify it is a number.
                   totals[payment.typePaiement] += amount; // Add to total.
                }

            }
        }
    }


  const paymentIcons = {
    'Carte bancaire': <CreditCard className="h-4 w-4" />, // Smaller icons
    'Espèces': <Wallet className="h-4 w-4" />,
    'Chèque': <FileText className="h-4 w-4" />,
    'Virement': <Repeat className="h-4 w-4" />,
  };

  return (
   <Card>
     <CardHeader>
        <CardTitle>Payment Summary</CardTitle>
      </CardHeader>
      <CardContent>
       <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payment Type</TableHead>
              <TableHead className="text-right">Amount</TableHead> {/* Right-align */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(totals).map(([type, total]) => (
                total > 0 && ( // Only show if total > 0
                <TableRow key={type}>
                    <TableCell className="flex items-center">
                      {paymentIcons[type]}
                      <span className="ml-2">{type}</span> {/* Add a little space */}
                    </TableCell>
                     <TableCell className="text-right font-medium">  {/* Right-align, bold */}
                        {total}
                     </TableCell>
                </TableRow>
                )
            ))}
            {/* No Payments Message */}
            {(!payments || payments.length === 0) && (
                <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground">
                   No payments yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentSummary;