import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartData {
  type: 'multiChart';
  data: {
    categorySpending: Record<string, number>;
    summary: {
      income: number;
      mandatory: number;
      discretionary: number;
      savings: number;
    };
    transactions: Array<{
      id: string;
      date: string;
      description: string;
      amount: number;
      category: string;
      type: string;
    }>;
  };
}

interface FinancialChartsProps {
  chartConfig: ChartData;
}

const COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#F97316', '#06B6D4', '#84CC16', '#EC4899', '#6B7280'
];

export default function FinancialCharts({ chartConfig }: FinancialChartsProps) {
  if (!chartConfig || !chartConfig.data) {
    return null;
  }

  const { categorySpending, summary } = chartConfig.data;

  // Prepare data for category spending pie chart
  const categoryData = Object.entries(categorySpending)
    .map(([category, amount]) => ({
      name: category,
      value: amount,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8); // Show top 8 categories

  // Prepare data for budget overview bar chart
  const budgetData = [
    { name: 'Income', amount: summary.income, color: '#10B981' },
    { name: 'Mandatory', amount: summary.mandatory, color: '#EF4444' },
    { name: 'Discretionary', amount: summary.discretionary, color: '#F59E0B' },
    { name: 'Net Savings', amount: summary.savings, color: summary.savings >= 0 ? '#10B981' : '#EF4444' },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(value));
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-medium">{label}</p>
          <p className="text-[hsl(221,83%,53%)]">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Analysis</h3>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-3 rounded-lg border">
          <p className="text-sm text-gray-600">Total Income</p>
          <p className="text-lg font-semibold text-green-600">{formatCurrency(summary.income)}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border">
          <p className="text-sm text-gray-600">Total Spending</p>
          <p className="text-lg font-semibold text-red-600">
            {formatCurrency(summary.mandatory + summary.discretionary)}
          </p>
        </div>
        <div className="bg-white p-3 rounded-lg border">
          <p className="text-sm text-gray-600">Mandatory</p>
          <p className="text-lg font-semibold text-orange-600">{formatCurrency(summary.mandatory)}</p>
        </div>
        <div className="bg-white p-3 rounded-lg border">
          <p className="text-sm text-gray-600">Net Savings</p>
          <p className={`text-lg font-semibold ${summary.savings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(summary.savings)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Spending Pie Chart */}
        <div className="bg-white p-4 rounded-lg border">
          <h4 className="text-md font-medium text-gray-900 mb-3">Spending by Category</h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Budget Overview Bar Chart */}
        <div className="bg-white p-4 rounded-lg border">
          <h4 className="text-md font-medium text-gray-900 mb-3">Budget Overview</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={budgetData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="amount" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 50/30/20 Rule Analysis */}
      <div className="bg-white p-4 rounded-lg border">
        <h4 className="text-md font-medium text-gray-900 mb-3">50/30/20 Rule Analysis</h4>
        <div className="space-y-2">
          {summary.income > 0 && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Needs (Should be ≤50%)</span>
                <span className={`text-sm font-medium ${
                  (summary.mandatory / summary.income) <= 0.5 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {((summary.mandatory / summary.income) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Wants (Should be ≤30%)</span>
                <span className={`text-sm font-medium ${
                  (summary.discretionary / summary.income) <= 0.3 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {((summary.discretionary / summary.income) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Savings (Should be ≥20%)</span>
                <span className={`text-sm font-medium ${
                  (summary.savings / summary.income) >= 0.2 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {((summary.savings / summary.income) * 100).toFixed(1)}%
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}