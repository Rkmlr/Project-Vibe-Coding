"use client";

export default function ActivityLogs({ logs = [] }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-xl text-white">Central Family Activity Logs</h2>
        <span className="text-xs text-brand-muted font-mono uppercase tracking-widest">Keamanan Terjamin</span>
      </div>

      <div className="glass-card rounded-xl border border-white/5 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-white/5 bg-brand-slate/40 text-brand-muted uppercase tracking-wider">
                <th className="p-4 font-semibold">Timestamp</th>
                <th className="p-4 font-semibold">Aktor</th>
                <th className="p-4 font-semibold">Aksi</th>
                <th className="p-4 font-semibold">Tabel Target</th>
                <th className="p-4 font-semibold text-right">Nilai Baru</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-brand-muted">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.01] transition-colors">
                  <td className="p-4 text-white">
                    {new Date(log.created_at).toLocaleString("id-ID", {
                      month: "short",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </td>
                  <td className="p-4">
                    <span className="text-brand-sage">{log.user_name}</span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${
                      log.action === "SOFT_DELETE" ? "bg-red-500/10 text-red-400" :
                      log.action === "UPDATE_LIMIT" ? "bg-brand-gold/10 text-brand-gold" : "bg-white/10 text-white"
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4">{log.target_table}</td>
                  <td className="p-4 text-right text-white max-w-xs truncate" title={JSON.stringify(log.new_values)}>
                    {JSON.stringify(log.new_values)}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-brand-muted italic">
                    Belum ada log aktivitas tercatat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
