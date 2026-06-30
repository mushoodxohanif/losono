"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CrmExportStatus, TrackingSessionSummary } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

export type TrackingSessionView = {
  id: string;
  visitorId: string;
  startedAt: string | Date;
  lastActivityAt: string | Date;
  landingPage?: string | null;
  referrer?: string | null;
  eventCount: number;
  summary?: TrackingSessionSummary | null;
  exportStatus?: CrmExportStatus | null;
};

export type TrackingEventView = {
  id: string;
  sessionId: string;
  visitorId: string;
  eventName: string;
  properties?: Record<string, unknown> | null;
  pageUrl?: string | null;
  createdAt: string | Date;
};

type TrackingLogsProps = {
  agentId: string;
  initialSessions: TrackingSessionView[];
  initialEvents: TrackingEventView[];
};

const ALL_SESSIONS = "__all__";

function formatDuration(start: Date, end: Date) {
  const ms = Math.max(end.getTime() - start.getTime(), 0);
  const minutes = Math.floor(ms / 60_000);

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

function truncateVisitorId(visitorId: string) {
  return visitorId.length > 12 ? `${visitorId.slice(0, 8)}…` : visitorId;
}

function exportStatusLabel(status: CrmExportStatus | null | undefined) {
  switch (status) {
    case "success":
      return "Exported";
    case "skipped":
      return "Skipped";
    case "failed":
      return "Export failed";
    case "pending":
      return "Pending";
    default:
      return "Not exported";
  }
}

function formatProperties(
  properties: Record<string, unknown> | null | undefined,
) {
  if (!properties || Object.keys(properties).length === 0) {
    return null;
  }

  try {
    return JSON.stringify(properties, null, 2);
  } catch {
    return String(properties);
  }
}

export function TrackingLogs({
  agentId,
  initialSessions,
  initialEvents,
}: TrackingLogsProps) {
  const [sessions, setSessions] = useState(initialSessions);
  const [events, setEvents] = useState(initialEvents);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  );
  const [filterSessionId, setFilterSessionId] = useState(ALL_SESSIONS);
  const [filterEventName, setFilterEventName] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const eventNames = useMemo(() => {
    const names = new Set(events.map((event) => event.eventName));
    return Array.from(names).sort();
  }, [events]);

  const filteredEvents = useMemo(() => {
    const normalizedName = filterEventName.trim().toLowerCase();

    return events.filter((event) => {
      if (
        filterSessionId !== ALL_SESSIONS &&
        event.sessionId !== filterSessionId
      ) {
        return false;
      }

      if (
        normalizedName &&
        !event.eventName.toLowerCase().includes(normalizedName)
      ) {
        return false;
      }

      if (filterDate) {
        const eventDate = new Date(event.createdAt).toISOString().slice(0, 10);
        if (eventDate !== filterDate) {
          return false;
        }
      }

      return true;
    });
  }, [events, filterSessionId, filterEventName, filterDate]);

  useEffect(() => {
    if (!selectedSessionId) {
      return;
    }

    setFilterSessionId(selectedSessionId);
  }, [selectedSessionId]);

  async function loadEventsForSession(sessionId: string) {
    setLoadingEvents(true);

    try {
      const response = await fetch(
        `/api/agents/${agentId}/tracking?sessionId=${sessionId}`,
      );
      const data = (await response.json()) as {
        events?: TrackingEventView[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load events");
      }

      setEvents((current) => {
        const byId = new Map(current.map((event) => [event.id, event]));
        for (const event of data.events ?? []) {
          byId.set(event.id, event);
        }
        return Array.from(byId.values()).sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      });
    } finally {
      setLoadingEvents(false);
    }
  }

  async function refreshData() {
    setRefreshing(true);

    try {
      const response = await fetch(`/api/agents/${agentId}/tracking`);
      const data = (await response.json()) as {
        sessions?: TrackingSessionView[];
        events?: TrackingEventView[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to refresh tracking data");
      }

      setSessions(data.sessions ?? []);
      setEvents(data.events ?? []);
    } finally {
      setRefreshing(false);
    }
  }

  function handleSelectSession(sessionId: string) {
    setSelectedSessionId((current) =>
      current === sessionId ? null : sessionId,
    );

    if (selectedSessionId !== sessionId) {
      void loadEventsForSession(sessionId);
    }
  }

  return (
    <section className="space-y-6 rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-lg font-medium">Sessions & events</h2>
          <p className="text-sm text-muted-foreground">
            Click sessions are grouped into 30-minute inactivity windows. Select
            a session to filter the event log.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => void refreshData()}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium">Sessions</h3>

        {sessions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
            No tracking sessions yet. Add the script to your site and trigger
            some events to see data here.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-4 py-2 font-medium">Visitor</th>
                  <th className="px-4 py-2 font-medium">Events</th>
                  <th className="px-4 py-2 font-medium">Duration</th>
                  <th className="px-4 py-2 font-medium">Landing page</th>
                  <th className="px-4 py-2 font-medium">Last activity</th>
                  <th className="px-4 py-2 font-medium">CRM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sessions.map((session) => {
                  const startedAt = new Date(session.startedAt);
                  const lastActivityAt = new Date(session.lastActivityAt);
                  const isSelected = selectedSessionId === session.id;

                  return (
                    <tr
                      key={session.id}
                      className={cn(
                        "cursor-pointer transition-colors hover:bg-muted/30",
                        isSelected && "bg-primary/5",
                      )}
                      onClick={() => handleSelectSession(session.id)}
                    >
                      <td className="px-4 py-3 font-mono text-xs">
                        {truncateVisitorId(session.visitorId)}
                      </td>
                      <td className="px-4 py-3">{session.eventCount}</td>
                      <td className="px-4 py-3">
                        {formatDuration(startedAt, lastActivityAt)}
                      </td>
                      <td className="max-w-[220px] truncate px-4 py-3 text-muted-foreground">
                        {session.landingPage ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        {lastActivityAt.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {exportStatusLabel(session.exportStatus)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="space-y-4 border-t border-border pt-6">
        <div className="space-y-1">
          <h3 className="text-sm font-medium">Event log</h3>
          <p className="text-sm text-muted-foreground">
            Filter events by session, name, or date.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Select
            value={filterSessionId}
            onValueChange={(value) => {
              setFilterSessionId(value);
              setSelectedSessionId(value === ALL_SESSIONS ? null : value);
            }}
          >
            <SelectTrigger className="min-w-[200px]">
              <SelectValue placeholder="All sessions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_SESSIONS}>All sessions</SelectItem>
              {sessions.map((session) => (
                <SelectItem key={session.id} value={session.id}>
                  {truncateVisitorId(session.visitorId)} ·{" "}
                  {new Date(session.startedAt).toLocaleString()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filterEventName || "__any__"}
            onValueChange={(value) =>
              setFilterEventName(value === "__any__" ? "" : value)
            }
          >
            <SelectTrigger className="min-w-[180px]">
              <SelectValue placeholder="Any event" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__any__">Any event</SelectItem>
              {eventNames.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={filterDate}
            onChange={(event) => setFilterDate(event.target.value)}
            className="w-[180px]"
            aria-label="Filter by date"
          />

          {(filterSessionId !== ALL_SESSIONS ||
            filterEventName ||
            filterDate) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setFilterSessionId(ALL_SESSIONS);
                setFilterEventName("");
                setFilterDate("");
                setSelectedSessionId(null);
              }}
            >
              Clear filters
            </Button>
          )}
        </div>

        {loadingEvents ? (
          <p className="text-sm text-muted-foreground">Loading events…</p>
        ) : filteredEvents.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
            No events match the current filters.
          </p>
        ) : (
          <div className="max-h-[480px] space-y-3 overflow-y-auto">
            {filteredEvents.map((event) => {
              const properties = formatProperties(event.properties);

              return (
                <article
                  key={event.id}
                  className="space-y-2 rounded-xl border border-border p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="font-medium">{event.eventName}</span>
                    <span className="text-muted-foreground">
                      {new Date(event.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>Visitor {truncateVisitorId(event.visitorId)}</span>
                    {event.pageUrl ? <span>{event.pageUrl}</span> : null}
                  </div>

                  {properties ? (
                    <pre className="overflow-x-auto rounded-lg bg-muted/40 p-3 text-xs whitespace-pre-wrap">
                      {properties}
                    </pre>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
