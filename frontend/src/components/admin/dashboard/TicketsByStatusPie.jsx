import React from "react";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";

// Define rich gradient colors for status
const GRADIENTS = [
  {
    id: "openGradient",
    colors: ["#e65100", "#ff9800", "#ffcc80"], // Orange (Open)
  },
  {
    id: "inprocessGradient",
    colors: ["#6a1b9a", "#9c27b0", "#ce93d8"], // Purple (In Progress)
  },
  {
    id: "resolvedGradient",
    colors: ["#1b5e20", "#43a047", "#81c784"], // Green (Resolved)
  },
  {
    id: "closedGradient",
    colors: ["#01579b", "#0288d1", "#81d4fa"], // Blue (Closed)
  },
];

const TicketsByStatusPie = ({data = [], loading = false, error = null }) => {
  const [hovered, setHovered] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);

  // Custom label positioned outside the pie
  const renderCustomizedLabel = (props) => {
    const { cx, cy, midAngle, outerRadius, index, name, value, percent } = props;
    
    // Calculate position for external label
    const RADIAN = Math.PI / 180;
    const radius = outerRadius * 1.2;
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
          strokeWidth={1.5}
        />
        
        {/* Label background for better readability */}
        <rect
          x={textAnchor === 'start' ? x - 5 : x - 85}
          y={y - 12}
          width={60}
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
      width: "100%", // Make it fully responsive
      color: "#23272f",
      marginBottom: 0, // Remove margin, parent div handles spacing
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
      Tickets by Status
    </h4>
    <ResponsiveContainer width="105%" height={330}>
        <PieChart>
          {/* Define gradients */}
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

          {/* Filled circle pie chart */}
          <Pie
            data={data}
            dataKey="value"
            nameKey="status"
            cx="50%"
            cy="50%"
            outerRadius={120} // Reduced from 130 to 120
            innerRadius={0} // Set to 0 for a filled circle
            labelLine={false}
            label={renderCustomizedLabel}
            isAnimationActive={true}
            stroke="#ffffff" // White borders between segments
            strokeWidth={3}
            paddingAngle={1} // Small gap between segments
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(-1)}
          >
            {data.map((entry, idx) => (
              <Cell
                key={`cell-${idx}`}
                fill={`url(#${GRADIENTS[idx % GRADIENTS.length].id})`}
                style={{
                  filter: idx === activeIndex ? "drop-shadow(0 0 10px rgba(0,0,0,0.35))" : "none",
                  opacity: activeIndex < 0 || idx === activeIndex ? 1 : 0.75,
                  transition: "opacity 0.3s, filter 0.3s",
                }}
              />
            ))}
          </Pie>

          <Tooltip
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

export default TicketsByStatusPie;