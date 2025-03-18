interface Caisse {
  _id: String; // Or string, if your IDs are strings
  soldeinitiale: number;
  soldefinale: number;
  dateOuverture: string; // Store as ISO string (e.g., "2024-01-26T14:30:00.000Z")
  isOpen: boolean;
  transactions: Transaction[]; // IMPORTANT: Include the transactions array
}

interface Transaction {
  _id: String;
  montant: number;
  type: 'retrait' | 'depot'; // Use a union type for better type safety
  date: string;          // Store as ISO string
  idCaisse: String;      // You might not need this if transactions are *always* fetched with the caisse
  motif: string;
}