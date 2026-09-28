// src/modules/settings/user-logs/components/LogDetail.tsx
import { format } from 'date-fns';
import { Clock, Fingerprint, Globe, Monitor, User, Database, Cpu, AppWindow } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IUserLog } from '@/types';
import { actionOf, isSessionAction, toneSoft } from './logMeta';
import { ChangeDiff } from './LogTimeline';

const known = (v?: string | null) => (v && v.toLowerCase() !== 'unknown' ? v : null);

function Fact({ icon: Icon, label, value, mono }: { icon: typeof Clock; label: string; value?: string | null; mono?: boolean }) {
  return (
    <div className="flex min-w-0 items-start gap-2.5 rounded-lg bg-muted/40 px-3 py-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</dt>
        <dd className={cn('mt-0.5 text-sm text-foreground [overflow-wrap:anywhere]', mono && 'font-mono text-[13px]')}>{value || '—'}</dd>
      </div>
    </div>
  );
}

export default function LogDetail({ log }: { log: IUserLog }) {
  const action = actionOf(log.actionType);
  const Icon = action.icon;
  const at = new Date(log.createdAt);
  const when = Number.isNaN(at.getTime()) ? log.createdAt : format(at, 'EEEE, MMM d, yyyy · HH:mm:ss');

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-1 py-2 sm:px-2">
      {/* What happened */}
      <div className="flex items-start gap-3">
        <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-full', toneSoft[action.tone])}>
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-base text-foreground/85">
            <span className="font-semibold text-foreground">{log.createdByName || 'Someone'}</span> {action.verb}
            {!isSessionAction(log.actionType) && log.modelName && <span className="font-semibold text-foreground"> {log.modelName}</span>}
          </p>
          {log.detail && <p className="mt-1 text-sm text-muted-foreground [overflow-wrap:anywhere]">{log.detail}</p>}
          <span className={cn('mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium', toneSoft[action.tone])}>{action.label}</span>
        </div>
      </div>

      <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <Fact icon={Clock} label="When" value={when} />
        <Fact icon={User} label="By" value={log.createdByName} />
        <Fact icon={Database} label="Collection" value={log.modelName} />
        <Fact icon={Fingerprint} label="Object ID" value={log.modelId} mono />
        <Fact icon={Globe} label="IP address" value={log.ipAddress} mono />
        <Fact icon={Monitor} label="Device" value={known(log.device)} />
        <Fact icon={AppWindow} label="Browser" value={known(log.browser)} />
        <Fact icon={Cpu} label="Operating system" value={known(log.operatingSystem)} />
      </dl>

      {log.changes && (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Changes</h3>
          <ChangeDiff changes={log.changes} />
        </section>
      )}

      {log.userAgent && (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">User agent</h3>
          <p className="rounded-lg bg-muted/40 px-3 py-2.5 font-mono text-xs text-muted-foreground [overflow-wrap:anywhere]">{log.userAgent}</p>
        </section>
      )}
    </div>
  );
}
