
import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';

// Sample data (replace with your actual data fetching)
const data = [
  { name: 'Jan', sales: 4000, users: 2400, profit: 2400 },
  { name: 'Feb', sales: 3000, users: 1398, profit: 2210 },
  { name: 'Mar', sales: 2000, users: 9800, profit: 2290 },
  { name: 'Apr', sales: 2780, users: 3908, profit: 2000 },
  { name: 'May', sales: 1890, users: 4800, profit: 2181 },
  { name: 'Jun', sales: 2390, users: 3800, profit: 2500 },
  { name: 'Jul', sales: 3490, users: 4300, profit: 2100 },
];

const pieData = [
  { name: 'Category A', value: 400 },
  { name: 'Category B', value: 300 },
  { name: 'Category C', value: 300 },
  { name: 'Category D', value: 200 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

function StatisticsPage() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Statistiques</h1>

      {/* Numerical Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total des Ventes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">19550 $ {/* Replace with dynamic value */}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Nombre d'Utilisateurs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">26698 {/* Replace with dynamic value */}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Bénéfice</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">15681 $ {/* Replace with dynamic value */}</p>
          </CardContent>
        </Card>
      </div>

      {/* Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Ventes par Mois</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="sales" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Profit et utilisateurs</CardTitle>
        </CardHeader>
        <CardContent>
        <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={data}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="profit" stroke="#8884d8" activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="users" stroke="#82ca9d" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Répartition par Catégorie</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
                <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

export default StatisticsPage;