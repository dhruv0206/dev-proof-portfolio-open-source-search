// Pure utility functions for the public profile page.
// No React, no hooks — just data transformation.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProjectData {
  name: string;
  score?: number;
  tier?: string;
  discipline?: string;
  scoreBreakdown?: {
    feature_score: number;
    architecture_score: number;
    intent_score: number;
    forensics_score: number;
  };
}

export interface TechItem {
  name: string;
  category: "language" | "framework" | "library";
  count: number;
}

export interface ProjectWithStack {
  stack: {
    languages: string[];
    frameworks: string[];
    libs: string[];
  };
}

export interface ActivityDay {
  date: string; // 'YYYY-MM-DD'
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface ContributionInput {
  mergedAt: string | null;
}

// ---------------------------------------------------------------------------
// getBestProject
// ---------------------------------------------------------------------------

export function getBestProject(projects: ProjectData[]): ProjectData | null {
  let best: ProjectData | null = null;

  for (const project of projects) {
    if (project.score === undefined || project.score === 0) continue;
    if (best === null || project.score > (best.score as number)) {
      best = project;
    }
  }

  return best;
}

// ---------------------------------------------------------------------------
// aggregateTechStack
// ---------------------------------------------------------------------------

export function aggregateTechStack(projects: ProjectWithStack[]): TechItem[] {
  // Map from lowercased name -> { name (original casing), category, count }
  const seen = new Map<string, TechItem>();

  function addItems(
    items: string[],
    category: TechItem["category"],
  ): void {
    for (const item of items) {
      const key = item.toLowerCase();
      const existing = seen.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        seen.set(key, { name: item, category, count: 1 });
      }
    }
  }

  for (const project of projects) {
    addItems(project.stack.languages, "language");
    addItems(project.stack.frameworks, "framework");
    addItems(project.stack.libs, "library");
  }

  const result = Array.from(seen.values());

  result.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.name.localeCompare(b.name);
  });

  return result;
}

// ---------------------------------------------------------------------------
// buildActivityData
// ---------------------------------------------------------------------------

function getActivityLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count <= 4) return 3;
  return 4;
}

function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function buildActivityData(
  contributions: ContributionInput[],
  months: number = 12,
): ActivityDay[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(today);
  start.setMonth(start.getMonth() - months);

  // Count contributions per day
  const countsByDate = new Map<string, number>();

  for (const contribution of contributions) {
    if (contribution.mergedAt === null) continue;

    const merged = new Date(contribution.mergedAt);
    merged.setHours(0, 0, 0, 0);

    if (merged < start || merged > today) continue;

    const key = formatDate(merged);
    countsByDate.set(key, (countsByDate.get(key) ?? 0) + 1);
  }

  // Generate contiguous date entries from start to today (inclusive)
  const result: ActivityDay[] = [];
  const cursor = new Date(start);

  while (cursor <= today) {
    const key = formatDate(cursor);
    const count = countsByDate.get(key) ?? 0;
    result.push({ date: key, count, level: getActivityLevel(count) });
    cursor.setDate(cursor.getDate() + 1);
  }

  return result;
}
