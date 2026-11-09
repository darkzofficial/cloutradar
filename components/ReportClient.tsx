'use client';
// Client wrapper so the scan form can render a report it just received.
import Report from './Report';
import type { ScanResult } from '@/lib/scoring';
export default function ReportClient({ result }: { result: ScanResult }) {
  return <Report result={result} />;
}
