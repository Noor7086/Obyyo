import React from 'react';

interface SimpleChartProps {
  type: 'line' | 'bar';
  data: number[];
  labels: string[];
  title: string;
  color?: string;
}

const SimpleChart: React.FC<SimpleChartProps> = ({
  type,
  data,
  labels,
  title,
  color = '#6366f1'
}) => {
  // Ensure data has values and handle edge cases
  const validData = data.map(d => (isNaN(d) || d === null || d === undefined) ? 0 : d);
  const maxValue = Math.max(...validData, 0);
  const minValue = Math.min(...validData, 0);
  // Prevent division by zero if all values are the same
  const range = maxValue - minValue === 0 ? 1 : maxValue - minValue;

  const getY = (value: number) => {
    const defaultY = 200; // Bottom of chart
    if (isNaN(value)) return defaultY;
    const normalized = (value - minValue) / range;
    if (isNaN(normalized)) return defaultY;
    return 200 - (normalized * 200);
  };

  const getX = (index: number) => {
    if (data.length <= 1) return 200; // Center if only one point
    return (index / (data.length - 1)) * 400;
  };

  return (
    <div className="simple-chart">
      <h6 className="chart-title">{title}</h6>
      <div className={`chart-container ${type}-chart`}>
        {type === 'line' ? (
          <div className="line-chart">
            <svg viewBox="0 0 400 200" className="chart-svg">
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={color} stopOpacity="0.05" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map((percent, index) => (
                <line
                  key={index}
                  x1="0"
                  y1={`${percent}%`}
                  x2="100%"
                  y2={`${percent}%`}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                />
              ))}

              {/* Area fill */}
              {validData.length > 0 && (
                <path
                  d={`M 0,${getY(validData[0])} ${validData.map((value, index) =>
                    `L ${getX(index)},${getY(value)}`
                  ).join(' ')} L 400,200 L 0,200 Z`}
                  fill="url(#gradient)"
                />
              )}

              {/* Line */}
              {validData.length > 0 && (
                <path
                  d={`M 0,${getY(validData[0])} ${validData.map((value, index) =>
                    `L ${getX(index)},${getY(value)}`
                  ).join(' ')}`}
                  fill="none"
                  stroke={color}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Data points */}
              {validData.map((value, index) => (
                <circle
                  key={index}
                  cx={getX(index)}
                  cy={getY(value)}
                  r="4"
                  fill={color}
                  stroke="white"
                  strokeWidth="2"
                />
              ))}
            </svg>
          </div>
        ) : (
          <div className="bar-chart">
            <div className="bars-container">
              {validData.map((value, index) => (
                <div key={index} className="bar-item">
                  <div
                    className="bar"
                    style={{
                      height: `${(range === 0 ? 0 : ((value - minValue) / range) * 100)}%`,
                      backgroundColor: color
                    }}
                  ></div>
                  <span className="bar-label">{labels[index] || ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="chart-legend">
        {labels.map((label, index) => (
          <div key={index} className="legend-item">
            <span
              className="legend-color"
              style={{ backgroundColor: color }}
            ></span>
            <span className="legend-label">{label}</span>
            <span className="legend-value">{validData[index] ?? 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimpleChart;
