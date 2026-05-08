import { Link } from '@inertiajs/react';
import { useI18n } from '@/Hooks/useI18n';

export function AdminFlowSection({ eyebrow, title, description, children, contentClassName = 'p-6' }) {
    return (
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-[linear-gradient(180deg,_#ffffff,_#f8fafc)] px-6 py-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{eyebrow}</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">{title}</h2>
                {description ? <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">{description}</p> : null}
            </div>
            <div className={contentClassName}>{children}</div>
        </section>
    );
}

export default function AdminFlowShell({
    title,
    description,
    backHref,
    backLabel,
    stats = [],
    sections = [],
    activeSection,
    onSectionChange,
    contextTitle,
    contextDescription,
    contextItems = [],
    summary,
    actions,
    children,
}) {
    const { t } = useI18n();
    const currentSection = sections.find((section) => section.key === activeSection) ?? sections[0];
    const resolvedBackLabel = backLabel ?? t('admin.shell.back', 'Volver');

    return (
        <div className="space-y-8">
            <section className="overflow-hidden rounded-[36px] border border-slate-200 bg-[linear-gradient(135deg,_#f8fafc,_#e0f2fe_52%,_#fff7ed)] shadow-sm">
                <div className="grid gap-6 px-6 py-7 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-sky-700">{t('admin.shell.backoffice', 'Backoffice')}</p>
                        <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
                        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">{description}</p>
                        {backHref ? (
                            <div className="mt-5">
                                <Link
                                    href={backHref}
                                    className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                    {resolvedBackLabel}
                                </Link>
                            </div>
                        ) : null}
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
                        {stats.map((stat) => (
                            <div key={stat.label} className="rounded-[24px] border border-white/60 bg-white/70 px-4 py-4 backdrop-blur">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{stat.label}</p>
                                <p className="mt-2 text-3xl font-semibold text-slate-900">{stat.value}</p>
                                {stat.helper ? <p className="mt-1 text-xs text-slate-500">{stat.helper}</p> : null}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
                <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
                    <div className="rounded-[28px] border border-slate-200 bg-white p-3 shadow-sm">
                        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{t('admin.shell.views', 'Flujo')}</p>
                        <div className="space-y-3">
                            {sections.map((section) => {
                                const isActive = section.key === currentSection?.key;

                                return (
                                    <button
                                        key={section.key}
                                        type="button"
                                        onClick={() => onSectionChange(section.key)}
                                        className={`w-full rounded-[24px] border p-4 text-left transition ${isActive ? 'border-slate-900 bg-slate-900 text-white shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-900 hover:bg-white'}`}
                                    >
                                        <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${isActive ? 'text-sky-200' : 'text-slate-500'}`}>{section.eyebrow}</p>
                                        <div className="mt-2 flex items-start justify-between gap-3">
                                            <div>
                                                <h2 className="text-base font-semibold">{section.title}</h2>
                                                <p className={`mt-2 text-sm leading-6 ${isActive ? 'text-slate-200' : 'text-slate-600'}`}>{section.description}</p>
                                            </div>
                                            {section.badge ? (
                                                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${isActive ? 'bg-white/10 text-white' : 'bg-white text-slate-600'}`}>
                                                    {section.badge}
                                                </span>
                                            ) : null}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{t('admin.shell.context', 'Contexto')}</p>
                        <h2 className="mt-2 text-xl font-semibold text-slate-900">{contextTitle ?? currentSection?.title}</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{contextDescription ?? currentSection?.description}</p>
                        {contextItems.length > 0 ? (
                            <div className="mt-5 space-y-3 text-sm text-slate-600">
                                {contextItems.map((item) => (
                                    <div key={item.label} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                                        <span>{item.label}</span>
                                        <strong className="text-slate-900">{item.value}</strong>
                                    </div>
                                ))}
                            </div>
                        ) : null}
                    </div>
                </aside>

                <div className="space-y-6">{children}</div>

                <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">{summary}</aside>
            </div>

            {actions ? (
                <div className="sticky bottom-4 z-10">
                    <div className="rounded-[28px] border border-slate-200 bg-white/95 px-5 py-4 shadow-lg shadow-slate-200/60 backdrop-blur">
                        {actions}
                    </div>
                </div>
            ) : null}
        </div>
    );
}