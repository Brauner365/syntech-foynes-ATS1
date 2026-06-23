"use client"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts"

const COLORS = ["#3b82f6","#f59e0b","#8b5cf6","#f97316","#22c55e","#ef4444","#94a3b8"]

export default function MetricsCharts({ data }: { data: any }) {
  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Stage distribution pie */}
      <div className="card p-5">
        <h3 className="font-semibold text-slate-700 mb-4">Pipeline by Stage</h3>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={data.stageData.filter((d:any)=>d.value>0)} cx="50%" cy="50%"
              outerRadius={80} dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${value}`}>
              {data.stageData.map((_:any, i:number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Location bar chart */}
      <div className="card p-5">
        <h3 className="font-semibold text-slate-700 mb-4">Heads by Location</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data.locationData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="quantity" name="Required" fill="#152850" radius={[3,3,0,0]} />
            <Bar dataKey="filled" name="Placed" fill="#22c55e" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Vacancy pipeline depth */}
      <div className="card p-5 col-span-2">
        <h3 className="font-semibold text-slate-700 mb-4">Pipeline Depth by Role</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data.vacancyData} margin={{ top: 0, right: 0, bottom: 40, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" interval={0} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="pipeline" name="In Pipeline" fill="#3b82f6" radius={[3,3,0,0]} />
            <Bar dataKey="quantity" name="Target" fill="#e2e8f0" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
