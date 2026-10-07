import { InfrastructureArchitecture } from '../types/infrastructure';
import { simulateArchitecture } from './engine';

export interface WorkloadTimeSeriesPoint {
  day: number;
  dateStr: string;
  historicalRps: number;
  projectedRps: number;
  upperConfidenceRps: number;
  lowerConfidenceRps: number;
  cpuProjectedPct: number;
  iopsProjectedPct: number;
  isBreached: boolean;
}

export interface CapacityForecastResult {
  currentRps: number;
  growthRatePctPerMonth: number;
  daysToCpuSaturation: number;
  daysToIopsSaturation: number;
  daysToMemorySaturation: number;
  earliestExhaustionDays: number;
  exhaustionComponent: string;
  recommendedActionDate: string;
  timeSeries: WorkloadTimeSeriesPoint[];
  sensitivityCoefficients: {
    rpsToCpuElasticity: number;
    rpsToLatencyElasticity: number;
    cacheHitToDbLoadReduction: number;
  };
}

export function generateCapacityForecast(
  arch: InfrastructureArchitecture,
  monthlyGrowthRatePct: number = 18.5
): CapacityForecastResult {
  const currentSim = simulateArchitecture(arch);
  const baseRps = arch.traffic.ingressRps;
  const dailyGrowthRate = Math.pow(1 + monthlyGrowthRatePct / 100, 1 / 30) - 1;

  const timeSeries: WorkloadTimeSeriesPoint[] = [];
  const today = new Date('2026-10-06T00:00:00Z');

  let daysToCpuSaturation = 999;
  let daysToIopsSaturation = 999;
  let daysToMemorySaturation = 999;

  for (let day = -14; day <= 30; day++) {
    const curDate = new Date(today);
    curDate.setDate(today.getDate() + day);
    const dateStr = curDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    // Historical (-14 to 0) has diurnal sinusoidal variance
    const seasonality = 1.0 + 0.12 * Math.sin((day * 2 * Math.PI) / 7);
    const growthFactor = Math.pow(1 + dailyGrowthRate, day);
    const projected = Math.round(baseRps * growthFactor * seasonality);
    const variance = projected * 0.08;

    const histVal = day <= 0 ? Math.round(projected + (Math.sin(day * 4.3) * 0.05 * projected)) : 0;

    // Simulate architecture at this projected load
    const tempArch = JSON.parse(JSON.stringify(arch));
    tempArch.traffic.ingressRps = projected;
    const simPoint = simulateArchitecture(tempArch);

    if (day > 0) {
      if (simPoint.capacity.cpuUtilizationPct >= 85 && daysToCpuSaturation === 999) {
        daysToCpuSaturation = day;
      }
      if (simPoint.capacity.iopsUtilizationPct >= 85 && daysToIopsSaturation === 999) {
        daysToIopsSaturation = day;
      }
      if (simPoint.capacity.memoryUtilizationPct >= 90 && daysToMemorySaturation === 999) {
        daysToMemorySaturation = day;
      }
    }

    timeSeries.push({
      day,
      dateStr,
      historicalRps: histVal,
      projectedRps: projected,
      upperConfidenceRps: Math.round(projected + variance * (1 + Math.max(0, day) * 0.03)),
      lowerConfidenceRps: Math.round(Math.max(0, projected - variance * (1 + Math.max(0, day) * 0.03))),
      cpuProjectedPct: simPoint.capacity.cpuUtilizationPct,
      iopsProjectedPct: simPoint.capacity.iopsUtilizationPct,
      isBreached: simPoint.capacity.cpuUtilizationPct >= 85 || simPoint.capacity.iopsUtilizationPct >= 85,
    });
  }

  const earliestExhaustionDays = Math.min(daysToCpuSaturation, daysToIopsSaturation, daysToMemorySaturation);
  let exhaustionComponent = 'None (Safe > 30 days)';
  if (earliestExhaustionDays === daysToCpuSaturation && daysToCpuSaturation !== 999) {
    exhaustionComponent = 'Compute CPU Cores (85% safe threshold)';
  } else if (earliestExhaustionDays === daysToIopsSaturation && daysToIopsSaturation !== 999) {
    exhaustionComponent = 'Database Provisioned IOPS';
  } else if (earliestExhaustionDays === daysToMemorySaturation && daysToMemorySaturation !== 999) {
    exhaustionComponent = 'Instance RAM / Working Set';
  }

  const targetActionDate = new Date(today);
  const actionLeadDays = Math.max(3, earliestExhaustionDays - 7);
  targetActionDate.setDate(today.getDate() + (earliestExhaustionDays === 999 ? 30 : actionLeadDays));
  const recommendedActionDate = targetActionDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return {
    currentRps: baseRps,
    growthRatePctPerMonth: monthlyGrowthRatePct,
    daysToCpuSaturation,
    daysToIopsSaturation,
    daysToMemorySaturation,
    earliestExhaustionDays,
    exhaustionComponent,
    recommendedActionDate,
    timeSeries,
    sensitivityCoefficients: {
      rpsToCpuElasticity: +(currentSim.capacity.cpuUtilizationPct / baseRps).toFixed(5),
      rpsToLatencyElasticity: +(currentSim.performance.p95LatencyMs / baseRps).toFixed(5),
      cacheHitToDbLoadReduction: 0.88,
    },
  };
}
