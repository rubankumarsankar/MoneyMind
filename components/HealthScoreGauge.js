"use client";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function HealthScoreGauge({ score, riskLevel }) {
  const data = {
    labels: ["Score", "Remaining"],
    datasets: [
      {
        data: [score, 100 - score],
        backgroundColor: [
          score >= 80 ? "#10b981" : score >= 60 ? "#fbbf24" : score >= 40 ? "#f97316" : "#ef4444",
          "#e5e7eb",
        ],
        borderWidth: 0,
        cutout: "80%",
        circumference: 180,
        rotation: 270,
      },
    ],
  };

  const options = {
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    maintainAspectRatio: false,
  };

  return (
    <div className="relative h-48 w-full flex flex-col items-center justify-center">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center mt-6">
            <h2 className="text-4xl font-bold">{score}</h2>
            <p className={`text-sm font-semibold ${
                score >= 80 ? "text-green-500" : score >= 60 ? "text-yellow-500" : score >= 40 ? "text-orange-500" : "text-red-500"
            }`}>{riskLevel}</p>
        </div>
        <div className="w-full h-full">
            <Doughnut data={data} options={options} />
        </div>
    </div>
  );
}
