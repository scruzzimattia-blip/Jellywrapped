import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#6366f1', '#f59e0b', '#22c55e', '#ec4899', '#38bdf8', '#a78bfa', '#fb7185'];

export function DonutChart(props: {
  data: { name: string; value: number }[];
}): React.ReactElement {
  const { data } = props;

  return (
    <div className="glass-card h-80 w-full max-w-md rounded-2xl p-4">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={72}
            outerRadius={110}
            paddingAngle={2}
            stroke="transparent"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]!} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'rgba(9,9,16,0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              color: '#f1f5f9',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
