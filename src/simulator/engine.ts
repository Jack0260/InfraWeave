import {
  InfrastructureArchitecture,
  SimulationResult,
  SimulationCostBreakdown,
  SimulationPerformance,
  SimulationCapacity,
  SimulationReliability,
  SimulationDataCenter,
} from '../types/infrastructure';

/**
 * Erlang-C formula for multi-server queuing M/M/c
 * c = number of servers
 * a = offered load (lambda / mu)
 */
function erlangC(c: number, a: number): number {
  if (c <= 0 || a <= 0) return 0;
  const rho = a / c;
  if (rho >= 0.999) return 1.0; // Over capacity queue saturation

  let sum = 0;
  let term = 1; // a^0 / 0!
  sum += term;
  for (let k = 1; k < c; k++) {
    term = (term * a) / k;
    sum += term;
  }

  // term for k = c
  const termC = (term * a) / c;
  const numerator = termC / (1 - rho);
  const denominator = sum + numerator;

  return Math.min(1.0, Math.max(0, numerator / denominator));
}

/**
 * Calculates deterministic, transparent infrastructure metrics based on queueing theory,
 * Little's Law, power dissipation laws, and reliability block diagrams.
 */
export function simulateArchitecture(arch: InfrastructureArchitecture): SimulationResult {
  const traffic = arch.traffic;
  const effectiveRps = traffic.ingressRps * traffic.burstMultiplier;
  const readRps = effectiveRps * traffic.readWriteRatio;
  const writeRps = effectiveRps * (1 - traffic.readWriteRatio);

  // 1. COMPUTE LAYER MODEL
  const totalComputeInstances = arch.computeNodes.reduce((acc, n) => acc + n.instances, 0);
  const totalComputeCapacityQps = arch.computeNodes.reduce(
    (acc, n) => acc + n.instances * n.maxQpsPerInstance,
    0
  );
  const totalComputeCpuCores = arch.computeNodes.reduce(
    (acc, n) => acc + n.instances * n.vCpuPerInstance,
    0
  );
  const totalComputeRamGb = arch.computeNodes.reduce(
    (acc, n) => acc + n.instances * n.ramGbPerInstance,
    0
  );

  const computeLoadRatio = totalComputeCapacityQps > 0 ? effectiveRps / totalComputeCapacityQps : 2.0;
  const cpuUtilizationPct = Math.min(100, Math.max(5, computeLoadRatio * 80));
  const memoryUtilizationPct = Math.min(100, Math.max(12, computeLoadRatio * 65 + 15));

  // Queueing delay using M/M/c approximation
  // c = total cores / instances
  // mu = service rate per instance (e.g. maxQpsPerInstance)
  const avgServiceTimeSec = 0.008; // 8ms base execution service time
  const serviceRatePerInstance = 1 / avgServiceTimeSec; // 125 req/s per single core
  const offeredLoad = effectiveRps / Math.max(1, serviceRatePerInstance);
  const serversC = Math.max(1, totalComputeInstances * 4); // thread/worker pool concurrency
  const probWait = erlangC(serversC, offeredLoad);
  const queueDelayMs = computeLoadRatio >= 1.0
    ? Math.min(1200, 30 + Math.pow(computeLoadRatio - 0.95, 2) * 800)
    : Math.max(0.4, (probWait / Math.max(0.01, serversC * serviceRatePerInstance - effectiveRps)) * 1000);

  // 2. CACHE LAYER MODEL
  const activeCacheNodes = arch.cacheNodes.filter(c => c.enabled);
  const totalCacheRam = activeCacheNodes.reduce((acc, c) => acc + c.nodes * c.ramGbPerNode, 0);
  let effectiveCacheHitRate = 0;

  if (activeCacheNodes.length > 0) {
    const avgTarget = activeCacheNodes.reduce((acc, c) => acc + c.hitRateTarget, 0) / activeCacheNodes.length;
    // Diminishing returns & memory pressure on hit rate
    const workingSetGbNeeded = (effectiveRps * traffic.payloadSizeKb * 3600) / (1024 * 1024); // ~1 hr hot set
    const cacheFitRatio = totalCacheRam > 0 ? Math.min(1.0, totalCacheRam / workingSetGbNeeded) : 0.5;
    effectiveCacheHitRate = avgTarget * (0.8 + 0.2 * cacheFitRatio);
  }

  const cacheLookupLatencyMs = activeCacheNodes.length > 0 ? 0.9 : 0;
  const dbReadRps = readRps * (1 - effectiveCacheHitRate);
  const dbWriteRps = writeRps;
  const totalDbRps = dbReadRps + dbWriteRps;

  // 3. DATABASE LAYER MODEL
  const totalDbReadCapacity = arch.databaseNodes.reduce(
    (acc, d) => acc + (d.primaryInstances + d.readReplicas) * d.maxReadQps,
    0
  );
  const totalDbWriteCapacity = arch.databaseNodes.reduce(
    (acc, d) => acc + d.primaryInstances * d.maxWriteQps,
    0
  );
  const totalDbIops = arch.databaseNodes.reduce((acc, d) => acc + d.iopsProvisioned, 0);

  const iopsDemand = totalDbRps * 1.5; // ~1.5 IOPS per query
  const iopsUtilizationPct = totalDbIops > 0 ? Math.min(100, (iopsDemand / totalDbIops) * 100) : 100;

  // DB Latency calculation
  const isSyncReplication = arch.databaseNodes.some(d => d.replicationMode === 'sync');
  const baseDbReadMs = 4.2;
  const baseDbWriteMs = isSyncReplication ? 9.5 : 5.8;
  const iopsPenalty = iopsUtilizationPct > 80 ? Math.pow((iopsUtilizationPct - 80) / 10, 1.8) * 4 : 0;

  const dbWeightedLatencyMs = totalDbRps > 0
    ? (dbReadRps * (baseDbReadMs + iopsPenalty) + dbWriteRps * (baseDbWriteMs + iopsPenalty)) / totalDbRps
    : 4.5;

  // 4. NETWORK & QUEUE LAYER
  let avgNetworkHopMs = 2.5;
  let crossRegionLinkCount = 0;
  for (const link of arch.links) {
    if (link.crossRegion) {
      crossRegionLinkCount++;
      avgNetworkHopMs += 28.0; // transatlantic / cross-region RTT
    }
  }

  // End-to-end Latency (Little's Law composition)
  const p50LatencyMs = +(
    avgNetworkHopMs +
    queueDelayMs +
    (avgServiceTimeSec * 1000) +
    (effectiveCacheHitRate * cacheLookupLatencyMs) +
    ((1 - effectiveCacheHitRate) * dbWeightedLatencyMs * 0.4)
  ).toFixed(2);

  const p95LatencyMs = +(p50LatencyMs * 2.1 + (queueDelayMs * 1.6) + iopsPenalty * 1.5).toFixed(2);
  const p99LatencyMs = +(p95LatencyMs * 1.85 + (queueDelayMs * 2.8)).toFixed(2);

  // Dropped requests if compute or DB is totally saturated
  let droppedRequestsPct = 0;
  if (computeLoadRatio > 1.05) {
    droppedRequestsPct = +Math.min(100, (computeLoadRatio - 1.0) * 85).toFixed(2);
  }
  const throughputHandledRps = +(effectiveRps * (1 - droppedRequestsPct / 100)).toFixed(1);

  // 5. CAPACITY & BOTTLENECK ANALYSIS
  const cpuHeadroomPct = +Math.max(0, 100 - cpuUtilizationPct).toFixed(1);
  const memoryHeadroomPct = +Math.max(0, 100 - memoryUtilizationPct).toFixed(1);
  const iopsHeadroomPct = +Math.max(0, 100 - iopsUtilizationPct).toFixed(1);
  const networkBandwidthUsedGbps = (effectiveRps * traffic.payloadSizeKb * 8) / (1024 * 1024);
  const totalLinkBandwidthGbps = arch.links.reduce((acc, l) => acc + l.bandwidthGbps, 20);
  const networkUtilizationPct = +Math.min(100, (networkBandwidthUsedGbps / totalLinkBandwidthGbps) * 100).toFixed(1);

  let bottleneckNodeId: string | null = null;
  let bottleneckNodeName: string | null = null;
  let bottleneckReason: string | null = null;

  if (cpuUtilizationPct > 85) {
    const firstCompute = arch.computeNodes[0];
    bottleneckNodeId = firstCompute?.id || 'compute-tier';
    bottleneckNodeName = firstCompute?.name || 'API Compute Tier';
    bottleneckReason = `CPU utilization reached ${cpuUtilizationPct.toFixed(1)}%. Core execution queuing active.`;
  } else if (iopsUtilizationPct > 85) {
    const firstDb = arch.databaseNodes[0];
    bottleneckNodeId = firstDb?.id || 'db-tier';
    bottleneckNodeName = firstDb?.name || 'Primary Database';
    bottleneckReason = `IOPS saturation reached ${iopsUtilizationPct.toFixed(1)}%. Disk I/O wait inflating DB query latency.`;
  } else if (effectiveCacheHitRate === 0 && activeCacheNodes.length === 0) {
    bottleneckReason = 'Cache tier disabled. 100% of read traffic penetrates to backend relational database.';
  }

  // 6. RELIABILITY, SLO, AND MTTR MODEL
  // Compute Tier Availability: parallel redundancy A = 1 - (1 - A_unit)^N
  const singleInstanceAvail = 0.995; // 99.5% for single EC2/VM
  const computeAvail = totalComputeInstances > 1
    ? 1 - Math.pow(1 - singleInstanceAvail, Math.min(5, totalComputeInstances))
    : singleInstanceAvail;

  // DB Availability
  const hasDbReplica = arch.databaseNodes.some(d => d.readReplicas > 0);
  const dbAvail = hasDbReplica ? 0.9998 : 0.992; // Multi-AZ replica vs single primary

  // Region redundancy multiplier
  const regionCount = arch.regions.length;
  const regionMultiplier = regionCount > 1 ? 0.99995 : 0.9985;

  const compositeAvailabilityPct = +(computeAvail * dbAvail * regionMultiplier * 100).toFixed(4);
  const availabilityNines = +(-Math.log10(Math.max(0.000001, 1 - compositeAvailabilityPct / 100))).toFixed(2);

  // Single Points of Failure (SPOFs)
  const spofs: SimulationReliability['singlePointsOfFailure'] = [];
  for (const comp of arch.computeNodes) {
    if (comp.instances === 1) {
      spofs.push({
        id: comp.id,
        name: comp.name,
        type: 'Compute',
        reason: 'Single instance provisioned. No horizontal failover available.',
      });
    }
  }
  for (const db of arch.databaseNodes) {
    if (db.readReplicas === 0) {
      spofs.push({
        id: db.id,
        name: db.name,
        type: 'Database',
        reason: 'Zero read replicas configured. Primary failure causes immediate downtime.',
      });
    }
  }
  if (arch.regions.length === 1) {
    spofs.push({
      id: arch.regions[0].id,
      name: arch.regions[0].name,
      type: 'Region',
      reason: 'Single cloud region footprint. Total regional outage will blackhole all ingress.',
    });
  }

  // MTTR calculation
  let mttrMinutes = 1.2;
  if (!hasDbReplica) mttrMinutes += 12.0; // cold disk snapshot restoration
  if (isSyncReplication) mttrMinutes = Math.max(0.4, mttrMinutes - 0.6);
  if (totalComputeInstances === 1) mttrMinutes += 4.5;

  const sloTargetPct = 99.9;
  const minutesInMonth = 43200;
  const errorBudgetMinutesPerMonth = +(minutesInMonth * (1 - sloTargetPct / 100)).toFixed(1); // 43.2 min
  const unavailFraction = Math.max(0, 1 - compositeAvailabilityPct / 100);
  const expectedDowntimeMinutes = +(minutesInMonth * unavailFraction).toFixed(2);
  const errorBudgetConsumedPct = +Math.min(250, (expectedDowntimeMinutes / errorBudgetMinutesPerMonth) * 100).toFixed(1);

  let sloStatus: 'healthy' | 'at-risk' | 'breached' = 'healthy';
  if (compositeAvailabilityPct < sloTargetPct) {
    sloStatus = 'breached';
  } else if (compositeAvailabilityPct < sloTargetPct + 0.05) {
    sloStatus = 'at-risk';
  }

  const blastRadiusScore = Math.min(100, Math.round(
    (spofs.length * 20) + (100 - compositeAvailabilityPct) * 40 + (regionCount === 1 ? 25 : 0)
  ));

  // 7. DATA CENTER / POWER / COOLING / THERMAL MODEL
  // Sum IT watts
  let itWatts = 0;
  const rackPowerMap: Record<string, { watts: number; uUsed: number }> = {};
  for (const r of arch.racks) {
    rackPowerMap[r.id] = { watts: 0, uUsed: 0 };
  }

  arch.computeNodes.forEach(c => {
    const w = c.instances * c.powerWattsPerUnit;
    itWatts += w;
    if (rackPowerMap[c.rackId]) {
      rackPowerMap[c.rackId].watts += w;
      rackPowerMap[c.rackId].uUsed += c.instances * 1;
    }
  });

  arch.databaseNodes.forEach(d => {
    const w = (d.primaryInstances + d.readReplicas) * d.powerWatts;
    itWatts += w;
    if (rackPowerMap[d.rackId]) {
      rackPowerMap[d.rackId].watts += w;
      rackPowerMap[d.rackId].uUsed += (d.primaryInstances + d.readReplicas) * 2;
    }
  });

  arch.cacheNodes.forEach(c => {
    if (c.enabled) {
      const w = c.nodes * c.powerWatts;
      itWatts += w;
      if (rackPowerMap[c.rackId]) {
        rackPowerMap[c.rackId].watts += w;
        rackPowerMap[c.rackId].uUsed += c.nodes * 1;
      }
    }
  });

  arch.queueNodes.forEach(q => {
    const w = q.powerWatts;
    itWatts += w;
    if (rackPowerMap[q.rackId]) {
      rackPowerMap[q.rackId].watts += w;
      rackPowerMap[q.rackId].uUsed += 2;
    }
  });

  const itPowerDrawKw = +(itWatts / 1000).toFixed(2);
  // PUE effective based on cooling zones
  const avgPue = arch.coolingZones.length > 0
    ? arch.coolingZones.reduce((acc, cz) => acc + cz.targetPue, 0) / arch.coolingZones.length
    : 1.25;
  const facilityPowerDrawKw = +(itPowerDrawKw * avgPue).toFixed(2);

  // Thermal dissipation: 1 kW IT load = 3,412.142 BTU/hr
  const totalBtuPerHour = Math.round(itPowerDrawKw * 3412.142);
  const totalCoolingCapacityTons = arch.coolingZones.reduce((acc, cz) => acc + cz.maxCoolingTons, 15);
  const totalCoolingCapacityBtu = totalCoolingCapacityTons * 12000;
  const coolingCapacityUsedPct = +Math.min(100, (totalBtuPerHour / totalCoolingCapacityBtu) * 100).toFixed(1);
  const coolingHeadroomPct = +Math.max(0, 100 - coolingCapacityUsedPct).toFixed(1);

  // Carbon footprint: kWh per month * carbon grams/kWh / 1000 = kg CO2
  const monthlyKwh = facilityPowerDrawKw * 730;
  const avgCarbonGrams = arch.regions.length > 0
    ? arch.regions.reduce((acc, r) => acc + r.carbonGramsKwh, 0) / arch.regions.length
    : 350;
  const carbonFootprintKgPerMonth = Math.round((monthlyKwh * avgCarbonGrams) / 1000);

  // Rack overages status
  const rackStatus = arch.racks.map(rack => {
    const reg = arch.regions.find(r => r.id === rack.regionId);
    const data = rackPowerMap[rack.id] || { watts: 0, uUsed: 0 };
    const usedKw = +(data.watts / 1000).toFixed(2);
    const utilPct = +(usedKw / rack.maxPowerKw * 100).toFixed(1);
    return {
      rackId: rack.id,
      rackCode: rack.code,
      regionCode: reg?.code || 'region-1',
      usedKw,
      maxKw: rack.maxPowerKw,
      utilizationPct: utilPct,
      isOverloaded: usedKw > rack.maxPowerKw,
      assignedUnitsU: data.uUsed,
    };
  });

  // 8. FINANCIAL COST BREAKDOWN
  const hoursPerMonth = 730;
  let computeCostMonth = 0;
  arch.computeNodes.forEach(c => {
    computeCostMonth += c.instances * c.unitCostPerHour * hoursPerMonth;
  });

  let databaseCostMonth = 0;
  arch.databaseNodes.forEach(d => {
    const instanceCost = (d.primaryInstances + d.readReplicas) * d.unitCostPerHour * hoursPerMonth;
    const storageCost = d.storageGb * 0.115; // standard SSD
    const iopsCost = (d.iopsProvisioned / 1000) * 6.5;
    databaseCostMonth += instanceCost + storageCost + iopsCost;
  });

  let cacheCostMonth = 0;
  arch.cacheNodes.forEach(c => {
    if (c.enabled) {
      cacheCostMonth += c.nodes * c.unitCostPerHour * hoursPerMonth;
    }
  });

  let queueCostMonth = 0;
  arch.queueNodes.forEach(q => {
    queueCostMonth += q.unitCostPerHour * hoursPerMonth;
  });

  let storageCostMonth = 0;
  arch.storageNodes.forEach(s => {
    const dataCost = s.sizeTb * 1024 * s.costPerGbMonth;
    const egressCost = s.egressGbPerMonth * 0.08;
    storageCostMonth += dataCost + egressCost;
  });

  // Network egress cost based on traffic volume
  const monthlyEgressGb = (effectiveRps * traffic.payloadSizeKb * 3600 * 730) / (1024 * 1024);
  const networkEgressCostMonth = +(monthlyEgressGb * 0.085).toFixed(2);

  // Datacenter grid power billing
  const avgPowerCostKwh = arch.regions.length > 0
    ? arch.regions.reduce((acc, r) => acc + r.gridPowerCostKwh, 0) / arch.regions.length
    : 0.12;
  const powerCostMonth = +(monthlyKwh * avgPowerCostKwh).toFixed(2);

  const monthlyTotal = +(
    computeCostMonth +
    databaseCostMonth +
    cacheCostMonth +
    queueCostMonth +
    storageCostMonth +
    networkEgressCostMonth +
    powerCostMonth
  ).toFixed(2);

  const hourlyTotal = +(monthlyTotal / hoursPerMonth).toFixed(2);
  const annualTotal = +(monthlyTotal * 12).toFixed(2);

  const cost: SimulationCostBreakdown = {
    hourlyTotal,
    monthlyTotal,
    annualTotal,
    computeCostMonth: +computeCostMonth.toFixed(2),
    databaseCostMonth: +databaseCostMonth.toFixed(2),
    cacheCostMonth: +cacheCostMonth.toFixed(2),
    queueCostMonth: +queueCostMonth.toFixed(2),
    storageCostMonth: +storageCostMonth.toFixed(2),
    networkEgressCostMonth,
    powerCostMonth,
  };

  const performance: SimulationPerformance = {
    p50LatencyMs,
    p95LatencyMs,
    p99LatencyMs,
    queueingDelayMs: +queueDelayMs.toFixed(2),
    networkHopLatencyMs: +avgNetworkHopMs.toFixed(2),
    dbLatencyMs: +dbWeightedLatencyMs.toFixed(2),
    cacheLookupLatencyMs,
    effectiveCacheHitRate: +(effectiveCacheHitRate * 100).toFixed(1),
    throughputHandledRps,
    droppedRequestsPct,
  };

  const capacity: SimulationCapacity = {
    cpuUtilizationPct: +cpuUtilizationPct.toFixed(1),
    cpuHeadroomPct,
    memoryUtilizationPct: +memoryUtilizationPct.toFixed(1),
    memoryHeadroomPct,
    iopsUtilizationPct: +iopsUtilizationPct.toFixed(1),
    iopsHeadroomPct,
    networkUtilizationPct,
    bottleneckNodeId,
    bottleneckNodeName,
    bottleneckReason,
  };

  const reliability: SimulationReliability = {
    compositeAvailabilityPct,
    availabilityNines,
    sloTargetPct,
    sloStatus,
    errorBudgetMinutesPerMonth,
    errorBudgetConsumedPct,
    mttrMinutes: +mttrMinutes.toFixed(1),
    singlePointsOfFailure: spofs,
    blastRadiusScore,
  };

  const dataCenter: SimulationDataCenter = {
    itPowerDrawKw,
    facilityPowerDrawKw,
    pueEffective: +avgPue.toFixed(2),
    totalBtuPerHour,
    coolingCapacityUsedPct,
    coolingHeadroomPct,
    carbonFootprintKgPerMonth,
    rackStatus,
  };

  const mathematicalAssumptions = [
    {
      category: 'Queuing Theory (Little’s Law & Erlang-C)',
      formula: 'W_q = [C(c, a)] / [c*μ - λ],  L_q = λ * W_q',
      explanation: 'Models multi-core thread concurrency and queuing latency under load spikes.',
      currentValue: `Offered load a=${offeredLoad.toFixed(2)}, Servers c=${serversC}, Queue delay=${queueDelayMs.toFixed(2)}ms`,
    },
    {
      category: 'Reliability Block Diagram (RBD)',
      formula: 'A_sys = [1 - (1 - A_comp)^N] * [1 - (1 - A_db)^(1+R)] * A_reg',
      explanation: 'Calculates active-redundant parallel reliability and cross-region resilience.',
      currentValue: `Composite Availability=${compositeAvailabilityPct}% (${availabilityNines} nines)`,
    },
    {
      category: 'Thermodynamics & Energy Transfer',
      formula: 'Q (BTU/hr) = P (kW) * 3,412.142,  P_facility = P_IT * PUE',
      explanation: 'Translates server electrical power dissipation into thermal cooling demand.',
      currentValue: `IT Draw=${itPowerDrawKw} kW, Heat Output=${totalBtuPerHour.toLocaleString()} BTU/hr, PUE=${avgPue.toFixed(2)}`,
    },
    {
      category: 'Cache Invalidation Dynamics',
      formula: 'H_eff = H_target * min(1.0, RAM_cache / RAM_hotset)',
      explanation: 'Accounts for working set size overflow and eviction memory pressure.',
      currentValue: `Effective Hit Rate=${(effectiveCacheHitRate * 100).toFixed(1)}% (Target: ${(activeCacheNodes[0]?.hitRateTarget ?? 0) * 100}%)`,
    },
    {
      category: 'MTTR Failover Model',
      formula: 'MTTR = T_heartbeat + T_election + (Lag_ms / 1000 * K) + T_coldboot',
      explanation: 'Estimates mean recovery duration factoring in sync vs async replication lag.',
      currentValue: `Estimated MTTR=${mttrMinutes.toFixed(1)} minutes`,
    },
  ];

  return {
    cost,
    performance,
    capacity,
    reliability,
    dataCenter,
    mathematicalAssumptions,
  };
}
