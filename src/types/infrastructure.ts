export type NodeType = 'compute' | 'database' | 'cache' | 'queue' | 'storage';

export type RolePersona =
  | 'solutions-architect'
  | 'sre'
  | 'devops'
  | 'cloud-engineer'
  | 'datacenter-engineer'
  | 'platform-engineer'
  | 'data-scientist'
  | 'applied-scientist';

export interface ComputeNode {
  id: string;
  name: string;
  role: 'api' | 'worker' | 'ingestion' | 'ml-inference';
  vCpuPerInstance: number;
  ramGbPerInstance: number;
  instances: number;
  unitCostPerHour: number;
  powerWattsPerUnit: number;
  maxQpsPerInstance: number;
  rackId: string;
  regionId: string;
}

export interface DatabaseNode {
  id: string;
  name: string;
  engine: 'postgres' | 'mysql' | 'dynamodb' | 'spanner' | 'mongodb';
  primaryInstances: number;
  readReplicas: number;
  storageGb: number;
  iopsProvisioned: number;
  unitCostPerHour: number;
  maxReadQps: number;
  maxWriteQps: number;
  replicationMode: 'sync' | 'async';
  replicationLagMs: number;
  powerWatts: number;
  rackId: string;
  regionId: string;
}

export interface CacheNode {
  id: string;
  name: string;
  engine: 'redis' | 'memcached';
  nodes: number;
  ramGbPerNode: number;
  unitCostPerHour: number;
  hitRateTarget: number; // 0.0 - 1.0 (e.g. 0.85)
  powerWatts: number;
  rackId: string;
  regionId: string;
  enabled: boolean;
}

export interface QueueNode {
  id: string;
  name: string;
  engine: 'kafka' | 'sqs' | 'rabbitmq';
  partitions: number;
  throughputMsgPerSec: number;
  retentionHours: number;
  unitCostPerHour: number;
  powerWatts: number;
  rackId: string;
  regionId: string;
}

export interface StorageNode {
  id: string;
  name: string;
  type: 'object-s3' | 'block-ebs' | 'cold-archive';
  sizeTb: number;
  egressGbPerMonth: number;
  costPerGbMonth: number;
  durabilityNines: number; // e.g. 11 = 99.999999999%
  powerWatts: number;
  regionId: string;
}

export interface NetworkLink {
  id: string;
  sourceId: string;
  targetId: string;
  bandwidthGbps: number;
  baselineLatencyMs: number;
  packetLossPct: number;
  egressCostPerGb: number;
  crossRegion: boolean;
}

export interface Region {
  id: string;
  name: string;
  code: string;
  gridPowerCostKwh: number; // e.g. $0.12 / kWh
  carbonGramsKwh: number;   // e.g. 380 g CO2/kWh
  ambientTempC: number;     // e.g. 24°C
}

export interface Rack {
  id: string;
  code: string;
  regionId: string;
  coolingZoneId: string;
  maxPowerKw: number;       // e.g. 12 kW
  pduRedundancy: 'single' | 'dual-A/B';
  totalUHeight: number;     // e.g. 42U
}

export interface CoolingZone {
  id: string;
  regionId: string;
  name: string;
  maxCoolingTons: number;   // 1 ton = 12,000 BTU/hr
  coolingType: 'chilled-water' | 'direct-air-free' | 'hot-aisle-containment';
  targetPue: number;        // e.g. 1.22
}

export interface TrafficProfile {
  ingressRps: number;       // req/s
  readWriteRatio: number;   // 0.8 means 80% reads, 20% writes
  payloadSizeKb: number;    // average payload size
  burstMultiplier: number;  // 1.0 = normal, 3.0 = 3x burst
  trafficPattern: 'steady' | 'diurnal' | 'bursty' | 'black-friday';
  geoDistribution: Record<string, number>; // regionId -> percentage (sums to 1)
}

export interface InfrastructureArchitecture {
  id: string;
  name: string;
  description: string;
  regions: Region[];
  coolingZones: CoolingZone[];
  racks: Rack[];
  computeNodes: ComputeNode[];
  databaseNodes: DatabaseNode[];
  cacheNodes: CacheNode[];
  queueNodes: QueueNode[];
  storageNodes: StorageNode[];
  links: NetworkLink[];
  traffic: TrafficProfile;
  createdAt: string;
  updatedAt: string;
}

export interface SimulationCostBreakdown {
  hourlyTotal: number;
  monthlyTotal: number;
  annualTotal: number;
  computeCostMonth: number;
  databaseCostMonth: number;
  cacheCostMonth: number;
  queueCostMonth: number;
  storageCostMonth: number;
  networkEgressCostMonth: number;
  powerCostMonth: number;
}

