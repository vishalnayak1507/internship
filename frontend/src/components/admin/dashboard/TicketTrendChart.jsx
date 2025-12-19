import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from "recharts";

// Helper to format date labels
// Format date for axis label (short for large ranges)
const formatDateLabel = (dateString, isDense = false) => {
  const date = new Date(dateString);
  if (isDense) {
    // Only show month/day for dense data
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

const TicketTrendChart = ({ data, timeFilter }) => {
  // Helper to get all dates in range
  function getDateRangeArray(start, end) {
    const arr = [];
    let dt = new Date(start);
    const endDt = new Date(end);
    while (dt <= endDt) {
      arr.push(dt.toISOString().split('T')[0]);
      dt.setDate(dt.getDate() + 1);
    }
    return arr;
  }

  // Fill missing dates for custom range
  // Normalize backend date to 'YYYY-MM-DD' for mapping
  let dataWithSLA = data.map(item => ({
    ...item,
    count: item.total, // for compatibility with existing chart code
    slaBreached: item.slaBreached,
    date: typeof item.date === 'string' ? item.date.split('T')[0] : new Date(item.date).toISOString().split('T')[0]
  }));

  if (timeFilter?.startDate && timeFilter?.endDate) {
    const allDates = getDateRangeArray(timeFilter.startDate, timeFilter.endDate);
    const dataMap = Object.fromEntries(dataWithSLA.map(d => [d.date, d]));
    dataWithSLA = allDates.map(date =>
      dataMap[date]
        ? dataMap[date]
        : { date, count: 0, slaBreached: 0, total: 0 }
    );
  }

  // Calculate averages for reference lines
  const ticketAvg = dataWithSLA.length
    ? dataWithSLA.reduce((sum, item) => sum + item.count, 0) / dataWithSLA.length
    : 0;
  const slaAvg = dataWithSLA.length
    ? dataWithSLA.reduce((sum, item) => sum + item.slaBreached, 0) / dataWithSLA.length
    : 0;

  // For dense data, show fewer ticks
  const dense = dataWithSLA.length > 14;

  // Dynamic chart title
  let chartTitle = 'Ticket Trend';
  if (timeFilter?.period === 'daily') chartTitle = 'Today\'s Ticket Trend';
  else if (timeFilter?.period === 'weekly') chartTitle = 'This Week\'s Ticket Trend';
  else if (timeFilter?.period === 'monthly') chartTitle = 'This Month\'s Ticket Trend';
  else if (timeFilter?.startDate && timeFilter?.endDate) chartTitle = `Ticket Trend (${timeFilter.startDate} to ${timeFilter.endDate})`;
  else if (dataWithSLA.length === 7) chartTitle = 'Last 7-Day Ticket Trend';

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 24,
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        padding: "20px 16px",
        height: "auto",
        maxHeight: 380,
        transition: "transform 0.2s, box-shadow 0.2s",
        overflow: "hidden",
        width: "100%",
        boxSizing: "border-box",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.12)";
        e.currentTarget.style.transform = "translateY(-4px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <h3
          style={{
            margin: 0,
            color: "#263238",
            fontWeight: 600,
            fontSize: "1.4rem",
          }}
        >
          {chartTitle}
        </h3>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
            marginTop: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                background: "#1976d2",
              }}
            ></div>
            <span style={{ color: "#455a64", fontSize: "0.95rem", fontWeight: 500 }}>
              New Tickets
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                background: "#d32f2f",
              }}
            ></div>
            <span style={{ color: "#455a64", fontSize: "0.95rem", fontWeight: 500 }}>
              SLA Breached
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <svg width="40" height="6" style={{ display: 'block' }}>
              <line x1="0" y1="3" x2="40" y2="3" stroke="#9e9e9e" strokeWidth="3" strokeDasharray="6,4" />
            </svg>
            <span style={{ color: "#455a64", fontSize: "0.85rem", fontWeight: 500 }}>
              Averages
            </span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart
          data={dataWithSLA}
          margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eceff1" />
          <XAxis
            dataKey="date"
            tickFormatter={v => formatDateLabel(v, dense)}
            tick={{ fill: "#546e7a", fontSize: dense ? 10 : 12, fontWeight: 500 }}
            axisLine={{ stroke: "#eceff1" }}
            tickLine={false}
            padding={{ left: 5, right: 5 }}
            interval={dense ? Math.ceil(dataWithSLA.length / 14) - 1 : 0}
            minTickGap={dense ? 10 : 0}
            angle={dense ? -35 : 0}
            height={dense ? 50 : 30}
          />
          <YAxis
            tick={{ fill: "#546e7a", fontSize: 12, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
            width={35}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#263238",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              boxShadow: "0 6px 16px rgba(0,0,0,0.2)",
              padding: "12px 16px",
              fontSize: "0.9rem",
              minWidth: 180,
            }}
            itemStyle={{ color: "#fff" }}
            labelStyle={{ fontWeight: 600, marginBottom: 8 }}
            labelFormatter={value => formatDateLabel(value)}
            formatter={(value, name) => {
              if (name === "count") return [`${value} Tickets`, "New Tickets"];
              if (name === "slaBreached") return [`${value} Tickets`, "SLA Breached"];
              return [value, name];
            }}
          />
          {/* Reference line for ticket average */}
          <ReferenceLine
            y={ticketAvg}
            stroke="#1976d2"
            strokeDasharray="3 3"
            strokeWidth={1.5}
            strokeOpacity={0.5}
          />
          {/* Reference line for SLA breach average */}
          <ReferenceLine
            y={slaAvg}
            stroke="#d32f2f"
            strokeDasharray="3 3"
            strokeWidth={1.5}
            strokeOpacity={0.5}
          />
          {/* New Tickets line */}
          <Line
            type="monotone"
            dataKey="count"
            name="New Tickets"
            stroke="#1976d2"
            strokeWidth={2.5}
            dot={dense ? false : {
              fill: "#1976d2",
              strokeWidth: 2,
              r: 5,
              stroke: "#fff",
            }}
            activeDot={dense ? false : {
              fill: "#1976d2",
              strokeWidth: 2,
              r: 7,
              stroke: "#fff",
            }}
            isAnimationActive={false}
          />
          {/* SLA Breached line */}
          <Line
            type="monotone"
            dataKey="slaBreached"
            name="SLA Breached"
            stroke="#d32f2f"
            strokeWidth={2.5}
            dot={dense ? false : {
              fill: "#d32f2f",
              strokeWidth: 2,
              r: 5,
              stroke: "#fff",
            }}
            activeDot={dense ? false : {
              fill: "#d32f2f",
              strokeWidth: 2,
              r: 7,
              stroke: "#fff",
            }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
      {/* </ResponsiveContainer> */}
    </div>
  );
};

export default TicketTrendChart;