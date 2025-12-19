import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";
import { useDepartment } from "../../../utils/admin/DepartmentContext";

// Define rich gradient colors
const GRADIENTS = [
  {
    id: "blueGradient",
    colors: ["#304ffe", "#536dfe", "#7986cb"],
  },
  {
    id: "greenGradient",
    colors: ["#00796b", "#009688", "#4db6ac"],
  },
  {
    id: "orangeGradient",
    colors: ["#e65100", "#f57c00", "#ffb74d"],
  },
  {
    id: "purpleGradient",
    colors: ["#7b1fa2", "#9c27b0", "#ba68c8"],
  },
];

const TicketsBySourcePie = ({ data = [], loading, error, fetchData }) => {
  const { selectedDepartment, refreshKey } = useDepartment(); // Get context values
  const [hovered, setHovered] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  // This effect will run whenever department changes or refresh is triggered
  useEffect(() => {
    if (fetchData) {
      console.log("Fetching source data for department:", selectedDepartment);
      fetchData(selectedDepartment);
    }
  }, [selectedDepartment, refreshKey, fetchData]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;
  
  // Ensure data is an array to prevent rendering errors
  const safeData = Array.isArray(data) ? data : [];

  // Custom label positioned outside the pie
  const renderCustomizedLabel = (props) => {
    const { cx, cy, midAngle, outerRadius, index, name, value, percent } = props;
    
    // Calculate position for external label
    const RADIAN = Math.PI / 180;
    const radius = outerRadius * 1.15; // Position labels closer to the pie
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    // Determine text anchor based on position
    const textAnchor = x > cx ? 'start' : 'end';

    return (
      <g>
        {/* Line connecting pie to label */}
        <path
          d={`M${cx + outerRadius * Math.cos(-midAngle * RADIAN)},${cy + outerRadius * Math.sin(-midAngle * RADIAN)}
             L${x - (textAnchor === 'start' ? -5 : 5)},${y}`}
          stroke="#666"
          fill="none"
          strokeWidth={1}
        />
        
        {/* Label background for better readability */}
        <rect
          x={textAnchor === 'start' ? x - 5 : x - 85}
          y={y - 12}
          width={80}
          height={24}
          fill="rgba(255,255,255,0.9)"
          rx={4}
          ry={4}
        />
        
        {/* Text label */}
        <text
          x={x}
          y={y}
          fill="#333"
          textAnchor={textAnchor}
          dominantBaseline="central"
          style={{ fontWeight: 600, fontSize: 13 }}
        >
          {`${name}: ${(percent * 100).toFixed(0)}%`}
        </text>
      </g>
    );
  };

  return (
  <div
    style={{
      background: "#ffffff",
      borderRadius: 24,
      boxShadow: hovered
        ? "0 20px 64px 0 rgba(0,0,0,0.18)"
        : "0 8px 32px 0 rgba(0,0,0,0.08)",
      padding: 20,
      width: "100%", // Change from fixed 450 to 100% for responsiveness
      color: "#23272f",
      marginBottom: 0, // Change from 24 to 0 to match TicketsByStatusPie
      transition: "transform 0.25s cubic-bezier(.4,2,.6,1), box-shadow 0.25s",
      willChange: "transform, box-shadow",
      cursor: "pointer",
      transform: hovered ? "scale(1.04) translateY(-6px)" : "scale(1)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    }}
    onMouseEnter={() => setHovered(true)}
    onMouseLeave={() => {
      setHovered(false);
      setActiveIndex(-1);
    }}
  >
    <h4
      style={{
        textAlign: "center",
        marginBottom: 12,
        color: "#263238",
        fontWeight: 700,
        fontSize: "1.35rem",
        letterSpacing: 0.5,
      }}
    >
      Tickets by Source - {selectedDepartment || 'All'}
    </h4>
    <ResponsiveContainer width="99%" height={330}>
        <PieChart>
          <defs>
            {GRADIENTS.map((gradient) => (
              <radialGradient
                key={gradient.id}
                id={gradient.id}
                cx="50%"
                cy="50%"
                r="70%"
                fx="50%"
                fy="50%"
              >
                <stop offset="0%" stopColor={gradient.colors[2]} />
                <stop offset="70%" stopColor={gradient.colors[1]} />
                <stop offset="100%" stopColor={gradient.colors[0]} />
              </radialGradient>
            ))}
          </defs>

          <Pie
            data={safeData}
            dataKey="value"
            nameKey="source"
            cx="50%"
            cy="50%"
            outerRadius={130}
            innerRadius={90}
            labelLine={false}
            label={renderCustomizedLabel}
            isAnimationActive={true}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth={2}
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(-1)}
          >
            {safeData.map((entry, idx) => (
              <Cell
                key={`cell-${idx}`}
                fill={`url(#${GRADIENTS[idx % GRADIENTS.length].id})`}
                style={{
                  filter: idx === activeIndex ? "drop-shadow(0 0 8px rgba(0,0,0,0.3))" : "none",
                  opacity: activeIndex < 0 || idx === activeIndex ? 1 : 0.7,
                  transition: "opacity 0.3s, filter 0.3s",
                }}
              />
            ))}
          </Pie>

          <Tooltip
            formatter={(value, name, props) => [`${value} (${props.payload.percentage}%)`, name]}
            contentStyle={{
              background: "#263238",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
              fontWeight: 500,
              fontSize: 14,
              padding: "10px 14px",
            }}
            itemStyle={{ color: "#fff" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TicketsBySourcePie;