'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Building2, Globe, Twitter, Github, ExternalLink, Plus, Trash2, Briefcase, Linkedin, Clock, ChevronDown } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const ROLE_OPTIONS = [
    'Backend Engineer',
    'Frontend Engineer',
    'Fullstack Engineer',
    'Mobile Engineer',
    'AI/ML Engineer',
    'Data Scientist',
    'Data Engineer',
    'DevOps/SRE',
    'Security Engineer',
    'Embedded/Systems',
];

const WORK_TYPE_OPTIONS = [
    { value: 'remote', label: 'Remote' },
    { value: 'hybrid', label: 'Hybrid' },
    { value: 'onsite', label: 'Onsite' },
];

const EXPERIENCE_OPTIONS = [
    { value: '0-2', label: '0–2 years' },
    { value: '2-5', label: '2–5 years' },
    { value: '5-10', label: '5–10 years' },
    { value: '10+', label: '10+ years' },
];

const TIMEZONE_OPTIONS = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Sao_Paulo',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Kolkata',
    'Asia/Shanghai',
    'Asia/Tokyo',
    'Asia/Singapore',
    'Australia/Sydney',
    'Pacific/Auckland',
];

interface WorkExperienceEntry {
    company: string;
    role: string;
    startDate: string;
    endDate: string | null;
    description: string | null;
}

interface UserSettings {
    id: string;
    name: string;
    email: string;
    image: string;
    githubUsername: string;
    githubId: number;
    company: string | null;
    blog: string | null;
    location: string | null;
    bio: string | null;
    twitterUsername: string | null;
    publicRepos: number;
    followers: number;
    following: number;
    hireable: boolean | null;
    discoverable: boolean;
    openToWork: boolean;
    preferredRoles: string[];
    workType: string | null;
    yearsOfExperience: string | null;
    timezone: string | null;
    linkedinUrl: string | null;
    workExperience: WorkExperienceEntry[];
}

interface SettingsContentProps {
    userId: string;
}

function ProfileSkeleton() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader><Skeleton className="h-5 w-20" /></CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-16 w-16 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-36" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><Skeleton className="h-5 w-36" /></CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
        </div>
    );
}

