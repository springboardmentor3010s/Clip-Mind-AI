import { motion } from "framer-motion";
import { FiPlay, FiClock, FiEye } from "react-icons/fi";

interface Props {
  title: string;
  duration: string;
  status: string;
  thumbnail: string;
  views?: number;
  onClick?: () => void;
}

const gradients: Record<string, string> = {
  "grad-1": "from-violet-500 via-fuchsia-500 to-pink-500",
  "grad-2": "from-indigo-500 via-purple-500 to-violet-500",
  "grad-3": "from-purple-500 via-violet-500 to-blue-500",
  "grad-4": "from-fuchsia-500 via-pink-500 to-rose-500",
  "grad-5": "from-blue-500 via-indigo-500 to-purple-500",
};

export function VideoCard({ title, duration, status, thumbnail, views, onClick }: Props) {
  const grad = gradients[thumbnail] || gradients["grad-1"];
  return (
    <motion.button
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="group text-left w-full rounded-3xl bg-card border border-border/60 p-3 shadow-soft hover:shadow-glow transition-all"
    >
      <div className={`relative aspect-video rounded-2xl bg-gradient-to-br ${grad} overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-12 w-12 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <FiPlay className="text-primary ml-0.5" />
          </div>
        </div>
        <span className="absolute top-3 left-3 rounded-full bg-white/20 backdrop-blur px-2.5 py-1 text-[11px] font-medium text-white border border-white/30">
          {status}
        </span>
        <span className="absolute bottom-3 right-3 rounded-full bg-black/50 backdrop-blur px-2 py-0.5 text-[11px] text-white flex items-center gap-1">
          <FiClock className="text-[10px]" /> {duration}
        </span>
      </div>
      <div className="px-2 pt-3 pb-1">
        <h3 className="text-sm font-semibold text-foreground line-clamp-2">{title}</h3>
        {views !== undefined && (
          <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
            <FiEye /> {views.toLocaleString()} views
          </div>
        )}
      </div>
    </motion.button>
  );
}
