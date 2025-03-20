import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line
} from 'recharts';
import axiosInstance from '@/utils/axiosInstance';
import Header from '@/components/layout/Header';
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
};

interface Order {
    _id: string;
    produits: {
        produit: {
            _id: string;
            nom: string;
            prix: number;
        };
        quantite: number;
        remise: number;
    }[];
    services: {
        service: {
            _id: string;
            nom: string;
            prix: number;
        };
        prix: number;
        remise: number;
    }[];
    date: string;
    status: boolean;
    remiseGlobale?: number;
}


interface Payment {
    _id: string;
    montant: number;
    methode:string;
}

const calculateProductsSubtotal = (orderItems: Order['produits'] | undefined): number => {
    if (!orderItems) return 0;
    return orderItems.reduce((total, item) => {
        return total + (item.produit.prix * item.quantite - (item.remise || 0));
    }, 0);
};

const calculateServicesSubtotal = (orderServices: Order['services'] | undefined): number => {
    if (!orderServices) return 0;
    return orderServices.reduce((total, item) => {
        return total + (item.prix - (item.remise || 0));
    }, 0);
};

const calculateTotalPayments = async (orderId: string): Promise<number> => {
    try {
        const response = await axiosInstance.get<Payment[]>(`/api/paiements/commande/${orderId}`);
        return response.data.reduce((total, payment) => total + payment.montant, 0);
    } catch (error) {
        console.error("Error fetching payments:", error);
        return 0;
    }
};