export function SettingsContent({ userId }: SettingsContentProps) {
    const [settings, setSettings] = useState<UserSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [savedMessage, setSavedMessage] = useState(false);

    // Editable state for hiring fields
    const [openToWork, setOpenToWork] = useState(false);
    const [discoverable, setDiscoverable] = useState(false);
    const [preferredRoles, setPreferredRoles] = useState<string[]>([]);
    const [workType, setWorkType] = useState<string>('');
    const [yearsOfExperience, setYearsOfExperience] = useState<string>('');
    const [timezone, setTimezone] = useState<string>('');
    const [linkedinUrl, setLinkedinUrl] = useState<string>('');
    const [workExperience, setWorkExperience] = useState<WorkExperienceEntry[]>([]);

    const fetchSettings = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_URL}/api/users/me/settings`, {
                credentials: 'include',
                headers: { 'X-User-Id': userId },
            });
            if (!response.ok) throw new Error('Failed to load settings');
            const data: UserSettings = await response.json();
            setSettings(data);
            // Populate editable state
            setOpenToWork(data.openToWork || false);
            setDiscoverable(data.discoverable || false);
            setPreferredRoles(data.preferredRoles || []);
            setWorkType(data.workType || '');
            setYearsOfExperience(data.yearsOfExperience || '');
            setTimezone(data.timezone || '');
            setLinkedinUrl(data.linkedinUrl || '');
            setWorkExperience(data.workExperience || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => { fetchSettings(); }, [fetchSettings]);

    const saveSettings = async (patch: Record<string, unknown>) => {
        setSaving(true);
        try {
            const response = await fetch(`${API_URL}/api/users/me/settings`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'X-User-Id': userId, 'Content-Type': 'application/json' },
                body: JSON.stringify(patch),
            });
            if (!response.ok) throw new Error('Failed to save');
            setSavedMessage(true);
            setTimeout(() => setSavedMessage(false), 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleRole = (role: string) => {
        setPreferredRoles(prev =>
            prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
        );
    };

    const addWorkExperience = () => {
        if (workExperience.length >= 5) return;
        setWorkExperience(prev => [...prev, { company: '', role: '', startDate: '', endDate: null, description: null }]);
    };

    const updateWorkExperience = (index: number, field: keyof WorkExperienceEntry, value: string | null) => {
        setWorkExperience(prev => prev.map((entry, i) =>
            i === index ? { ...entry, [field]: value } : entry
        ));
    };

    const removeWorkExperience = (index: number) => {
        setWorkExperience(prev => prev.filter((_, i) => i !== index));
    };

    const handleSaveAll = () => {
        saveSettings({
            discoverable,
            openToWork,
            preferredRoles,
            workType: workType || null,
            yearsOfExperience: yearsOfExperience || null,
            timezone: timezone || null,
            linkedinUrl: linkedinUrl || null,
            workExperience: workExperience.filter(e => e.company && e.role),
        });
    };

    if (loading) return <div className="max-w-2xl"><ProfileSkeleton /></div>;

    if (error) {
        return (
            <div className="max-w-2xl">
                <Card>
                    <CardContent className="py-8 text-center">
                        <p className="text-sm text-muted-foreground mb-4">{error}</p>
                        <button onClick={fetchSettings} className="text-sm font-medium text-primary hover:underline">
                            Try again
                        </button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!settings) return null;

    return (
        <div className="max-w-2xl space-y-6">
            {/* Profile Card (read-only from GitHub) */}
            <Card>
                <CardHeader>
                    <CardTitle>Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        {settings.image ? (
                            <img src={settings.image} alt={settings.name} width={64} height={64} className="rounded-full" />
                        ) : (
                            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                                <Github className="h-8 w-8 text-muted-foreground" />
                            </div>
                        )}
                        <div>
                            <p className="text-lg font-semibold">{settings.name}</p>
                            <p className="text-sm text-muted-foreground">@{settings.githubUsername}</p>
                            <p className="text-sm text-muted-foreground">{settings.email}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                        <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground">Location:</span>
                            <span>{settings.location || <span className="text-muted-foreground italic">Not set on GitHub</span>}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground">Company:</span>
                            <span>{settings.company || <span className="text-muted-foreground italic">Not set on GitHub</span>}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground">Website:</span>
                            {settings.blog ? (
                                <a href={settings.blog.startsWith('http') ? settings.blog : `https://${settings.blog}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="text-primary hover:underline inline-flex items-center gap-1 truncate">
                                    {settings.blog}<ExternalLink className="h-3 w-3 shrink-0" />
                                </a>
                            ) : <span className="text-muted-foreground italic">Not set on GitHub</span>}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Twitter className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground">Twitter:</span>
                            {settings.twitterUsername ? (
                                <a href={`https://twitter.com/${settings.twitterUsername}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="text-primary hover:underline inline-flex items-center gap-1">
                                    @{settings.twitterUsername}<ExternalLink className="h-3 w-3 shrink-0" />
                                </a>
                            ) : <span className="text-muted-foreground italic">Not set on GitHub</span>}
                        </div>

                        {settings.bio && (
                            <div className="col-span-1 md:col-span-2 text-sm">
                                <p className="text-muted-foreground mb-1">Bio</p>
                                <p>{settings.bio}</p>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                        <Github className="h-4 w-4 shrink-0" />
                        <span>{settings.publicRepos} public repos &middot; {settings.followers} followers</span>
                    </div>

                    <p className="text-xs text-muted-foreground pt-2">
                        Profile data synced from GitHub. Update your GitHub profile to change these.
                    </p>
                </CardContent>
            </Card>

            {/* Hiring Preferences Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Hiring Preferences</CardTitle>
                    <CardDescription>
                        Control your visibility to companies and share what you&apos;re looking for.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Discoverable toggle */}
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                            <p className="text-sm font-medium">Discoverable by companies</p>
                            <p className="text-xs text-muted-foreground">
                                Your verified portfolio will be visible to companies searching for developers.
                            </p>
                        </div>
                        <Switch checked={discoverable} onCheckedChange={setDiscoverable} />
                    </div>

                    {/* Open to work toggle */}
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                            <p className="text-sm font-medium">Open to work</p>
                            <p className="text-xs text-muted-foreground">
                                Signal to recruiters that you&apos;re actively looking for opportunities.
                            </p>
                        </div>
                        <Switch checked={openToWork} onCheckedChange={setOpenToWork} />
                    </div>

                    <hr className="border-border" />

                    {/* Preferred Roles */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Preferred Roles</Label>
                        <div className="flex flex-wrap gap-2">
                            {ROLE_OPTIONS.map(role => (
                                <button
                                    key={role}
                                    type="button"
                                    onClick={() => handleToggleRole(role)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                                        preferredRoles.includes(role)
                                            ? 'bg-primary/10 border-primary/50 text-primary'
                                            : 'bg-card border-border text-muted-foreground hover:border-foreground/30'
                                    }`}
                                >
                                    {role}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Work Type & Experience Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="workType" className="text-sm font-medium">Work Type</Label>
                            <div className="relative">
                                <select
                                    id="workType"
                                    value={workType}
                                    onChange={e => setWorkType(e.target.value)}
                                    className="w-full h-10 rounded-md border border-border bg-background px-3 py-2 text-sm appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                    <option value="">Select...</option>
                                    {WORK_TYPE_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2.5 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="experience" className="text-sm font-medium">Years of Experience</Label>
                            <div className="relative">
                                <select
                                    id="experience"
                                    value={yearsOfExperience}
                                    onChange={e => setYearsOfExperience(e.target.value)}
                                    className="w-full h-10 rounded-md border border-border bg-background px-3 py-2 text-sm appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                    <option value="">Select...</option>
                                    {EXPERIENCE_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2.5 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Timezone */}
                    <div className="space-y-2">
                        <Label htmlFor="timezone" className="text-sm font-medium">Timezone</Label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                            <select
                                id="timezone"
                                value={timezone}
                                onChange={e => setTimezone(e.target.value)}
                                className="w-full h-10 rounded-md border border-border bg-background pl-9 pr-8 py-2 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="">Select timezone...</option>
                                {TIMEZONE_OPTIONS.map(tz => (
                                    <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                        </div>
                    </div>

                    {/* LinkedIn URL */}
                    <div className="space-y-2">
                        <Label htmlFor="linkedin" className="text-sm font-medium">LinkedIn</Label>
                        <div className="relative">
                            <Linkedin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                            <Input
                                id="linkedin"
                                placeholder="https://linkedin.com/in/yourprofile"
                                value={linkedinUrl}
                                onChange={e => setLinkedinUrl(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Work Experience Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Work Experience</CardTitle>
                            <CardDescription>Add your professional background. Max 5 entries.</CardDescription>
                        </div>
                        {workExperience.length < 5 && (
                            <Button variant="outline" size="sm" onClick={addWorkExperience}>
                                <Plus className="h-4 w-4 mr-1" /> Add
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {workExperience.length === 0 ? (
                        <button
                            onClick={addWorkExperience}
                            className="w-full py-8 border-2 border-dashed border-border rounded-lg flex flex-col items-center gap-2 text-muted-foreground hover:border-foreground/30 hover:text-foreground transition-colors"
                        >
                            <Briefcase className="h-6 w-6" />
                            <span className="text-sm">Add your first work experience</span>
                        </button>
                    ) : (
                        <div className="space-y-4">
                            {workExperience.map((entry, index) => (
                                <div key={index} className="p-4 border border-border rounded-lg space-y-3 relative">
                                    <button
                                        onClick={() => removeWorkExperience(index)}
                                        className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-destructive transition-colors"
                                        aria-label="Remove entry"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-8">
                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">Company</Label>
                                            <Input
                                                placeholder="e.g. Google"
                                                value={entry.company}
                                                onChange={e => updateWorkExperience(index, 'company', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">Role</Label>
                                            <Input
                                                placeholder="e.g. Senior Backend Engineer"
                                                value={entry.role}
                                                onChange={e => updateWorkExperience(index, 'role', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">Start Date</Label>
                                            <Input
                                                type="month"
                                                value={entry.startDate}
                                                onChange={e => updateWorkExperience(index, 'startDate', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">End Date</Label>
                                            <Input
                                                type="month"
                                                value={entry.endDate || ''}
                                                onChange={e => updateWorkExperience(index, 'endDate', e.target.value || null)}
                                                placeholder="Present"
                                            />
                                            {!entry.endDate && entry.startDate && (
                                                <p className="text-xs text-primary">Present</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Description</Label>
                                        <textarea
                                            placeholder="Key achievements, responsibilities, or highlights (one per line)"
                                            value={entry.description || ''}
                                            onChange={e => updateWorkExperience(index, 'description', e.target.value || null)}
                                            rows={3}
                                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex items-center gap-3">
                <Button onClick={handleSaveAll} disabled={saving} className="bg-primary hover:bg-primary/90">
                    {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                {savedMessage && (
                    <span className="text-sm text-primary font-medium">Changes saved</span>
                )}
            </div>
        </div>
    );
}
