export type Cage = {
  id: number;
  status: "critical" | "low";
  risk: number;
  dissolvedOxygen: number;
  doTrend: "down" | "stable";
  temperature: number;
  ph: number;
  phTrend?: "down" | "stable";
  mortality: number;
  sparkline: number[];
};

export const cages: Cage[] = [
  {
    id: 1,
    status: "critical",
    risk: 8.7,
    dissolvedOxygen: 6.95,
    doTrend: "down",
    temperature: 11.2,
    ph: 6.88,
    phTrend: "down",
    mortality: 5.0,
    sparkline: [9.5, 9.3, 8.9, 8.4, 7.8, 7.3, 6.95],
  },
  { id: 2, status: "low", risk: 1.2, dissolvedOxygen: 9.6, doTrend: "stable", temperature: 11.0, ph: 7.3, mortality: 0.03, sparkline: [9.5, 9.6, 9.5, 9.6, 9.5, 9.6, 9.6] },
  { id: 3, status: "low", risk: 2.1, dissolvedOxygen: 9.4, doTrend: "stable", temperature: 11.1, ph: 7.2, mortality: 0.03, sparkline: [9.3, 9.4, 9.5, 9.4, 9.3, 9.4, 9.4] },
  { id: 4, status: "low", risk: 1.8, dissolvedOxygen: 9.5, doTrend: "stable", temperature: 10.9, ph: 7.4, mortality: 0.02, sparkline: [9.5, 9.4, 9.5, 9.6, 9.5, 9.5, 9.5] },
  { id: 5, status: "low", risk: 3.5, dissolvedOxygen: 9.1, doTrend: "stable", temperature: 11.3, ph: 7.1, mortality: 0.04, sparkline: [9.2, 9.1, 9.1, 9.0, 9.1, 9.2, 9.1] },
  { id: 6, status: "low", risk: 2.7, dissolvedOxygen: 9.8, doTrend: "stable", temperature: 11.0, ph: 7.3, mortality: 0.03, sparkline: [9.7, 9.8, 9.7, 9.8, 9.9, 9.8, 9.8] },
];
