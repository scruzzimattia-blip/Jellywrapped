import { motion } from 'framer-motion';

export function EmptyYearSlide(props: { year: number }): React.ReactElement {
  const { year } = props;
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
        <p className="text-6xl">📺</p>
        <h2 className="mt-6 font-[family-name:var(--font-display)] text-3xl text-[#f1f5f9]">
          Looks like you took {year} off
        </h2>
        <p className="mt-4 max-w-lg text-[#64748b]">
          No Jellyfin history in Tracearr for that year — or your API filters are whispering secrets we can&apos;t hear.
        </p>
      </motion.div>
    </div>
  );
}
