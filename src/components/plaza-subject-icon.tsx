const icons: Record<string, [string, string]> = {
  语文: ['rose', 'M5 5h6l1 2 1-2h6v14h-6l-1 1-1-1H5z M12 7v13 M7 9h2 M15 9h2'],
  数学: ['blue', 'M6 3h12v18H6z M9 7h6 M9 11h1 M14 11h1 M9 15h1 M14 15h1 M9 18h1 M14 18h1'],
  英语: ['violet', 'M4 19 9 5l5 14 M6 14h6 M15 10h4l2 9 M15 16h5'],
  科学: ['amber', 'M4 15c4 3 12 0 16-5 M5 9c-3 1-3 4 0 6 M19 9c3-1 3-3 0-3 M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16'],
  物理: ['violet', 'M3 12c0-5 18-5 18 0s-18 5-18 0 M8 4c4-3 13 13 9 16S4 7 8 4 M16 4c-4-3-13 13-9 16S20 7 16 4'],
  化学: ['blue', 'M9 3h6 M10 3v7L4 19q-1 2 2 2h12q3 0 2-2l-6-9V3 M7 15h10 M9 18h1 M14 17h1'],
  生物: ['mint', 'M19 4C7 3 2 9 6 16s15 2 13-12 M5 21l12-14 M10 15v-5 M10 15h5'],
  历史: ['amber', 'M6 4h13v15H8 M6 4a3 3 0 0 0 0 6h2v10a2 2 0 0 0 4 0 M11 8h5 M11 12h5'],
  地理: ['blue', 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M3 12h18 M12 3c-5 5-5 13 0 18 M12 3c5 5 5 13 0 18'],
  音乐: ['rose', 'M9 17V5l10-2v12 M9 5l10-2 M9 17c-1-4-8-2-6 2 2 3 6 1 6-2 M19 15c-1-4-8-2-6 2 2 3 6 1 6-2'],
  美术: ['violet', 'm6 16 11-13 4 4-13 11 M6 16c-6 0 0 7-5 6 8 3 9-3 7-4'],
  信息科技: ['blue', 'M3 4h18v13H3z M8 21h8 M12 17v4 M9 8l-3 3 3 3 M15 8l3 3-3 3'],
  体育与健康: ['mint', 'M12 8C5 1 0 10 5 15l7 6 7-6C25 10 19 1 12 8 M5 12h4l2-3 2 6 2-3h4'],
};
const fallback: [string, string] = ['amber', 'm12 3 3 6 6 3-6 3-3 6-3-6-6-3 6-3z'];
export default function PlazaSubjectIcon({ subject }: { subject?: string }) {
  const [tone, path] = icons[subject || ''] || fallback;
  return <span className={`plaza-subject-icon tone-${tone}`} aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round"><path d={path} /></svg></span>;
}
