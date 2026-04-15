import Link from "next/link";

import { query } from "@/lib/db";
import type { SendLog } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getLogs(): Promise<SendLog[]> {
  if (!process.env.DATABASE_URL) {
    return [];
  }
  const result = await query<SendLog>(
    `SELECT
      send_logs.id,
      send_logs.person_id,
      people.name AS person_name,
      people.email AS person_email,
      send_logs.sent_local_date::text,
      send_logs.sent_at::text,
      send_logs.status,
      send_logs.error
     FROM send_logs
     LEFT JOIN people ON people.id = send_logs.person_id
     ORDER BY send_logs.sent_at DESC
     LIMIT 100`,
  );
  return result.rows;
}

export default async function LogsPage() {
  const logs = await getLogs();

  return (
    <main className="min-h-screen py-8">
      <div className="mx-auto w-full max-w-5xl space-y-4 px-4">
        <header className="surface-card hero-gradient rounded-2xl p-4">
          <h1 className="text-2xl font-bold text-slate-900">Birthday Send Logs</h1>
          <p className="text-sm text-slate-600">Latest delivery attempts from the birthday sender.</p>
          <Link
            href="/"
            className="btn-secondary mt-2 inline-block rounded-full px-3 py-1 text-sm"
          >
            Back to calendar
          </Link>
        </header>

        <section className="surface-card overflow-x-auto rounded-2xl">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">Local Date</th>
                <th className="px-3 py-2">Person</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Error</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td className="px-3 py-3 text-slate-600" colSpan={6}>
                    No send logs yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-t border-slate-100">
                    <td className="px-3 py-2">{new Date(log.sent_at).toLocaleString()}</td>
                    <td className="px-3 py-2">{log.sent_local_date}</td>
                    <td className="px-3 py-2">{log.person_name ?? "Unknown"}</td>
                    <td className="px-3 py-2">{log.person_email ?? "Unknown"}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded px-2 py-1 text-xs font-medium ${
                          log.status === "success"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-600">{log.error ?? "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
