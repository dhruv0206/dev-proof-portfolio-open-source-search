import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const TIER_COLORS: Record<string, string> = {
  ELITE: '#a855f7',
  ADVANCED: '#3b82f6',
  INTERMEDIATE: '#10b981',
  BASIC: '#737373',
};

interface Profile {
  name: string | null;
  username: string;
  avatarUrl: string | null;
}

interface Stats {
  verifiedPRs: number;
  repositories: number;
  linesAdded: number;
  linesRemoved: number;
}

interface VerifiedProject {
  name: string;
  score?: number;
  tier?: string;
  discipline?: string;
  stack: {
    languages: string[];
    frameworks: string[];
    libs: string[];
  };
}

interface ProfileData {
  profile: Profile;
  stats: Stats;
  verifiedProjects: VerifiedProject[];
}

function collectSkills(projects: VerifiedProject[]): string[] {
  const seen = new Set<string>();
  const skills: string[] = [];

  for (const project of projects) {
    for (const lang of project.stack.languages) {
      const normalized = lang.trim();
      if (normalized && !seen.has(normalized.toLowerCase())) {
        seen.add(normalized.toLowerCase());
        skills.push(normalized);
      }
      if (skills.length >= 5) return skills;
    }
    for (const fw of project.stack.frameworks) {
      const normalized = fw.trim();
      if (normalized && !seen.has(normalized.toLowerCase())) {
        seen.add(normalized.toLowerCase());
        skills.push(normalized);
      }
      if (skills.length >= 5) return skills;
    }
  }

  return skills;
}

function getBestProject(projects: VerifiedProject[]): VerifiedProject | null {
  if (projects.length === 0) return null;

  let best: VerifiedProject | null = null;
  let bestScore = -1;

  for (const project of projects) {
    const score = project.score ?? 0;
    if (score > bestScore) {
      bestScore = score;
      best = project;
    }
  }

  return best;
}

function renderFallback(username: string): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          backgroundColor: '#0a0a0a',
          padding: '60px',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: '48px',
            fontWeight: 700,
            color: '#ffffff',
            marginBottom: '24px',
          }}
        >
          DevProof
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: '24px',
            color: '#a1a1aa',
          }}
        >
          @{username.slice(0, 40)}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control':
          'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
        'Content-Type': 'image/png',
      },
    }
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
): Promise<ImageResponse> {
  const { username } = await params;

  let data: ProfileData;

  try {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const res = await fetch(
      `${apiUrl}/api/users/profile/${encodeURIComponent(username)}`,
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) {
      return renderFallback(username);
    }

    data = (await res.json()) as ProfileData;
  } catch {
    return renderFallback(username);
  }

  const { profile, stats, verifiedProjects } = data;
  const bestProject = getBestProject(verifiedProjects);
  const skills = collectSkills(verifiedProjects);

  const tierLabel = bestProject?.tier?.toUpperCase() ?? '';
  const tierColor = TIER_COLORS[tierLabel] ?? TIER_COLORS.BASIC;
  const bestScore = bestProject?.score ?? 0;

  const displayName = (profile.name ?? profile.username).slice(0, 30);
  const handle = `@${profile.username.slice(0, 30)}`;

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          backgroundColor: '#0a0a0a',
          padding: '60px',
        }}
      >
        {/* Top row: brand + tier badge */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: '32px',
              fontWeight: 700,
              color: '#ffffff',
            }}
          >
            DevProof
          </div>

          {bestProject && tierLabel ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: tierColor,
                borderRadius: '9999px',
                padding: '8px 20px',
                fontSize: '16px',
                fontWeight: 600,
                color: '#ffffff',
              }}
            >
              {tierLabel} · {bestScore}
            </div>
          ) : (
            <div style={{ display: 'flex' }} />
          )}
        </div>

        {/* Middle section: avatar + name */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: '40px',
          }}
        >
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              width={80}
              height={80}
              style={{
                borderRadius: '50%',
                marginRight: '20px',
              }}
            />
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: '#3b82f6',
                marginRight: '20px',
                fontSize: '36px',
                fontWeight: 700,
                color: '#ffffff',
              }}
            >
              {(profile.name ?? profile.username).charAt(0).toUpperCase()}
            </div>
          )}

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                display: 'flex',
                fontSize: '28px',
                fontWeight: 700,
                color: '#ffffff',
              }}
            >
              {displayName}
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: '16px',
                color: '#a1a1aa',
                marginTop: '4px',
              }}
            >
              {handle}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            marginTop: '40px',
            gap: '24px',
          }}
        >
          {[
            { value: stats.verifiedPRs, label: 'Verified PRs' },
            { value: stats.repositories, label: 'Repositories' },
            { value: verifiedProjects.length, label: 'Projects' },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#141414',
                borderRadius: '12px',
                padding: '16px 32px',
                minWidth: '180px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  fontSize: '24px',
                  fontWeight: 700,
                  color: '#ffffff',
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  display: 'flex',
                  fontSize: '14px',
                  color: '#a1a1aa',
                  marginTop: '4px',
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Skills row */}
        {skills.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              marginTop: '28px',
              gap: '10px',
              flexWrap: 'wrap',
            }}
          >
            {skills.map((skill) => (
              <div
                key={skill}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#1a1a2e',
                  borderRadius: '9999px',
                  padding: '6px 16px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#10b981',
                }}
              >
                {skill.slice(0, 20)}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-end',
            alignItems: 'flex-end',
            flexGrow: 1,
            width: '100%',
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: '14px',
              color: '#a1a1aa',
            }}
          >
            orenda.vision/p/{profile.username.slice(0, 30)}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control':
          'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
        'Content-Type': 'image/png',
      },
    }
  );
}