const StatisticsComponent = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Statistics states
    const [totalPaymentsByDay, setTotalPaymentsByDay] = useState<{ date: string; total: number; }[]>([]);
    const [orderStatusCounts, setOrderStatusCounts] = useState({ paid: 0, pending: 0 });
    const [topProducts, setTopProducts] = useState<{ name: string; quantity: number; }[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<{ method: string; total: number; }[]>([]);
    const [dailyRevenue, setDailyRevenue] = useState<{ date: string; revenue: number }[]>([]);
    const [monthlyRevenue, setMonthlyRevenue] = useState<{ month: string; revenue: number }[]>([]);


    const fetchOrders = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axiosInstance.get<Order[]>('api/commandes');
            setOrders(response.data);
        } catch (err) {
            setError("Failed to fetch orders.");
            console.error("Error fetching orders:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    useEffect(() => {
        const calculateStatistics = async () => {
            if (orders.length === 0) return;

            // 1. Total Payments by Day
            const paymentsByDay: { [date: string]: number } = {};
            for (const order of orders) {
                const orderDate = new Date(order.date).toLocaleDateString();
                const totalPaid = await calculateTotalPayments(order._id);
                paymentsByDay[orderDate] = (paymentsByDay[orderDate] || 0) + totalPaid;
            }
            const formattedPaymentsByDay = Object.entries(paymentsByDay).map(([date, total]) => ({ date, total }));
            setTotalPaymentsByDay(formattedPaymentsByDay);

            // 2. Order Status (Paid vs. Pending)
            let paidCount = 0;
            let pendingCount = 0;

            for (const order of orders) {
                const totalOrderValue = calculateProductsSubtotal(order.produits) + calculateServicesSubtotal(order.services) - (order.remiseGlobale || 0);
                const totalPaid = await calculateTotalPayments(order._id);
                if (totalPaid >= totalOrderValue) {
                    paidCount++;
                } else {
                    pendingCount++;
                }
            }
            setOrderStatusCounts({ paid: paidCount, pending: pendingCount });

            // 3. Top Products
            const productCounts: { [productId: string]: { name: string; quantity: number; } } = {};
            for (const order of orders) {
                if (order.produits) {
                    for (const item of order.produits) {
                        const { _id, nom } = item.produit;
                        productCounts[_id] = productCounts[_id] || { name: nom, quantity: 0 };
                        productCounts[_id].quantity += item.quantite;
                    }
                }
            }
            const sortedProducts = Object.values(productCounts).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
            setTopProducts(sortedProducts);

            // 4. Payment Methods
            const paymentMethodCounts: { [method: string]: number } = {};
            for (const order of orders) {
                try {
                    const response = await axiosInstance.get<Payment[]>(`/api/paiements/commande/${order._id}`);
                    const payments = response.data;
                    for (const payment of payments) {
                        paymentMethodCounts[payment.methode] = (paymentMethodCounts[payment.methode] || 0) + payment.montant;
                    }
                } catch (error) {
                    console.error("Error fetching payments for order:", order._id, error);
                }
            }
            const formattedPaymentMethods = Object.entries(paymentMethodCounts).map(([method, total]) => ({ method, total }));
            setPaymentMethods(formattedPaymentMethods);

            // 5. Daily Revenue
            const dailyRevenueData: { [date: string]: number } = {};
            for (const order of orders) {
              const orderDate = new Date(order.date).toLocaleDateString();
              const orderRevenue = calculateProductsSubtotal(order.produits) + calculateServicesSubtotal(order.services) - (order.remiseGlobale || 0);
              dailyRevenueData[orderDate] = (dailyRevenueData[orderDate] || 0) + orderRevenue;
            }
            const formattedDailyRevenue = Object.entries(dailyRevenueData).map(([date, revenue]) => ({ date, revenue }));
            setDailyRevenue(formattedDailyRevenue);


            // 6. Monthly Revenue
            const monthlyRevenueData: { [month: string]: number } = {};
            for (const order of orders) {
              const orderDate = new Date(order.date);
              const orderMonth = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM format
              const orderRevenue = calculateProductsSubtotal(order.produits) + calculateServicesSubtotal(order.services) - (order.remiseGlobale || 0);
              monthlyRevenueData[orderMonth] = (monthlyRevenueData[orderMonth] || 0) + orderRevenue;
            }
            const formattedMonthlyRevenue = Object.entries(monthlyRevenueData).map(([month, revenue]) => ({ month, revenue }));
            setMonthlyRevenue(formattedMonthlyRevenue);
        };

        calculateStatistics();
    }, [orders]);


    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF']; // Example colors



    return (
        <>
        <Header />
        <div className="container py-8">
            <h1 className="text-3xl font-semibold mb-6">Statistiques</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                {/* Total Payments by Day */}
                <Card>
                    <CardHeader>
                        <CardTitle>Total des paiements par jour</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {totalPaymentsByDay.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={totalPaymentsByDay}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis tickFormatter={formatCurrency} />
                                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                                    <Legend />
                                    <Bar dataKey="total" fill="#8884d8" name="Total Paiements" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <p>Aucune donnée de paiement disponible.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Order Status Counts (Pie Chart) */}
                <Card>
                    <CardHeader>
                        <CardTitle>Statut des Commandes</CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Payées', value: orderStatusCounts.paid },
                                        { name: 'En Attente', value: orderStatusCounts.pending },
                                    ]}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={(entry) => entry.name}
                                >
                                    {
                                        [
                                            { name: 'Payées', value: orderStatusCounts.paid },
                                            { name: 'En Attente', value: orderStatusCounts.pending },
                                        ].map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))
                                    }
                                </Pie>
                                <Tooltip />
                                 <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>



                {/* Top 5 Products */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top 5 Produits</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {topProducts.length > 0 ? (
                            <ul className="list-disc pl-5">
                                {topProducts.map((product, index) => (
                                    <li key={index}>
                                        {product.name} ({product.quantity})
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>Aucune donnée de produit disponible.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Payment Methods (Pie Chart) */}
                <Card>
                    <CardHeader><CardTitle>Méthodes de Paiement</CardTitle></CardHeader>
                    <CardContent className="flex justify-center">
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie data={paymentMethods} dataKey="total" nameKey="method" cx="50%" cy="50%" outerRadius={80} fill="#82ca9d" label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}>
                                    {paymentMethods.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: any) => formatCurrency(value)} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Daily Revenue (Line Chart) */}
               <Card>
                    <CardHeader><CardTitle>Revenus Quotidiens</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={dailyRevenue}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis tickFormatter={formatCurrency} />
                          <Tooltip formatter={(value:any) => formatCurrency(value)}/>
                          <Legend />
                          <Line type="monotone" dataKey="revenue" stroke="#8884d8" name="Revenu" />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Monthly Revenue (Line Chart) */}
                  <Card>
                    <CardHeader><CardTitle>Revenus Mensuels</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={monthlyRevenue}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis tickFormatter={formatCurrency}/>
                          <Tooltip formatter={(value:any) => formatCurrency(value)}/>
                          <Legend />
                          <Line type="monotone" dataKey="revenue" stroke="#82ca9d" name="Revenu" />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
            </div>
        </div>
        </>
    );
};

export default StatisticsComponent;