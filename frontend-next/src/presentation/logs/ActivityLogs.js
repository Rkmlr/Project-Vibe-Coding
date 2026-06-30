"use client";

export default function ActivityLogs({ logs = [] }) {
  return (
    <div className="glass-card bg-white/5 rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-black/20 text-brand-muted text-xs uppercase tracking-wider font-mono">
              <th className="p-5 font-semibold">Waktu & Tanggal</th>
              <th className="p-5 font-semibold">Pelaku</th>
              <th className="p-5 font-semibold">Aksi</th>
              <th className="p-5 font-semibold">Target Data</th>
              <th className="p-5 font-semibold">Detail Perubahan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 text-sm">
            {logs.map((log) => {
              // Action Mapping
              let actionLabel = log.action;
              let actionColor = "bg-white/10 text-white";
              
              if (log.action === "CREATE_ENVELOPES") {
                actionLabel = "Buat Amplop";
                actionColor = "bg-brand-sage/20 text-brand-sage border border-brand-sage/30";
              } else if (log.action === "UPDATE_ENVELOPES" || log.action === "UPDATE_LIMIT") {
                actionLabel = "Edit Amplop";
                actionColor = "bg-brand-gold/20 text-brand-gold border border-brand-gold/30";
              } else if (log.action === "DELETE_ENVELOPES" || log.action === "SOFT_DELETE") {
                actionLabel = "Hapus Amplop";
                actionColor = "bg-red-500/20 text-red-400 border border-red-500/30";
              } else if (log.action === "UPDATE_FAMILIES") {
                actionLabel = "Edit Keluarga";
                actionColor = "bg-blue-500/20 text-blue-400 border border-blue-500/30";
              }

              // Table Mapping
              let tableLabel = log.target_table;
              if (log.target_table === "envelopes") tableLabel = "Pos Anggaran";
              if (log.target_table === "families") tableLabel = "Profil Keluarga";

              return (
                <tr key={log.id} className="hover:bg-white/[0.03] transition-colors group">
                  <td className="p-5 text-brand-muted whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="p-5 whitespace-nowrap">
                    <span className="font-medium text-white">{log.user_name}</span>
                  </td>
                  <td className="p-5 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-mono tracking-wide ${actionColor}`}>
                      {actionLabel}
                    </span>
                  </td>
                  <td className="p-5 text-white/80 whitespace-nowrap">{tableLabel}</td>
                  <td className="p-5">
                    <div className="flex flex-wrap gap-2 text-xs font-mono text-brand-muted">
                      {log.new_values && typeof log.new_values === 'object' ? (
                        Object.entries(log.new_values).map(([key, value]) => {
                          // Skip system fields to keep it clean
                          if (['id', 'family_id', 'created_at', 'updated_at'].includes(key)) return null;
                          return (
                            <span key={key} className="bg-brand-slate/50 border border-white/5 px-2 py-1 rounded-md">
                              <span className="text-white/60 mr-1">{key}:</span>
                              <span className="text-white">{String(value)}</span>
                            </span>
                          );
                        })
                      ) : (
                        <span>-</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {logs.length === 0 && (
              <tr>
                <td colSpan="5" className="p-12 text-center">
                  <p className="text-brand-muted text-lg mb-2">Belum ada riwayat aktivitas.</p>
                  <p className="text-sm text-brand-muted/70">Perubahan data yang dilakukan akan muncul di sini.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
