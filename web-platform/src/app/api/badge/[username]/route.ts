import { NextRequest, NextResponse } from "next/server";

interface VerifiedProject {
  score?: number;
  tier?: string;
}

interface ProfileResponse {
  verifiedProjects: VerifiedProject[];
}

const TIER_COLORS: Record<string, string> = {
  ELITE: "#a855f7",
  ADVANCED: "#3b82f6",
  INTERMEDIATE: "#10b981",
  BASIC: "#737373",
};

const CACHE_HEADERS = {
  "Content-Type": "image/svg+xml",
  "Cache-Control":
    "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
};

function measureText(text: string): number {
  return text.length * 6.5;
}

function renderBadge(label: string, value: string, valueColor: string): string {
  const labelWidth = measureText(label) + 20;
  const valueWidth = measureText(value) + 20;
  const totalWidth = labelWidth + valueWidth;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20">
  <defs>
    <linearGradient id="smooth" x2="0" y2="100%">
      <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
      <stop offset="1" stop-opacity=".1"/>
    </linearGradient>
    <clipPath id="round">
      <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
    </clipPath>
  </defs>
  <g clip-path="url(#round)">
    <rect width="${labelWidth}" height="20" fill="#555"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="20" fill="${valueColor}"/>
    <rect width="${totalWidth}" height="20" fill="url(#smooth)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110">
    <text x="${(labelWidth / 2) * 10}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)">${label}</text>
    <text x="${(labelWidth / 2) * 10}" y="140" transform="scale(.1)">${label}</text>
    <text x="${(labelWidth + valueWidth / 2) * 10}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)">${value}</text>
    <text x="${(labelWidth + valueWidth / 2) * 10}" y="140" transform="scale(.1)">${value}</text>
  </g>
</svg>`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  try {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const res = await fetch(
      `${apiUrl}/api/users/profile/${encodeURIComponent(username)}`,
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) {
      const svg = renderBadge("DevProof", "no data", "#737373");
      return new NextResponse(svg, { status: 200, headers: CACHE_HEADERS });
    }

    const data: ProfileResponse = await res.json();

    let bestScore = 0;
    let bestTier = "BASIC";

    for (const project of data.verifiedProjects ?? []) {
      const score = project.score ?? 0;
      if (score > bestScore) {
        bestScore = score;
        bestTier = project.tier ?? "BASIC";
      }
    }

    const tierUpper = bestTier.toUpperCase();
    const color = TIER_COLORS[tierUpper] ?? TIER_COLORS.BASIC;
    const value =
      data.verifiedProjects?.length > 0
        ? `${tierUpper} ${bestScore}`
        : "no data";
    const valueColor =
      data.verifiedProjects?.length > 0 ? color : "#737373";

    const svg = renderBadge("DevProof", value, valueColor);
    return new NextResponse(svg, { status: 200, headers: CACHE_HEADERS });
  } catch {
    const svg = renderBadge("DevProof", "no data", "#737373");
    return new NextResponse(svg, { status: 200, headers: CACHE_HEADERS });
  }
}
