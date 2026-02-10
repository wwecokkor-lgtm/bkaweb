import React, { useMemo } from 'react';
import { Card } from './commonComponents';

interface ChartData {
  label: string;
  value: number;
}

interface BarChartProps {
  data: ChartData[];
  title: string;
}

export const BarChart: React.FC<BarChartProps> = ({ data, title }) => {
  // FIX: useMemo was used without being imported from React.
  const maxValue = useMemo(() => Math.max(...data.map(d => d.value), 0), [data]);
  
  if (!data || data.length === 0) {
    return (
        <Card className="h-full">
             <h3 className="text-xl font-bold mb-4">{title}</h3>
             <div className="flex items-center justify-center h-full text-slate-400">
                 No data to display.
             </div>
        </Card>
    );
  }

  return (
    <Card className="h-full">
      <h3 className="text-xl font-bold mb-4">{title}</h3>
      <div className="flex justify-around items-end h-56 space-x-2">
        {data.map((item) => (
          <div key={item.label} className="flex flex-col items-center flex-1 h-full justify-end">
            <div
              className="w-full bg-sky-500 rounded-t-md hover:bg-sky-400 transition-all"
              style={{ height: `${(item.value / maxValue) * 100}%` }}
              title={`${item.label}: ${item.value}`}
            ></div>
            <p className="text-xs text-slate-400 mt-2 truncate">{item.label}</p>
          </div>
        ))}
      </div>
    </Card>
  );
};
