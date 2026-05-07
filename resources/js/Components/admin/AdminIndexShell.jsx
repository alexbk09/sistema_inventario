export default function AdminIndexShell({
    title,
    description,
    stats = [],
    sections = [],
    activeSection,
    onSectionChange,
    contextTitle,
    contextDescription,
    contextItems = [],
    primaryAction,
    secondaryActions,
    filters,
    children,
}) {
    return (
        <div className="space-y-8">
            <section className="overflow-hidden rounded-[36px] border border-slate-200 bg-[linear-gradient(135deg,_#f8fafc,_#e0f2fe_52%,_#fff7ed)] shadow-sm">
                <div className="grid gap-6 px-6 py-7 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-sky-700">Backoffice</p>
                        <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
                        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">{description}</p>
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

            <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
                <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
                    {sections.length > 0 ? (
                        <div className="rounded-[28px] border border-slate-200 bg-white p-3 shadow-sm">
                            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Vistas</p>
                            <div className="space-y-3">
                                {sections.map((section) => {
                                    const isActive = section.key === activeSection;

                                    return (
                                        <button
                                            key={section.key}
                                            type="button"
                                            onClick={() => onSectionChange?.(section.key)}
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
                    ) : null}

                    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Contexto</p>
                        <h2 className="mt-2 text-xl font-semibold text-slate-900">{contextTitle}</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{contextDescription}</p>
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

                <div className="space-y-6">
                    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 bg-[linear-gradient(180deg,_#ffffff,_#f8fafc)] px-6 py-5">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Operación</p>
                                    <h2 className="mt-2 text-xl font-semibold text-slate-900">Acciones y filtros</h2>
                                    <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">Mantén accesibles la búsqueda, filtros y acciones principales sin perder espacio útil para la tabla.</p>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {secondaryActions}
                                    {primaryAction}
                                </div>
                            </div>
                        </div>
                        <div className="p-6">{filters}</div>
                    </section>

                    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                        {children}
                    </section>
                </div>
            </div>
        </div>
    );
}