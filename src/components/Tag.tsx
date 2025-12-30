type TagProps = {
  label: string;
  tone?: 'accent' | 'muted' | 'success' | 'warning';
};

export default function Tag({ label, tone = 'muted' }: TagProps) {
  return <span className={`tag tag-${tone}`}>{label}</span>;
}
