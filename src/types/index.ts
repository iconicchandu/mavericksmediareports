export interface DataRecord {
  subid: string;
  revenue: number;
  campaign: string;
  creative: string;
  et: string;
  advertiser: string;
  fileName: string;
  conv?: number; // Optional conversion count from CONV column
}

export interface ProcessedData {
  records: DataRecord[];
  campaigns: Set<string>;
  ets: Set<string>;
  creatives: Set<string>;
  advertisers: Set<string>;
}

export interface CreativeStats {
  name: string;
  frequency: number;
  revenue: number;
  ets: string[];
}

export interface AdvertiserStats {
  name: string;
  revenue: number;
  campaigns: string[];
  frequency?: number; // Total count/frequency (sum of CONV values)
}

export interface CampaignStats {
  name: string;
  revenue: number;
  creatives: CreativeStats[];
  ets: string[];
}

export interface ETStats {
  name: string;
  revenue: number;
  creatives: CreativeStats[];
  campaigns: string[];
  advertisers: Map<string, number>; // 👈 add this
  advertisersArray?: { name: string; revenue: number }[]; // 👈 optional, for UI
}