export interface SimulationPerformance {
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  queueingDelayMs: number;
  networkHopLatencyMs: number;
  dbLatencyMs: number;
  cacheLookupLatencyMs: number;
  effectiveCacheHitRate: number;
  throughputHandledRps: number;
  droppedRequestsPct: number;
}

export interface SimulationCapacity {
  cpuUtilizationPct: number;
  cpuHeadroomPct: number;
  memoryUtilizationPct: number;
  memoryHeadroomPct: number;
  iopsUtilizationPct: number;
  iopsHeadroomPct: number;
  networkUtilizationPct: number;
  bottleneckNodeId: string | null;
  bottleneckNodeName: string | null;
  bottleneckReason: string | null;
}

export interface SimulationReliability {
  compositeAvailabilityPct: number; // e.g. 99.965
  availabilityNines: number;         // e.g. 3.4
  sloTargetPct: number;              // e.g. 99.9
  sloStatus: 'healthy' | 'at-risk' | 'breached';
  errorBudgetMinutesPerMonth: number;
  errorBudgetConsumedPct: number;
  mttrMinutes: number;
  singlePointsOfFailure: Array<{
    id: string;
    name: string;
    type: string;
    reason: string;
  }>;
  blastRadiusScore: number;          // 0 - 100
}

export interface SimulationDataCenter {
  itPowerDrawKw: number;
  facilityPowerDrawKw: number;       // IT Power * PUE
  pueEffective: number;
  totalBtuPerHour: number;
  coolingCapacityUsedPct: number;
  coolingHeadroomPct: number;
  carbonFootprintKgPerMonth: number;
  rackStatus: Array<{
    rackId: string;
    rackCode: string;
    regionCode: string;
    usedKw: number;
    maxKw: number;
    utilizationPct: number;
    isOverloaded: boolean;
    assignedUnitsU: number;
  }>;
}

export interface SimulationResult {
  cost: SimulationCostBreakdown;
  performance: SimulationPerformance;
  capacity: SimulationCapacity;
  reliability: SimulationReliability;
  dataCenter: SimulationDataCenter;
  mathematicalAssumptions: Array<{
    category: string;
    formula: string;
    explanation: string;
    currentValue: string;
  }>;
}

// Constraint Solver Interfaces
export interface SolverConstraints {
  maxCostMonthly: number;
  minAvailabilityPct: number;
  maxLatencyP95Ms: number;
  minCapacityHeadroomPct: number;
  maxPowerKw?: number;
  objective: 'cost-min' | 'performance-max' | 'reliability-max' | 'balanced' | 'carbon-min';
}

export interface SolverCandidate {
  id: string;
  title: string;
  score: number; // 0 - 100
  architecture: InfrastructureArchitecture;
  metrics: SimulationResult;
  isFeasible: boolean;
  violations: string[];
  reasoning: string;
  tradeoffs: string[];
  recommendedChanges: string[];
}

// Chaos Engineering / Failure Simulation
export type ChaosTriggerType =
  | 'node-failure'
  | 'rack-failure'
  | 'region-failure'
  | 'database-primary-failure'
  | 'network-degradation'
  | 'traffic-spike';

export interface ChaosStep {
  timeOffsetSec: number;
  headline: string;
  description: string;
  affectedComponents: string[];
  severity: 'nominal' | 'warning' | 'critical' | 'recovery';
  metricsSnapshot: {
    rps: number;
    p95LatencyMs: number;
    cpuUtilizationPct: number;
    errorRatePct: number;
    availabilityPct: number;
  };
}

export interface ChaosExperimentReport {
  triggerType: ChaosTriggerType;
  targetId: string;
  targetName: string;
  durationMinutes: number;
  steps: ChaosStep[];
  survived: boolean;
  sloBreached: boolean;
  mttrObservedMin: number;
  recoverySummary: string;
  architecturalHardeningRecommendations: string[];
}

// Audit history & Architecture Decision Record
export interface ArchitectureAuditEntry {
  id: string;
  timestamp: string;
  authorPersona: RolePersona;
  action: string;
  summary: string;
  deltaCost: number;
  deltaLatencyP95: number;
  deltaAvailability: number;
}

export interface ArchitectureDecisionRecord {
  id: string;
  title: string;
  status: 'Proposed' | 'Accepted' | 'Deprecated' | 'Superseded';
  author: string;
  date: string;
  context: string;
  decision: string;
  consequences: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
  metricsEvidence: {
    monthlyCost: string;
    p95Latency: string;
    availability: string;
    powerKw: string;
  };
}
